import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, CalendarCheck, FileCheck, User, Calculator, Gift, ChartColumn, Clock } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';
import { route } from 'ziggy-js';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Attendance',
        href: route('attendance.index'),
        icon: CalendarCheck,
    },
    {
        title: 'Document Tracking',
        href: route('document_tracking.index'),
        icon: FileCheck,
    },
    {
        title: 'Employee',
        href: route('employee.index'),
        icon: User,
    },
    {
        title: 'Payroll',
        href: route('payroll.index'),
        icon: Calculator,
    },
    {
        title: 'Benefits',
        href: route('benefits.index'),
        icon: Gift,
    },
    {
        title: 'Reports and Analytics',
        href: route('reports_and_analytics.index'),
        icon: ChartColumn,
    },
    {
        title: 'Activity Logs',
        href: route('activity_logs.index'),
        icon: Clock,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
