"use client"

import { router } from "@inertiajs/react"
import { type Table, type RowSelectionState } from "@tanstack/react-table"
import { Plus, Trash2, X } from "lucide-react"
import React from "react"

import { toast } from "sonner"
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
  route: string
  getId?: (rowOriginal: unknown) => string | number
  entityName: string
  onSuccess?: (count: number) => void  
  onError?: () => void                 
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
        toast.success(`${entityPlural} deleted successfully.`)
        table.resetRowSelection()
        setDeleteDialogOpen(false)
      },
      onError: () => toast.error(`Failed to delete ${entityPlural}.`),
    })
  }

  const entity = bulkDelete?.entityName ?? "item"
  const entityPlural = selectedCount > 1 ? `${selectedCount} ${entity}s` : entity

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              const col = table.getColumn(searchColumnId)
              if (!col && process.env.NODE_ENV === "development") {
                console.warn(`[DataTableToolbar] searchColumnId "${searchColumnId}" not found.`)
              }
              col?.setFilterValue(e.target.value)
            }}
            className="h-8 sm:w-50 lg:w-62.5"
          />

          {filters.map(({ columnId, title, options }) =>
            table.getColumn(columnId) ? (
              <DataTableFacetedFilter
                key={columnId}
                column={table.getColumn(columnId)}
                title={title}
                options={options}
                table={table}
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
              <X className="ml-1 size-3.5" />
            </Button>
          )}
        </div>

        {/* Right — actions: always row, wraps to next line on mobile */}
        <div className="flex shrink-0 items-center gap-2">
          {hasSelection && bulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5 shrink-0" />
              {/* Hide label on xs to save space, show count always */}
              <span className="hidden sm:inline">Delete</span>
              <span>({selectedCount})</span>
            </Button>
          )}
          <DataTableViewOptions table={table} />
          {addButton && (
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={addButton.onClick}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">{addButton.label}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bulk delete confirmation dialog — unchanged */}
      {bulkDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {entityPlural}?</AlertDialogTitle>
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