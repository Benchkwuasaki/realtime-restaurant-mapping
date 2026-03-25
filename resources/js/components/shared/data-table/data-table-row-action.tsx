"use client"

import { type Row } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Action config types ────────────────────────────────────────────────────────

export interface RowActionButton<TData> {
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: (row: TData) => void
  /**
   * When true, clicking the button opens a confirmation dialog before
   * calling onClick. Provide confirmDialog to customise the copy.
   */
  confirm?: boolean
  confirmDialog?: {
    title: (row: TData) => string
    description: (row: TData) => React.ReactNode
    confirmLabel?: string
  }
  className?: string
  /** Tailwind classes applied on hover — e.g. "hover:text-destructive hover:bg-destructive/10" */
  hoverClassName?: string
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions?: RowActionButton<TData>[]
  /**
   * How many actions to show as icon buttons before collapsing the rest into
   * a "…" overflow menu. On mobile, always collapses to the overflow menu when
   * there are 2+ actions. Defaults to 2.
   */
  mobileCollapseAt?: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DataTableRowActions<TData>({
  row,
  actions = [],
  mobileCollapseAt = 2,
}: DataTableRowActionsProps<TData>) {
  const original = row.original
  const [confirmIndex, setConfirmIndex] = React.useState<number | null>(null)

  const handleAction = (action: RowActionButton<TData>, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (action.confirm) {
      setConfirmIndex(index)
    } else {
      action.onClick(original)
    }
  }

  const confirmDialogs = actions.map((action, i) => {
    if (!action.confirm) return null
    const dialog = action.confirmDialog
    return (
      <AlertDialog
        key={i}
        open={confirmIndex === i}
        onOpenChange={(open) => !open && setConfirmIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.title(original) ?? `${action.label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.description(original) ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(original)
                setConfirmIndex(null)
              }}
            >
              {dialog?.confirmLabel ?? action.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  })

  // On mobile (< sm): always use overflow menu when actions.length >= mobileCollapseAt
  // On desktop: show all as icon buttons
  return (
    <>
      {/* ── Mobile: overflow "…" menu ── */}
      <div className={`flex items-center gap-1 ${actions.length >= mobileCollapseAt ? "sm:hidden" : ""}`}>
        {actions.length >= mobileCollapseAt ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onSelect={(e) => {
                    if (action.confirm) {
                      setConfirmIndex(i)
                    } else {
                      action.onClick(original)
                    }
                  }}
                  className={`flex items-center gap-2 py-2 ${action.hoverClassName ?? ""} ${action.className ?? ""}`}
                >
                  <action.icon className="size-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          actions.map((action, i) => (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              className={`size-8 text-muted-foreground hover:text-foreground hover:bg-accent ${action.hoverClassName ?? ""} ${action.className ?? ""}`}
              onClick={(e) => handleAction(action, i, e)}
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="sr-only">{action.label}</span>
            </Button>
          ))
        )}
      </div>

      {/* ── Desktop: icon buttons ── */}
      {actions.length >= mobileCollapseAt && (
        <div className="hidden sm:flex items-center gap-1">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              className={`size-8 text-muted-foreground hover:text-foreground hover:bg-accent ${action.hoverClassName ?? ""} ${action.className ?? ""}`}
              onClick={(e) => handleAction(action, i, e)}
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="sr-only">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {confirmDialogs}
    </>
  )
}

// ─── Pre-built action helpers ───────────────────────────────────────────────────

export function editAction<TData>(
  onClick: (row: TData) => void
): RowActionButton<TData> {
  return {
    icon: Pencil,
    label: "Edit",
    onClick,
  }
}

export function addAction<TData>(
  onClick: (row: TData) => void,
): RowActionButton<TData> {
  return {
    icon: Plus,
    label: "Add",
    onClick,
  }
}

export function deleteAction<TData>(
  onClick: (row: TData) => void,
  opts?: {
    title?: (row: TData) => string
    description?: (row: TData) => React.ReactNode
    confirmLabel?: string
    getName?: (row: TData) => string
  }
): RowActionButton<TData> {
  const getName = opts?.getName ?? ((row) => String((row as { name?: string }).name ?? "this record"))
  return {
    icon: Trash2,
    label: "Delete",
    onClick,
    confirm: true,
    hoverClassName: "hover:text-destructive hover:bg-destructive/10",
    confirmDialog: {
      title: opts?.title ?? ((row) => `Delete ${getName(row)}?`),
      description:
        opts?.description ??
        ((row) => (
          <>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{getName(row)}</span>{" "}
            and all associated data. This action cannot be undone.
          </>
        )),
      confirmLabel: opts?.confirmLabel ?? "Delete",
    },
  }
}