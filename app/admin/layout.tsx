import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { TopHeader } from "@/components/top-header"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompleteProfileForm } from "@/components/complete-profile-form"
import { unstable_cache } from "next/cache"

// Cache the profile DB query per user — 5 minute TTL.
// We use createAdminClient() here because unstable_cache (cross-request) 
// cannot access cookies() (per-request).
async function getAdminProfile(userId: string) {
  const fetchProfile = unstable_cache(
    async (id: string) => {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, is_profile_completed, academy_name, academy_logo_url, first_name')
        .eq('id', id)
        .single()
      return data
    },
    [`admin-profile-${userId}`],
    { revalidate: 300, tags: [`admin-profile-${userId}`] }
  )
  return fetchProfile(userId)
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // Security: getUser() must run every request — DO NOT cache this
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Profile data is cached — DB query only runs once per 5 minutes per user
  const profile = await getAdminProfile(user.id)

  const role = profile?.role?.toLowerCase()

  if (role !== 'academy' && role !== 'academy_admin') {
    redirect('/')
  }

  const displayName = profile?.full_name 
    || profile?.first_name 
    || user.user_metadata?.full_name 
    || user.email?.split('@')[0] 
    || "User"

  const userData = {
    name: displayName,
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || "",
  }

  const academyData = {
    name: profile?.academy_name || "Joor Academy",
    logo: profile?.academy_logo_url || null,
  }

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
