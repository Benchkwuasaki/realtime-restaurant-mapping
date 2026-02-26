import { Head, router } from "@inertiajs/react"
import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

import { columns } from "./components/columns"
import { type InternalOrganization } from "./data/schema"

// ─── Filter options ────────────────────────────────────────────────────────────

const typeFilterOptions = [
  { value: "Union",        label: "Union" },
  { value: "Cooperative",  label: "Cooperative" },
  { value: "Association",  label: "Association" },
]

const statusFilterOptions = [
  { value: true,  label: "Active" },
  { value: false, label: "Inactive" },
]

const payrollFilterOptions = [
  { value: true,  label: "Linked" },
  { value: false, label: "Not Linked" },
]

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  organizations: InternalOrganization[]
  totalOrganizations: number
  activeOrganizations: number
  inactiveOrganizations: number
}

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Internal Organizations", href: route("internal-organization.index") },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
  organizations,
  totalOrganizations,
  activeOrganizations,
  inactiveOrganizations,
}: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Internal Organizations" />

      <div className="flex h-full flex-1 flex-col gap-8 p-8">
        {/* ── Table ────────────────────────────────────────────────────────── */}
        <DataTable
          data={organizations}
          columns={columns}
          getRowId={(row) => String(row.id)}
          onRowClick={(row) =>
            router.get(route("internal-organization.show", row.original.id))
          }
          defaultPageSize={10}
          searchColumnId="name"
          searchPlaceholder="Search organizations..."
          addButton={{
            label: "Add Organization",
            onClick: () => router.visit(route("internal-organization.create")),
          }}
          bulkDelete={{
            route: route("internal-organization.bulk-destroy"),
            entityName: "Organization",
            getId: (row) => (row as InternalOrganization).id,
          }}
        />
      </div>
    </AppLayout>
  )
}