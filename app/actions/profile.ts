'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeProfile(formData: FormData) {
  const supabase = await createClient()

  // Verify user is logged in
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const academy_name = formData.get('academy_name') as string
  const academy_contact = formData.get('academy_contact') as string
  const location = formData.get('location') as string
  const website = formData.get('website') as string
  const description = formData.get('description') as string
  const academy_logo = formData.get('academy_logo') as File | null

  if (!academy_name || !academy_contact || !location) {
    return { error: 'Please fill out all required fields.' }
  }

  let academy_logo_url = null

  // Handle logo upload if provided
  if (academy_logo && academy_logo.size > 0) {
    const fileExt = academy_logo.name.split('.').pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(filePath, academy_logo, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Failed to upload logo:', uploadError)
      return { error: 'Failed to upload logo.' }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    academy_logo_url = publicUrl
    console.log(`[completeProfile] Uploaded logo. Public URL: ${academy_logo_url}`)
  }

  // Prepare update data
  const updateData: any = {
    academy_name,
    academy_contact,
    location,
    website: website || null,
    description: description || null,
    is_profile_completed: true,
    updated_at: new Date().toISOString()
  }

  // Only update logo if a new one was provided
  if (academy_logo_url) {
    updateData.academy_logo_url = academy_logo_url
  }

  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update profile:', error)
    return { error: 'Failed to update profile. Please try again.' }
  }

  // Revalidate the layout so the form disappears
  revalidatePath('/admin', 'layout')
  
  return { success: true }
}
