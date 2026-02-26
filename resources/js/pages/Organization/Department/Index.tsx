import { Head, useForm, usePage } from "@inertiajs/react"
import { Building2 } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { getColumns } from "@/components/Organization/Department/components/columns"
import { type Department } from "@/components/Organization/Department/data/schema"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    departments: Department[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Departments", href: "/organization/departments" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Department Modal ─────────────────────────────────────────────────────────

interface DepartmentModalProps {
    open: boolean
    editingDepartment: Department | null
    onClose: () => void
}

function DepartmentModal({ open, editingDepartment, onClose }: DepartmentModalProps) {
    const isEdit = editingDepartment !== null

    const { data, setData, post, put, processing, errors, reset } = useForm({
        department_name: editingDepartment?.department_name ?? "",
        department_acronym: editingDepartment?.department_acronym ?? "",
        department_description: editingDepartment?.department_description ?? "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("department.update", editingDepartment!.department_id), { onSuccess: handleClose })
        } else {
            post(route("department.store"), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Department" : "Create Department"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">
                        {/* Department Name + Acronym */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="department_name" className="block text-xs font-medium text-foreground mb-1.5">
                                    Department Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="department_name"
                                    value={data.department_name}
                                    onChange={(e) => setData("department_name", e.target.value)}
                                    placeholder="e.g. Human Resources"
                                    className="text-sm"
                                />
                                <FieldError message={errors.department_name} />
                            </div>
                            <div>
                                <label htmlFor="department_acronym" className="block text-xs font-medium text-foreground mb-1.5">
                                    Acronym <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="department_acronym"
                                    value={data.department_acronym}
                                    onChange={(e) => setData("department_acronym", e.target.value.toUpperCase())}
                                    placeholder="e.g. HR"
                                    className="text-sm font-mono"
                                    maxLength={10}
                                />
                                <FieldError message={errors.department_acronym} />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="department_description" className="block text-xs font-medium text-foreground mb-1.5">
                                Description
                            </label>
                            <Textarea
                                id="department_description"
                                value={data.department_description ?? ""}
                                onChange={(e) => setData("department_description", e.target.value)}
                                placeholder="Optional description of this department's responsibilities..."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.department_description} />
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Department" : "Create Department"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentIndex({ departments }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen] = useState(false)
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

    function openCreate() {
        setEditingDepartment(null)
        setModalOpen(true)
    }

    function openEdit(department: Department) {
        setEditingDepartment(department)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingDepartment(null)
    }

    // Delete is handled inside DataTableRowActions via deleteAction() in columns.tsx
    const columns = getColumns({ onEdit: openEdit, onDelete: () => {} })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Departments
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {departments.length} department{departments.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={departments}
                    getRowId={(row) => String(row.department_id)}
                    searchPlaceholder="Search departments..."
                    searchColumnId="department_name"
                    addButton={{
                        label: "Create Department",
                        onClick: openCreate,
                    }}
                    bulkDelete={{
                        route: route("department.bulk-destroy"),
                        entityName: "Department",
                        getId: (row) => (row as Department).department_id,
                    }}
                />
            </div>

            <DepartmentModal
                key={editingDepartment?.department_id ?? "create"}
                open={modalOpen}
                editingDepartment={editingDepartment}
                onClose={closeModal}
            />
        </AppLayout>
    )
}