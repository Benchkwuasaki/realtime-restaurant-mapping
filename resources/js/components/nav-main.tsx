import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, usePage } from "@inertiajs/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type NavItem = {
  title: string
  url?: string | null
  icon: LucideIcon
  badgeCount?: number
  isActive?: boolean
  show?: boolean
  items?: { title: string; url?: string | null; badgeCount?: number }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { url } = usePage()

  const stripQuery = (u?: string | null) => {
    if (!u) return ""
    return u.split("?")[0]
  }

  const toPath = (u?: string | null) => {
    if (!u) return ""
    const clean = stripQuery(u)

    try {
      // Handles absolute URLs produced by route() and converts to "/path"
      return new URL(clean, window.location.origin).pathname
    } catch {
      // Handles already-relative paths like "/dashboard"
      return clean
    }
  }

  const currentPath = toPath(url)

  const isActivePath = (targetUrl?: string | null) => {
    if (!targetUrl) return false

    const targetPath = toPath(targetUrl)
    if (!targetPath) return false

    if (targetPath === "/") return currentPath === "/"

    return currentPath === targetPath || currentPath.startsWith(targetPath + "/")
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          if (item.show === false) return null

          const hasChildren = !!item.items?.length

          const isActive = isActivePath(item.url)
          const hasActiveChild =
            item.items?.some((child) => isActivePath(child.url)) ?? false

          const defaultOpen = hasActiveChild

          return (
            <Collapsible key={item.title} defaultOpen={defaultOpen} className="group/collapsible">
              <SidebarMenuItem>
                {hasChildren ? (
                  <CollapsibleTrigger className="hover:cursor-pointer" asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive || hasActiveChild}
                    >
                      <item.icon />
                      <span className="flex-1">{item.title}</span>
                      {(item.badgeCount ?? 0) > 0 ? (
                        <Badge
                          variant="destructive"
                          className="h-4 min-w-4 rounded-full px-1 text-[9px] font-medium leading-none"
                        >
                          {item.badgeCount}
                        </Badge>
                      ) : null}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : item.url ? (
                  // Leaf item with URL: normal navigation
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  // Leaf item with no URL: static (no navigation)
                  <SidebarMenuButton tooltip={item.title} isActive={false}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}

                {hasChildren ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!.map((subItem) => {
                        const isChildActive = isActivePath(subItem.url)

                        // If a child has no URL, render it as static
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            {subItem.url ? (
                              <Link
                                href={subItem.url}
                                className={cn(
                                  "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center justify-between gap-2 overflow-hidden rounded-md px-2 text-sm outline-hidden focus-visible:ring-2",
                                  isChildActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                                )}
                              >
                                <span>{subItem.title}</span>
                                {(subItem.badgeCount ?? 0) > 0 ? (
                                  <Badge
                                    variant="destructive"
                                    className="h-4 min-w-4 rounded-full px-1 text-[9px] font-medium leading-none"
                                  >
                                    {subItem.badgeCount}
                                  </Badge>
                                ) : null}
                              </Link>
                            ) : (
                              <SidebarMenuSubButton isActive={false}>
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
