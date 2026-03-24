"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

export function VerificationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")?.toLowerCase()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [value, setValue] = useState("")
  const [cooldown, setCooldown] = useState(0)

  // Start cooldown timer
  const startCooldown = () => {
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resend verification code');
      } else {
        setMessage('Code resent successfully!')
        startCooldown()
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (value.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Invalid verification code');
        setLoading(false)
        return;
      }

      // Verification successful
      router.push("/login?message=Account verified successfully! Please log in.")
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6 items-center">
              {error && (
                <div className="w-full text-sm font-medium text-destructive text-center p-3 rounded-lg border border-destructive/20 bg-destructive/5 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}
              {message && (
                <div className="w-full text-sm font-medium text-primary text-center p-3 rounded-lg border border-primary/20 bg-primary/5 animate-in fade-in zoom-in duration-300">
                  {message}
                </div>
              )}

              <div className="py-2">
                <InputOTP
                  maxLength={6}
                  value={value}
                  onChange={(value) => setValue(value)}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-12 text-lg shadow-sm" />
                    <InputOTPSlot index={1} className="size-12 text-lg shadow-sm" />
                    <InputOTPSlot index={2} className="size-12 text-lg shadow-sm" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="size-12 text-lg shadow-sm" />
                    <InputOTPSlot index={4} className="size-12 text-lg shadow-sm" />
                    <InputOTPSlot index={5} className="size-12 text-lg shadow-sm" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="w-full flex flex-col gap-3">
                <RippleButton
                  type="submit"
                  className="w-full h-11 text-base shadow-md bg-primary text-primary-foreground border-primary font-medium"
                  disabled={loading || value.length !== 6}
                  rippleColor="hsl(var(--primary-foreground) / 0.4)"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </RippleButton>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive a code?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || cooldown > 0}
                      className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline transition-all"
                    >
                      {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/signup")}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Change email or go back
                  </button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
