'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: string
    positive?: boolean
  }
}

export function MetricCard({ label, value, icon: Icon, subtitle, trend }: MetricCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" data-icon="inline-start" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="flex items-center gap-2">
            {trend && (
              <Badge
                variant={trend.positive ? "secondary" : "destructive"}
                className={cn(
                  "px-1 py-0 text-[10px] font-medium",
                  trend.positive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""
                )}
              >
                {trend.value}
              </Badge>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
