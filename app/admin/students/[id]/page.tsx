import { getAuthContext } from '@/lib/auth/get-claims'
import { redirect } from 'next/navigation'
import StudentProfileClient from './student-profile-client'

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) {
    redirect('/login')
  }

  return (
    <div className="p-4 md:p-8 pt-6">
      <StudentProfileClient studentId={params.id} />
    </div>
  )
}
