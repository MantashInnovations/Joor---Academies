'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTeachers, toggleTeacherStatus } from '@/app/actions/teachers'
import { format } from 'date-fns'
import { toast } from 'sonner'
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
import { Search, MoreHorizontal, Eye, Edit, UserX, User, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { AddTeacherDialog } from '@/components/teachers/add-teacher-dialog'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'

export default function TeachersClient({
  initialData = [],
  initialCount = 0,
}: {
  initialData?: any[]
  initialCount?: number
}) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [debouncedSearch] = useDebounce(searchTerm, 300)
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  type TeachersResult = { success: true; data: any[]; count: number }
  const seedData: TeachersResult | undefined =
    page === 0 && debouncedSearch === '' && status === 'active'
      ? { success: true, data: initialData, count: initialCount }
      : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['teachers-list', page, debouncedSearch, status],
    queryFn: async (): Promise<TeachersResult> => {
      const res = await getTeachers({ page, search: debouncedSearch, status })
      if ('error' in res) throw new Error(res.error)
      return res as TeachersResult
    },
    placeholderData: (prev) => prev,
    initialData: seedData,
    initialDataUpdatedAt: seedData ? Date.now() : undefined,
  })

  const teachers = data?.data || []
  const totalCount = data?.count || 0
  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleRowClick = (teacherId: string) => {
    // router.push(`/admin/teachers/${teacherId}`)
    console.log('Clicked teacher:', teacherId)
  }

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    setIsProcessing(id)
    try {
      const nextStatus = !currentStatus
      const res = await toggleTeacherStatus(id, nextStatus)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(nextStatus ? 'Teacher reactivated' : 'Teacher deactivated')
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] })
    } finally {
      setIsProcessing(null)
    }
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

            Teachers
          </TypingAnimation>
          <Badge variant="secondary" className="text-sm font-mono flex items-center gap-1">
            <NumberTicker value={totalCount} />
            <span className="opacity-60 text-[10px] ml-0.5">{status === 'active' ? 'ACTIVE' : 'INACTIVE'}</span>
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
                placeholder="Search teachers..."
                className="pl-8 bg-background sm:bg-card/50 border-white/10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </MagicCard>
          <AddTeacherDialog trigger={
            <RippleButton className="h-10 px-4 bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 text-xs sm:text-sm">
              Add Teacher
            </RippleButton>
          } />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Tabs value={status} onValueChange={(v: any) => {
          setStatus(v)
          setPage(0)
        }} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-[300px] h-11 p-1 bg-muted/50">
            <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Deactivated
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden md:table-cell">Photo</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Specialization</TableHead>
              <TableHead className="hidden lg:table-cell">Joining Date</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <GraduationCap className="size-8 opacity-20 mb-2" />
                    <p>No teachers found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {teachers.map((teacher: any, index: number) => {
                  const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase() || 'TR'

                  return (
                    <motion.tr
                      key={teacher.id}
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
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="hidden md:table-cell">
                        <Avatar className="group-hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="font-semibold">
                        {teacher.first_name} {teacher.last_name}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="text-muted-foreground hidden lg:table-cell">
                        {teacher.email}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-normal border-primary/20 text-primary bg-primary/5">
                          {teacher.specialization || 'Faculty'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="hidden lg:table-cell">
                        {teacher.joining_date ? format(new Date(teacher.joining_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(teacher.id)} className="hidden sm:table-cell">
                        <Badge variant={teacher.is_active ? "default" : "secondary"} className="rounded-full px-3">
                          {teacher.is_active ? 'Active' : 'Inactive'}
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
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRowClick(teacher.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Schedule
                            </DropdownMenuItem>

                            <AddTeacherDialog
                              teacher={teacher}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                              }
                            />

                            <DropdownMenuSeparator />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className={teacher.is_active ? "text-destructive" : "text-primary"}
                                >
                                  {teacher.is_active ? (
                                    <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                                  ) : (
                                    <><User className="mr-2 h-4 w-4" /> Reactivate</>
                                  )}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {teacher.is_active ? 'Deactivate Teacher?' : 'Reactivate Teacher?'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {teacher.is_active
                                      ? `This will prevent ${teacher.first_name} ${teacher.last_name} from logging into the teacher portal.`
                                      : `This will restore ${teacher.first_name} ${teacher.last_name}'s access to the teacher portal.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className={teacher.is_active ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}
                                    onClick={() => handleStatusToggle(teacher.id, teacher.is_active)}
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{teachers.length > 0 ? page * pageSize + 1 : 0}</span> to{' '}
          <span className="font-medium">
            {Math.min((page + 1) * pageSize, totalCount)}
          </span>{' '}
          of <span className="font-medium">{totalCount}</span> teachers.
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
            disabled={isLast || isLoading || teachers.length === 0}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
