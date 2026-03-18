"use client"

import * as React from "react"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  DollarSign,
  GraduationCap,
  LogOut,
  Megaphone,
  Receipt,
  Settings,
  Users,
  Users2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const data = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/avatars/admin.png",
  },
  academy: {
    name: "Joor Academy",
    logo: GraduationCap,
  },
  navMain: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Students",
          url: "/admin/students",
          icon: Users,
        },
        {
          title: "Teachers",
          url: "/admin/teachers",
          icon: Users2,
        },
        {
          title: "Classes",
          url: "/admin/classes",
          icon: BookOpen,
        },
        {
          title: "Timetable",
          url: "/admin/timetable",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          title: "Fees",
          url: "/admin/finance/fees",
          icon: Receipt,
        },
        {
          title: "Salaries",
          url: "/admin/finance/salaries",
          icon: DollarSign,
        },
        {
          title: "Expenses",
          url: "/admin/finance/expenses",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Attendance",
          url: "/admin/attendance",
          icon: ClipboardList,
        },
        {
          title: "Announcements",
          url: "/admin/announcements",
          icon: Megaphone,
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AdminSidebar({
  user: propUser,
  academy: propAcademy,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar?: string }
  academy?: { name: string; logo?: string | React.ElementType | null }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login?message=Logged out successfully")
    router.refresh()
  }

  // Merge prop user with dummy data if needed, or just use prop user
  const displayUser = propUser || data.user
  const displayAcademy = propAcademy || data.academy

  React.useEffect(() => {
    if (displayAcademy.logo && typeof displayAcademy.logo === 'string') {
      console.log(`[AdminSidebar] Academy logo URL: ${displayAcademy.logo}`)
    }
  }, [displayAcademy.logo])

  const AcademyLogo = (displayAcademy.logo && typeof displayAcademy.logo !== 'string') 
    ? displayAcademy.logo 
    : data.academy.logo

  const isStringLogo = typeof displayAcademy.logo === 'string' && displayAcademy.logo !== ''

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                  {isStringLogo ? (
                    <img 
                      src={displayAcademy.logo as string} 
                      alt={displayAcademy.name} 
                      className="size-full object-cover" 
                      onError={(e) => console.error("[AdminSidebar] Logo failed to load:", displayAcademy.logo)}
                    />
                  ) : AcademyLogo ? (
                    <AcademyLogo className="size-4" />
                  ) : (
                    <div className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {displayAcademy.name}
                  </span>
                  <span className="truncate text-xs">Academy Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                    <AvatarFallback className="rounded-lg">
                      {displayUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayUser.name}</span>
                    <span className="truncate text-xs">{displayUser.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                      <AvatarFallback className="rounded-lg">
                        {displayUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayUser.name}</span>
                      <span className="truncate text-xs">{displayUser.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
