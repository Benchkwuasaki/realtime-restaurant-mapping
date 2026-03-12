"use client"

import { router } from "@inertiajs/react"
import { route } from "ziggy-js"
import { useState, useRef } from "react"
import { Pen, Trash } from "lucide-react"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from "@/components/shared/data-table/data-table-row-action"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { type Division } from "../data/schema"

interface ColumnOptions {
    onEdit: (division: Division) => void
}

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    division: Division | null
    onClose: () => void
}

function DeleteConfirmDialog({ division, onClose }: DeleteConfirmDialogProps) {
    const [processing, setProcessing] = useState(false)

    function handleConfirm() {
        if (!division) return
        setProcessing(true)
        router.delete(route("division.destroy", division.division_id), {
            onFinish: () => {
                setProcessing(false)
                onClose()
            },
        })
    }

    return (
        <Dialog open={division !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="text-sm font-semibold text-foreground">
                        Delete Division
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 text-sm text-muted-foreground">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-foreground">{division?.division_name}</span>?{" "}
                    This will also affect any units assigned to this division.
                    This action cannot be undone.
                </div>

                <DialogFooter className="px-5 py-4 border-t border-border flex flex-row justify-end bg-muted/30">
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
                        {processing ? "Deleting…" : "Delete Division"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileDivisionCardProps {
    row: Division
    onEdit: (division: Division) => void
}

function MobileDivisionCard({ row, onEdit }: MobileDivisionCardProps) {
    const [confirmDivision, setConfirmDivision] = useState<Division | null>(null)
    const suppressNextClick = useRef(false)

    function handleDialogClose() {
        suppressNextClick.current = true
        setConfirmDivision(null)
        setTimeout(() => { suppressNextClick.current = false }, 200)
    }

    return (
        <>
            <div
                className="flex flex-col bg-background overflow-hidden"
                onClick={(e) => { if (suppressNextClick.current) e.stopPropagation() }}
            >
                {/* ── Card Body ── */}
                <div className="px-4 pt-4 pb-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-base text-foreground">
                            {row.division_name}
                        </span>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {row.division_acronym}
                        </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row.department?.department_name ?? "—"}
                    </div>

                    {row.division_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {row.division_description}
                        </p>
                    )}
                </div>

                {/* ── Card Footer ── */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                        {row.units?.length ?? 0} unit{(row.units?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xs text-muted-foreground hover:text-foreground w-12"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(row)
                            }}
                        >
                            <Pen />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xs text-muted-foreground hover:text-destructive w-12"
                            onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDivision(row)
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                division={confirmDivision}
                onClose={handleDialogClose}
            />
        </>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({ onEdit }: ColumnOptions): DataTableColumnDef<Division>[] {
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
            accessorKey: "division_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 font-medium text-foreground">
                    {row.getValue("division_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobileDivisionCard row={row} onEdit={onEdit} />
            ),
        },
        {
            accessorKey: "division_acronym",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs">
                    {row.getValue("division_acronym")}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "division_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const desc: string | null = row.getValue("division_description")
                return (
                    <div className="min-w-50 max-w-[320px] text-sm text-muted-foreground truncate">
                        {desc ?? <span className="italic text-muted-foreground/50">No description</span>}
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            id: "department",
            accessorFn: (row) => String(row.department?.department_id ?? ""),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <div className="min-w-35 text-sm text-muted-foreground">
                    {row.original.department?.department_name ?? "—"}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.department_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        editAction(onEdit),
                        deleteAction(
                            (division) =>
                                router.delete(route("division.destroy", division.division_id)),
                            {
                                getName: (d) => d.division_name,
                                description: (d) => (
                                    <>
                                        Are you sure you want to delete{" "}
                                        <span className="font-medium text-foreground">
                                            {d.division_name}
                                        </span>?{" "}
                                        This will also affect any units assigned to this division.
                                        This action cannot be undone.
                                    </>
                                ),
                                confirmLabel: "Delete Division",
                            }
                        ),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ]
}