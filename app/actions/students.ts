'use server'

import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { revalidatePath } from 'next/cache'

// --- SCHEMAS ---
const getStudentsSchema = z.object({
  page: z.number().min(0).default(0),
  search: z.string().optional(),
  classFilter: z.string().optional(),
})

const createStudentSchema = z.object({
  full_name: z.string().min(1, 'Full name is required.'),
  cnic: z.string().min(1, 'CNIC is required.'),
  email: z.string().email().min(1, 'Email is required.'),
  date_of_birth: z.string().optional(),
  parent_name: z.string().min(1, 'Parent name is required.'),
  parent_phone: z.string().min(1, 'Parent phone is required.'),
  parent_email: z.string().email().optional().or(z.literal('')),
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

    // 1. Create Auth User for the student
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
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
      if (authError.message.includes('already been registered')) {
        return { error: `Authentication setup failed: This email is already registered. If a previous attempt failed, please delete the orphaned user from your Supabase Dashboard (Auth > Users) and try again.` }
      }
      return { error: `Authentication setup failed: ${authError.message}` }
    }

    // 2. Create/Update Profile record (Using upsert to handle triggers)
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authUser.user.id,
      full_name: parsed.data.full_name,
      role: 'student',
      cnic: parsed.data.cnic,
      is_profile_completed: true,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('[StudentAction] Profile Creation Error:', profileError)
      return { error: `Profile creation failed: ${profileError.message}` }
    }

    // 3. Create Student record (Using adminClient to bypass RLS)
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
      return { error: `Database error: ${error.message}` }
    }

    revalidatePath('/admin/students')
    return { success: true, data }
  } catch (err: any) {
    console.error('[StudentAction] createStudent unexpected error:', err)
    return { error: 'An unexpected error occurred. Please check your network or database connection.' }
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
