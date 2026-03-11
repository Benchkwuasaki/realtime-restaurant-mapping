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
    ]
}