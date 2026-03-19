import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resend } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';
import { validateEmailSource } from '@/lib/email-validation';

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email source (block disposable domains)
    const validation = validateEmailSource(email);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (type === 'forgot') {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      
      // Check if user exists in auth.users
      const { data: adminData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('List users error:', listError.message);
        throw new Error('Failed to verify user existence');
      }

      const targetUser = adminData.users.find((u) => u.email === email);

      if (!targetUser) {
        console.warn('Forgot password attempt for non-existent user:', email);
        return NextResponse.json({ 
          error: 'This email is not recognized. Please check your spelling or sign up.' 
        }, { status: 404 });
      }

      // Check if user has a profile in public.profiles
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', targetUser.id)
        .single();

      if (profileError || !profileData) {
        console.warn('Forgot password attempt for user without profile:', email, profileError?.message);
        return NextResponse.json({ 
          error: 'This email is not recognized. Please check your spelling or sign up.' 
        }, { status: 404 });
      }

      // 3. Server-side Rate Limiting (3 attempts per 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: attempts, error: countError } = await supabase
        .from('otp_verifications')
        .select('created_at')
        .eq('email', email)
        .gte('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: true });

      if (countError) {
        console.error('Rate limit check error:', countError);
      } else if (attempts && attempts.length >= 3) {
        // The user can try again when the oldest attempt is older than 15 minutes
        const oldestAttempt = new Date(attempts[0].created_at);
        const nextAllowedAttempt = new Date(oldestAttempt.getTime() + 15 * 60 * 1000);
        const remainingMs = nextAllowedAttempt.getTime() - Date.now();
        
        const remainingSecs = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(remainingSecs / 60);
        const secs = remainingSecs % 60;
        const timeStr = mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}` : `${secs} second${secs !== 1 ? 's' : ''}`;

        return NextResponse.json({ 
          error: `Too many attempts. Please try again after ${timeStr}.` 
        }, { status: 429 });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Supabase (otp_verifications table)
    // Note: We use the public supabase client here. 
    // If RLS is strictly "false" for public, this might fail unless service role is used.
    // For now, we assume the user has configured access or we'll provide instructions.
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert([{ email, code: otp }]);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
    }

    // Send email via Resend (using official SDK pattern)
    const { data, error: mailError } = await resend.emails.send({
      from: 'Joor <noreply@contact.tabisharshad.com>',
      to: [email],
      subject: 'Your Joor Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verify Your Account</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            To complete your registration, please enter the following 6-digit verification code:
          </p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (mailError) {
      console.warn('Resend failed to send email:', mailError.message);
      console.info('------------------------------------------');
      console.info(`DEV OTP FOR ${email}: ${otp}`);
      console.info('------------------------------------------');

      return NextResponse.json({
        success: true,
        debug: "Resend limit reached or unverified domain. Code logged to console."
      });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error('Detailed Send OTP error:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
