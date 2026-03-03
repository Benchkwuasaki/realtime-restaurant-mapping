"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type LeaveApplication } from "../data/schema"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
    LeaveApplication["status"],
    React.ComponentProps<typeof Badge>["variant"]
> = {
    approved:  "green",
    pending:   "yellow",
    rejected:  "red",
    cancelled: "gray",
    draft:     "secondary",
}

const STATUS_LABEL: Record<LeaveApplication["status"], string> = {
    approved:  "Approved",
    pending:   "Pending",
    rejected:  "Rejected",
    cancelled: "Cancelled",
    draft:     "Draft",
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): ColumnDef<LeaveApplication>[] {
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
                    {new Date(row.getValue("start_date")).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                    })}
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
                    {new Date(row.getValue("end_date")).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                    })}
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
                    <Badge variant={STATUS_BADGE[status]}>
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