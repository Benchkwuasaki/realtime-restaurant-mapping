import { router } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import {
    REQUEST_STATUS_PILL,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_ICON,
} from "../data/data"
import { type ArchiveRow } from "../data/schema"

// ─── Request Status Badge ─────────────────────────────────────────────────────

function RequestStatusBadge({ status }: { status: string }) {
    const Icon = REQUEST_STATUS_ICON[status]
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${REQUEST_STATUS_PILL[status] ?? "bg-muted text-muted-foreground"}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {REQUEST_STATUS_LABEL[status] ?? status}
        </span>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileArchiveCard({ row }: { row: ArchiveRow }) {
    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">{row.title}</span>
                    <RequestStatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Origin: <span className="font-medium text-foreground">{row.origin_office?.acronym ?? "—"}</span></span>
                    <span>Final: <span className="font-medium text-foreground">{row.current_office?.acronym ?? "—"}</span></span>
                </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.visit(route("document-tracking.show", row.id))}
                >
                    View Details
                </Button>
            </div>
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): DataTableColumnDef<ArchiveRow>[] {
    return [
        // Select
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={v => row.toggleSelected(!!v)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={e => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // Title
        {
            id: "title",
            accessorKey: "title",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.title}</span>
            ),
            mobileCard: (row) => <MobileArchiveCard row={row} />,
        },

        // Origin Office
        {
            id: "origin_office",
            accessorFn: row => row.origin_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Origin Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.origin_office?.acronym ?? "—"}
                </span>
            ),
        },

        // Final Office
        {
            id: "current_office",
            accessorFn: row => row.current_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Final Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.current_office?.acronym ?? "—"}
                </span>
            ),
        },

        // Status
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => <RequestStatusBadge status={row.original.status} />,
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },

        // Actions
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.visit(route("document-tracking.show", row.original.id))}
                    >
                        View
                    </Button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ]
}