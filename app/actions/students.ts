'use server'

import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { sendSyncInvitationEmail } from '@/lib/emails/sync-invitation'
import { headers } from 'next/headers'

// --- SCHEMAS ---
const getStudentsSchema = z.object({
  page: z.number().min(0).default(0),
  search: z.string().optional(),
  classFilter: z.string().optional(),
})

const createStudentSchema = z.object({
  full_name: z.string().min(1, 'Full name is required.'),
  cnic: z.string().min(1, 'CNIC is required.'),
  email: z.string().email().min(1, 'Email is required.').transform(v => v.toLowerCase()),
  date_of_birth: z.string().optional(),
  parent_name: z.string().min(1, 'Parent name is required.'),
  parent_phone: z.string().min(1, 'Parent phone is required.'),
  parent_email: z.string().email().optional().or(z.literal('')).transform(v => v?.toLowerCase()),
  address: z.string().optional(),
  enrollment_date: z.string().min(1, 'Enrollment date is required.'),
  notes: z.string().optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// --- ACTIONS ---

export async function getStudents(input: z.infer<typeof getStudentsSchema>) {
  // 1. AUTH & AUTHZ
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  // 2. VALIDATE
  const parsed = getStudentsSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid parameters' }
  const { page, search, classFilter } = parsed.data

  const supabase = await createClient()
  const aid = ctx.academyId
  const pageSize = 10
  const start = page * pageSize
  const end = start + pageSize - 1

  try {
    let query = supabase
      .from('students')
      .select('id, student_code, full_name, parent_phone, enrollment_date, is_active', { count: 'exact' })
      .eq('academy_id', aid)
      .order('created_at', { ascending: false })

    if (search && search.trim() !== '') {
      // Use logical OR for search across name and code
      query = query.or(`full_name.ilike.%${search}%,student_code.ilike.%${search}%`)
    }

    // Note: classFilter is omitted for now until schema relationship (classes -> students or enrollments) is clarified.

    const { data, count, error } = await query.range(start, end)

    if (error) throw error

    return { success: true, data, count: count || 0 }
  } catch (err: any) {
    console.error('[StudentAction] getStudents error:', err)
    return { error: 'Failed to fetch students' }
  }
}

export async function createStudent(rawData: unknown) {
  // 1. AUTH & AUTHZ
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  // 2. VALIDATE
  const parsed = createStudentSchema.safeParse(rawData)
  if (!parsed.success) return { error: 'Validation failed', issues: parsed.error.flatten() }

  const supabase = await createClient()
  const aid = ctx.academyId

  try {
    // Generate Student Code (STU-YYYY-XXX)
    const year = new Date().getFullYear()

    // Simple sequence logic: get the highest code for this year and academy
    const { data: latestStudent } = await supabase
      .from('students')
      .select('student_code')
      .eq('academy_id', aid)
      .like('student_code', `STU-${year}-%`)
      .order('student_code', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNum = 1
    if (latestStudent && latestStudent.student_code) {
      const parts = latestStudent.student_code.split('-')
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1
      }
    }
    const studentCode = `STU-${year}-${nextNum.toString().padStart(3, '0')}`

    const adminClient = await createAdminClient()

    // 1. Tenant Uniqueness Check — within THIS academy
    const { data: existingInAcademy } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', parsed.data.email)
      .eq('academy_id', aid)
      .single()

    if (existingInAcademy) {
      return { error: 'A student with this email address already exists in your academy.' }
    }

    // 2. Check if a pending invitation already exists
    const { data: existingInvite } = await adminClient
      .from('academy_invitations')
      .select('id')
      .eq('email', parsed.data.email)
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
      .eq('email', parsed.data.email)
      .neq('academy_id', aid)
      .limit(1)

    if (otherProfiles && otherProfiles.length > 0) {
      // --- INVITATION FLOW ---
      const token = randomUUID()

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

      const { error: inviteError } = await adminClient
        .from('academy_invitations')
        .insert({
          email: parsed.data.email,
          academy_id: aid,
          role: 'student',
          token,
          payload: { ...parsed.data, student_code: studentCode },
          invited_by: ctx.userId,
        })

      if (inviteError) {
        console.error('[StudentAction] Invitation Error:', inviteError)
        return { error: 'Failed to create invitation.' }
      }

      const headersList = await headers()
      const host = headersList.get('host') || 'localhost:3000'
      const protocol = headersList.get('x-forwarded-proto') || 'http'
      const baseUrl = `${protocol}://${host}`

      await sendSyncInvitationEmail({
        to: parsed.data.email,
        inviteeName: parsed.data.full_name,
        invitingAcademyName: invitingAcademy?.academy_name || 'New Academy',
        existingAcademyName: existingAcademy?.academy_name || 'Existing Academy',
        role: 'student',
        token,
        baseUrl,
      })

      revalidatePath('/admin/students')
      return {
        success: true,
        invited: true,
        message: `An invitation email has been sent to ${parsed.data.email}. They need to accept it to join your academy.`,
      }
    }

    // --- NORMAL FLOW ---

    // 4. Generate Auth Alias
    const [localPart, domain] = parsed.data.email.split('@')
    const authAlias = `${localPart}+${aid}@${domain}`

    // 5. Create Auth User for the student
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: authAlias,
      password: 'Joor123',
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        role: 'student',
        academy_id: aid,
      },
      app_metadata: {
        role: 'student',
        academy_id: aid,
      },
    })

    if (authError) {
      console.error('[StudentAction] Auth Provisioning Error:', authError)
      return { error: 'Authentication setup failed.' }
    }

    // 6. Create/Update Profile record
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authUser.user.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      role: 'student',
      cnic: parsed.data.cnic,
      academy_id: aid,
      is_profile_completed: true,
      is_active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('[StudentAction] Profile Creation Error:', profileError)
      return { error: 'Profile creation failed.' }
    }

    // 7. Create Student record
    const { data, error } = await adminClient
      .from('students')
      .insert({
        ...parsed.data,
        student_code: studentCode,
        academy_id: aid,
        user_id: authUser.user.id,
      })
      .select('id, student_code')
      .single()

    if (error) {
      console.error('[StudentAction] Supabase Insert Error:', error)
      return { error: 'Failed to create student record.' }
    }

    revalidatePath('/admin/students')
    return { success: true, data }
  } catch (err: any) {
    console.error('[StudentAction] createStudent unexpected error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function getStudentProfile(studentId: string) {
  // 1. AUTH & AUTHZ
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const aid = ctx.academyId

  try {
    // Parallel fetching for performance
    const [studentData, feesData] = await Promise.all([
      // Primary Student Profile
      supabase
        .from('students')
        .select(`
          id, student_code, full_name, date_of_birth, gender, phone, email,
          parent_name, parent_phone, parent_email, address, enrollment_date, is_active, notes,
          classes(id, name, monthly_fee)
        `)
        .eq('id', studentId)
        .eq('academy_id', aid)
        .single(),

      // Fee Records
      supabase
        .from('fee_records')
        .select('id, month, actual_fee, expected_fee, status, created_at')
        .eq('student_id', studentId)
        .eq('academy_id', aid)
        .order('created_at', { ascending: false })
    ])

    if (studentData.error) throw studentData.error

    // TODO: Add attendance fetch here when attendance schema is confirmed.

    return {
      success: true,
      data: {
        profile: studentData.data,
        fees: feesData.data || [],
        attendance: [] // Placeholder
      }
    }
  } catch (err: any) {
    console.error('[StudentAction] getStudentProfile error:', err)
    return { error: 'Failed to fetch student profile.' }
  }
}

export async function updateStudent(studentId: string, rawData: unknown) {
  // 1. AUTH & AUTHZ
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }
  if (ctx.role !== 'academy_admin' && ctx.role !== 'super_admin') return { error: 'Forbidden' }

  // 2. VALIDATE
  const parsed = createStudentSchema.safeParse(rawData) // Reuse schema
  if (!parsed.success) return { error: 'Validation failed', issues: parsed.error.flatten() }

  const supabase = await createClient()
  const aid = ctx.academyId

  try {
    // Fetch student to get user_id to sync profile and auth
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .eq('academy_id', aid)
      .single()

    if (fetchError || !student) return { error: 'Student not found or unauthorized' }

    const adminClient = await createAdminClient()
    const { full_name, email, cnic } = parsed.data

    // Sync Profile
    if (full_name || email || cnic) {
      const updateData: any = {}
      if (full_name) updateData.full_name = full_name
      if (email) updateData.email = email
      if (cnic) updateData.cnic = cnic

      const { error: profileError } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', student.user_id)

      if (profileError) console.error('[StudentAction] Profile Update Error:', profileError)
    }

    // Sync Auth Email and check tenant uniqueness
    if (email) {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('academy_id', aid)
        .neq('id', student.user_id)
        .single()

      if (existingProfile) {
        return { error: 'A student with this email address already exists in your academy.' }
      }

      const [localPart, domain] = email.split('@')
      const authAlias = `${localPart}+${aid}@${domain}`

      const { error: authError } = await adminClient.auth.admin.updateUserById(student.user_id, {
        email: authAlias,
      })
      if (authError) console.error('[StudentAction] Auth Email Update Error:', authError)
    }

    const { error } = await supabase
      .from('students')
      .update(parsed.data)
      .eq('id', studentId)
      .eq('academy_id', aid) // Security check

    if (error) throw error

    revalidatePath('/admin/students')
    return { success: true }
  } catch (err: any) {
    console.error('[StudentAction] updateStudent error:', err)
    return { error: 'Failed to update student.' }
  }
}
