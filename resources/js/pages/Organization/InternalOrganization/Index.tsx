import { Head, router } from "@inertiajs/react"
import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

import { columns } from "./components/columns"
import { OrganizationDialog } from "./components/OrganizationDialog"
import { type InternalOrganization } from "./data/schema"

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Internal Organizations", href: route("internal-organization.index") },
]

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  organizations: InternalOrganization[]
  totalOrganizations: number
  activeOrganizations: number
  inactiveOrganizations: number
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
  organizations,
  totalOrganizations,
  activeOrganizations,
  inactiveOrganizations,
}: Props) {
  const [dialogOrg, setDialogOrg] = useState<InternalOrganization | null | undefined>(undefined)

  const tableColumns = useMemo(
    () => columns({ onEdit: (org) => setDialogOrg(org) }),
    []
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Internal Organizations" />

      <div className="flex h-full flex-1 flex-col gap-8 p-8">

        <div className="max-w-300 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Organizations"
            value={totalOrganizations}
            description="All registered organizations"
            icon={<Building2 className="size-4 text-destructive" />}
          />
          <StatCard
            title="Active"
            value={activeOrganizations}
            description="Currently active organizations"
            icon={<CheckCircle2 className="size-4 text-green-500" />}
          />
          <StatCard
            title="Inactive"
            value={inactiveOrganizations}
            description="Currently inactive organizations"
            icon={<XCircle className="size-4 text-destructive" />}
          />
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
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
      />
    </AppLayout>
  )
}