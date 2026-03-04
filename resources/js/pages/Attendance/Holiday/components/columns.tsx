"use client"

import { Repeat, Pencil, Trash2 } from "lucide-react"
import { useState, useRef } from "react"
import { router } from "@inertiajs/react"
import { route } from "ziggy-js"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  DataTableRowActions,
  editAction,
  deleteAction,
} from "@/components/shared/data-table/data-table-row-action"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TYPE_PILL, TYPE_DOT } from "../data/data"
import { type Holiday } from "../data/schema"

interface ColumnOptions {
  onEdit: (holiday: Holiday) => void
  onDelete: (holiday: Holiday) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })
}

function getFormattedDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
}

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  holiday: Holiday | null
  onClose: () => void
}

function DeleteConfirmDialog({ holiday, onClose }: DeleteConfirmDialogProps) {
  const [processing, setProcessing] = useState(false)

  function handleConfirm() {
    if (!holiday) return
    setProcessing(true)
    router.delete(route("holiday.destroy", holiday.holiday_id), {
      onFinish: () => {
        setProcessing(false)
        onClose()
      },
    })
  }

  return (
    <Dialog open={holiday !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Delete Holiday
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{holiday?.name}</span>?{" "}
          This action cannot be undone.
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={processing}
            onClick={handleConfirm}
            className="text-xs"
          >
            {processing ? "Deleting…" : "Delete Holiday"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileHolidayCardProps {
  row: Holiday
  onEdit: (holiday: Holiday) => void
}

function MobileHolidayCard({ row, onEdit }: MobileHolidayCardProps) {
  const [confirmHoliday, setConfirmHoliday] = useState<Holiday | null>(null)
  const suppressNextClick = useRef(false)

  function handleDialogClose() {
    suppressNextClick.current = true
    setConfirmHoliday(null)
    setTimeout(() => { suppressNextClick.current = false }, 200)
  }

  return (
    <>
      <div
        className="flex flex-col bg-background overflow-hidden"
        onClick={(e) => { if (suppressNextClick.current) e.stopPropagation() }}
      >
        {/* ── Card Body ── */}
        <div className="px-4 pt-4 pb-3 space-y-2">

          {/* Name row + type pill */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[row.type] ?? "bg-muted-foreground"}`} />
              <span className="font-semibold text-sm text-foreground truncate">
                {row.name}
              </span>
              {row.is_recurring && (
                <Repeat className="w-3.5 h-3.5 text-muted-foreground shrink-0" title="Recurring yearly" />
              )}
            </div>
            <span className={`inline-block shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_PILL[row.type] ?? "bg-muted text-muted-foreground"}`}>
              {row.type}
            </span>
          </div>

          {/* Date + day of week */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground pl-3.5">
            <span>{getFormattedDate(row.date)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{getDayOfWeek(row.date)}</span>
          </div>

          {/* Description */}
          {row.description && (
            <p className="text-xs text-muted-foreground pl-3.5 line-clamp-2">
              {row.description}
            </p>
          )}
        </div>

        {/* ── Card Footer ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">
            {row.is_recurring ? "Repeats every year" : "One-time holiday"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(row)
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmHoliday(row)
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        holiday={confirmHoliday}
        onClose={handleDialogClose}
      />
    </>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({ onEdit, onDelete }: ColumnOptions): DataTableColumnDef<Holiday>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Holiday Name" />
      ),
      cell: ({ row }) => {
        const holiday = row.original
        return (
          <div className="min-w-45">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[holiday.type] ?? "bg-muted-foreground"}`} />
              <span className="font-medium text-foreground text-sm">{holiday.name}</span>
              {holiday.is_recurring && (
                <Repeat className="w-3 h-3 text-muted-foreground shrink-0" title="Recurring yearly" />
              )}
            </div>
            {holiday.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 pl-3 truncate max-w-50">
                {holiday.description}
              </p>
            )}
          </div>
        )
      },
      // ── Mobile card registered on this column ──
      mobileCard: (row) => <MobileHolidayCard row={row} onEdit={onEdit} />,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <div className="min-w-30 text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("date") + "T00:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type: string = row.getValue("type")
        return (
          <div className="min-w-37.5">
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_PILL[type] ?? "bg-muted text-muted-foreground"}`}>
              {type}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "is_recurring",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recurring" />,
      cell: ({ row }) => {
        const isRecurring: boolean = row.getValue("is_recurring")
        return (
          <div className="min-w-20 flex items-center gap-1.5">
            {isRecurring ? (
              <>
                <Repeat className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Yes</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        )
      },
      filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          actions={[
            editAction(onEdit),
            deleteAction(onDelete, {
              getName: (h) => h.name,
            }),
          ]}
        />
      ),
      enableHiding: false,
    },
  ]
}