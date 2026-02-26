"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Unit } from "../data/schema"
import { DataTableRowActions } from "@/components/shared/data-table/data-table-row-action"

interface ColumnOptions {
    onEdit: (unit: Unit) => void
    onDelete: (unit: Unit) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Unit>[] {
    return [
        {
            id: "select",
            size: 40,
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
            size: 260,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit Name" />
            ),
            cell: ({ row }) => (
                <div className="font-medium text-foreground truncate">
                    {row.getValue("unit_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "unit_acronym",
            size: 120,
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
            accessorKey: "unit_description",
            size: 300,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const desc: string | null = row.getValue("unit_description")
                return (
                    <div className="truncate text-sm text-muted-foreground">
                        {desc ?? <span className="italic text-muted-foreground/50">No description</span>}
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            id: "division",
            size: 200,
            accessorFn: (row) => row.division?.division_name ?? "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division" />
            ),
            cell: ({ row }) => (
                <div className="truncate text-sm text-muted-foreground">
                    {row.original.division?.division_name ?? "—"}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.division_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            size: 80,
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