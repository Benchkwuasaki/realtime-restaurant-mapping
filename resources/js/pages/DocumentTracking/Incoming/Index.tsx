import { Head, router, usePage } from "@inertiajs/react"
import { route } from "ziggy-js"
import { FileText, Clock, CheckCircle2, Plus } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import type { BreadcrumbItem } from "@/types"
import { getColumns } from "./components/columns"
import { officeStatusOptions } from "./data/data"
import { type IncomingRow } from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    documents: IncomingRow[]
    departmentId: number
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Document Tracking", href: "#" },
    { title: "Incoming", href: route("document-tracking-incoming.index") },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IncomingIndex({ documents, departmentId }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const pendingReceipt = documents.filter(d => d.office_status === "pending_receipt").length
    const received = documents.filter(d => d.office_status === "received").length
    const total = documents.length

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incoming Requests" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Incoming Requests</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Requests currently assigned to your department ·{" "}
                            <span className="font-semibold text-foreground">{total}</span> active
                        </p>
                    </div>
                </div>

                {/* Flash message */}
                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard
                        title="Total Active"
                        value={total}
                        description="Requests in your queue"
                        icon={<FileText className="w-4 h-4 m-2 text-primary" />}
                    />
                    <StatCard
                        title="Pending Receipt"
                        value={pendingReceipt}
                        description="Awaiting acknowledgement"
                        icon={<Clock className="w-4 h-4 m-2 text-yellow-500" />}
                    />
                    <StatCard
                        title="Received"
                        value={received}
                        description="Being processed"
                        icon={<CheckCircle2 className="w-4 h-4 m-2 text-blue-500" />}
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
                        { columnId: "office_status", title: "Status", options: officeStatusOptions },
                    ]}
                    defaultPageSize={25}
                    onRowClick={row => router.visit(route("document-tracking.show", row.original.id))}
                />

            </div>
        </AppLayout>
    )
}