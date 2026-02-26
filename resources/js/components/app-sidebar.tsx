"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  SquareTerminal,
  User,
  Globe,
  LayoutDashboard,
  File,
  Building2,
  FileCheck,
  FileCheck2,
  Calendar,
  Wallet,
  Logs,
  Pencil,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
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
import { url } from "inspector"
import { title } from "process"
import { route } from "ziggy-js"
import { Link } from "@inertiajs/react"
import Logo from "@/assets/images/logo.svg"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: route("dashboard"),
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Employee",
      url: route("employee.index"),
      icon: User,
    },
    {
      title: "Organization",
      url: null,
      icon: Building2,
      items: [
        // TODO: Update the URLs for the organization sub-menu items
        {
          title: "Organisational Chart",
          url: "/organization/organizational_chart",
        },
        {
          title: "Departments",
          url: "/organization/departments",
        },
        {
          title: "Divisions",
          url: "/organization/divisions",
        },
        {
          title: "Units",
          url: "/organization/units",
        },
        {
          title: "Positions",
          url: "/organization/positions",
        },
        {
          title: "Signatories",
          url: "/organization/signatories",
        },
        {
          title: "Internal Organization",
          url: "/organization/internal_organization",
        }
      ]
    },
    {
      title: "Attendance",
      url: null,
      icon: FileCheck2,
      items: [
        {
          title: "Whereabout Slip",
          url: "/organization/whereabout_slip",
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
      items: [
        {
          title: "Leave Calendar",
          url: "/leave/leave_calendar",
        },
        {
          title: "Leave Filing",
          url: "/leave/leave_filing",
        },
        {
          title: "Leave Approval Workflow",
          url: "/leave/leaving_approval_workflow",
        },
        {
          title: "Leave Adjustment Memo",
          url: "/leave/leave_adjustment_memo",
        },
        {
          title: "Monthly Earned Leave Posting",
          url: "/leave/monthly_earned_leave_posting",
        },
        {
          title: "Leave History",
          url: "/leave/leave_history",
        },
        {
          title: "Leave Settings",
          url: "/leave/leave_settings",
        }
      ]
    },
    {
      title: "Payroll",
      url: null,
      icon: Wallet,
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
    },
    {
      title: "Activity Logs",
      url: "/activity_logs",
      icon: Logs,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
