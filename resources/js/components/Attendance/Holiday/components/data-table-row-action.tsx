"use client"

import { type Row } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type Holiday } from "../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (holiday: Holiday) => void
  onDelete: (holiday: Holiday) => void
}

export function DataTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
}: DataTableRowActionsProps<TData>) {
  const holiday = row.original as Holiday

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={(e) => {
          e.stopPropagation()
          onEdit(holiday)
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="sr-only">Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(holiday)
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  )
}