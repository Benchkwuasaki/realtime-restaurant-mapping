import { type RowSelectionState, type Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

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
  // These come directly from React state in the parent — never from
  // table.getState() — so they are always current on every render.
  pageIndex: number
  pageSize: number
  pageCount: number
  totalFiltered: number
  rowSelection: RowSelectionState // ← added
  onPageIndexChange: (index: number) => void
  onPageSizeChange: (size: number) => void
}

export function DataTablePagination<TData>({
  table,
  pageIndex,
  pageSize,
  pageCount,
  totalFiltered,
  rowSelection, // ← added
  onPageIndexChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  // Count keys in rowSelection — this is always accurate regardless of pagination
  const selectedCount = Object.keys(rowSelection).length
  const hasSelectionColumn = !!table.getColumn("select")

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 px-2">
      <div className="text-muted-foreground text-sm">
        {hasSelectionColumn && (
          <>{selectedCount} of {totalFiltered} row(s) selected.</>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:gap-x-8">
        <div className="flex items-center space-x-2">
          <p className="hidden sm:block text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
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
        <div className="text-sm font-medium tabular-nums">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageIndexChange(0)}
            disabled={pageIndex === 0}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageIndexChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageIndexChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageIndexChange(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}