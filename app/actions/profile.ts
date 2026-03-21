'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

const ProfileSchema = z.object({
  academy_name: z.string().min(3).max(100),
  academy_contact: z.string().min(5).max(20),
  location: z.string().min(5).max(200),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
})

export async function completeProfile(formData: FormData) {
  // 1. AUTHENTICATE
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'Unauthorized' }

  // 2. AUTHORIZE
  if (!['academy_admin', 'super_admin'].includes(ctx.role)) {
    return { error: 'Forbidden' }
  }

  // 3. VALIDATE
  const rawData = {
    academy_name: formData.get('academy_name'),
    academy_contact: formData.get('academy_contact'),
    location: formData.get('location'),
    website: formData.get('website') || '',
    description: formData.get('description') || '',
  }
  
  const logoFile = formData.get('academy_logo') as File | null;

  const result = ProfileSchema.safeParse(rawData)
  if (!result.success) {
    return { error: 'Invalid input data.' }
  }

  const supabase = await createClient()
  let academy_logo_url = null

  // Storage Validation (Step 3 continued)
  if (logoFile && logoFile.size > 0) {
    // Validate size (max 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: 'Logo must be smaller than 2MB.' }
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(logoFile.type)) {
      return { error: 'Only JPG, PNG and WebP are allowed.' }
    }

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${randomUUID()}.${fileExt}`
    // 4. SCOPE TO TENANT (using userId/academyId for path)
    const filePath = `${ctx.userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, logoFile, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload logo.' }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    academy_logo_url = publicUrl
  }

  // 5. EXECUTE
  const updateData: any = {
    ...result.data,
    website: result.data.website || null,
    description: result.data.description || null,
    is_profile_completed: true,
    updated_at: new Date().toISOString()
  }

  if (academy_logo_url) {
    updateData.academy_logo_url = academy_logo_url
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', ctx.userId)
    .select('id') // specific column

  if (error) {
    console.error('Failed to update profile:', error)
    return { error: 'Update failed.' }
  }

  if (!data || data.length === 0) {
    return { error: 'Profile not found! Please check your database if you manually deleted rows.' }
  }

  revalidatePath('/admin', 'layout')
  return { success: true }
}
