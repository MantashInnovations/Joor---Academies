'use client'

import { useQuery } from '@tanstack/react-query'
import { getStudentProfile } from '@/app/actions/students'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Edit, 
  ArrowLeft 
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default function StudentProfileClient({ studentId }: { studentId: string }) {
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const res = await getStudentProfile(studentId)
      if ('error' in res) throw new Error(res.error)
      return res.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[600px] md:col-span-2 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col gap-4 text-center py-10">
        <h2 className="text-xl font-bold">Failed to load profile</h2>
        <Button variant="outline" asChild className="mx-auto"><Link href="/admin/students">Go Back</Link></Button>
      </div>
    )
  }

  const { profile, fees } = result
  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/students"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Profile Overview */}
        <Card className="h-fit">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-sm">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
            <CardDescription className="text-sm font-medium mt-1">
              {profile.student_code}
            </CardDescription>
            <div className="mt-2 flex justify-center">
              <Badge variant={profile.is_active ? "default" : "secondary"}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Enrolled: {profile.enrollment_date ? format(new Date(profile.enrollment_date), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-primary" />
                <span>Parent: {profile.parent_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>{profile.parent_phone || 'N/A'}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <Button className="w-full" variant="outline">
              <Edit className="w-4 h-4 mr-2" /> Quick Edit
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Tabbed Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-xl">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Detailed personal and contact info.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{profile.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student Phone</p>
                      <p className="font-medium">{profile.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student Email</p>
                      <p className="font-medium">{profile.email || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="font-medium">{profile.address || 'N/A'}</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Parent / Guardian</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Parent Name</p>
                        <p className="font-medium">{profile.parent_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Parent Phone</p>
                        <p className="font-medium">{profile.parent_phone}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Parent Email</p>
                        <p className="font-medium">{profile.parent_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Subjects</CardTitle>
                  <CardDescription>Classes and subjects this student is attending.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {!profile.classes || profile.classes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No subjects enrolled.</p>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(profile.classes) ? profile.classes.map((c: any, i: number) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                             <div className="flex items-center gap-3">
                               <GraduationCap className="h-5 w-5 text-primary" />
                               <div>
                                 <p className="font-medium">{c.name}</p>
                                 <p className="text-xs text-muted-foreground">Class Record ID: {c.id}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-lg">${c.monthly_fee || 0}</p>
                               <p className="text-xs text-muted-foreground">per month</p>
                             </div>
                           </div>
                        )) : (
                          // If it's a single object due to schema relation changes
                          <div className="flex items-center justify-between p-4 rounded-lg border">
                             <div className="flex items-center gap-3">
                               <GraduationCap className="h-5 w-5 text-primary" />
                               <div>
                                 <p className="font-medium">{(profile.classes as any).name}</p>
                               </div>
                             </div>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Record</CardTitle>
                  <CardDescription>Coming soon after schema finalization.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center border-dashed border-2 rounded-lg mx-6 mb-6">
                  <p className="text-muted-foreground">Attendance analytics will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fee History</CardTitle>
                  <CardDescription>Past billing cycles and transaction status.</CardDescription>
                </CardHeader>
                <CardContent>
                  {fees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No fee records found.</p>
                  ) : (
                    <div className="space-y-4">
                      {fees.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                          <div>
                            <p className="font-semibold">{f.month}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(f.created_at), 'PPP')}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Expected</p>
                            <p className="text-sm text-muted-foreground">${f.expected_fee || 0}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold">${f.actual_fee || 0}</p>
                            <Badge variant={f.status === 'paid' ? "default" : "destructive"}>
                              {f.status || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
