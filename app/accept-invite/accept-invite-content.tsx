'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const success = searchParams.get('success')

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl border-accent/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Account Synchronized!</CardTitle>
          <CardDescription className="text-base mt-2">
            Your existing password has been successfully linked to your new academy account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button asChild className="w-full h-12 text-base font-medium" size="lg">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  let errorMessage = 'An unexpected error occurred.'
  switch (error) {
    case 'missing_token':
      errorMessage = 'Invalid invitation link. The token is missing.'
      break
    case 'invalid_or_expired':
      errorMessage = 'This invitation link is invalid or has expired.'
      break
    case 'no_existing_account':
      errorMessage = 'We could not find your existing account to synchronize with.'
      break
    case 'auth_failed':
      errorMessage = 'Failed to create your new authentication record.'
      break
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-destructive/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
          Synchronization Failed
        </CardTitle>
        <CardDescription className="text-base mt-2 text-muted-foreground">
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Button asChild variant="outline" className="w-full h-12 text-base font-medium" size="lg">
          <Link href="/login">Return to Login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
