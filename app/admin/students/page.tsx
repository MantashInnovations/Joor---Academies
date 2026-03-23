import StudentListClient from './student-list-client'
import { Metadata } from 'next'
import { getAuthContext } from "@/lib/auth/get-claims"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: 'Students | Admin Portal',
  description: 'Manage academy students and enrollments.',
}

export default async function StudentsPage() {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) redirect('/login')

  const supabase = await createClient()

  // Prefetch first page of students server-side — client renders with data already loaded
  const { data: initialStudents, count } = await supabase
    .from('students')
    .select('id, student_code, full_name, parent_phone, enrollment_date, is_active, created_at', { count: 'exact' })
    .eq('academy_id', ctx.academyId)
    .order('created_at', { ascending: false })
    .range(0, 9)

  return (
    <div className="p-4 md:p-8 pt-6">
      <StudentListClient 
        initialData={initialStudents ?? []} 
        initialCount={count ?? 0} 
      />
    </div>
  )
}
