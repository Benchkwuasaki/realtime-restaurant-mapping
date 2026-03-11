import { Head, router } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Archive, CheckCircle2, XCircle } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import type { BreadcrumbItem } from "@/types"
import { getColumns } from "./components/columns"
import { requestStatusOptions } from "./data/data"
import { type ArchiveRow } from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    documents: ArchiveRow[]
    departmentId: number
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Document Tracking", href: "#" },
    { title: "Archive", href: route("document-tracking-archive.index") },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArchiveIndex({ documents, departmentId }: Props) {
    const completed = documents.filter(d => d.status === "completed").length
    const cancelled = documents.filter(d => d.status === "cancelled").length
    const total = documents.length

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived Requests" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Archived Requests</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Completed and cancelled requests involving your department ·{" "}
                            <span className="font-semibold text-foreground">{total}</span> records
                        </p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard
                        title="Total"
                        value={total}
                        description="All closed requests"
                        icon={<Archive className="w-4 h-4 m-2 text-primary" />}
                    />
                    <StatCard
                        title="Completed"
                        value={completed}
                        description="Successfully resolved"
                        icon={<CheckCircle2 className="w-4 h-4 m-2 text-green-500" />}
                    />
                    <StatCard
                        title="Cancelled"
                        value={cancelled}
                        description="Withdrawn before completion"
                        icon={<XCircle className="w-4 h-4 m-2 text-destructive" />}
                    />
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={documents}
                    getRowId={row => String(row.id)}
                    searchColumnId="title"
                    searchPlaceholder="Search by title…"
                    filters={[
                        { columnId: "status", title: "Status", options: requestStatusOptions },
                    ]}
                    defaultPageSize={25}
                    onRowClick={row => router.visit(route("document-tracking.show", row.original.id))}
                />

            </div>
        </AppLayout>
    )
}