"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Repeat } from "lucide-react"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"
import { TYPE_PILL, TYPE_DOT } from "../data/data"
import { type Holiday } from "../data/schema"
import {
  DataTableRowActions,
  editAction,
  deleteAction,
} from "@/components/shared/data-table/data-table-row-action"

interface ColumnOptions {
  onEdit: (holiday: Holiday) => void
  onDelete: (holiday: Holiday) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Holiday>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Holiday Name" />
      ),
      cell: ({ row }) => {
        const holiday = row.original
        return (
          <div className="min-w-45">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[holiday.type] ?? "bg-muted-foreground"}`}
              />
              <span className="font-medium text-foreground text-sm">{holiday.name}</span>
              {holiday.is_recurring && (
                <Repeat className="w-3 h-3 text-muted-foreground shrink-0" title="Recurring yearly" />
              )}
            </div>
            {holiday.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 pl-3 truncate max-w-50">
                {holiday.description}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <div className="min-w-30 text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("date") + "T00:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type: string = row.getValue("type")
        return (
          <div className="min-w-37.5">
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_PILL[type] ?? "bg-muted text-muted-foreground"}`}>
              {type}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "is_recurring",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recurring" />,
      cell: ({ row }) => {
        const isRecurring: boolean = row.getValue("is_recurring")
        return (
          <div className="min-w-20 flex items-center gap-1.5">
            {isRecurring ? (
              <>
                <Repeat className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Yes</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        )
      },
      filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
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
              getName: (h) => h.name,
            }),
          ]}
        />
      ),
      enableHiding: false,
    },
  ]
}