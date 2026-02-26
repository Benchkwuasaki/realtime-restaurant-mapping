"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Department } from "../data/schema"
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from "@/components/shared/data-table/data-table-row-action"

interface ColumnOptions {
    onEdit: (department: Department) => void
    onDelete: (department: Department) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Department>[] {
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
            accessorKey: "department_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[180px] font-medium text-foreground">
                    {row.getValue("department_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "department_acronym",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="default" className="font-mono text-xs">
                    {row.getValue("department_acronym")}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "department_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const desc: string | null = row.getValue("department_description")
                return (
                    <div className="min-w-[200px] max-w-[360px] text-sm text-muted-foreground truncate">
                        {desc ?? <span className="italic text-muted-foreground/50">No description</span>}
                    </div>
                )
            },
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
                        deleteAction(onDelete, {
                            getName: (d) => d.department_name,
                            description: (d) => (
                                <>
                                    Are you sure you want to delete{" "}
                                    <span className="font-medium text-foreground">{d.department_name}</span>?{" "}
                                    This will also affect any divisions assigned to this department.
                                    This action cannot be undone.
                                </>
                            ),
                            confirmLabel: "Delete Department",
                        }),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ]
}