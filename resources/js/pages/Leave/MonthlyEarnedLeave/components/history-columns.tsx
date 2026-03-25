// resources/js/pages/Leave/Accrual/components/history-columns.tsx

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { type CreditStatus, type HistoryTableRow } from "../data/schema"

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

// ─── Shared sub-components ────────────────────────────────────────────────────

export function CreditBadge({ status }: { status: CreditStatus }) {
    const variantMap = {
        full_credit: "green",
        prorated:    "yellow",
        ineligible:  "destructive",
    } as const

    const labelMap = {
        full_credit: "Full Credit",
        prorated:    "Prorated",
        ineligible:  "Ineligible",
    }

    return (
        <Badge variant={variantMap[status]}>
            {labelMap[status]}
        </Badge>
    )
}

export function EmployeeAvatar({ url, name }: { url: string | null; name: string }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return url ? (
        <img src={url} alt={name} className="size-8 shrink-0 rounded-full object-cover" />
    ) : (
        <div className="size-8 shrink-0 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-semibold">
            {initials}
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getHistoryColumns(
    onViewRow: (row: HistoryTableRow) => void
): DataTableColumnDef<HistoryTableRow>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <EmployeeAvatar url={row.original.avatar_url} name={row.original.name} />
                    <span className="text-sm">{row.original.name}</span>
                </div>
            ),
            mobileCard: (row) => (
                <div className="flex flex-col bg-background overflow-hidden">
                    {/* Card body */}
                    <div className="px-4 pt-4 pb-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <EmployeeAvatar url={row.avatar_url} name={row.name} />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-foreground truncate">{row.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{row.department}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-xs text-muted-foreground">{row.leave_type_name}</span>
                            <span className="text-xs text-muted-foreground">
                                {MONTHS[row.posting_month - 1]} {row.posting_year}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">{row.reference_no}</span>
                        </div>
                    </div>
                    {/* Card footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                        <CreditBadge status={row.credit_status} />
                        <span className="text-xs text-muted-foreground">{row.posting_date}</span>
                    </div>
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "department",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.department}</span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "leave_type_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.leave_type_name}</span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "period",
            header: "Period",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {MONTHS[row.original.posting_month - 1]} {row.original.posting_year}
                </span>
            ),
            enableHiding: true,
        },
        // ── Hidden filter-only columns ─────────────────────────────────────────
        {
            id: "posting_year",
            accessorFn: (row) => String(row.posting_year),
            header: "",
            cell: () => null,
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.posting_year)),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "posting_month",
            accessorFn: (row) => String(row.posting_month),
            header: "",
            cell: () => null,
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.posting_month)),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "credit_status",
            header: "Status",
            cell: ({ row }) => <CreditBadge status={row.original.credit_status} />,
            filterFn: (row, _id, value: string[]) =>
                value.includes(row.getValue("credit_status")),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "reference_no",
            header: "Reference",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm font-mono">
                    {row.original.reference_no}
                </span>
            ),
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "posting_date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Posted Date" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.posting_date}</span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
    ]
}