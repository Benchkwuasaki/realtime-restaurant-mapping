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
  UserCog,
  Bell,
  FileBarChart,
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
import { url } from "node_modules/zod/v4/classic/external.cjs"
import { title } from "process"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasRole } = useAuth()

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: route("dashboard"),
        icon: LayoutDashboard,
        show: hasRole("ogm") || hasRole("hr_admin") || hasRole("super_admin"),
      },
      // TODO: implement user management, admin, super admin
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
          // TODO: Update the URLs for the organization sub-menu items
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
            title: "Attendance Settings",
            url: route('attendance-settings.index'),
          },
          {
            title: "Whereabout Slip",
            url: route('whereabout-slip.index'),
          },
          {
            title: "Holiday Management",
            url: "/holiday",
          },
          {
            title: "Overtime Entry",
            url: "/organization/overtime_entry",
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
        url: route("document_tracking.index"),
        icon: File,
        show: hasRole("ogm") || hasRole("hr_admin") || hasRole("super_admin") || hasRole("document_tracking_operator"),
      },
      {
          title: "Reports and Analytics",
          url: "/reports_and_analytics",
          icon: FileBarChart,
          show: hasRole("ogm") || hasRole("hr_admin") || hasRole("super_admin"),
          items: [
            {
              title: "Employee Reports",
              url: "/reports_and_analytics/employees",
            },
            {
              title: "Attendance Reports",
              url: route('reports_and_analytics.attendance-report.index'),
            },
            {
              title: "Leave Reports",
              url: "/reports_and_analytics/leave",
            },
            {
              title: "Payroll Reports",
              url: "/reports_and_analytics/payroll",
            },
            {
              title: "Government Reports",
              url: "/reports_and_analytics/government",
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
                href="/dashboard"
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
      </SidebarHeader>      <SidebarContent>
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
