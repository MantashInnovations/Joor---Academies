"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RippleButton } from "@/components/ui/ripple-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp" | "reset">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, type: "forgot" }),
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setStep("otp")
      setMessage("Check your email for the verification code.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }
    
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code: otp, shouldDelete: false }),
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired verification code")
      }

      setStep("reset")
      setError(null)
      setMessage(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword: password }),
        headers: { "Content-Type": "application/json" },
      })

      const contentType = response.headers.get("content-type")
      let data
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("Non-JSON response received:", text)
        throw new Error("Server returned an unexpected error page. Check your server logs.")
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      router.push("/login?message=Password reset successful. Please log in.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify OTP"}
            {step === "reset" && "Reset Password"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && `Enter the code sent to ${email}`}
            {step === "reset" && "Choose a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm font-medium text-destructive text-center p-2 rounded border border-destructive/20 bg-destructive/5">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-sm font-medium text-primary text-center p-2 rounded border border-primary/20 bg-primary/5">
              {message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendOTP}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                  />
                </Field>
                <RippleButton
                  type="submit"
                  className="w-full bg-primary text-primary-foreground border-primary font-medium"
                  disabled={loading}
                  rippleColor="hsl(var(--primary-foreground) / 0.4)"
                >
                  {loading ? "Sending..." : "Continue"}
                </RippleButton>
                <div className="text-center text-sm">
                  <a href="/login" className="text-muted-foreground hover:underline">
                    Back to login
                  </a>
                </div>
              </FieldGroup>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-6 items-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(v) => setOtp(v)}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <RippleButton
                  type="submit"
                  className="w-full bg-primary text-primary-foreground border-primary font-medium"
                  disabled={otp.length !== 6}
                  rippleColor="hsl(var(--primary-foreground) / 0.4)"
                >
                  Verify Code
                </RippleButton>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>
                <RippleButton
                  type="submit"
                  className="w-full bg-primary text-primary-foreground border-primary font-medium"
                  disabled={loading}
                  rippleColor="hsl(var(--primary-foreground) / 0.4)"
                >
                  {loading ? "Resetting..." : "Save Password"}
                </RippleButton>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
