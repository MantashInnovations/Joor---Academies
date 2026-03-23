'use client'

import { 
  BookOpen, 
  Calendar, 
  CreditCard, 
  GraduationCap,
  Trophy
} from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardClient() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Your academic journey, all in one place.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          label="GPA / Grade"
          value="N/A"
          icon={Trophy}
          subtitle="Coming Soon"
        />
        <MetricCard
          label="Pending Fees"
          value="$0"
          icon={CreditCard}
          subtitle="Coming Soon"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="bg-muted/5 border-dashed flex items-center justify-center h-[300px]">
          <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
            <Calendar className="size-8 opacity-20" />
            <p>Upcoming Schedule Placeholder</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/5 border-dashed flex items-center justify-center h-[300px]">
          <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
            <Trophy className="size-8 opacity-20" />
            <p>Academic Progress Placeholder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
