import * as React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export type NavItem = {
    title: string;
    url?: string | null;
    icon: LucideIcon;
    isActive?: boolean;
    show?: boolean;
    items?: { title: string; url?: string | null; exact?: boolean }[];
};

export function NavMain({
    items,
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
    const { url } = usePage();

    const stripQuery = (u?: string | null) => {
        if (!u) return '';
        return u.split('?')[0];
    };

    const toPath = (u?: string | null) => {
        if (!u) return '';
        const clean = stripQuery(u);

        try {
            // Handles absolute URLs produced by route() and converts to "/path"
            return new URL(clean, window.location.origin).pathname;
        } catch {
            // Handles already-relative paths like "/dashboard"
            return clean;
        }
    };

    const currentPath = toPath(url);

    const isActivePath = (targetUrl?: string | null, exact?: boolean) => {
        if (!targetUrl) return false;

        const targetPath = toPath(targetUrl);
        if (!targetPath) return false;

        if (targetPath === '/') return currentPath === '/';

        if (exact) return currentPath === targetPath;

        return (
            currentPath === targetPath ||
            currentPath.startsWith(targetPath + '/')
        );
    };

    const visibleItems = items.filter((item) => item.show !== false);

    if (visibleItems.length === 0) return null;

    return (
        <SidebarGroup>
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}

            <SidebarMenu>
                {visibleItems.map((item) => {
                    const hasChildren = !!item.items?.length;

                    // const isActive = isActivePath(item.url);
                    const isActive = isActivePath(item.url, !hasChildren);
                    const hasActiveChild =
                        item.items?.some((child) =>
                            isActivePath(child.url, child.exact),
                        ) ?? false;

                    const defaultOpen = hasActiveChild;

                    return (
                        <Collapsible
                            key={item.title}
                            defaultOpen={defaultOpen}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                {hasChildren ? (
                                    // Parent with children: whole row toggles the collapsible
                                    <CollapsibleTrigger
                                        className="hover:cursor-pointer"
                                        asChild
                                    >
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={
                                                isActive || hasActiveChild
                                            }
                                        >
                                            <item.icon />
                                            <span className="flex-1">
                                                {item.title}
                                            </span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                ) : item.url ? (
                                    // Leaf item with URL: normal navigation
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={isActive}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                ) : (
                                    // Leaf item with no URL: static (no navigation)
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={false}
                                    >
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                )}

                                {hasChildren ? (
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items!.map((subItem) => {
                                                const isChildActive =
                                                    isActivePath(
                                                        subItem.url,
                                                        subItem.exact,
                                                    );

                                                return (
                                                    <SidebarMenuSubItem
                                                        key={subItem.title}
                                                    >
                                                        {subItem.url ? (
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={
                                                                    isChildActive
                                                                }
                                                            >
                                                                <Link
                                                                    href={
                                                                        subItem.url
                                                                    }
                                                                >
                                                                    <span>
                                                                        {
                                                                            subItem.title
                                                                        }
                                                                    </span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        ) : (
                                                            <SidebarMenuSubButton
                                                                isActive={false}
                                                            >
                                                                <span>
                                                                    {
                                                                        subItem.title
                                                                    }
                                                                </span>
                                                            </SidebarMenuSubButton>
                                                        )}
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                ) : null}
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
