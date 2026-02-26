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
    getRowId: getRowId ?? ((row) => {
      const r = row as Record<string, unknown>
      const id = r["id"] ?? r["holiday_id"] ?? r["employee_id"]
      if (id === undefined && process.env.NODE_ENV === "development") {
        console.warn(
          "[DataTable] getRowId could not find a unique id on row. " +
          "Pass the getRowId prop explicitly. Row:", row
        )
      }
      return String(id ?? Math.random())
    }),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      setPagination((old) =>
        typeof updater === "function" ? updater(old) : updater
      )
    },
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
        rowSelection={rowSelection}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
      />
    </div>
  )
}