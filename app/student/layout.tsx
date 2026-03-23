import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleSidebar } from "@/components/role-sidebar"
import { TopHeader } from "@/components/top-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LayoutDashboard, BookOpen, Calendar, CreditCard, Settings, User } from "lucide-react"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // 1. Fetch Student profile and academy ID
  const { data: student } = await supabase
    .from('students')
    .select('full_name, academy_id')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect("/") // Or handle error

  // 2. Fetch Academy branding
  const { data: academy } = await supabase
    .from('profiles')
    .select('academy_name, academy_logo_url')
    .eq('id', student.academy_id)
    .single()

  const userData = {
    name: student.full_name || user.email?.split('@')[0] || "Student",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || "",
  }

  const academyData = {
    name: academy?.academy_name || "Joor Academy",
    logo: academy?.academy_logo_url || null,
  }

  return (
    <SidebarProvider>
      <RoleSidebar user={userData} academy={academyData} roleName="Student Portal" role="student" />
      <SidebarInset>
        <TopHeader academyName={academyData.name} academyLogo={academyData.logo} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 relative">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
