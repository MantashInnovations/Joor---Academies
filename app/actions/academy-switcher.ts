'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { redirect } from 'next/navigation'

export async function getMyAcademies() {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.userId) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Find all profiles with the exact same verified email address
  const { data: myProfiles, error } = await supabase
    .from('profiles')
    .select('id, academy_id, academy_name, academy_logo_url, role')
    .eq('email', ctx.email)
    .order('last_active_at', { ascending: false })

  if (error) {
    console.error('[AcademySwitcher] Error fetching academies:', error)
    return { error: 'Failed to fetch academies' }
  }

  // Filter out any academies without names
  const validProfiles = (myProfiles || []).filter(p => p.academy_name)
  
  return { data: validProfiles }
}

export async function switchAcademy(targetProfileId: string, role: string) {
  const supabase = await createClient()
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'Unauthorized' }

  // 1. Verify this profile actually belongs to this user (matches email)
  const { data: targetProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('id, email, academy_id')
    .eq('id', targetProfileId)
    .single()

  if (verifyError || !targetProfile) {
    return { error: 'Profile not found' }
  }

  if (targetProfile.email !== ctx.email) {
    return { error: 'You do not have access to this academy' }
  }

  // 2. Update last_active_at for the target profile
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', targetProfileId)

  // 3. Since auth uses the underlying auth.users alias, we just need to re-authenticate with that alias.
  // The easiest way is to log them out and redirect to a silent login page with a token, or just
  // log them out and make them enter their password again.
  // Actually, we can use the Supabase admin client to generate a link to log them in directly as that user.
  // OR, we can just log them out and have them log back in.
  
  return { success: true, redirectUrl: `/login?email=${encodeURIComponent(ctx.email)}&switched=true` }
}
