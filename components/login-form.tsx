import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const [displayMessage, setDisplayMessage] = useState<string | null>(message)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (message) {
      setDisplayMessage(message)
      const timer = setTimeout(() => {
        setDisplayMessage(null)
        // Clear the message from URL
        const params = new URLSearchParams(searchParams.toString())
        params.delete("message")
        router.replace(`/login${params.toString() ? `?${params.toString()}` : ""}`)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, router, searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Fetch role from profiles table
    let role = null;
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        
      if (!profileError && profile) {
        role = profile.role?.toLowerCase()
      }
    }

    console.debug("Login successful. Normalized role:", role)

    if (role === "academy") {
      console.log("Redirecting to /admin/dashboard")
      router.push("/admin/dashboard")
    } else {
      console.log("Redirecting to / (Role not academy)")
      router.push("/")
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {displayMessage && (
                <div className="text-sm font-medium text-primary text-center bg-primary/10 p-2 rounded animate-in fade-in zoom-in duration-300">
                  {displayMessage}
                </div>
              )}
              {error && (
                <div className="text-sm font-medium text-destructive text-center p-2 rounded border border-destructive/20">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <PasswordInput id="password" name="password" required />
              </Field>
              <Field>
                <RippleButton
                  type="submit"
                  disabled={loading}
                  rippleColor="hsl(var(--primary-foreground) / 0.4)"
                  className="w-full bg-primary text-primary-foreground border-primary font-medium"
                >
                  {loading ? "Logging in..." : "Login"}
                </RippleButton>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
