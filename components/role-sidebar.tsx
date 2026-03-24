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
  User,
  LucideIcon
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
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
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AcademySwitcher } from "@/components/academy-switcher"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const TEACHER_NAV: NavGroup[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
      { title: "My Classes", url: "/teacher/classes", icon: BookOpen },
      { title: "Attendance", url: "/teacher/attendance", icon: Calendar },
    ],
  },
  {
    title: "Academic",
    items: [
      { title: "Assignments", url: "/teacher/assignments", icon: ClipboardList },
      { title: "Settings", url: "/teacher/settings", icon: Settings },
    ],
  },
]

export const STUDENT_NAV: NavGroup[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
      { title: "My Classes", url: "/student/classes", icon: BookOpen },
      { title: "My Attendance", url: "/student/attendance", icon: Calendar },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "My Fees", url: "/student/fees", icon: CreditCard },
      { title: "Profile", url: "/student/profile", icon: User },
    ],
  },
]

interface RoleSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar?: string }
  academy?: { name: string; logo?: string | React.ElementType | null }
  navMain?: NavGroup[]
  roleName: string
  role?: 'teacher' | 'student'
}

export function RoleSidebar({
  user,
  academy,
  navMain: propNavMain,
  roleName,
  role,
  ...props
}: RoleSidebarProps) {
  const navMain = propNavMain || (role === 'teacher' ? TEACHER_NAV : role === 'student' ? STUDENT_NAV : [])
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login?message=Logged out successfully")
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const isStringLogo = typeof academy?.logo === 'string' && academy.logo !== ''
  const DefaultLogo = GraduationCap
  const AcademyLogo = (academy?.logo && typeof academy.logo !== 'string') 
    ? academy.logo as React.ElementType
    : DefaultLogo

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <AcademySwitcher
          currentAcademy={{
            name: academy?.name || "Joor Academy",
            logo: academy?.logo || null,
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(item.url)
                      }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
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
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
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
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
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
