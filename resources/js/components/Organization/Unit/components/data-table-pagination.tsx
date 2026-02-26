import { type RowSelectionState, type Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
    table: Table<TData>
    rowSelection: RowSelectionState
    pageIndex: number
    pageSize: number
    pageCount: number
    canPreviousPage: boolean
    canNextPage: boolean
}

export function DataTablePagination<TData>({
    table,
    rowSelection,
    pageIndex,
    pageSize,
    pageCount,
    canPreviousPage,
    canNextPage,
}: DataTablePaginationProps<TData>) {
    const selectedCount = Object.values(rowSelection).filter(Boolean).length
    const totalCount = table.getFilteredRowModel().rows.length

    return (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">

            {/* Selected count — hidden on mobile to save space */}
            <p className="hidden sm:block text-sm text-muted-foreground flex-1">
                {selectedCount} of {totalCount} row(s) selected.
            </p>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4 sm:justify-end">

                {/* Rows per page */}
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-17.5">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 25, 30, 40, 50].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page counter + nav buttons */}
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium whitespace-nowrap">
                        {pageIndex + 1} / {pageCount}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="hidden size-8 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!canPreviousPage}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => table.previousPage()}
                            disabled={!canPreviousPage}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => table.nextPage()}
                            disabled={!canNextPage}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="hidden size-8 lg:flex"
                            onClick={() => table.setPageIndex(pageCount - 1)}
                            disabled={!canNextPage}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Selected count — shown on mobile below controls */}
            <p className="text-xs text-muted-foreground sm:hidden">
                {selectedCount} of {totalCount} row(s) selected.
            </p>
        </div>
    )
}