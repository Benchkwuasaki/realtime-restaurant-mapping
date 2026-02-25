"use client"

import { type Table } from "@tanstack/react-table"
import { FileDown, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { AArrowDown } from "lucide-react"
import React from "react"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

export function DataTableToolbar<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0
    const [searchValue, setSearchValue] = React.useState("")
    const modules = [
        {
            value: 'attendance',
            label: 'Attendance',
            icon: AArrowDown
        },
        {
            value: 'employee',
            label: 'Employee',
            icon: AArrowDown
        },
        {
            value: 'document_tracking',
            label: 'Document Tracking',
            icon: AArrowDown
        },
    ]

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-2">
                <Input
                    placeholder="Search tasks..."
                    value={searchValue}
                    onChange={(event) => {
                        setSearchValue(event.target.value)
                        table.getColumn("user")?.setFilterValue(event.target.value)
                    }}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {table.getColumn("module") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("module")}
                        title="Module"
                        options={modules}
                    />
                )}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.resetColumnFilters()}
                    >
                        Reset
                        <X />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>
        </div>
    )
}
