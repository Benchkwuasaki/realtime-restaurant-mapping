"use client"

import { router } from "@inertiajs/react"
import { type Table, type RowSelectionState } from "@tanstack/react-table"
import { Plus, Trash2, X } from "lucide-react"
import React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter, type FacetedFilterOption } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-option"

// ─── Config types ──────────────────────────────────────────────────────────────

export interface ToolbarFilterConfig {
  /** Must match the column accessorKey / id */
  columnId: string
  title: string
  options: FacetedFilterOption[]
}

export interface ToolbarAddButtonConfig {
  label: string
  onClick: () => void
}

export interface ToolbarBulkDeleteConfig {
  /** Route string or full URL for the bulk-delete request */
  route: string
  /**
   * Extract the IDs from each selected row.
   * Defaults to `(row) => row.id` if omitted.
   */
  getId?: (rowOriginal: unknown) => string | number
  /** Singular noun used in confirmation copy, e.g. "Holiday" */
  entityName: string
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  rowSelection: RowSelectionState
  /** Column id to use for the text search input — must match an accessorKey or column id */
  searchColumnId: string
  searchPlaceholder?: string
  filters?: ToolbarFilterConfig[]
  addButton?: ToolbarAddButtonConfig
  bulkDelete?: ToolbarBulkDeleteConfig
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTableToolbar<TData>({
  table,
  rowSelection,
  searchColumnId,
  searchPlaceholder = "Search...",
  filters = [],
  addButton,
  bulkDelete,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchValue, setSearchValue] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const selectedCount = Object.keys(rowSelection).length
  const hasSelection = selectedCount > 0

  const handleBulkDelete = () => {
    if (!bulkDelete) return

    const getId = bulkDelete.getId ?? ((row) => (row as { id: string | number }).id)
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => getId(row.original))

    router.delete(bulkDelete.route, {
      data: { ids },
      preserveScroll: true,
      onSuccess: () => {
        table.resetRowSelection()
        setDeleteDialogOpen(false)
      },
    })
  }

  const entity = bulkDelete?.entityName ?? "item"
  const entityPlural = selectedCount > 1 ? `${selectedCount} ${entity}s` : entity

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Left — search + filters */}
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              const col = table.getColumn(searchColumnId)
              if (!col && process.env.NODE_ENV === "development") {
                console.warn(`[DataTableToolbar] searchColumnId "${searchColumnId}" not found. Check your column accessorKey or id.`)
              }
              col?.setFilterValue(e.target.value)
            }}
            className="h-8 w-[180px] lg:w-[250px]"
          />

          {filters.map(({ columnId, title, options }) =>
            table.getColumn(columnId) ? (
              <DataTableFacetedFilter
                key={columnId}
                column={table.getColumn(columnId)}
                title={title}
                options={options}
              />
            ) : null
          )}

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                table.resetColumnFilters()
                setSearchValue("")
              }}
            >
              Reset
              <X />
            </Button>
          )}
        </div>

        {/* Right — bulk delete, view options, add button */}
        <div className="flex items-center gap-2">
          {hasSelection && bulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedCount})
            </Button>
          )}
          <DataTableViewOptions table={table} />
          {addButton && (
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={addButton.onClick}
            >
              <Plus className="w-3.5 h-3.5" />
              {addButton.label}
            </Button>
          )}
        </div>
      </div>

      {/* Bulk delete confirmation dialog */}
      {bulkDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {entityPlural}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {entityPlural} and all associated
                data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                variant="destructive"
              >
                Delete {entityPlural}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}