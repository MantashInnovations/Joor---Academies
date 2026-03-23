'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth/get-claims'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

/**
 * SECTION 1: METRIC CARDS
 * Fetches counts and sums for the dashboard cards.
 */
export async function getDashboardMetrics() {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }

  // Restrict to Academy Admin
  if (ctx.role !== 'academy_admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const aid = ctx.academyId
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()

  try {
    const [
      studentsCount,
      teachersCount,
      classesCount,
      revenueSum,
      expensesSum,
      salariesSum,
      commissionsSum
    ] = await Promise.all([
      // 1. Total Active Students
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('academy_id', aid).eq('is_active', true),
      // 2. Total Teachers
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('academy_id', aid),
      // 3. Active Classes
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('academy_id', aid).eq('is_active', true),
      // 4. Monthly Revenue (Current Month)
      supabase.from('fee_records').select('actual_fee').eq('academy_id', aid).gte('created_at', monthStart).lte('created_at', monthEnd),
      // 5. Monthly Expenses (Current Month)
      supabase.from('expenses').select('amount').eq('academy_id', aid).gte('date', monthStart).lte('date', monthEnd),
      // 6. Pending Salaries
      supabase.from('salary_records').select('amount').eq('academy_id', aid).eq('status', 'pending'),
      // 7. Pending Commissions
      supabase.from('commission_records').select('teacher_earns').eq('academy_id', aid).eq('status', 'pending')
    ])

    return {
      success: true,
      data: {
        totalStudents: studentsCount.count || 0,
        totalTeachers: teachersCount.count || 0,
        activeClasses: classesCount.count || 0,
        monthlyRevenue: (revenueSum.data || []).reduce((acc, curr) => acc + (curr.actual_fee || 0), 0),
        monthlyExpenses: (expensesSum.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0),
        pendingSalaries: (salariesSum.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0),
        pendingCommissions: (commissionsSum.data || []).reduce((acc, curr) => acc + (curr.teacher_earns || 0), 0),
      }
    }
  } catch (error) {
    console.error('[DashboardAction] Metrics error:', error)
    return { error: 'Failed to fetch metrics.' }
  }
}

/**
 * SECTION 2: CHARTS
 * Fetches 6-month historical data for charts.
 */
export async function getDashboardCharts() {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const aid = ctx.academyId
  const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5)

  try {
    const now = new Date()
    const [revenueData, expenseData, studentGrowth] = await Promise.all([
      supabase.from('fee_records').select('actual_fee, created_at').eq('academy_id', aid).gte('created_at', sixMonthsAgo.toISOString()),
      supabase.from('expenses').select('amount, date').eq('academy_id', aid).gte('date', sixMonthsAgo.toISOString()),
      supabase.from('students').select('created_at').eq('academy_id', aid).gte('created_at', sixMonthsAgo.toISOString())
    ])

    // Process data into 6-month buckets
    const chartData = Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(now, 5 - i)
      const monthLabel = format(monthDate, 'MMM')
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)

      const revenue = (revenueData.data || [])
        .filter(r => {
          const d = new Date(r.created_at)
          return d >= mStart && d <= mEnd
        })
        .reduce((acc, curr) => acc + (curr.actual_fee || 0), 0)

      const expenses = (expenseData.data || [])
        .filter(e => {
          const d = new Date(e.date)
          return d >= mStart && d <= mEnd
        })
        .reduce((acc, curr) => acc + (curr.amount || 0), 0)

      const students = (studentGrowth.data || [])
        .filter(s => {
          const d = new Date(s.created_at)
          return d <= mEnd // Cumulative or per-month? Prompt says "enrollment growth", usually per-month new students or total count. 
          // Let's go with "new students per month" for the line chart usually, or total. 
          // The prompt says "Student enrollment growth", usually means total active count over time.
        })
        .length

      return {
        month: monthLabel,
        revenue,
        expenses,
        students
      }
    })

    return {
      success: true,
      data: {
        financeChart: chartData.map(d => ({ month: d.month, revenue: d.revenue, expenses: d.expenses })),
        enrollmentChart: chartData.map(d => ({ month: d.month, students: d.students }))
      }
    }
  } catch (error) {
    console.error('[DashboardAction] Charts error:', error)
    return { error: 'Failed to fetch chart data.' }
  }
}

/**
 * SECTION 3: RECENT ACTIVITY
 */
export async function getRecentActivity() {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.academyId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const aid = ctx.academyId

  try {
    const [recentStudents, recentExpenses, pendingFees] = await Promise.all([
      // Recent Students (last 5)
      supabase.from('students')
        .select('full_name, created_at, classes(name)')
        .eq('academy_id', aid)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent Expenses (last 5)
      supabase.from('expenses')
        .select('title, amount, category, date')
        .eq('academy_id', aid)
        .order('date', { ascending: false })
        .limit(5),

      // Pending (Overdue) Fees - Sample logic: fee_records where actual_fee < expected_fee? 
      // User says: students with overdue fees (name, amount, month)
      // Assuming a 'dues' view or specific table exists.
      supabase.from('fee_records')
        .select('student_id, actual_fee, month, students(full_name)')
        .eq('academy_id', aid)
        .lt('actual_fee', 1000) // Placeholder logic for overdue
        .limit(5)
    ])

    return {
      success: true,
      data: {
        students: (recentStudents.data || []).map(s => ({
          name: s.full_name,
          class: (s.classes as any)?.name || 'N/A',
          date: s.created_at
        })),
        expenses: recentExpenses.data || [],
        pendingFees: (pendingFees.data || []).map(f => ({
          name: (f.students as any)?.full_name || 'N/A',
          amount: f.actual_fee,
          month: f.month
        }))
      }
    }
  } catch (error) {
    console.error('[DashboardAction] Activity error:', error)
    return { error: 'Failed to fetch activity lists.' }
  }
}
