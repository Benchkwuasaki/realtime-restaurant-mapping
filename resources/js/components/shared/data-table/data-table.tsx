'use client';

import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnFiltersState,
    type Row,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { useIsMobile } from '../../../hooks/use-is-mobile';
import { DataTablePagination } from './data-table-pagination';
import {
    DataTableToolbar,
    type ToolbarAddButtonConfig,
    type ToolbarBulkDeleteConfig,
    type ToolbarFilterConfig,
} from './data-table-toolbar';
import { type DataTableColumnDef } from './types/data-table-types';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DataTableProps<TData, TValue> {
    columns: DataTableColumnDef<TData, TValue>[];
    data: TData[];

    /**
     * How to derive the stable row id from each record.
     * Defaults to `(row) => String((row as any).id)`.
     */
    getRowId?: (row: TData) => string;
    /**
     * Optional click handler for an entire row (e.g. navigate to detail page).
     * Receives the full row object. When omitted, rows are not clickable.
     */
    onRowClick?: (row: Row<TData>) => void;

    /** Default page size (defaults to 25) */
    defaultPageSize?: number;

    // ── Toolbar config ──────────────────────────────────────────────────────────
    searchColumnId: string;
    searchPlaceholder?: string;
    filters?: ToolbarFilterConfig[];
    addButton?: ToolbarAddButtonConfig;
    bulkDelete?: ToolbarBulkDeleteConfig;

    /**
     * Optional observer called whenever the column filters state changes.
     * Receives the new filters array — use this to react to filter changes
     * (e.g. triggering a server-side Inertia visit) without owning the state.
     */
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
    columns,
    data,
    getRowId,
    onRowClick,
    defaultPageSize = 10,
    searchColumnId,
    searchPlaceholder,
    filters,
    addButton,
    bulkDelete,
    onColumnFiltersChange: onColumnFiltersChangeProp,
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });

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
            setSorting(updater);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        },
        onColumnFiltersChange: (updater) => {
            setColumnFilters(updater);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            const next =
                typeof updater === 'function'
                    ? updater(columnFilters)
                    : updater;
            onColumnFiltersChangeProp?.(next);
        },
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const totalFiltered = table.getFilteredRowModel().rows.length;
    const pageCount = Math.max(
        1,
        Math.ceil(totalFiltered / pagination.pageSize),
    );
    const isMobile = useIsMobile();

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

            <div className="rounded-md border border-gray-200">
                {isMobile ? (
                    <div className="divide-y divide-gray-200">
                        {/* ── Select-all header ── */}
                        <div className="bg-muted/50 flex items-center gap-3 px-4 py-2">
                            <Checkbox
                                checked={
                                    table.getIsAllPageRowsSelected() ||
                                    (table.getIsSomePageRowsSelected() &&
                                        'indeterminate')
                                }
                                onCheckedChange={(value) =>
                                    table.toggleAllPageRowsSelected(!!value)
                                }
                                aria-label="Select all"
                            />
                            <span className="text-muted-foreground text-xs font-medium">
                                {table.getIsSomePageRowsSelected() ||
                                table.getIsAllPageRowsSelected()
                                    ? `${Object.keys(rowSelection).length} selected`
                                    : 'Select all'}
                            </span>
                        </div>

                        {/* ── Cards ── */}
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const cardColumns = (
                                    columns as DataTableColumnDef<TData>[]
                                ).filter((col) => col.mobileCard);
                                return (
                                    <div
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                        onClick={
                                            onRowClick
                                                ? () => onRowClick(row)
                                                : undefined
                                        }
                                        className={[
                                            'flex items-center gap-3 px-4 py-3 transition-colors',
                                            row.getIsSelected()
                                                ? 'bg-muted'
                                                : 'bg-background',
                                            onRowClick
                                                ? 'active:bg-muted cursor-pointer'
                                                : '',
                                        ].join(' ')}
                                    >
                                        {/* Per-row checkbox */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="shrink-0"
                                        >
                                            <Checkbox
                                                checked={row.getIsSelected()}
                                                onCheckedChange={(value) =>
                                                    row.toggleSelected(!!value)
                                                }
                                                aria-label="Select row"
                                            />
                                        </div>

                                        {/* Card fields */}
                                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                            {cardColumns.map((col) => {
                                                const colId =
                                                    (
                                                        col as {
                                                            accessorKey?: string;
                                                        }
                                                    ).accessorKey ??
                                                    (col.id as string);
                                                return (
                                                    <div key={colId}>
                                                        {col.mobileCard!(
                                                            row.original,
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                                No results.
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Table view (desktop) ── */
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
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
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                            className={
                                                onRowClick
                                                    ? 'cursor-pointer'
                                                    : undefined
                                            }
                                            onClick={
                                                onRowClick
                                                    ? () => onRowClick(row)
                                                    : undefined
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
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
                )}
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
    );
}
