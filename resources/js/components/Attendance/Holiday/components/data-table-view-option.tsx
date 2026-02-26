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
        .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
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

  return (
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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
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
                  {isVisible && <Check className="size-3 stroke-primary-foreground" />}
                </div>
                {column.id.replace(/_/g, " ")}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}