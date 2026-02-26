import { Head, router, useForm, usePage } from "@inertiajs/react"
import { Building2 } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { getColumns } from "@/components/Organization/Division/components/columns"
import { DataTable } from "@/components/Organization/Division/components/data-table"
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
import { type Department, type Division } from "@/components/Organization/Division/data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    divisions: Division[]
    departments: Department[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Divisions", href: "/organization/division" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Division Modal ───────────────────────────────────────────────────────────

interface DivisionModalProps {
    open: boolean
    editingDivision: Division | null
    departments: Department[]
    onClose: () => void
}

function DivisionModal({ open, editingDivision, departments, onClose }: DivisionModalProps) {
    const isEdit = editingDivision !== null

    const { data, setData, post, put, processing, errors, reset } = useForm({
        division_name:        editingDivision?.division_name        ?? "",
        division_acronym:     editingDivision?.division_acronym     ?? "",
        division_description: editingDivision?.division_description ?? "",
        department_id:        editingDivision?.department_id
                                ? String(editingDivision.department_id)
                                : "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("division.update", editingDivision!.division_id), { onSuccess: handleClose })
        } else {
            post(route("division.store"), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">

                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Division" : "Create Division"}
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">

                        {/* Department */}
                        <div>
                            <label htmlFor="department_id" className="block text-xs font-medium text-foreground mb-1.5">
                                Department <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.department_id}
                                onValueChange={(v) => setData("department_id", v)}
                            >
                                <SelectTrigger id="department_id" className="text-sm">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((d) => (
                                        <SelectItem key={d.department_id} value={String(d.department_id)}>
                                            {d.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.department_id} />
                        </div>

                        {/* Division Name + Acronym */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="division_name" className="block text-xs font-medium text-foreground mb-1.5">
                                    Division Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="division_name"
                                    value={data.division_name}
                                    onChange={(e) => setData("division_name", e.target.value)}
                                    placeholder="e.g. Information Technology"
                                    className="text-sm"
                                />
                                <FieldError message={errors.division_name} />
                            </div>
                            <div>
                                <label htmlFor="division_acronym" className="block text-xs font-medium text-foreground mb-1.5">
                                    Acronym <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="division_acronym"
                                    value={data.division_acronym}
                                    onChange={(e) => setData("division_acronym", e.target.value.toUpperCase())}
                                    placeholder="e.g. IT"
                                    className="text-sm font-mono"
                                    maxLength={10}
                                />
                                <FieldError message={errors.division_acronym} />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="division_description" className="block text-xs font-medium text-foreground mb-1.5">
                                Description
                            </label>
                            <Textarea
                                id="division_description"
                                value={data.division_description ?? ""}
                                onChange={(e) => setData("division_description", e.target.value)}
                                placeholder="Optional description of this division's responsibilities..."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.division_description} />
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
                            {processing ? "Saving…" : isEdit ? "Update Division" : "Create Division"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Alert Dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
    division: Division | null
    onClose: () => void
}

function DeleteAlertDialog({ division, onClose }: DeleteDialogProps) {
    function handleConfirm() {
        if (division) {
            router.delete(route("division.destroy", division.division_id), {
                onFinish: onClose,
            })
        }
    }

    return (
        <AlertDialog open={division !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Division</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-foreground">{division?.division_name}</span>?
                        {" "}This will also affect any units assigned to this division.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleConfirm}>
                        Delete Division
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivisionIndex({ divisions, departments }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen]               = useState(false)
    const [editingDivision, setEditingDivision]   = useState<Division | null>(null)
    const [deletingDivision, setDeletingDivision] = useState<Division | null>(null)

    function openCreate() {
        setEditingDivision(null)
        setModalOpen(true)
    }

    function openEdit(division: Division) {
        setEditingDivision(division)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingDivision(null)
    }

    const columns = getColumns({ onEdit: openEdit, onDelete: setDeletingDivision })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Divisions" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Divisions
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {divisions.length} division{divisions.length !== 1 ? "s" : ""} across {departments.length} department{departments.length !== 1 ? "s" : ""}
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
                    data={divisions}
                    departments={departments}
                    onCreateDivision={openCreate}
                />
            </div>

            {/* Create / Edit modal */}
            <DivisionModal
                open={modalOpen}
                editingDivision={editingDivision}
                departments={departments}
                onClose={closeModal}
            />

            {/* Delete confirmation */}
            <DeleteAlertDialog
                division={deletingDivision}
                onClose={() => setDeletingDivision(null)}
            />
        </AppLayout>
    )
}