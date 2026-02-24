"use client"

import { router } from "@inertiajs/react"
import { type ColumnDef } from "@tanstack/react-table"
import React from "react"
import { DataTableColumnHeader } from "@/components/Employeee/components/data-table-column-header"
import { DataTableRowActions } from "@/components/Employeee/components/data-table-row-action"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"

import { type Task } from "../data/schema"

function StatusToggle({ id, currentStatus }: { id: string; currentStatus: boolean }) {
  const [isActive, setIsActive] = React.useState(currentStatus)
  const [isPending, setIsPending] = React.useState(false)

  const handleChange = (checked: boolean) => {
    setIsActive(checked)
    setIsPending(true)

    router.patch(
      `/employee/${id}/toggle`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setIsPending(false),
        onError: () => {
          setIsActive(!checked)
          setIsPending(false)
        },
      }
    )
  }

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleChange}
      disabled={isPending}
    />
  )
}

export const columns: ColumnDef<Task>[] = [
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
  },
  {
    accessorKey: "position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[120px]">{row.getValue("position")}</div>
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
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive: boolean = row.getValue("status")
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "toggle",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Toggle" />
    ),
    cell: ({ row }) => (
      <StatusToggle
        id={row.original.id}
        currentStatus={row.original.status}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]