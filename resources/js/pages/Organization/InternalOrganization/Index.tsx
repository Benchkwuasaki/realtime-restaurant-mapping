import { Head, router } from "@inertiajs/react"
import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

import { columns } from "./components/columns"
import { OrganizationDialog, type InternalOrgType, type EmployeeOption } from "./components/OrganizationDialog"
import { type InternalOrganization } from "./data/schema"

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Internal Organizations", href: route("internal-organization.index") },
]

const statusFilterOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' },
]

const canBeDeductedFilterOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
]


// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  organizations: InternalOrganization[]
  orgTypes: InternalOrgType[]
  employees: EmployeeOption[]
  totalOrganizations: number
  activeOrganizations: number
  inactiveOrganizations: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({
  organizations,
  orgTypes,
  employees,
  totalOrganizations,
  activeOrganizations,
  inactiveOrganizations,
}: Props) {
  const [dialogOrg, setDialogOrg] = useState<InternalOrganization | null | undefined>(undefined)

  const orgTypeFilterOptions = useMemo(
    () => orgTypes.map((t) => ({ value: t.internal_org_type, label: t.internal_org_type })),
    [orgTypes]
  )

  const tableColumns = useMemo(
    () => columns({ onEdit: (org) => setDialogOrg(org) }),
    []
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Internal Organizations" />

      <div className="flex h-full flex-1 flex-col gap-8 p-8">

        <div className="max-w-300 grid grid-cols-1 gap-4 sm:grid-cols-1">
          <StatCard
            title="Total Organizations"
            value={totalOrganizations}
            description="All registered organizations"
            icon={<Building2 className="size-4 text-primary" />}
          />
          <StatCard
            title="Active"
            value={activeOrganizations}
            description="Currently active organizations"
            icon={<CheckCircle2 className="size-4 text-primary" />}
          />
          <StatCard
            title="Inactive"
            value={inactiveOrganizations}
            description="Currently inactive organizations"
            icon={<XCircle className="size-4 text-primary" />}
          />
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <DataTable
          data={organizations}
          columns={tableColumns}
          getRowId={(row) => String(row.internal_organization_id)}
          onRowClick={(row) =>
            router.get(route("internal-organization.show", row.original.internal_organization_id))
          }
          defaultPageSize={10}
          searchColumnId="name"
          searchPlaceholder="Search organizations..."
          filters={[
            {
              columnId: 'type',           
              title: 'Type',
              options: orgTypeFilterOptions,
            },
            {
              columnId: 'status',
              title: 'Status',
              options: statusFilterOptions,
            },
            {
              columnId: 'payroll_deduction_linked',
              title: 'Can be Deducted',
              options: canBeDeductedFilterOptions,
            },
          ]}
          addButton={{
            label: "Add Organization",
            onClick: () => setDialogOrg(null),
          }}
          bulkDelete={{
            route: route("internal-organization.bulk-destroy"),
            entityName: "Organization",
            getId: (row) => (row as InternalOrganization).id,
          }}
        />
      </div>

      {/* ── Organization Modal (Add / Edit) ────────────────────────────────── */}
      <OrganizationDialog
        open={dialogOrg !== undefined}
        onOpenChange={(open) => { if (!open) setDialogOrg(undefined) }}
        organization={dialogOrg}
        orgTypes={orgTypes}
        employees={employees}
        redirectTo={route("internal-organization.index")}
      />
    </AppLayout>
  )
}