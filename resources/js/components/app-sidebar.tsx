'use client';

import { Link } from '@inertiajs/react';
import {
    User,
    LayoutDashboard,
    File,
    Building2,
    FileCheck2,
    Calendar,
    Logs,
    Play,
    FileOutput,
    ArrowLeftRight,
    Settings2,
    UserCog,
    Bell,
    FileBarChart,
} from 'lucide-react';
import * as React from 'react';

import { route } from 'ziggy-js';
import Logo from '@/assets/images/logo.svg';
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
import { useAuth } from '@/hooks/use-auth';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';

type Office = { name: string | null; acronym: string | null };

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user, hasRole } = useAuth();
    const { department, division, unit } = user?.offices ?? {};
    const hasLinkedDepartment = Boolean(department?.name);
    const incomingDocumentsCount =
        user?.notifications?.incoming_documents_count ?? 0;
    const officeParts = (
        [department, division, unit] as (Office | undefined | null)[]
    ).filter((office): office is Office => !!office?.name);

    const data = {
        navMain: [
            {
                title: 'Dashboard',
                url: route('dashboard'),
                icon: LayoutDashboard,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
            },
            {
                title: 'Employee',
                url: route('employee.index'),
                icon: User,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
            },
            {
                title: 'My Profile',
                url: user?.employee_id
                    ? route('employee.show', user?.employee_id)
                    : '#',
                icon: User,
                show: hasRole('employee'),
            },
            {
                title: 'Organization',
                url: null,
                icon: Building2,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Organizational Chart',
                        url: route('organization.chart'),
                    },
                    {
                        title: 'Departments',
                        url: route('department.index'),
                    },
                    {
                        title: 'Divisions',
                        url: route('division.index'),
                    },
                    {
                        title: 'Units',
                        url: route('unit.index'),
                    },
                    {
                        title: 'Positions',
                        url: route('position.index'),
                    },
                    {
                        title: 'Internal Organization',
                        url: route('internal-organization.index'),
                    },
                ],
            },
            {
                title: 'Attendance',
                url: null,
                icon: FileCheck2,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Attendance Logs',
                        url: route('recognition-logs.index'),
                    },
                    {
                        title: 'Attendance Record',
                        url: route('attendance-record.index'),
                    },
                    {
                        title: 'Whereabout Slip',
                        url: route('whereabout-slip.index'),
                    },
                    {
                        title: 'Holiday Management',
                        url: '/holiday',
                    },
                ],
            },
            {
                title: 'Leave',
                url: '/leave',
                icon: Calendar,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin') ||
                    hasRole('document_tracking_operator'),
                items: [
                    {
                        title: 'Leave Calendar',
                        url: route('leave.leave-calendar'),
                    },
                    {
                        title: 'Leave Application',
                        url: route('leave.leave-application.index'),
                    },
                    {
                        title: 'Leave Adjustment Memo',
                        url: '/leave/leave-adjustment-memo',
                    },
                    {
                        title: 'Monthly Earned Leave Posting',
                        url: route('leave.accrual.index'),
                    },
                    {
                        title: 'Leave Settings',
                        url: route('leave.leave-settings'),
                    },
                ], //.filter(item =>
                //   // employees only see Leave Application
                //   hasRole('employee') && !hasRole('super_admin')
                //     ? item.title === 'Leave Application'
                //     : true
                // )
            },
            {
                title: 'Leave Application',
                url: route('leave.leave-application.index'),
                icon: Calendar,
                show: hasRole('employee'),
            },
            {
                title: 'Payroll Processing',
                url: route('payroll.index'),
                icon: Play,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
            },
            {
                title: 'Outputs',
                url: null,
                icon: FileOutput,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Payroll Register',
                        url: route('payroll-register.index'),
                    },
                    {
                        title: 'Pay Slip Generation',
                        url: route('payslipgeneration.index'),
                    },
                    {
                        title: 'Government Remittance Report',
                        url: route('governmentremittancereport.index'),
                    },
                ],
            },
            {
                title: 'Pay Adjustments',
                url: null,
                icon: ArrowLeftRight,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Allowance Management',
                        url: route('allowancemanagement.index'),
                    },
                    { title: 'Loan Entry', url: route('loanentry.index') },
                    {
                        title: 'Internal Org Deductions',
                        url: route('internal-org-deductions.index'),
                    },
                    {
                        title: 'Other Deduction Entry',
                        url: route('otherdeductions.index'),
                    },
                ],
            },
            {
                title: 'Configuration',
                url: null,
                icon: Settings2,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Payroll Deduction Settings',
                        url: route('payroll.deduction-settings.index'),
                    },
                    {
                        title: 'Salary Grade Table',
                        url: route('payroll.salary-grade.index'),
                    },
                    {
                        title: 'Step Increment',
                        url: route('payroll.step-increment.index'),
                    },
                ],
            },
            {
                title: 'Document Tracking',
                url: null,
                icon: File,
                badgeCount: incomingDocumentsCount,
                show:
                    hasLinkedDepartment &&
                    (hasRole('ogm') ||
                        hasRole('hr_admin') ||
                        hasRole('super_admin') ||
                        hasRole('document_tracking_operator')),
                items: [
                    {
                        title: 'Incoming',
                        url: route('document-tracking-incoming.index'),
                        badgeCount: incomingDocumentsCount,
                    },
                    {
                        title: 'Outgoing',
                        url: route('document-tracking-outgoing.index'),
                    },
                    {
                        title: 'Archive',
                        url: route('document-tracking-archive.index'),
                    },
                ],
            },
            {
                title: 'Reports and Analytics',
                url: '/reports_and_analytics',
                icon: FileBarChart,
                show:
                    hasRole('ogm') ||
                    hasRole('hr_admin') ||
                    hasRole('super_admin'),
                items: [
                    {
                        title: 'Employee Reports',
                        url: route(
                            'reports_and_analytics.employee-report.index',
                        ),
                    },
                    {
                        title: 'Attendance Reports',
                        url: route(
                            'reports_and_analytics.attendance-report.index',
                        ),
                    },
                    {
                        title: 'Leave Reports',
                        url: route('reports_and_analytics.leave.index'),
                    },
                    {
                        title: 'Payroll Reports',
                        url: route(
                            'reports_and_analytics.payroll-report.index',
                        ),
                    },
                    {
                        title: 'Government Reports',
                        url: route(
                            'reports_and_analytics.government-report.index',
                        ),
                    },
                ],
            },
            {
                title: 'Announcements',
                url: route('announcements.index'),
                icon: Bell,
                show: true,
            },
            {
                title: 'Activity Logs',
                url: route('activity_logs.index'),
                icon: Logs,
                show: true,
            },
        ],
        // navSecondary: [
        //   {
        //     title: "Support",
        //     url: "#",
        //     icon: LifeBuoy,
        //   },
        //   {
        //     title: "Feedback",
        //     url: "#",
        //     icon: Send,
        //   },
        // ],
        // projects: [
        //   {
        //     name: "Design Engineering",
        //     url: "#",
        //     icon: Frame,
        //   },
        //   {
        //     name: "Sales & Marketing",
        //     url: "#",
        //     icon: PieChart,
        //   },
        //   {
        //     name: "Travel",
        //     url: "#",
        //     icon: Map,
        //   },
        // ],
    };

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="h-auto min-h-0 py-3"
                        >
                            <Link
                                href={route('dashboard')}
                                className="flex items-center gap-3 px-2"
                            >
                                <img
                                    src={Logo}
                                    alt="Metro Kidapawan Water District Logo"
                                    className="h-12 w-12 shrink-0 object-contain"
                                />
                                <div
                                    className="flex h-12 flex-col justify-between leading-none font-bold"
                                    aria-label="MKWD"
                                >
                                    <p>Metro Kidapawan</p>
                                    <p>Water District</p>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {(() => {
                    if (officeParts.length === 0) return null;

                    return (
                        <div className="flex justify-center gap-1.5 px-3 pb-2">
                            <Building2 className="size-3 shrink-0 text-muted-foreground" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-row">
                                            <p className="cursor-default text-xs leading-tight font-bold text-muted-foreground">
                                                {officeParts
                                                    .map(
                                                        (office) =>
                                                            office.acronym ??
                                                            office.name,
                                                    )
                                                    .join(' › ')}
                                            </p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            {officeParts
                                                .map((office) => office.name)
                                                .join(' › ')}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    );
                })()}
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {/* <NavProjects projects={data.projects} /> */}
                {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
