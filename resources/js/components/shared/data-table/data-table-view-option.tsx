"use client"

import { type Table } from "@tanstack/react-table"
import { Check, Settings2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const [visibility, setVisibility] = React.useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {}
      table
        .getAllColumns()
        .filter(
          (col) => typeof col.accessorFn !== "undefined" && col.getCanHide()
        )
        .forEach((col) => {
          init[col.id] = col.getIsVisible()
        })
      return init
    }
  )

  const handleToggle = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return
    const newValue = !visibility[columnId]
    column.toggleVisibility(newValue)
    setVisibility((prev) => ({ ...prev, [columnId]: newValue }))
  }

  const hidableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide()
    )

  const ColumnList = () => (
    <>
      {hidableColumns.map((column) => {
        const isVisible = visibility[column.id] ?? true
        return (
          <button
            key={column.id}
            onClick={() => handleToggle(column.id)}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-sm capitalize hover:bg-accent sm:py-1.5"
          >
            <div
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                isVisible
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-input"
              )}
            >
              {isVisible && (
                <Check className="size-3 stroke-primary-foreground" />
              )}
            </div>
            {column.id.replace(/_/g, " ")}
          </button>
        )
      })}
    </>
  )

  return (
    <>
      {/* Mobile: Sheet (bottom drawer) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 lg:hidden"
          >
            <Settings2 />
            <span className="sr-only">View options</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-sm font-medium">Toggle columns</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-0.5">
            <ColumnList />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
          >
            <Settings2 />
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hidableColumns.map((column) => {
            const isVisible = visibility[column.id] ?? true
            return (
              <DropdownMenuItem
                key={column.id}
                onSelect={(e) => {
                  e.preventDefault()
                  handleToggle(column.id)
                }}
                className="flex items-center gap-2 capitalize"
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                    isVisible
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {isVisible && (
                    <Check className="size-3 stroke-primary-foreground" />
                  )}
                </div>
                {column.id.replace(/_/g, " ")}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}