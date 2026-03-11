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

import { type Department } from "../data/schema"

interface ColumnOptions {
    onEdit: (department: Department) => void
}

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    department: Department | null
    onClose: () => void
}

function DeleteConfirmDialog({ department, onClose }: DeleteConfirmDialogProps) {
    const [processing, setProcessing] = useState(false)

    function handleConfirm() {
        if (!department) return
        setProcessing(true)
        router.delete(route("department.destroy", department.department_id), {
            onFinish: () => {
                setProcessing(false)
                onClose()
            },
        })
    }

    return (
        <Dialog open={department !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="text-sm font-semibold text-foreground">
                        Delete Department
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 text-sm text-muted-foreground">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-foreground">{department?.department_name}</span>?{" "}
                    This will also affect any divisions assigned to this department.
                    This action cannot be undone.
                </div>

                <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-end bg-muted/30">
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
                        {processing ? "Deleting…" : "Delete Department"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileDepartmentCardProps {
    row: Department
    onEdit: (department: Department) => void
}

function MobileDepartmentCard({ row, onEdit }: MobileDepartmentCardProps) {
    const [confirmDepartment, setConfirmDepartment] = useState<Department | null>(null)
    const suppressNextClick = useRef(false)

    function handleDialogClose() {
        suppressNextClick.current = true
        setConfirmDepartment(null)
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
                            {row.department_name}
                        </span>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {row.department_acronym}
                        </Badge>
                    </div>

                    {row.department_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {row.department_description}
                        </p>
                    )}
                </div>

                {/* ── Card Footer ── */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                        {row.divisions?.length ?? 0} division{(row.divisions?.length ?? 0) !== 1 ? "s" : ""}
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
                                setConfirmDepartment(row)
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                department={confirmDepartment}
                onClose={handleDialogClose}
            />
        </>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({ onEdit }: ColumnOptions): DataTableColumnDef<Department>[] {
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
            accessorKey: "department_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[180px] font-medium text-foreground">
                    {row.getValue("department_name")}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobileDepartmentCard row={row} onEdit={onEdit} />
            ),
        },
        {
            accessorKey: "department_acronym",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs">
                    {row.getValue("department_acronym")}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "department_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const desc: string | null = row.getValue("department_description")
                return (
                    <div className="min-w-[200px] max-w-[360px] text-sm text-muted-foreground truncate">
                        {desc ?? <span className="italic text-muted-foreground/50">No description</span>}
                    </div>
                )
            },
            enableSorting: false,
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
                            (department) =>
                                router.delete(
                                    route("department.destroy", department.department_id)
                                ),
                            {
                                getName: (d) => d.department_name,
                                description: (d) => (
                                    <>
                                        Are you sure you want to delete{" "}
                                        <span className="font-medium text-foreground">
                                            {d.department_name}
                                        </span>?{" "}
                                        This will also affect any divisions assigned to this department.
                                        This action cannot be undone.
                                    </>
                                ),
                                confirmLabel: "Delete Department",
                            }
                        ),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ]
}