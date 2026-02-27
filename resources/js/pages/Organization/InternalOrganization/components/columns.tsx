"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { router } from "@inertiajs/react"
import { route } from "ziggy-js"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type InternalOrganization } from "../data/schema"
import {
  DataTableRowActions,
  deleteAction,
  editAction,
} from "@/components/shared/data-table/data-table-row-action"

// ─── Column Options ────────────────────────────────────────────────────────────

interface ColumnOptions {
  onEdit: (org: InternalOrganization) => void
}

// ─── Columns ───────────────────────────────────────────────────────────────────

export const columns = ({ onEdit }: ColumnOptions): ColumnDef<InternalOrganization>[] => [
  // ── Select ──────────────────────────────────────────────────────────────────
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

  // ── Organization Code / ID ──────────────────────────────────────────────────
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code / ID" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[80px] font-mono text-sm">{row.getValue("code")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },

  // ── Organization Name ───────────────────────────────────────────────────────
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organization Name" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[160px] font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },

  // ── Type ────────────────────────────────────────────────────────────────────
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[110px]">{row.getValue("type")}</div>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },

  // ── President / Head ────────────────────────────────────────────────────────
  {
    accessorKey: "head",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Head" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[140px]">{row.getValue("head")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },

  // ── Payroll Deduction Linked ─────────────────────────────────────────────────
  {
    accessorKey: "payroll_deduction_linked",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payroll Deduction Linked" />
    ),
    cell: ({ row }) => {
      const linked: boolean = row.getValue("payroll_deduction_linked")
      return (
        <div className="min-w-[100px]">
          <Badge variant={linked ? "default" : "secondary"}>
            {linked ? "Yes" : "No"}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },

  // ── Status ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive: boolean = row.getValue("status")
      return (
        <div className="min-w-[90px]">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },

  // ── Actions ─────────────────────────────────────────────────────────────────
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          editAction((org) => onEdit(org)),
          deleteAction((org) => router.delete(route("internal-organization.destroy", org.internal_organization_id)), {
            getName: (org) => org.name,
            description: (org) => (
              <>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">{org.name}</span>?{" "}
                This action cannot be undone.
              </>
            ),
            confirmLabel: "Delete Organization",
          }),
        ]}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]