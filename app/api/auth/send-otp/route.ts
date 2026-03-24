import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { validateEmailSource } from '@/lib/email-validation';
import { randomInt } from 'node:crypto';
import { hashOTP } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    let { email, type } = await request.json();
    email = email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email source (block disposable domains)
    const validation = validateEmailSource(email);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    if (type === 'forgot') {
      // 1. Check if user exists using more efficient method
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      // Though listUsers is still not ideal, getUserByEmail is better if available.
      // Supabase Admin API has getUserById but listUsers is often used for email search if not indexed.
      // However, we can just try to fetch the profile which is indexed by ID.
      
      const targetUser = users.find((u) => u.email === email);

      if (!targetUser) {
        console.warn('Forgot password attempt for non-existent user:', email);
        // Security: Use generic error message if not signed up
        return NextResponse.json({ 
          error: 'If this email is registered, you will receive a code.' 
        }, { status: 200 }); // Return 200 to prevent account enumeration
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', targetUser.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ 
          error: 'If this email is registered, you will receive a code.' 
        }, { status: 200 });
      }

      // 3. Server-side Rate Limiting (5 attempts per hour per skill)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: attempts } = await supabaseAdmin
        .from('otp_verifications')
        .select('created_at')
        .eq('email', email)
        .gte('created_at', oneHourAgo)
        .limit(6);

      if (attempts && attempts.length >= 5) {
        return NextResponse.json({ 
          error: 'Too many attempts. Please try again later.' 
        }, { status: 429 });
      }
    }

    // Generate 6-digit OTP using cryptographically secure method
    const otp = randomInt(100000, 999999).toString();
    const hashedOtp = hashOTP(otp);

    // Invalidate all previous OTPs
    await supabaseAdmin
      .from('otp_verifications')
      .update({ expires_at: new Date().toISOString() })
      .eq('email', email)
      .gt('expires_at', new Date().toISOString());

    // Store HASHED OTP
    const { error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .insert([{ email, code: hashedOtp }]);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
    }

    // Send email via Resend
    const { data, error: mailError } = await resend.emails.send({
      from: 'Joor <noreply@contact.tabisharshad.com>',
      to: [email],
      subject: 'Your Joor Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verify Your Account</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Please enter the following 6-digit verification code:
          </p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
        </div>
      `,
    });

    if (mailError) {
      console.error('Resend error:', mailError);
      // Fallback for dev: log OTP if local
      if (process.env.NODE_ENV === 'development') {
        console.info(`[DEV] OTP for ${email}: ${otp}`);
      }
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Detailed Send OTP error:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
