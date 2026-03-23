import DashboardClient from './dashboard-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Admin Portal',
  description: 'Manage your academy metrics, finances, and activities.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
