"use client"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type LeaveApplication } from "../data/schema"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LeaveApplication["status"], React.ComponentProps<typeof Badge>["variant"]> = {
    approved:       "green",
    for_approval:   "yellow",
    pending:        "yellow",
    for_disapproval:"red",
    rejected:       "red",
    cancelled:      "secondary",
}

const STATUS_LABEL: Record<LeaveApplication["status"], string> = {
    approved:        "Approved",
    for_approval:    "For Approval",
    pending:         "Pending",
    for_disapproval: "For Disapproval",
    rejected:        "Rejected",
    cancelled:       "Cancelled",
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileLeaveCard({ row }: { row: LeaveApplication }) {
    const status = row.status
    const days = row.days_requested

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            {/* ── Card Body ── */}
            <div className="px-4 pt-4 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm lg:text-base text-foreground">
                        {row.employee_name}
                    </span>
                    <Badge variant={STATUS_BADGE[status]} className="text-xs">
                        {STATUS_LABEL[status]}
                    </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                    {row.department_name}
                </div>

                <Badge variant="outline" className="text-xs">
                    {row.leave_type_name}
                </Badge>
            </div>

            {/* ── Card Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </span>
                <span className="text-xs font-medium tabular-nums">
                    {days} {days === 1 ? "day" : "days"}
                </span>
            </div>
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): DataTableColumnDef<LeaveApplication>[] {
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
            accessorKey: "employee_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[160px] font-medium text-foreground">
                    {row.getValue("employee_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            // ── Mobile card is registered on this column ──
            mobileCard: (row) => <MobileLeaveCard row={row} />,
        },
        {
            accessorKey: "department_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue("department_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
        {
            accessorKey: "leave_type_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.getValue("leave_type_name")}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
        {
            accessorKey: "start_date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Start Date" />
            ),
            cell: ({ row }) => (
                <div className="text-sm tabular-nums">
                    {formatDate(row.getValue("start_date"))}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "end_date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="End Date" />
            ),
            cell: ({ row }) => (
                <div className="text-sm tabular-nums">
                    {formatDate(row.getValue("end_date"))}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "days_requested",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Days" />
            ),
            cell: ({ row }) => {
                const days: number = row.getValue("days_requested")
                return (
                    <div className="text-sm tabular-nums font-medium">
                        {days} {days === 1 ? "day" : "days"}
                    </div>
                )
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as LeaveApplication["status"]
                return (
                    <Badge variant={STATUS_BADGE[status]} className="text-xs">
                        {STATUS_LABEL[status]}
                    </Badge>
                )
            },
            enableSorting: true,
            enableHiding: true,
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
    ]
}