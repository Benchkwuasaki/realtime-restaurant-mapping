"use client"
import { router } from "@inertiajs/react"
import { type Table, type RowSelectionState } from "@tanstack/react-table"
import { Trash2, X } from "lucide-react"
import React from "react"
import { DataTableViewOptions } from "@/components/Employeee/components/data-table-view-option"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { status } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
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

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  rowSelection: RowSelectionState
}

export function DataTableToolbar<TData>({ table, rowSelection }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchValue, setSearchValue] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const selectedCount = Object.keys(rowSelection).length
  const hasSelection = selectedCount > 0

  const handleBulkDelete = () => {
    const ids = table.getFilteredSelectedRowModel().rows.map(row => row.id)
    router.delete("/employee/bulk-destroy", {
      data: { ids },
      preserveScroll: true,
      onSuccess: () => {
        table.resetRowSelection()
        setDeleteDialogOpen(false)
      },
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search Employee..."
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value)
              table.getColumn("name")?.setFilterValue(event.target.value)
            }}
            className="h-8 w-37.5 lg:w-62.5"
          />
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={status}
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
          <Button variant="default" size="sm" onClick={() => router.visit('/employee/create')}>
            Create Employee
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Employee{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} employee record{selectedCount > 1 ? "s" : ""} and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              variant={'destructive'}
            >
              Delete {selectedCount > 1 ? `${selectedCount} Employees` : "Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}