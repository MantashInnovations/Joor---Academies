import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, code, shouldDelete = true } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Check if OTP exists and is valid
    const { data: verification, error: dbError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (dbError || !verification) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // OTP is valid, clean up only if requested
    if (shouldDelete) {
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', email);
    }

    // Note: In a real app, you would now mark the user as verified in the profiles table.
    // For now, we return success so the frontend can proceed.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
