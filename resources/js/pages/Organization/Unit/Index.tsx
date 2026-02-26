import { Head, router, useForm, usePage } from "@inertiajs/react"
import { Building2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { getColumns } from "@/components/Organization/Unit/components/columns"
import { DataTable } from "@/components/Organization/Unit/components/data-table"
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { type Division, type Unit } from "@/components/Organization/Unit/data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    units: Unit[]
    divisions: Division[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Units", href: "/unit" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Unit Modal ───────────────────────────────────────────────────────────────

interface UnitModalProps {
    open: boolean
    editingUnit: Unit | null
    divisions: Division[]
    onClose: () => void
}

function UnitModal({ open, editingUnit, divisions, onClose }: UnitModalProps) {
    const isEdit = editingUnit !== null

    const { data, setData, post, put, processing, errors, reset } = useForm({
        unit_name:        editingUnit?.unit_name        ?? "",
        unit_acronym:     editingUnit?.unit_acronym     ?? "",
        unit_description: editingUnit?.unit_description ?? "",
        division_id:      editingUnit?.division_id      ? String(editingUnit.division_id) : "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("unit.update", editingUnit!.unit_id), { onSuccess: handleClose })
        } else {
            post(route("unit.store"), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">

                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Unit" : "Create Unit"}
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">

                        {/* Division */}
                        <div>
                            <label htmlFor="division_id" className="block text-xs font-medium text-foreground mb-1.5">
                                Division <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.division_id}
                                onValueChange={(v) => setData("division_id", v)}
                            >
                                <SelectTrigger id="division_id" className="text-sm">
                                    <SelectValue placeholder="Select division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions.map((d) => (
                                        <SelectItem key={d.division_id} value={String(d.division_id)}>
                                            {d.division_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.division_id} />
                        </div>

                        {/* Unit Name + Acronym */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="unit_name" className="block text-xs font-medium text-foreground mb-1.5">
                                    Unit Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="unit_name"
                                    value={data.unit_name}
                                    onChange={(e) => setData("unit_name", e.target.value)}
                                    placeholder="e.g. Information Technology"
                                    className="text-sm"
                                />
                                <FieldError message={errors.unit_name} />
                            </div>
                            <div>
                                <label htmlFor="unit_acronym" className="block text-xs font-medium text-foreground mb-1.5">
                                    Acronym <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="unit_acronym"
                                    value={data.unit_acronym}
                                    onChange={(e) => setData("unit_acronym", e.target.value.toUpperCase())}
                                    placeholder="e.g. IT"
                                    className="text-sm font-mono"
                                    maxLength={10}
                                />
                                <FieldError message={errors.unit_acronym} />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="unit_description" className="block text-xs font-medium text-foreground mb-1.5">
                                Description
                            </label>
                            <Textarea
                                id="unit_description"
                                value={data.unit_description ?? ""}
                                onChange={(e) => setData("unit_description", e.target.value)}
                                placeholder="Optional description of this unit's responsibilities..."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.unit_description} />
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Unit" : "Create Unit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Alert Dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
    unit: Unit | null
    onClose: () => void
}

function DeleteAlertDialog({ unit, onClose }: DeleteDialogProps) {
    function handleConfirm() {
        if (unit) {
            router.delete(route("unit.destroy", unit.unit_id), {
                onFinish: onClose,
            })
        }
    }

    return (
        <AlertDialog open={unit !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-foreground">{unit?.unit_name}</span>?
                        {" "}This will also affect any positions assigned to this unit.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleConfirm}>
                        Delete Unit
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UnitIndex({ units, divisions }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen]         = useState(false)
    const [editingUnit, setEditingUnit]     = useState<Unit | null>(null)
    const [deletingUnit, setDeletingUnit]   = useState<Unit | null>(null)

    function openCreate() {
        setEditingUnit(null)
        setModalOpen(true)
    }

    function openEdit(unit: Unit) {
        setEditingUnit(unit)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingUnit(null)
    }

    const columns = getColumns({ onEdit: openEdit, onDelete: setDeletingUnit })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Units" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Units
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {units.length} unit{units.length !== 1 ? "s" : ""} across {divisions.length} division{divisions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Flash */}
                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={units}
                    divisions={divisions}
                    onCreateUnit={openCreate}
                />
            </div>

            {/* Create / Edit modal */}
            <UnitModal
                open={modalOpen}
                editingUnit={editingUnit}
                divisions={divisions}
                onClose={closeModal}
            />

            {/* Delete confirmation */}
            <DeleteAlertDialog
                unit={deletingUnit}
                onClose={() => setDeletingUnit(null)}
            />
        </AppLayout>
    )
}