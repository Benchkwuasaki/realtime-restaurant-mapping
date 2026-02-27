"use client"

import { router } from "@inertiajs/react"
import { type ColumnDef } from "@tanstack/react-table"
import { route } from "ziggy-js"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from "@/components/shared/data-table/data-table-row-action"
import { Checkbox } from "@/components/ui/checkbox"
import { type Position } from "../data/schema"

interface ColumnOptions {
    onEdit: (position: Position) => void
}

export function getColumns({ onEdit }: ColumnOptions): ColumnDef<Position>[] {
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
                <div className="min-w-[180px] font-medium">{row.getValue("position_name")}</div>
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
                <div className="min-w-[140px]">
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
                <div className="min-w-[140px]">
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
                <div className="min-w-[120px]">
                    {row.original.unit?.unit_name ?? "—"}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.unit_id ?? "")),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "total_slots",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Slots" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[80px] text-center">{row.getValue("total_slots")}</div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "occupied_slots",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Occupied" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[80px] text-center">{row.getValue("occupied_slots")}</div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        editAction(onEdit),
                        deleteAction((position) => router.delete(route("position.destroy", position.position_id)), {
                            getName: (p) => p.position_name,
                            description: (p) => (
                                <>
                                    Are you sure you want to delete{" "}
                                    <span className="font-medium text-foreground">{p.position_name}</span>?{" "}
                                    This will also affect any items assigned to this position.
                                    This action cannot be undone.
                                </>
                            ),
                            confirmLabel: "Delete Position",
                        }),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ]
}