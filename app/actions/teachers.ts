'use server'

import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { sendSyncInvitationEmail } from '@/lib/emails/sync-invitation'
import { headers } from 'next/headers'

const createTeacherSchema = z.object({
  first_name: z.string().min(1, 'First name is required.'),
  last_name: z.string().min(1, 'Last name is required.'),
  cnic: z.string().min(1, 'CNIC is required.'),
  email: z.string().email('Invalid email').min(1, 'Required').transform(v => v.toLowerCase()),
  phone: z.string().min(1, 'Phone is required.'),
  whatsapp_no: z.string().optional(),
  age: z.coerce.number().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  salary_type: z.enum(['salary', 'commission']).default('salary'),
  commission_type: z.enum(['per_class', 'per_student']).optional(),
  commission_rate: z.coerce.number().default(0),
})


export async function createTeacher(rawData: unknown) {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  const parsed = createTeacherSchema.safeParse(rawData)
  if (!parsed.success) return { error: 'Validation failed', issues: parsed.error.flatten() }

  const adminClient = await createAdminClient()
  const aid = ctx.academyId
  const { first_name, last_name, email, cnic } = parsed.data
  const fullName = `${first_name} ${last_name}`

  try {
    // 1. Tenant Uniqueness Check — within THIS academy
    const { data: existingInAcademy } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('academy_id', aid)
      .single()

    if (existingInAcademy) {
      return { error: 'A user with this email already exists in your academy.' }
    }

    // 2. Check if a pending invitation already exists
    const { data: existingInvite } = await adminClient
      .from('academy_invitations')
      .select('id')
      .eq('email', email)
      .eq('academy_id', aid)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return { error: 'An invitation has already been sent to this email for your academy.' }
    }

    // 3. Cross-Academy Check — does this email exist in OTHER academies?
    const { data: otherProfiles } = await adminClient
      .from('profiles')
      .select('id, academy_id, full_name')
      .eq('email', email)
      .neq('academy_id', aid)
      .limit(1)

    if (otherProfiles && otherProfiles.length > 0) {
      // --- INVITATION FLOW ---
      // This email is used in another academy. Send an invitation instead.
      const token = randomUUID()

      // Get names for the email
      const { data: invitingAcademy } = await adminClient
        .from('profiles')
        .select('academy_name')
        .eq('id', aid)
        .single()

      const { data: existingAcademy } = await adminClient
        .from('profiles')
        .select('academy_name')
        .eq('id', otherProfiles[0].academy_id)
        .single()

      // Store the invitation with full form payload
      const { error: inviteError } = await adminClient
        .from('academy_invitations')
        .insert({
          email,
          academy_id: aid,
          role: 'teacher',
          token,
          payload: parsed.data,
          invited_by: ctx.userId,
        })

      if (inviteError) {
        console.error('[TeacherAction] Invitation Error:', inviteError)
        return { error: 'Failed to create invitation.' }
      }

      // Send the sync email
      const headersList = await headers()
      const host = headersList.get('host') || 'localhost:3000'
      const protocol = headersList.get('x-forwarded-proto') || 'http'
      const baseUrl = `${protocol}://${host}`

      await sendSyncInvitationEmail({
        to: email,
        inviteeName: fullName,
        invitingAcademyName: invitingAcademy?.academy_name || 'New Academy',
        existingAcademyName: existingAcademy?.academy_name || 'Existing Academy',
        role: 'teacher',
        token,
        baseUrl,
      })

      revalidatePath('/admin/teachers')
      return { 
        success: true, 
        invited: true, 
        message: `An invitation email has been sent to ${email}. They need to accept it to join your academy.` 
      }
    }

    // --- NORMAL FLOW (no cross-academy conflict) ---

    // 4. Generate Auth Alias
    const [localPart, domain] = email.split('@')
    const authAlias = `${localPart}+${aid}@${domain}`

    // 5. Create Auth User
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: authAlias,
      password: 'Joor123',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'teacher',
        academy_id: aid,
      },
      app_metadata: {
        role: 'teacher',
        academy_id: aid,
      },
    })

    if (authError) {
      console.error('[TeacherAction] Auth Provisioning Error:', authError)
      return { error: 'Authentication setup failed.' }
    }

    // 6. Create/Update Profile
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authUser.user.id,
      first_name,
      last_name,
      full_name: fullName,
      email,
      role: 'teacher',
      cnic,
      academy_id: aid,
      is_profile_completed: true,
      is_active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('[TeacherAction] Profile Creation Error:', profileError)
      return { error: 'Profile creation failed.' }
    }

    // 7. Create Teacher record
    const { data, error } = await adminClient.from('teachers').insert({
      ...parsed.data,
      user_id: authUser.user.id,
      academy_id: aid,
    }).select('id').single()

    if (error) {
      console.error('[TeacherAction] DB Insert Error:', error)
      return { error: 'Failed to create teacher record.' }
    }

    revalidatePath('/admin/teachers')
    return { success: true, data }
  } catch (err: any) {
    console.error('[TeacherAction] Unexpected error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function getTeachers(params: {
  page?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all'
} = {}) {
  const { page = 0, search = '', status = 'active' } = params
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }

  const pageSize = 10
  const start = page * pageSize
  const end = start + pageSize - 1

  const supabase = await createClient()

  let query = supabase
    .from('teachers')
    .select('id, first_name, last_name, email, specialization, joining_date, is_active, created_at', { count: 'exact' })
    .eq('academy_id', ctx.academyId)
    .order('created_at', { ascending: false })

  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (search && search.trim() !== '') {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,cnic.ilike.%${search}%`)
  }

  const { data, count, error } = await query.range(start, end)

  if (error) {
    console.error('[TeacherAction] getTeachers error:', error)
    return { error: 'Failed to fetch teachers.' }
  }

  return { success: true, data, count: count || 0 }
}

export async function updateTeacher(id: string, rawData: unknown) {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  const parsed = createTeacherSchema.partial().safeParse(rawData)
  if (!parsed.success) return { error: 'Validation failed', issues: parsed.error.flatten() }

  const supabase = await createClient()
  const aid = ctx.academyId

  const { data: teacher, error: fetchError } = await supabase
    .from('teachers')
    .select('user_id')
    .eq('id', id)
    .eq('academy_id', aid)
    .single()

  if (fetchError || !teacher) return { error: 'Teacher not found or unauthorized' }

  const adminClient = await createAdminClient()
  const { first_name, last_name, email } = parsed.data

  try {
    // 1. Update Profile if names changed
    if (first_name || last_name) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          first_name,
          last_name,
          full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
          email: email, // Sync email if changed
        })
        .eq('id', teacher.user_id)

      if (profileError) console.error('[TeacherAction] Profile Update Error:', profileError)
    }

    // 2. Update Auth Email if changed
    if (email) {
      // Check tenant uniqueness
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('academy_id', aid)
        .neq('id', teacher.user_id)
        .single()

      if (existingProfile) {
        return { error: 'A user with this email already exists in your academy.' }
      }

      // Update alias in auth.users
      const [localPart, domain] = email.split('@')
      const authAlias = `${localPart}+${aid}@${domain}`

      const { error: authError } = await adminClient.auth.admin.updateUserById(teacher.user_id, {
        email: authAlias,
      })
      if (authError) console.error('[TeacherAction] Auth Email Update Error:', authError)
    }

    // 3. Update Teacher record
    const { error } = await supabase
      .from('teachers')
      .update(parsed.data)
      .eq('id', id)
      .eq('academy_id', aid)

    if (error) {
      console.error('[TeacherAction] Update Error:', error)
      return { error: 'Failed to update teacher settings' }
    }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    console.error('[TeacherAction] updateTeacher error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

export async function toggleTeacherStatus(id: string, isActive: boolean) {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { data: teacher, error: fetchError } = await supabase
    .from('teachers')
    .select('user_id')
    .eq('id', id)
    .eq('academy_id', ctx.academyId)
    .single()

  if (fetchError || !teacher) return { error: 'Teacher not found or unauthorized' }

  const adminClient = await createAdminClient()

  try {
    // 1. Update Teacher status
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({ is_active: isActive })
      .eq('id', id)

    if (teacherError) throw teacherError

    // 2. Update Profile status
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', teacher.user_id)

    if (profileError) console.error('[TeacherAction] Profile Status Update Error:', profileError)

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    console.error('[TeacherAction] toggleTeacherStatus error:', err)
    return { error: 'Failed to update status' }
  }
}
