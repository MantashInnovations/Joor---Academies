import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { compareOTP } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { email, code, shouldDelete = true } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Verification required.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Fetch the latest valid OTP for this email
    const { data: verification, error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .select('code, expires_at')
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !verification) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
    }

    // 2. Timing-safe hashed comparison
    const isValid = compareOTP(code, verification.code);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
    }

    // OTP is valid, clean up only if requested
    if (shouldDelete) {
      await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .eq('email', email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
