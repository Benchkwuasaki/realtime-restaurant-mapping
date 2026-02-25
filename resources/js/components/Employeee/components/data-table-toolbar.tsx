"use client"
import { router } from "@inertiajs/react"
import { type Table } from "@tanstack/react-table"
import { Trash2, X } from "lucide-react"
import React from "react"
import { DataTableViewOptions } from "@/components/Employeee/components/data-table-view-option"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { status } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchValue, setSearchValue] = React.useState("")

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedRows.length} employee(s)? This action cannot be undone.`)) {
      const ids = selectedRows.map(row => row.id)
      router.delete("/employee", {
        data: { ids },
        preserveScroll: true,
        onSuccess: () => table.resetRowSelection(),
      })
    }
  }

  return (
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
            onClick={handleBulkDelete}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete ({selectedRows.length})
          </Button>
        )}
        <DataTableViewOptions table={table} />
        <Button variant="default" size="sm" onClick={() => router.visit('/employee/create')}>
          Create Employee
        </Button>
      </div>
    </div>
  )
}