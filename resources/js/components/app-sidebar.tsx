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
  LayoutDashboard ,
  File,
  Building2,
  FileCheck,
  FileCheck2,
  Calendar,
  Wallet,
  Logs,
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
      url: "/organization",
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
      url: route("attendance.index"),
      icon: FileCheck2,
      items: [
        {
          title: "Whereabout Slip",
          url: "/organization/whereabout_slip",
        },
        {
          title: "Holiday Management",
          url: "/organization/holiday_management",
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
      url: route("payroll.index"),
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
      items: [
        {
          title: "Create Request",
          url: "document_tracking/create",
        },
      ],
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
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Metro Kidapawan Water District</span>

                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
