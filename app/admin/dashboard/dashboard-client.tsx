'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Users2,
  BookOpen,
  TrendingUp,
  CreditCard,
  Receipt,
  Wallet,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { FinanceChart, EnrollmentChart } from '@/components/dashboard/dashboard-charts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { getDashboardMetrics, getDashboardCharts, getRecentActivity } from '@/app/actions/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardClient() {
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await getDashboardMetrics()
      if ('error' in res) throw new Error(res.error)
      return res.data
    }
  })

  const { data: charts, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const res = await getDashboardCharts()
      if ('error' in res) throw new Error(res.error)
      return res.data
    }
  })

  const { data: activity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const res = await getRecentActivity()
      if ('error' in res) throw new Error(res.error)
      return res.data
    }
  })

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's what's happening in your academy today.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {isMetricsLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Students"
              value={metrics?.totalStudents || 0}
              icon={Users}
              trend={{ value: "+2.5%", positive: true }}
            />
            <MetricCard
              label="Total Teachers"
              value={metrics?.totalTeachers || 0}
              icon={Users2}
            />
            <MetricCard
              label="Active Classes"
              value={metrics?.activeClasses || 0}
              icon={BookOpen}
            />
            <MetricCard
              label="Monthly Revenue"
              value={`$${metrics?.monthlyRevenue || 0}`}
              icon={TrendingUp}
              subtitle="This month"
              trend={{ value: "+12%", positive: true }}
            />
            <MetricCard
              label="Monthly Expenses"
              value={`$${metrics?.monthlyExpenses || 0}`}
              icon={CreditCard}
              subtitle="This month"
            />
            <MetricCard
              label="Pending Salaries"
              value={`$${metrics?.pendingSalaries || 0}`}
              icon={Receipt}
              trend={{ value: "-4%", positive: false }}
            />
            <MetricCard
              label="Pending Commissions"
              value={`$${metrics?.pendingCommissions || 0}`}
              icon={Wallet}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10 hover:bg-primary/10 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Manage Students</p>
                <p className="text-xs text-muted-foreground">View and add students</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/students">Go</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                <Users2 className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Staff Records</p>
                <p className="text-xs text-muted-foreground">Teachers & employees</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/teachers">Go</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Active Classes</p>
                <p className="text-xs text-muted-foreground">Schedule & fees</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/classes">Go</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                <Receipt className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Fee Portal</p>
                <p className="text-xs text-muted-foreground">Collect & track fees</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/finance/fees">Go</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {isChartsLoading ? (
          <>
            <Skeleton className="h-[400px] md:col-span-2 rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </>
        ) : (
          <>
            <FinanceChart data={charts?.financeChart || []} />
            <EnrollmentChart data={charts?.enrollmentChart || []} />
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
        {isActivityLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[350px] rounded-xl" />
            <Skeleton className="h-[350px] rounded-xl" />
            <Skeleton className="h-[350px] rounded-xl" />
          </div>
        ) : (
          <RecentActivity
            students={activity?.students || []}
            expenses={activity?.expenses || []}
            pendingFees={activity?.pendingFees || []}
          />
        )}
      </div>
    </div>
  )
}
