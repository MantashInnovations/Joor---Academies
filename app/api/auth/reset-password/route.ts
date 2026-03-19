import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase as publicClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error("Critical: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.")
      return NextResponse.json(
        { error: "Server configuration error: Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    // Initialize admin client inside the handler to prevent module-level crashes
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // 1. Verify OTP from otp_verifications table
    const { data: verification, error: verifyError } = await publicClient
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("code", otp)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (verifyError || !verification) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    // 2. Find user ID by email
    console.log("Searching for user with email:", email)
    const { data: adminData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error("List users error:", listError)
      return NextResponse.json({ error: listError.message || "Failed to find user" }, { status: 500 })
    }

    if (!adminData?.users) {
      console.error("No users found in admin data")
      return NextResponse.json({ error: "No users found" }, { status: 404 })
    }

    const targetUser = adminData.users.find((u) => u.email === email)
    if (!targetUser) {
      console.error("User not found in user list")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 3. Security Check: Ensure new password is different from current one
    // We attempt to sign in with the new password; if it works, it's not a new password.
    const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
      email,
      password: newPassword,
    })

    if (signInData?.user || (signInError && signInError.message.includes("MFA"))) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      )
    }

    // 3. Update password
    console.log("Updating password for user:", targetUser.id)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Update password error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 4. Clean up OTP
    await publicClient.from("otp_verifications").delete().eq("email", email)

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
