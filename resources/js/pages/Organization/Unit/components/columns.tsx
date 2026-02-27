"use client"

import { router } from "@inertiajs/react"
import { type ColumnDef } from "@tanstack/react-table"
import { route } from "ziggy-js"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Unit } from "../data/schema"
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from "@/components/shared/data-table/data-table-row-action"

interface ColumnOptions {
    onEdit: (unit: Unit) => void
}

export function getColumns({ onEdit }: ColumnOptions): ColumnDef<Unit>[] {
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
            accessorKey: "unit_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[160px] font-medium">{row.getValue("unit_name")}</div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "unit_acronym",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="default" className="font-mono text-xs">
                    {row.getValue("unit_acronym")}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "division",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[140px]">
                    {row.original.division?.division_name ?? "—"}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "unit_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[200px] text-sm text-muted-foreground truncate max-w-[300px]">
                    {row.getValue("unit_description") || "—"}
                </div>
            ),
            enableSorting: false,
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
                        deleteAction((unit) => router.delete(route("unit.destroy", unit.unit_id)), {
                            getName: (u) => u.unit_name,
                            description: (u) => (
                                <>
                                    Are you sure you want to delete{" "}
                                    <span className="font-medium text-foreground">{u.unit_name}</span>?{" "}
                                    This will also affect any positions assigned to this unit.
                                    This action cannot be undone.
                                </>
                            ),
                            confirmLabel: "Delete Unit",
                        }),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ]
}