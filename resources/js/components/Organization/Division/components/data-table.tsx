"use client"

import { router } from "@inertiajs/react"
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"
import { route } from "ziggy-js"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { type Department, type Division } from "../data/schema"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    departments: Department[]
    onCreateDivision: () => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    departments,
    onCreateDivision,
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection]         = React.useState<RowSelectionState>({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters]       = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting]                   = React.useState<SortingState>([
        { id: "division_name", desc: false },
    ])
    const [pagination, setPagination]             = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    })

    const table = useReactTable({
        data,
        columns,
        getRowId: (row) => String((row as Division).division_id),
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        onPaginationChange: setPagination,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar
                table={table}
                rowSelection={rowSelection}
                departments={departments}
                onCreateDivision={onCreateDivision}
            />
            <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer"
                                    onClick={() => router.get(route("division.show", row.id))}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No divisions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination
                table={table}
                rowSelection={rowSelection}
                pageIndex={table.getState().pagination.pageIndex}
                pageSize={table.getState().pagination.pageSize}
                pageCount={table.getPageCount()}
                canPreviousPage={table.getCanPreviousPage()}
                canNextPage={table.getCanNextPage()}
            />
        </div>
    )
}