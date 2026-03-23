import TeachersClient from "./teachers-client"
import { Metadata } from "next"
import { getAuthContext } from "@/lib/auth/get-claims"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: 'Teachers | Admin Portal',
  description: 'Manage your academy faculty and staff.',
}

export default async function TeachersPage() {
  // Auth context reuses the same getUser() call as the layout (Next.js request deduplication)
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) redirect('/login')

  const supabase = await createClient()

  // Prefetch first page of teachers server-side — client renders with data already loaded
  const { data: initialTeachers, count } = await supabase
    .from('teachers')
    .select('id, first_name, last_name, email, specialization, joining_date, is_active, created_at', { count: 'exact' })
    .eq('academy_id', ctx.academyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 9)

  return (
    <div className="p-4 md:p-8 pt-6">
      <TeachersClient 
        initialData={initialTeachers ?? []} 
        initialCount={count ?? 0} 
      />
    </div>
  )
}
