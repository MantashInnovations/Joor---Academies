'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface RecentActivityProps {
  students: any[]
  expenses: any[]
  pendingFees: any[]
}

export function RecentActivity({ students, expenses, pendingFees }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Students */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Students
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {students.length === 0 && <p className="text-xs text-muted-foreground">No recent students.</p>}
              {students.map((student, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{student.name}</p>
                    <Badge variant="outline" className="text-[10px]">{student.class}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(student.date), 'MMM d, yyyy')}
                  </p>
                  {i < students.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {expenses.length === 0 && <p className="text-xs text-muted-foreground">No recent expenses.</p>}
              {expenses.map((expense, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{expense.title}</p>
                    <p className="text-sm font-bold text-destructive">-${expense.amount}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{expense.category}</span>
                    <span>{format(new Date(expense.date), 'MMM d')}</span>
                  </div>
                  {i < expenses.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pending Fees */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {pendingFees.length === 0 && <p className="text-xs text-muted-foreground">No pending fees.</p>}
              {pendingFees.map((fee, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{fee.name}</p>
                    <p className="text-sm font-bold text-amber-600">${fee.amount}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Month: {fee.month}</p>
                  {i < pendingFees.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
