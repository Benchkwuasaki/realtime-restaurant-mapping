"use client"

import { router } from "@inertiajs/react"
import { type Table, type RowSelectionState } from "@tanstack/react-table"
import { Plus, Repeat, Trash2, X } from "lucide-react"
import React from "react"
import { route } from "ziggy-js"

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
import { holidayTypes } from "../data/data"
import { type Holiday } from "../data/schema"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-option"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  rowSelection: RowSelectionState
  onAddHoliday: () => void
}

export function DataTableToolbar<TData>({
  table,
  rowSelection,
  onAddHoliday,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchValue, setSearchValue] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const selectedCount = Object.keys(rowSelection).length
  const hasSelection = selectedCount > 0

  const handleBulkDelete = () => {
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => (row.original as Holiday).holiday_id)

    router.delete(route("holiday.bulk-destroy"), {
      data: { ids },
      preserveScroll: true,
      onSuccess: () => {
        table.resetRowSelection()
        setDeleteDialogOpen(false)
      },
    })
  }

  // Recurring filter options
  const recurringOptions = [
    { value: true, label: "Recurring" },
    { value: false, label: "One-time" },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            placeholder="Search holidays..."
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value)
              table.getColumn("name")?.setFilterValue(event.target.value)
            }}
            className="h-8 w-[180px] lg:w-[250px]"
          />

          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={holidayTypes}
            />
          )}

          {table.getColumn("is_recurring") && (
            <DataTableFacetedFilter
              column={table.getColumn("is_recurring")}
              title="Recurring"
              options={recurringOptions}
            />
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

        <div className="flex items-center gap-2">
          {hasSelection && (
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
          <Button size="sm" className="gap-1.5 text-xs" onClick={onAddHoliday}>
            <Plus className="w-3.5 h-3.5" />
            Add Holiday
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} Holiday{selectedCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} holiday record
              {selectedCount > 1 ? "s" : ""} and all associated data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              variant={"destructive"}
            >
              Delete {selectedCount > 1 ? `${selectedCount} Holidays` : "Holiday"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}