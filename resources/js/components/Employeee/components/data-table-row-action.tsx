"use client"

import { router } from "@inertiajs/react"
import { type Row } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { taskSchema } from "../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // prevent row click from navigating
    if (confirm(`Are you sure you want to delete ${task.name}? This action cannot be undone.`)) {
      router.delete(`/employee/${task.id}`, { preserveScroll: true })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
    >
      <Trash2 className="w-4 h-4" />
      <span className="sr-only">Delete</span>
    </Button>
  )
}