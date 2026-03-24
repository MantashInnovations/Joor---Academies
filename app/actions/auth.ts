'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function getEmailByCnic(cnic: string) {
  if (!cnic) return { error: 'CNIC is required' }
  
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('cnic', cnic)
    .single()

  if (error || !data) {
    return { error: 'No account found with this CNIC' }
  }

  // Fetch the email from auth.users (requires admin client)
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.id)
  
  if (userError || !userData.user) {
    return { error: 'Authentication record not found' }
  }

  return { email: userData.user.email }
}

export async function getAuthEmailByEmail(email: string) {
  if (!email) return { error: 'Email is required' }
  
  const supabase = await createAdminClient()
  
  // Find profiles with this exact email
  const { data, error } = await supabase
    .from('profiles')
    .select('id, academy_id, role, is_active, last_active_at')
    .eq('email', email)

  if (error) {
    return { error: 'Database error while resolving email' }
  }

  if (!data || data.length === 0) {
    // Attempt normal login (e.g. for super_admin or academy_admin without alias)
    return { authEmail: email }
  }

// Find the correct profile to use
  let targetProfile = data[0]

  if (data.length > 1) {
    // Multi-academy user: pick the last visited academy
    targetProfile = data.sort((a, b) => {
      const timeA = a.last_active_at ? new Date(a.last_active_at).getTime() : 0
      const timeB = b.last_active_at ? new Date(b.last_active_at).getTime() : 0
      return timeB - timeA // Descending: newest first
    })[0]
  }

  // Resolve their actual auth.users email using the admin client.
  const profileId = targetProfile.id
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileId)
  
  if (userError || !userData.user) {
     return { error: 'Authentication record not found for this profile' }
  }

  // Update last_active_at for the logged in profile
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', profileId)

  return { authEmail: userData.user.email, profile: targetProfile }
}
