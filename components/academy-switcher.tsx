"use client"

import * as React from "react"
import { ChevronsUpDown, Check, Building2, PlusCircle, GraduationCap } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getMyAcademies, switchAcademy } from "@/app/actions/academy-switcher"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function AcademySwitcher({
  currentAcademy,
}: {
  currentAcademy: {
    name: string
    logo: string | React.ElementType | null
  }
}) {
  const { isMobile } = useSidebar()
  const [academies, setAcademies] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [switching, setSwitching] = React.useState(false)
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    async function fetchAcademies() {
      const { data, error } = await getMyAcademies()
      if (data) {
        setAcademies(data)
      }
      setLoading(false)
    }
    fetchAcademies()
  }, [])

  const handleSwitch = async (profileId: string, role: string) => {
    setSwitching(true)
    const activeProfile = academies.find(p => p.id === profileId)
    toast.loading(`Switching to ${activeProfile?.academy_name}...`, { id: "switch" })

    const res = await switchAcademy(profileId, role)
    if (res?.error) {
      toast.error(res.error, { id: "switch" })
      setSwitching(false)
      return
    }

    if (res?.redirectUrl) {
      // Log out of current session and redirect to login to resolve new alias
      await supabase.auth.signOut()
      router.push(res.redirectUrl)
    }
  }

  const isStringLogo = typeof currentAcademy.logo === 'string' && currentAcademy.logo !== ''
  const AcademyLogo = (currentAcademy.logo && typeof currentAcademy.logo !== 'string') 
    ? currentAcademy.logo as React.ElementType
    : GraduationCap

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                {isStringLogo ? (
                  <img 
                    src={currentAcademy.logo as string} 
                    alt={currentAcademy.name} 
                    className="size-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : AcademyLogo ? (
                  <AcademyLogo className="size-4" />
                ) : (
                  <div className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentAcademy.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">Admin</span>
              </div>
              {academies.length > 1 && (
                <ChevronsUpDown className="ml-auto size-4" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
          {academies.length > 1 && (
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Academy
              </DropdownMenuLabel>
              {academies.map((academy, index) => (
                <DropdownMenuItem
                  key={academy.id}
                  onClick={() => handleSwitch(academy.id, academy.role)}
                  disabled={switching || academy.academy_name === currentAcademy.name}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  <span className="truncate flex-1">{academy.academy_name}</span>
                  {academy.academy_name === currentAcademy.name && (
                    <Check className="size-4" />
                  )}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2 cursor-pointer" asChild>
                 <a href="/admin/settings">
                  <div className="flex size-6 items-center justify-center rounded-md bg-background border">
                    <PlusCircle className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add new academy</div>
                 </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
