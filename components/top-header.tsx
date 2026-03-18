"use client"

import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function TopHeader({ 
  academyName, 
  academyLogo 
}: { 
  academyName?: string,
  academyLogo?: string | null 
}) {
  const pathname = usePathname()
  
  // Dynamic title based on path
  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length <= 1) return "Dashboard"
    
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 bg-background/80 backdrop-blur-md z-30">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>
      
      <div className="flex flex-1 items-center justify-center px-4 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search dashboard..."
            className="w-full bg-muted/50 pl-9 md:w-full lg:w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="hidden sm:flex items-center gap-2 font-medium px-2.5 py-0.5 rounded-full border-primary/20 bg-primary/5 text-primary">
          {academyLogo && (
            <div className="size-4 overflow-hidden rounded-full shrink-0">
              <img src={academyLogo} alt="" className="size-full object-cover" />
            </div>
          )}
          {academyName || "Joor Academy"}
        </Badge>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
          </Button>
        </div>
      </div>
    </header>
  )
}
