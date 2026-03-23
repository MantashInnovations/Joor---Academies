'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudents } from '@/app/actions/students'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useDebounce } from 'use-debounce'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, MoreHorizontal, Eye, Edit, UserX, ChevronLeft, ChevronRight } from 'lucide-react'
import { AddStudentDialog } from '@/components/students/add-student-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { NumberTicker } from '@/components/ui/number-ticker'
import { MagicCard } from '@/components/ui/magic-card'
import { RippleButton } from '@/components/ui/ripple-button'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentListClient() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students-list', page, debouncedSearch],
    queryFn: async () => {
      const res = await getStudents({ page, search: debouncedSearch })
      if ('error' in res) throw new Error(res.error)
      return res
    },
    placeholderData: (prev) => prev, // keeps old data on screen while fetching next page
  })

  // Basic calculation for pagination UI
  const students = data?.data || []
  const totalCount = data?.count || 0
  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleRowClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <TypingAnimation 
            as="h1" 
            className="text-3xl font-bold tracking-tight"
            duration={50}
          >
            Students
          </TypingAnimation>
          <Badge variant="secondary" className="text-sm font-mono flex items-center gap-1">
            <NumberTicker value={totalCount} />
            <span className="opacity-60 text-[10px] ml-0.5">TOTAL</span>
          </Badge>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <MagicCard 
            className="p-0 border-none bg-transparent" 
            gradientSize={120}
            gradientColor="hsl(var(--primary) / 0.1)"
          >
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="pl-8 bg-card/50 border-white/10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </MagicCard>
          <AddStudentDialog trigger={
            <RippleButton className="h-10 px-4 bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20">
              Add Student
            </RippleButton>
          } />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead>Student Code</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Parent Phone</TableHead>
              {/* <TableHead>Classes</TableHead> Placeholder for multi-select relation */}
              <TableHead>Enrolled On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading State Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {students.map((student, index) => {
                  const initials = student.full_name
                    ? student.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'ST'

                  return (
                    <motion.tr 
                      key={student.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                      className="group cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <TableCell onClick={() => handleRowClick(student.id)}>
                        <Avatar className="group-hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(student.id)} className="font-mono text-xs font-bold text-primary/70">
                        {student.student_code}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(student.id)} className="font-semibold">
                        {student.full_name}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(student.id)} className="text-muted-foreground">
                        {student.parent_phone || 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(student.id)}>
                        {student.enrollment_date ? format(new Date(student.enrollment_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(student.id)}>
                        <Badge variant={student.is_active ? "default" : "secondary"} className="rounded-full px-3">
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRowClick(student.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <UserX className="mr-2 h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{students.length > 0 ? page * pageSize + 1 : 0}</span> to{' '}
          <span className="font-medium">
            {Math.min((page + 1) * pageSize, totalCount)}
          </span>{' '}
          of <span className="font-medium">{totalCount}</span> students.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={isFirst || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={isLast || isLoading || students.length === 0}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
