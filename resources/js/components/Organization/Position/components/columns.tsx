"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { type Position } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-action"

interface ColumnOptions {
    onEdit: (position: Position) => void
    onDelete: (position: Position) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Position>[] {
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
            accessorKey: "position_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Position Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 font-medium text-foreground">
                    {row.getValue("position_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "department",
            accessorFn: (row) => row.department?.department_name ?? "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <div className="min-w-35 text-sm text-muted-foreground">
                    {row.original.department?.department_name ?? "—"}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.department_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "division",
            accessorFn: (row) => row.division?.division_name ?? "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division" />
            ),
            cell: ({ row }) => (
                <div className="min-w-35 text-sm text-muted-foreground">
                    {row.original.division?.division_name ?? "—"}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.division_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "unit",
            accessorFn: (row) => row.unit?.unit_name ?? "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit" />
            ),
            cell: ({ row }) => (
                <div className="min-w-35 text-sm text-muted-foreground">
                    {row.original.unit?.unit_name ?? (
                        <span className="italic text-muted-foreground/50">No unit</span>
                    )}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.unit_id ?? "")),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "slots",
            accessorFn: (row) => row.total_slots,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Slots" />
            ),
            cell: ({ row }) => {
                const total    = row.original.total_slots
                const occupied = row.original.occupied_slots
                const vacant   = total - occupied

                return (
                    <div className="text-sm min-w-28">
                        <span className="font-medium text-foreground">{occupied}</span>
                        <span className="text-muted-foreground"> / {total} occupied</span>
                        {vacant > 0 && (
                            <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">
                                ({vacant} vacant)
                            </span>
                        )}
                    </div>
                )
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ),
            enableHiding: false,
        },
    ]
}