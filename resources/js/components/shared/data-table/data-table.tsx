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
import { Badge } from '@/components/ui/badge';
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

// ─── Header group config ────────────────────────────────────────────────────────

/**
 * A single cell in the top-level group header row.
 *
 * - `colSpan` / `rowSpan` work exactly like native HTML attributes.
 * - `label` can be a string or any React node (e.g. a <span> with a subtitle).
 * - `className` is applied to the <th> element.
 *
 * To make a column span BOTH header rows (like "#" or "Employee Name"),
 * set `rowSpan={2}`.
 */
export interface DataTableHeaderGroupCell {
    label: React.ReactNode;
    colSpan?: number;
    rowSpan?: number;
    className?: string;
}

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

    /** Default page size (defaults to 10) */
    defaultPageSize?: number;

    // ── Toolbar config ──────────────────────────────────────────────────────────
    searchColumnId: string;
    searchPlaceholder?: string;
    filters?: ToolbarFilterConfig[];
    addButton?: ToolbarAddButtonConfig;
    bulkDelete?: ToolbarBulkDeleteConfig;

    // ── Visual extensions ───────────────────────────────────────────────────────

    // ── Visual extensions ───────────────────────────────────────────────────────

    /**
     * When provided, renders an extra <tr> above the normal TanStack column
     * headers. Use this for grouped / colour-banded headers (e.g. the payroll
     * Earnings | Deductions | Net Pay bands).
     *
     * Each item maps to one <th>. Use `colSpan`, `rowSpan`, and `className` to
     * position cells exactly as you would in plain HTML.
     *
     * Tables that do NOT pass this prop are completely unaffected.
     */
    headerGroups?: DataTableHeaderGroupCell[];

    /**
     * When provided, renders a <tfoot> row after the last body row.
     * The callback receives the current *page* rows so totals are page-aware.
     *
     * Return an array of <td> / <th> elements — one per visible column.
     * Tables that do NOT pass this prop get no <tfoot> at all.
     *
     * @example
     * footerRow={(rows) => [
     *   <td colSpan={2}>Page Totals ({rows.length})</td>,
     *   <td className="text-right">{peso(rows.reduce((s,r) => s + r.original.grossPay, 0))}</td>,
     * ]}
     */
    footerRow?: (rows: Row<TData>[]) => React.ReactNode[];

    /**
     * When provided, renders an extra <tr> above the normal TanStack column
     * headers. Use this for grouped / colour-banded headers (e.g. the payroll
     * Earnings | Deductions | Net Pay bands).
     *
     * Each item maps to one <th>. Use `colSpan`, `rowSpan`, and `className` to
     * position cells exactly as you would in plain HTML.
     *
     * Tables that do NOT pass this prop are completely unaffected.
     */
    headerGroups?: DataTableHeaderGroupCell[];

    /**
     * When provided, renders a <tfoot> row after the last body row.
     * The callback receives the current *page* rows so totals are page-aware.
     *
     * Return an array of <td> / <th> elements — one per visible column.
     * Tables that do NOT pass this prop get no <tfoot> at all.
     *
     * @example
     * footerRow={(rows) => [
     *   <td colSpan={2}>Page Totals ({rows.length})</td>,
     *   <td className="text-right">{peso(rows.reduce((s,r) => s + r.original.grossPay, 0))}</td>,
     * ]}
     */
    footerRow?: (rows: Row<TData>[]) => React.ReactNode[];

    /**
     * Zebra-stripe body rows (index % 2 === 0 → white, odd → slate-50/50).
     * Defaults to `false` to preserve existing table appearance.
     */
    striped?: boolean;

    /**
     * Column id (accessorKey or id) next to which the "New" badge appears after
     * a record is created. Defaults to the second visible cell (index 1),
     * which skips the checkbox column.
     */
    newBadgeColumnId?: string;
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
    headerGroups,
    footerRow,
    striped = false,
    newBadgeColumnId,
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

    // ── "New record first" tracking ─────────────────────────────────────────────
    // Compares incoming data to the previous render to detect a newly added row.
    // The newest record is pinned to position 0 until the user sorts or filters.
    const [newestId, setNewestId] = React.useState<string | null>(null);
    const prevDataRef = React.useRef<TData[]>(data);

    React.useEffect(() => {
        const prev = prevDataRef.current;
        // Only act when a net-new record appears (count went up)
        if (data.length > prev.length && getRowId) {
            const prevIds = new Set(prev.map(getRowId));
            const added = data.find((row) => !prevIds.has(getRowId(row)));
            if (added) {
                setNewestId(getRowId(added));
                // Jump to first page so the pinned row is immediately visible
                setPagination((p) => ({ ...p, pageIndex: 0 }));
            }
        }
        prevDataRef.current = data;
    }, [data, getRowId]);

    // Reorder data so the newest record is always first (until sort/filter clears it)
    const displayData = React.useMemo<TData[]>(() => {
        if (!newestId || !getRowId) return data;
        const idx = data.findIndex((row) => getRowId(row) === newestId);
        if (idx <= 0) return data; // already first or not found
        const reordered = [...data];
        const [pinned] = reordered.splice(idx, 1);
        reordered.unshift(pinned);
        return reordered;
    }, [data, newestId, getRowId]);

    const table = useReactTable({
        data: displayData,
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
            // User explicitly sorted — release the pinned row
            setNewestId(null);
            setSorting(updater);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        },
        onColumnFiltersChange: (updater) => {
            // User filtered — release the pinned row
            setNewestId(null);
            setColumnFilters(updater);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
    const pageRows = table.getRowModel().rows;

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
                        <div className="flex items-center gap-3 bg-muted/50 px-4 py-2">
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
                            <span className="text-xs font-medium text-muted-foreground">
                                {table.getIsSomePageRowsSelected() ||
                                table.getIsAllPageRowsSelected()
                                    ? `${Object.keys(rowSelection).length} selected`
                                    : 'Select all'}
                            </span>
                        </div>

                        {/* ── Cards ── */}
                        {pageRows?.length ? (
                            pageRows.map((row) => {
                                const cardColumns = (
                                    columns as DataTableColumnDef<TData>[]
                                ).filter((col) => col.mobileCard);
                                const isNewest =
                                    newestId !== null && row.id === newestId;
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
                                                : isNewest
                                                  ? 'bg-primary/5'
                                                  : 'bg-background',
                                            onRowClick
                                                ? 'cursor-pointer active:bg-muted'
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

                                        {isNewest && (
                                            <Badge className="pointer-events-none h-5 shrink-0 self-start rounded-full px-1.5 py-0 text-[10px] font-semibold shadow-sm select-none">
                                                New
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                                No results.
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Table view (desktop) ── */
                    <div className="overflow-x-auto">
                        <Table>
                            {headerGroups && headerGroups.length > 0 ? (
                                /*
                                 * When headerGroups is provided we need full HTML control over
                                 * the <thead> so that rowSpan/colSpan cells work correctly.
                                 * TanStack's <TableHeader> wraps each row in its own <tr> which
                                 * breaks rowSpan — so we bypass it entirely here and render a
                                 * raw <thead> with two explicit <tr> rows:
                                 *   Row 1 → the group band cells (from headerGroups prop)
                                 *   Row 2 → the TanStack sub-column headers
                                 */
                                <thead>
                                    {/* Group band row — rowSpan≥2 cells span both header rows (fixed cols) */}
                                    <tr className="border-b-0">
                                        {headerGroups.map((cell, i) => (
                                            <th
                                                key={i}
                                                colSpan={cell.colSpan ?? 1}
                                                rowSpan={
                                                    (cell.rowSpan ?? 1) >= 2
                                                        ? 2
                                                        : 1
                                                }
                                                className={[
                                                    'px-4 py-0 align-bottom text-sm font-medium text-muted-foreground',
                                                    (cell.rowSpan ?? 1) >= 2
                                                        ? 'border-b border-border text-left align-middle'
                                                        : 'text-center align-bottom',
                                                    // Add border + bottom padding for labelled group cells
                                                    (cell.rowSpan ?? 1) < 2 &&
                                                    cell.label
                                                        ? 'rounded-t border-r border-b border-l border-border pb-1'
                                                        : '',
                                                    cell.className,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
                                                {cell.label}
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Sub-column header row — skip columns already spanned by rowSpan=2 cells */}
                                    {(() => {
                                        // Build a set of column offsets that are already occupied by rowSpan=2 group cells
                                        const skipped = new Set<number>();
                                        let offset = 0;
                                        for (const cell of headerGroups) {
                                            if ((cell.rowSpan ?? 1) >= 2) {
                                                for (
                                                    let c = 0;
                                                    c < (cell.colSpan ?? 1);
                                                    c++
                                                )
                                                    skipped.add(offset + c);
                                            }
                                            offset += cell.colSpan ?? 1;
                                        }

                                        return table
                                            .getHeaderGroups()
                                            .map((headerGroup) => {
                                                let colIndex = 0;
                                                return (
                                                    <tr key={headerGroup.id}>
                                                        {headerGroup.headers.map(
                                                            (header) => {
                                                                const myIndex =
                                                                    colIndex;
                                                                colIndex +=
                                                                    header.colSpan ??
                                                                    1;
                                                                if (
                                                                    skipped.has(
                                                                        myIndex,
                                                                    )
                                                                )
                                                                    return null;
                                                                // Determine if this sub-header belongs to a bordered group
                                                                const isGrouped =
                                                                    !skipped.has(
                                                                        myIndex,
                                                                    );
                                                                // Find the group cell this column belongs to
                                                                let gOffset = 0;
                                                                let inBorderedGroup = false;
                                                                for (const gc of headerGroups) {
                                                                    const span =
                                                                        gc.colSpan ??
                                                                        1;
                                                                    if (
                                                                        myIndex >=
                                                                            gOffset &&
                                                                        myIndex <
                                                                            gOffset +
                                                                                span
                                                                    ) {
                                                                        inBorderedGroup =
                                                                            (gc.rowSpan ??
                                                                                1) <
                                                                                2 &&
                                                                            !!gc.label;
                                                                        break;
                                                                    }
                                                                    gOffset +=
                                                                        span;
                                                                }
                                                                return (
                                                                    <th
                                                                        key={
                                                                            header.id
                                                                        }
                                                                        colSpan={
                                                                            header.colSpan
                                                                        }
                                                                        className={[
                                                                            'h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground',
                                                                            inBorderedGroup
                                                                                ? 'border-x border-b border-border'
                                                                                : '',
                                                                            header
                                                                                .column
                                                                                .columnDef
                                                                                .meta
                                                                                ?.headerClassName,
                                                                        ]
                                                                            .filter(
                                                                                Boolean,
                                                                            )
                                                                            .join(
                                                                                ' ',
                                                                            )}
                                                                    >
                                                                        {header.isPlaceholder
                                                                            ? null
                                                                            : flexRender(
                                                                                  header
                                                                                      .column
                                                                                      .columnDef
                                                                                      .header,
                                                                                  header.getContext(),
                                                                              )}
                                                                    </th>
                                                                );
                                                            },
                                                        )}
                                                    </tr>
                                                );
                                            });
                                    })()}
                                </thead>
                            ) : (
                                /* Standard single-row header — all existing tables unaffected */
                                <TableHeader>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    (header) => {
                                                        const colWidth = (
                                                            header.column
                                                                .columnDef as DataTableColumnDef<TData>
                                                        ).width;
                                                        const widthStyle =
                                                            colWidth !==
                                                            undefined
                                                                ? {
                                                                      width:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                      minWidth:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                      maxWidth:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                  }
                                                                : undefined;
                                                        return (
                                                            <TableHead
                                                                key={header.id}
                                                                colSpan={
                                                                    header.colSpan
                                                                }
                                                                style={
                                                                    widthStyle
                                                                }
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .header,
                                                                          header.getContext(),
                                                                      )}
                                                            </TableHead>
                                                        );
                                                    },
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                            )}

                            <TableBody>
                                {pageRows?.length ? (
                                    pageRows.map((row, index) => {
                                        const isNewest =
                                            newestId !== null &&
                                            row.id === newestId;
                                        return (
                                            <TableRow
                                                key={row.id}
                                                data-state={
                                                    row.getIsSelected() &&
                                                    'selected'
                                                }
                                                className={[
                                                    onRowClick
                                                        ? 'cursor-pointer'
                                                        : '',
                                                    striped
                                                        ? index % 2 === 0
                                                            ? 'bg-white hover:bg-blue-50/30'
                                                            : 'bg-slate-50/50 hover:bg-blue-50/30'
                                                        : '',
                                                    isNewest
                                                        ? 'bg-primary/5'
                                                        : '',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                                onClick={
                                                    onRowClick
                                                        ? () => onRowClick(row)
                                                        : undefined
                                                }
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell, cellIndex) => {
                                                        const colDef = cell
                                                            .column
                                                            .columnDef as DataTableColumnDef<TData>;
                                                        const colId =
                                                            cell.column.id;
                                                        const isBadgeCol =
                                                            newBadgeColumnId
                                                                ? colId ===
                                                                  newBadgeColumnId
                                                                : cellIndex ===
                                                                  1;
                                                        const showBadge =
                                                            isNewest &&
                                                            isBadgeCol;
                                                        const colWidth =
                                                            colDef.width;
                                                        const widthStyle =
                                                            colWidth !==
                                                            undefined
                                                                ? {
                                                                      width:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                      minWidth:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                      maxWidth:
                                                                          typeof colWidth ===
                                                                          'number'
                                                                              ? `${colWidth}px`
                                                                              : colWidth,
                                                                  }
                                                                : undefined;
                                                        const renderedCell =
                                                            flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            );
                                                        return (
                                                            <TableCell
                                                                key={cell.id}
                                                                className={
                                                                    cell.column
                                                                        .columnDef
                                                                        .meta
                                                                        ?.className
                                                                }
                                                                style={
                                                                    widthStyle
                                                                }
                                                            >
                                                                {showBadge ? (
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        {colWidth !==
                                                                        undefined ? (
                                                                            <span className="truncate">
                                                                                {
                                                                                    renderedCell
                                                                                }
                                                                            </span>
                                                                        ) : (
                                                                            renderedCell
                                                                        )}
                                                                        <Badge className="pointer-events-none h-5 shrink-0 rounded-full px-1.5 py-0 text-[10px] font-semibold shadow-sm select-none">
                                                                            New
                                                                        </Badge>
                                                                    </div>
                                                                ) : colWidth !==
                                                                  undefined ? (
                                                                    <div className="truncate">
                                                                        {
                                                                            renderedCell
                                                                        }
                                                                    </div>
                                                                ) : (
                                                                    renderedCell
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                            </TableRow>
                                        );
                                    })
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

                            {/* ── Optional footer / totals row ── */}
                            {footerRow && pageRows?.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-border bg-muted/50 text-sm font-semibold text-foreground">
                                        {footerRow(pageRows)}
                                    </tr>
                                </tfoot>
                            )}
                        </Table>
                    </div>
                )}
            </div>

            <DataTablePagination
                table={table}
                rowSelection={rowSelection}
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
