"use client"

import { Link } from "@inertiajs/react"
import {
  User,
  LayoutDashboard,
  File,
  Building2,
  FileCheck2,
  Calendar,
  Wallet,
  Logs,
  Bell,
  FileBarChart,
  HelpCircle
} from "lucide-react"
import * as React from "react"

import { route } from "ziggy-js"
import Logo from "@/assets/images/logo.svg"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type Office = { name: string | null; acronym: string | null }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasRole } = useAuth()
  const { department, division, unit } = user?.offices ?? {}
  const hasLinkedDepartment = Boolean(department?.name)
  const incomingDocumentsCount = user?.notifications?.incoming_documents_count ?? 0
  const officeParts = ([department, division, unit] as (Office | undefined | null)[])
    .filter((office): office is Office => !!office?.name)

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: route("dashboard"),
        icon: LayoutDashboard,
        show: hasRole("ogm") || hasRole("hr_admin") || hasRole("super_admin"),
      },
      {
        title: "Employee",
        url: route("employee.index"),
        icon: User,
        show: hasRole('ogm') || hasRole('hr_admin') || hasRole('super_admin'),
      },
      {
        title: "Organization",
        url: null,
        icon: Building2,
        show: hasRole('ogm') || hasRole('hr_admin') || hasRole('super_admin'),
        items: [
          {
            title: "Organizational Chart",
            url: route("organization.chart"),
          },
          {
            title: "Departments",
            url: route("department.index"),
          },
          {
            title: "Divisions",
            url: route("division.index"),
          },
          {
            title: "Units",
            url: route("unit.index"),
          },
          {
            title: "Positions",
            url: route("position.index"),
          },
          {
            title: "Internal Organization",
            url: route("internal-organization.index"),
          }
        ]
      },
      {
        title: "Attendance",
        url: null,
        icon: FileCheck2,
        show: hasRole('ogm') || hasRole('hr_admin') || hasRole('super_admin'),
        items: [
          {
            title: "Attendance Logs",
            url: route('recognition-logs.index'),
          },
          {
            title: "Attendance Record",
            url: route('attendance-record.index'),
          },
          {
            title: "Whereabout Slip",
            url: route('whereabout-slip.index'),
          },
          {
            title: "Holiday Management",
            url: "/holiday",
          },
        ]
      },
      {
        title: "Leave",
        url: "/leave",
        icon: Calendar,
        show: hasRole('ogm') || hasRole('hr_admin') || hasRole('super_admin'),
        items: [
          {
            title: "Leave Calendar",
            url: route("leave.leave-calendar")
          },
          {
            title: "Leave Application",
            url: route("leave.leave-application.index"),
          },
          {
            title: "Leave Adjustment Memo",
            url: "/leave/leave-adjustment-memo",
          },
          {
            title: "Monthly Earned Leave Posting",
            url: route("leave.accrual.index")
          },
          {
            title: "Leave Settings",
            url: route("leave.leave-settings"),
          }
        ]
      },
      {
        title: "Payroll",
        url: null,
        icon: Wallet,
        show: hasRole('ogm') || hasRole('hr_admin') || hasRole('super_admin'),
        items: [
          {
            title: "Payroll Processing",
            url: "/payroll/payroll_processsing",
          },
          {
            title: "Payroll Register",
            url: "/payroll/payroll_register",
          },
          {
            title: "Pay Slip Generation",
            url: "/payroll/pay_slip_generation",
          },
          {
            title: "Allowances Management",
            url: "/payroll/allowances_management",
          },
          {
            title: "Loan Entry",
            url: "/payroll/loan_entry",
          },
          {
            title: "Other Deduction Entry",
            url: "/payroll/other_deduction_entry",
          },
          {
            title: "Payroll Deduction Settings",
            url: "/payroll/payroll_deduction_settings",
          }
        ]
      },
      {
        title: "Document Tracking",
        url: null,
        icon: File,
        badgeCount: incomingDocumentsCount,
        show: hasLinkedDepartment && (
          hasRole("ogm") ||
          hasRole("hr_admin") ||
          hasRole("super_admin") ||
          hasRole("document_tracking_operator")
        ),
        items: [
          {
            title: "Incoming",
            url: route('document-tracking-incoming.index'),
            badgeCount: incomingDocumentsCount,
          },
          {
            title: "Outgoing",
            url: route('document-tracking-outgoing.index'),
          },
          {
            title: "Archive",
            url: route('document-tracking-archive.index'),
          },
        ]
      },
      {
          title: "Reports and Analytics",
          url: "/reports_and_analytics",
          icon: FileBarChart,
          show: hasRole("ogm") || hasRole("hr_admin") || hasRole("super_admin"),
          items: [
            {
              title: "Employee Reports",
              url: route('reports_and_analytics.employee-report.index'),
            },
            {
              title: "Attendance Reports",
              url: route('reports_and_analytics.attendance-report.index'),
            },
            {
              title: "Leave Reports",
              url: route('reports_and_analytics.leave-report.index'),
            },
            {
              title: "Payroll Reports",
              url: route('reports_and_analytics.payroll-report.index'),
            },
            {
              title: "Government Reports",
              url: route('reports_and_analytics.government-report.index'),
            },
          ],
        },
      {
        title: "Announcements",
        url: route("announcement.index"),
        icon: Bell,
        show: true,
      },
      {
        title: "Activity Logs",
        url: route("activity_logs.index"),
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
  }


  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto min-h-0 py-3">
              <Link
                href={route('dashboard')}
                className="flex items-center gap-3 px-2"
              >
                <img
                  src={Logo}
                  alt="Metro Kidapawan Water District Logo"
                  className="h-12 w-12 object-contain shrink-0"
                />
                <div
                  className="h-12 flex flex-col justify-between leading-none font-bold"
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
          if (officeParts.length === 0) return null

          return (
            <div className="flex justify-center gap-1.5 px-3 pb-2">
              <Building2 className="size-3 shrink-0 text-muted-foreground" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-row">
                      <p className="cursor-default text-xs leading-tight text-muted-foreground font-bold">
                        {officeParts.map((office) => office.acronym ?? office.name).join(" › ")}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{officeParts.map((office) => office.name).join(" › ")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
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
  )
}
