'use client';

import { router } from '@inertiajs/react';
import React from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { type Employee } from '../data/schema';

export const columns: DataTableColumnDef<Employee>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
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
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Employee Name" />
        ),
        cell: ({ row }) => {
            const employee = row.original;
            const name = row.getValue('name') as string;

      return (
        <div className="flex items-center gap-2.5 min-w-44">
          <div className="w-8 h-8 rounded-lg bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-[11px] text-muted-foreground">{employee.position}</p>
          </div>
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    mobileCard: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {row.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span className="font-semibold text-base">{row.name}</span>
      </div>
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
      <div className="min-w-20">{row.getValue("unit")}</div>
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
      <div className="min-w-25">{row.getValue("division")}</div>
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
      <div className="min-w-32.5">{row.getValue("department")}</div>
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
      <div className="min-w-32.5">{row.getValue("contactNumber")}</div>
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
      <div className="min-w-40">{row.getValue("email")}</div>
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
      <div className="min-w-30">{row.getValue("employmentClassification")}</div>
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