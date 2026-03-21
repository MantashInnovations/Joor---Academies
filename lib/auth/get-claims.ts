import { createClient } from '@/lib/supabase/server'

export type AuthContext = {
  userId: string
  email: string
  role: 'super_admin' | 'academy_admin' | 'teacher' | 'student' | 'parent'
  academyId: string | null
}

/**
 * Extracts and verifies user claims from the JWT.
 * Uses getUser() for security (cryptographic verification).
 * This should be called once per request and the context passed down.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Extract custom claims from app_metadata or user_metadata
  // Note: For multi-tenancy, academy_id and role should be in app_metadata
  // as they are set by the server and cannot be modified by the user.
  const appMetadata = user.app_metadata || {}
  const userMetadata = user.user_metadata || {}

  // Priority: app_metadata (verified) > user_metadata (fallback for dev)
  let rawRole = appMetadata.role || userMetadata.role
  let role = typeof rawRole === 'string' ? rawRole.toLowerCase() : undefined
  let academyId = appMetadata.academy_id || userMetadata.academy_id || null

  // Fallback for legacy users without JWT claims
  if (!role) {
    console.log(`[AuthContext] Role missing in JWT for ${user.email}, querying profiles table...`)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    role = profile?.role?.toLowerCase() || 'student'
  }

  // Normalize legacy 'academy' role to 'academy_admin'
  if (role === 'academy') {
    role = 'academy_admin'
  }

  // If the user is an academy admin, their academy ID is their own user ID
  if (role === 'academy_admin' && !academyId) {
    academyId = user.id
  }

  return {
    userId: user.id,
    email: user.email || '',
    role: role as AuthContext['role'],
    academyId,
  }
}
