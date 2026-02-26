"use client"

import { router } from "@inertiajs/react"
import { type Table, type RowSelectionState } from "@tanstack/react-table"
import { Trash2, X } from "lucide-react"
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
import { type Division, type Unit } from "../data/schema"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-option"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    rowSelection: RowSelectionState
    divisions: Division[]
    onCreateUnit: () => void
}

export function DataTableToolbar<TData>({
    table,
    rowSelection,
    divisions,
    onCreateUnit,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0
    const [searchValue, setSearchValue] = React.useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

    const selectedCount = Object.keys(rowSelection).length
    const hasSelection = selectedCount > 0

    // Division options derived from the prop — value is division_id as string
    // so it matches the filterFn in columns.tsx
    const divisionOptions = divisions.map((d) => ({
        label: d.division_name,
        value: String(d.division_id),
    }))

    const handleBulkDelete = () => {
        const ids = table
            .getFilteredSelectedRowModel()
            .rows.map((row) => (row.original as Unit).unit_id)

        router.delete(route("unit.bulk-destroy"), {
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
                <div className="flex flex-1 items-center gap-2 flex-wrap">
                    <Input
                        placeholder="Search units..."
                        value={searchValue}
                        onChange={(event) => {
                            setSearchValue(event.target.value)
                            table.getColumn("unit_name")?.setFilterValue(event.target.value)
                        }}
                        className="h-8 w-45 lg:w-62.5"
                    />
                    {table.getColumn("division") && (
                        <DataTableFacetedFilter
                            column={table.getColumn("division")}
                            title="Division"
                            options={divisionOptions}
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
                    <Button variant="default" size="sm" onClick={onCreateUnit}>
                        Create Unit
                    </Button>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {selectedCount} Unit{selectedCount > 1 ? "s" : ""}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {selectedCount} unit record
                            {selectedCount > 1 ? "s" : ""} and all associated data. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            variant="destructive"
                        >
                            Delete {selectedCount > 1 ? `${selectedCount} Units` : "Unit"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}