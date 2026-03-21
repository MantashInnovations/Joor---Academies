import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { TopHeader } from "@/components/top-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompleteProfileForm } from "@/components/complete-profile-form"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log(`[AdminLayout] User: ${user?.email || 'None'}`)

  if (!user) {
    console.log("[AdminLayout] No user found, redirecting to /login")
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_profile_completed, academy_name, academy_logo_url')
    .eq('id', user.id)
    .single()

  const role = profile?.role?.toLowerCase()

  if (role !== 'academy' && role !== 'academy_admin') {
    console.log(`[AdminLayout] Role '${role}' not authorized, redirecting to /`)
    redirect('/')
  }

  const userData = {
    name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || "", 
  }

  const academyData = {
    name: profile?.academy_name || "Joor Academy",
    logo: profile?.academy_logo_url || null,
  }

  console.log(`[AdminLayout] Academy Data:`, academyData)

  const needsProfileCompletion = profile?.is_profile_completed === false

  return (
    <SidebarProvider>
      <AdminSidebar user={userData} academy={academyData} />
      <SidebarInset>
        <TopHeader academyName={academyData.name} academyLogo={academyData.logo} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 relative">
          {children}
          <CompleteProfileForm open={needsProfileCompletion} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
