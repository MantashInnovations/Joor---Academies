import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { compareOTP } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    let { email, otp, newPassword } = await request.json()
    email = email?.toLowerCase()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey!,
      { auth: { persistSession: false } }
    )

    // 1. Verify OTP with hashed comparison
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from("otp_verifications")
      .select("code, expires_at")
      .eq("email", email)
      .gt("expires_at", new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verification || !compareOTP(otp, verification.code)) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      )
    }

    // 2. Find profiles associated with this email
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)

    if (profilesError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Failed to locate account(s)." }, { status: 404 })
    }

    // 3. Security Check: Ensure new password is different from current one
    // Try to sign in to the first profile to test if the password is the same
    const checkClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    // We can't log in directly with the standard email if there are multiple accounts 
    // without knowing an exact alias. So we fetch the first auth.users email (alias).
    const { data: firstUserData } = await supabaseAdmin.auth.admin.getUserById(profiles[0].id)
    
    if (firstUserData?.user?.email) {
      const { data: signInData } = await checkClient.auth.signInWithPassword({
        email: firstUserData.user.email,
        password: newPassword,
      })

      if (signInData?.user) {
        return NextResponse.json(
          { error: "New password must be different from your current password." },
          { status: 400 }
        )
      }
    }

    // 4. Update password for ALL associated accounts
    for (const profile of profiles) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      )
      if (updateError) {
        console.error("Update password error for user", profile.id, ":", updateError)
        // Note: we continue attempting updates even if one fails
      }
    }

    // 5. Clean up OTP
    await supabaseAdmin.from("otp_verifications").delete().eq("email", email)

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
