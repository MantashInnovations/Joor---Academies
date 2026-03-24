import { Suspense } from 'react'
import { AcceptInviteContent } from './accept-invite-content'

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 text-center space-y-4 animate-pulse">
          <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
          <div className="h-6 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
        </div>
      }>
        <AcceptInviteContent />
      </Suspense>
    </div>
  )
}
