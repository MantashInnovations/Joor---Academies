import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleSidebar } from "@/components/role-sidebar"
import { TopHeader } from "@/components/top-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LayoutDashboard, BookOpen, Calendar, ClipboardList, Settings, User } from "lucide-react"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // 1. Fetch Teacher profile and academy ID
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, first_name, last_name, academy_id')
    .eq('user_id', user.id)
    .single()

  if (!teacher) redirect("/") // Or handle error

  // 2. Fetch Academy branding
  const { data: academy } = await supabase
    .from('profiles')
    .select('academy_name, academy_logo_url')
    .eq('id', teacher.academy_id)
    .single()

  const userData = {
    name: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : user.email?.split('@')[0] || "Teacher",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || "",
  }

  const academyData = {
    name: academy?.academy_name || "Joor Academy",
    logo: academy?.academy_logo_url || null,
  }

  return (
    <SidebarProvider>
      <RoleSidebar user={userData} academy={academyData} roleName="Teacher Portal" role="teacher" />
      <SidebarInset>
        <TopHeader academyName={academyData.name} academyLogo={academyData.logo} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 relative">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
