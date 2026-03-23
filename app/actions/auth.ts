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
