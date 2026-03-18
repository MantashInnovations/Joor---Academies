"use client"

import Link from "next/link"
import { RippleButton } from "@/components/ui/ripple-button"
import { LayoutDashboard, ArrowRight } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 md:px-10">
        <div className="flex items-center gap-2 font-semibold text-xl tracking-tight">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <LayoutDashboard className="size-5" />
          </div>
          <span>Joor</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <RippleButton
              className="hidden sm:inline-flex rounded-full px-6 border-input bg-transparent text-foreground hover:bg-accent"
              rippleColor="hsl(var(--primary) / 0.2)"
            >
              Login
            </RippleButton>
          </Link>
          <Link href="/signup">
            <RippleButton
              className="rounded-full px-6 shadow-md bg-primary text-primary-foreground border-primary"
              rippleColor="hsl(var(--primary-foreground) / 0.4)"
            >
              Get Started
            </RippleButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Background Decorative Element */}
          <div className="absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          
          <h1 className="mb-6 text-4xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
            Build something <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              extraordinary
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Welcome to Joor, your modern toolkit for building high-performance 
            web applications with stunning UI components and seamless experiences.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <RippleButton
                className="h-12 rounded-full px-8 text-base shadow-lg bg-primary text-primary-foreground border-primary"
                rippleColor="hsl(var(--primary-foreground) / 0.4)"
              >
                Register Now
                <ArrowRight className="ml-2 size-5" />
              </RippleButton>
            </Link>
            <Link href="/login">
              <RippleButton
                className="h-12 rounded-full px-8 text-base border-input bg-background text-foreground hover:bg-muted"
                rippleColor="hsl(var(--primary) / 0.2)"
              >
                Member Login
              </RippleButton>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border/40">
        <div className="flex items-center justify-center gap-2">
          <span>&copy; 2026 Joor Inc.</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 border">d</kbd> for dark mode
          </span>
        </div>
      </footer>
    </div>
  )
}
