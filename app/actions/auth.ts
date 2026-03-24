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
    .select('id, academy_id, role, is_active')
    .eq('email', email)

  if (error) {
    return { error: 'Database error while resolving email' }
  }

  if (!data || data.length === 0) {
    // Attempt normal login (e.g. for super_admin or academy_admin without alias)
    return { authEmail: email }
  }

  if (data.length > 1) {
    return { 
      error: 'This email is associated with multiple academies. Please log in using your CNIC instead.' 
    }
  }

  // Exactly one profile found. Resolve their actual auth.users email using the admin client.
  const profileId = data[0].id
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileId)
  
  if (userError || !userData.user) {
     return { error: 'Authentication record not found for this profile' }
  }

  return { authEmail: userData.user.email }
}
