"use client"

import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { LayoutDashboard } from "lucide-react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh relative flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <AnimatedThemeToggler className="flex items-center justify-center rounded-full bg-background border border-border shadow-sm p-2 hover:bg-accent transition-colors" />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" />
          </div>
          Acme Inc.
        </a>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
