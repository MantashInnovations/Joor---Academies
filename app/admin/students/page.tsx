import StudentListClient from './student-list-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Students | Admin Portal',
  description: 'Manage academy students and enrollments.',
}

export default function StudentsPage() {
  return (
    <div className="p-4 md:p-8 pt-6">
      <StudentListClient />
    </div>
  )
}
