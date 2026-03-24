import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { getEmailByCnic } from "@/app/actions/auth"
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
    const identifier = (formData.get("email") as string)?.toLowerCase()
    const password = formData.get("password") as string

    let loginEmail = identifier

    // If identifier doesn't look like an email, assume it's a CNIC and look up the email
    if (identifier && !identifier.includes("@")) {
      console.log("[LoginForm] identifier looks like CNIC, looking up email...")
      const lookup = await getEmailByCnic(identifier)
      if (lookup.error) {
        setError(lookup.error)
        setLoading(false)
        return
      }
      if (lookup.email) {
        loginEmail = lookup.email
      }
    }

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Fetch role from profiles table (more reliable for custom roles)
    let role = user?.app_metadata?.role?.toLowerCase() || user?.user_metadata?.role?.toLowerCase() || null;
    
    if (user) {
      console.log("[Login] User authenticated. Checking profile for ID:", user.id);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single()
        
      if (!profileError && profile) {
        if (profile.is_active === false) {
          setError("Account deactivated. Please contact your administrator.")
          setLoading(false)
          await supabase.auth.signOut()
          return
        }
        console.log("[Login] Profile found. Role:", profile.role);
        role = profile.role?.toLowerCase()
      } else if (profileError) {
        console.warn("[Login] Profile fetch error (using metadata fallback):", profileError.message);
      }
    }

    console.log("[Login] Final resolved role:", role)

    // Comprehensive Role Normalization (sync with middleware)
    if (role === 'academy') role = 'academy_admin'
    if (role === 'superuser') role = 'super_admin'

    if (role === "academy_admin" || role === "super_admin") {
      console.log("Redirecting to /admin/dashboard")
      router.push("/admin/dashboard")
    } else if (role === "teacher") {
      console.log("Redirecting to /teacher/dashboard")
      router.push("/teacher/dashboard")
    } else if (role === "student") {
      console.log("Redirecting to /student/dashboard")
      router.push("/student/dashboard")
    } else {
      console.log(`Redirecting to / (Role '${role}' not handled explicitly)`)
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
                <FieldLabel htmlFor="email">Email or CNIC</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="name@example.com or 12345-6789012-3"
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
