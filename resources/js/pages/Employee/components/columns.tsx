"use client"

import { router } from "@inertiajs/react"
import React from "react"
import { route } from "ziggy-js"
import { toast } from 'sonner'
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  DataTableRowActions,
  deleteAction,
} from "@/components/shared/data-table/data-table-row-action"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { type Employee } from "../data/schema"

function CardField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

export const columns: DataTableColumnDef<Employee>[] = [
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
      <DataTableColumnHeader column={column} title="Employee Name" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[140px] font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
    mobileCard: (row) => (
      <span className="font-semibold text-base">{row.name}</span>
    ),
  },
  {
    accessorKey: "position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
    cell: ({ row }) => (
      <div className="min-w-30">{row.getValue("position")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unit" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[80px]">{row.getValue("unit")}</div>
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
      <div className="min-w-[100px]">{row.getValue("division")}</div>
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
      <div className="min-w-[130px]">{row.getValue("department")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "contactNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Number" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[130px]">{row.getValue("contactNumber")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[160px]">{row.getValue("email")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "employmentClassification",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Classification" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[120px]">{row.getValue("employmentClassification")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
    filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.status ? "default" : "destructive"}>
        {row.original.status ? "Active" : "Inactive"}
      </Badge>
    ),
    enableSorting: true,
    enableHiding: true,
    filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
    mobileCard: (row) => (
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs ml-2">Status</span>
        <Badge variant={row.status ? "default" : "destructive"}>
          {row.status ? "Active" : "Inactive"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          deleteAction(
            (row) => {
              const employee = row as Employee
              router.delete(route("employee.destroy", employee.id), {
                preserveScroll: true,
                onSuccess: () => toast.success("Employee deleted", {
                  description: `"${employee.name}" has been removed successfully.`,
                }),
                onError: () => toast.error("Failed to delete employee", {
                  description: "Something went wrong. Please try again.",
                }),
              })
            },
            { getName: (e) => (e as Employee).name }
          ),
        ]}
      />
    ),
  },
]