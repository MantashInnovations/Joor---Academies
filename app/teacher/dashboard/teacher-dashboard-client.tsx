'use client'

import { 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  GraduationCap
} from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardClient() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your academy command center.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="My Students"
          value={0}
          icon={Users}
          subtitle="Coming Soon"
        />
        <MetricCard
          label="My Classes"
          value={0}
          icon={BookOpen}
          subtitle="Coming Soon"
        />
        <MetricCard
          label="Attendance"
          value="0%"
          icon={Calendar}
          subtitle="Coming Soon"
        />
        <MetricCard
          label="Assignments"
          value={0}
          icon={ClipboardList}
          subtitle="Coming Soon"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="bg-muted/5 border-dashed flex items-center justify-center h-[300px]">
          <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
            <Calendar className="size-8 opacity-20" />
            <p>Class Schedule Placeholder</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/5 border-dashed flex items-center justify-center h-[300px]">
          <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
            <Users className="size-8 opacity-20" />
            <p>Recent Student Activity Placeholder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
