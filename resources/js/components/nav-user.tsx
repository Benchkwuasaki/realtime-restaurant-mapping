import { Link, router } from "@inertiajs/react"
import { ChevronsUpDown, LogOut, Settings, Building2 } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { UserInfo } from "@/components/user-info"
import { useAuth } from "@/hooks/use-auth"
import { route } from "ziggy-js"

type Office = { name: string | null; acronym: string | null }

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useAuth()

  if (!user) return null

  const { department, division, unit } = user.offices ?? {}
  const officeParts = ([department, division, unit] as (Office | undefined | null)[])
    .filter((o): o is Office => !!o?.name)

  const handleLogout = () => router.post(route('logout'))

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserInfo user={user} />
              </div>
            </DropdownMenuLabel>

            {officeParts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex items-start gap-1.5">
                  <Building2 className="size-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground leading-tight cursor-default">
                          {officeParts.map(o => o.acronym).join(' › ')}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{officeParts.map(o => o.name).join(' › ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={route('profile.edit')}>
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}