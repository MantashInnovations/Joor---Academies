import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { compareOTP } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json()

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

    // 2. Find user ID by email efficiently
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users.find((u) => u.email === email)
    
    if (listError || !targetUser) {
      return NextResponse.json({ error: "Failed to process request." }, { status: 404 })
    }

    // 3. Security Check: Ensure new password is different from current one
    // We use a fresh client for this check to avoid session pollution
    const checkClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: signInData } = await checkClient.auth.signInWithPassword({
      email,
      password: newPassword,
    })

    if (signInData?.user) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      )
    }

    // 4. Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Update password error:", updateError)
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 })
    }

    // 5. Clean up OTP
    await supabaseAdmin.from("otp_verifications").delete().eq("email", email)

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
