"use client"

import { router } from "@inertiajs/react"
import { useForm } from "@inertiajs/react"
import { type Row } from "@tanstack/react-table"
import { Trash2, Pencil } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
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
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getColumns } from "./components/column2"
import type { LeaveEntitlement } from "./data/schema"
import { useIsMobile } from "@/hooks/use-is-mobile"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = {
    leave_entitlements: LeaveEntitlement[]
    leave_types: Array<{ leave_type_id: number; leave_type_name: string }>
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Mobile Detail Modal ───────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-secondary last:border-0">
            <span className="text-xs text-muted-foreground shrink-0">{label}</span>
            <span className="text-xs text-right">{value}</span>
        </div>
    )
}

interface MobileDetailModalProps {
    leaveEntitlement: LeaveEntitlement | null
    onClose: () => void
    onEdit: (leaveEntitlement: LeaveEntitlement) => void
    onDeleted: () => void
}

function MobileDetailModal({ leaveEntitlement, onClose, onEdit, onDeleted }: MobileDetailModalProps) {
    const [confirmOpen, setConfirmOpen] = React.useState(false)

    if (!leaveEntitlement) return null

    function handleDelete() {
        router.delete(route("leave.leave-entitlement.destroy", leaveEntitlement!.leave_entitlement_id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Leave entitlement deleted successfully.")
                setConfirmOpen(false)
                onDeleted()
            },
            onError: () => toast.error("Failed to delete leave entitlement."),
        })
    }

    return (
        <>
            <Dialog open={!!leaveEntitlement} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="p-0 gap-0 max-w-sm max-h-[85vh] flex flex-col">
                    <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                        <DialogTitle className="text-sm font-semibold pr-6">
                            Leave Entitlement #{leaveEntitlement.leave_entitlement_id}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-5 py-4 overflow-y-auto flex-1 space-y-1">
                        <DetailRow
                            label="Leave Type ID"
                            value={leaveEntitlement.leave_type_id}
                        />
                        <DetailRow
                            label="Description"
                            value={
                                <span className="text-muted-foreground">
                                    {leaveEntitlement.leave_entitlement_description || "N/A"}
                                </span>
                            }
                        />
                        <DetailRow
                            label="Years of Service"
                            value={`${leaveEntitlement.years_of_service} yr${leaveEntitlement.years_of_service !== 1 ? "s" : ""}`}
                        />
                        <DetailRow
                            label="Days Entitled"
                            value={`${leaveEntitlement.days_entitled} day${Number(leaveEntitlement.days_entitled) !== 1 ? "s" : ""}`}
                        />
                        <DetailRow
                            label="Days Entitled"
                            value={
                                <span className="text-muted-foreground">
                                    {leaveEntitlement.event_type|| "N/A"}
                                </span>
                                }
                        />
                    </div>

                    <DialogFooter className="px-5 py-4 bg-muted/30 shrink-0 flex-row justify-between gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </Button>

                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                                onClose()
                                onEdit(leaveEntitlement)
                            }}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this leave entitlement?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the entitlement of{" "}
                            <strong>{leaveEntitlement.days_entitled} day{Number(leaveEntitlement.days_entitled) !== 1 ? "s" : ""}</strong>{" "}
                            for {leaveEntitlement.years_of_service} yr{leaveEntitlement.years_of_service !== 1 ? "s" : ""} of service.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

interface LeaveEntitlementModalProps {
    open: boolean
    editingLeaveEntitlement: LeaveEntitlement | null
    onClose: () => void
    leave_types: Array<{ leave_type_id: number; leave_type_name: string }>
}

function LeaveEntitlementModal({ open, editingLeaveEntitlement, onClose, leave_types }: LeaveEntitlementModalProps) {
    const isEdit = editingLeaveEntitlement !== null

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        leave_type_id: editingLeaveEntitlement?.leave_type_id ?? "",
        leave_entitlement_description: editingLeaveEntitlement?.leave_entitlement_description ?? "",
        years_of_service: editingLeaveEntitlement?.years_of_service ?? 0,
        days_entitled: editingLeaveEntitlement?.days_entitled ?? "",  
        event_type: editingLeaveEntitlement?.event_type ?? "",  
    })

    function handleClose() {
        reset()
        clearErrors()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("leave.leave-entitlement.update", editingLeaveEntitlement!.leave_entitlement_id), {
                onSuccess: () => {
                    toast.success("Leave entitlement updated successfully.")
                    handleClose()
                },
                onError: () => toast.error("Failed to update leave entitlement."),
            } as any)
        } else {
            post(route("leave.leave-entitlement.store"), {
                onSuccess: () => {
                    toast.success("Leave entitlement created successfully.")
                    handleClose()
                },
                onError: () => toast.error("Failed to create leave entitlement."),
            } as any)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader className="px-5 py-4 border-b shrink-0">
                    <DialogTitle className="text-sm font-semibold">
                        {isEdit ? "Edit Leave Entitlement" : "Create Leave Entitlement"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-5 py-5 space-y-4 overflow-y-auto flex-1">
                        <p className="text-xs text-muted-foreground">
                            All fields with <span className="text-red-600">*</span> are required.
                        </p>

                        <div>
                            <label className="text-xs font-medium">
                                Leave Type <span className="text-red-600">*</span>
                            </label>
                            <Select
                                value={String(data.leave_type_id)}
                                onValueChange={(value) => setData("leave_type_id", value)}
                            >
                                <SelectTrigger className="text-sm mt-1 w-full">
                                    <SelectValue placeholder="Select a leave type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {leave_types.map((lt) => (
                                        <SelectItem key={lt.leave_type_id} value={String(lt.leave_type_id)}>
                                            {lt.leave_type_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.leave_type_id} />
                        </div>

                        <div>
                            <label className="text-xs font-medium">Description</label>
                            <Textarea
                                value={data.leave_entitlement_description}
                                onChange={(e) => setData("leave_entitlement_description", e.target.value)}
                                rows={3}
                                className="text-sm mt-1"
                                placeholder="The description is optional..."
                            />
                            <FieldError message={errors.leave_entitlement_description} />
                        </div>

                        <section className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-medium">
                                    Years of Service <span className="text-red-600">*</span>
                                </label>
                                <Input
                                    type="number"
                                    value={data.years_of_service}
                                    onChange={(e) => setData("years_of_service", Number(e.target.value))}
                                    className="text-sm mt-1"
                                    placeholder="e.g. 1"
                                />
                                <FieldError message={errors.years_of_service} />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Days Entitled <span className="text-red-600">*</span>
                                </label>
                                <Input
                                    type="number"
                                    value={data.days_entitled}
                                    onChange={(e) => setData("days_entitled", e.target.value)}
                                    className="text-sm mt-1"
                                    placeholder="e.g. 15.0"
                                />
                                <FieldError message={errors.days_entitled} />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Event Name
                                </label>
                                <Input
                                    type="text"
                                    value={data.event_type}
                                    onChange={(e) => setData("event_type", e.target.value)}
                                    className="text-sm mt-1"
                                    placeholder="e.g. Live Birth"
                                />
                                <FieldError message={errors.event_type} />
                            </div>
                        </section>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t bg-muted/30 shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? "Saving..." : isEdit ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LeaveEntitlementIndex({ leave_entitlements, leave_types }: Props) {
    const isMobile = useIsMobile()

    const [modalOpen, setModalOpen] = React.useState(false)
    const [editingLeaveEntitlement, setEditingLeaveEntitlement] = React.useState<LeaveEntitlement | null>(null)
    const [detailLeaveEntitlement, setDetailLeaveEntitlement] = React.useState<LeaveEntitlement | null>(null)

    function openCreate() {
        setEditingLeaveEntitlement(null)
        setModalOpen(true)
    }

    function openEdit(leaveEntitlement: LeaveEntitlement) {
        setEditingLeaveEntitlement(leaveEntitlement)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingLeaveEntitlement(null)
    }

    function handleRowClick(row: Row<LeaveEntitlement>) {
        if (isMobile) {
            setDetailLeaveEntitlement(row.original)
        }
    }

    const columns = getColumns({ onEdit: openEdit })

    return (
        <section className="space-y-4">
            <DataTable
                columns={columns}
                data={leave_entitlements}
                getRowId={(row) => String(row.leave_entitlement_id)}
                searchColumnId="leave_type_id"
                searchPlaceholder="Search by leave type..."
                onRowClick={isMobile ? handleRowClick : undefined}
                addButton={{
                    label: "Add Entitlement",
                    onClick: openCreate,
                }}
                bulkDelete={{
                    route: route("leave.leave-entitlement.bulk-destroy"),
                    entityName: "Leave Entitlement",
                    getId: (row) => (row as LeaveEntitlement).leave_entitlement_id,
                }}
            />

            {/* Mobile-only detail modal */}
            <MobileDetailModal
                leaveEntitlement={detailLeaveEntitlement}
                onClose={() => setDetailLeaveEntitlement(null)}
                onEdit={openEdit}
                onDeleted={() => setDetailLeaveEntitlement(null)}
            />

            {/* Create / Edit modal */}
            <LeaveEntitlementModal
                key={editingLeaveEntitlement?.leave_entitlement_id ?? "create"}
                open={modalOpen}
                editingLeaveEntitlement={editingLeaveEntitlement}
                onClose={closeModal}
                leave_types={leave_types}
            />
        </section>
    )
}