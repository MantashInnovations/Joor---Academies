"use client"

import { 
  Users, 
  UserPlus, 
  BookOpen, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { MagicCard } from "@/components/ui/magic-card"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { RippleButton } from "@/components/ui/ripple-button"

const stats = [
  {
    title: "Total Students",
    value: 1284,
    display: "1,284",
    description: "+12.5% from last month",
    icon: Users,
    trend: "up"
  },
  {
    title: "Active Teachers",
    value: 84,
    display: "84",
    description: "+2 new this week",
    icon: UserPlus,
    trend: "up"
  },
  {
    title: "Active Classes",
    value: 42,
    display: "42",
    description: "Scheduled for today",
    icon: BookOpen,
    trend: "neutral"
  },
  {
    title: "Monthly Revenue",
    value: 42500,
    display: "$42,500",
    description: "-3.2% from last month",
    icon: Receipt,
    trend: "down",
    prefix: "$",
  },
]

const activities = [
  { name: "John Smith", action: "Paid monthly fee", date: "2 mins ago", avatar: "JS" },
  { name: "Sarah Connor", action: "Added to Grade 10", date: "1 hour ago", avatar: "SC" },
  { name: "Dr. Brown", action: "Marked attendance", date: "3 hours ago", avatar: "DB" },
  { name: "Principal", action: "New announcement", date: "5 hours ago", avatar: "PR" },
]

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <MagicCard key={stat.title} className="overflow-hidden border-sidebar-border shadow-sm rounded-xl" gradientColor="hsl(var(--primary) / 0.15)">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className="rounded-md bg-muted p-2">
                  <stat.icon className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <NumberTicker
                    value={stat.value}
                    className="text-2xl font-bold text-foreground"
                  />
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  {stat.trend === "up" && (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  )}
                  {stat.trend === "down" && (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                  )}
                  <span className={stat.trend === "up" ? "text-emerald-500 font-medium" : stat.trend === "down" ? "text-destructive font-medium" : ""}>
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          </MagicCard>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="lg:col-span-4 border-sidebar-border shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Academy performance and growth analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-b-lg border-t border-sidebar-border">
            <span className="text-muted-foreground italic">Analytics Chart Component Placeholder</span>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-sidebar-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events in your academy.</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <AnimatedList delay={800} className="gap-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 w-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                    {activity.avatar}
                  </div>
                  <div className="grid gap-0.5 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{activity.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground shrink-0">{activity.date}</div>
                </div>
              ))}
            </AnimatedList>
            <RippleButton
              className="w-full mt-6 border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9"
              rippleColor="hsl(var(--primary) / 0.3)"
            >
              View All Activity
            </RippleButton>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
