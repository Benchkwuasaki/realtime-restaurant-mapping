"use client"

import { router } from "@inertiajs/react"
import { type Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import React from "react"
import { DataTableViewOptions } from "@/components/Employeee/components/data-table-view-option"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { status } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchValue, setSearchValue] = React.useState("")

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
        <DataTableViewOptions table={table} />
        <Button variant="default" size="sm" onClick={() => router.visit('/employee/create')}>
          Create Employee
        </Button>
      </div>
    </div>
  )
}