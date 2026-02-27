"use client"

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
    type Row,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import {
    DataTableToolbar,
    type ToolbarAddButtonConfig,
    type ToolbarBulkDeleteConfig,
    type ToolbarFilterConfig,
} from "./data-table-toolbar"

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]

    /**
     * How to derive the stable row id from each record.
     * Defaults to `(row) => String((row as any).id)`.
     */
    getRowId?: (row: TData) => string
    /**
     * Optional click handler for an entire row (e.g. navigate to detail page).
     * Receives the full row object. When omitted, rows are not clickable.
     */
    onRowClick?: (row: Row<TData>) => void

    /** Default page size (defaults to 25) */
    defaultPageSize?: number

    // ── Toolbar config ──────────────────────────────────────────────────────────
    searchColumnId: string
    searchPlaceholder?: string
    filters?: ToolbarFilterConfig[]
    addButton?: ToolbarAddButtonConfig
    bulkDelete?: ToolbarBulkDeleteConfig
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
    columns,
    data,
    getRowId,
    onRowClick,
    defaultPageSize = 25,
    searchColumnId,
    searchPlaceholder,
    filters,
    addButton,
    bulkDelete,
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    })

    const table = useReactTable({
        data,
        columns,
        enableRowSelection: true,
        getRowId,
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        autoResetPageIndex: false,
        onRowSelectionChange: setRowSelection,
        onSortingChange: (updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        onColumnFiltersChange: (updater) => {
            setColumnFilters(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const totalFiltered = table.getFilteredRowModel().rows.length
    const pageCount = Math.max(1, Math.ceil(totalFiltered / pagination.pageSize))

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar
                table={table}
                rowSelection={rowSelection}
                searchColumnId={searchColumnId}
                searchPlaceholder={searchPlaceholder}
                filters={filters}
                addButton={addButton}
                bulkDelete={bulkDelete}
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
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
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
                                    className={onRowClick ? "cursor-pointer" : undefined}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                table={table}
                rowSelection={rowSelection} // ← added
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                pageCount={pageCount}
                totalFiltered={totalFiltered}
                onPageIndexChange={(index) =>
                    setPagination((prev) => ({ ...prev, pageIndex: index }))
                }
                onPageSizeChange={(size) =>
                    setPagination({ pageIndex: 0, pageSize: size })
                }
            />
        </div>
    )
}