import { Head, useForm, usePage } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import { Building2, GitBranch, LampDesk, LayoutGrid, UserPlus, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { route } from "ziggy-js"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import { getColumns } from "@/pages/Organization/Department/components/columns"
import {
    type Department,
    type DepartmentDivision,
} from "@/pages/Organization/Department/data/schema"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    departments: Department[]
    totalDepartments: number
    totalDivisions: number
}

interface UnlinkedEmployee {
    employee_id: number
    full_name: string
    work_id: string | null
    position_name: string | null
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

// ─── Divisions Dialog ─────────────────────────────────────────────────────────

interface DivisionsDialogProps {
    open: boolean
    department: Department | null
    onClose: () => void
    onAssign: (department: Department) => void
}

function DivisionsDialog({ open, department, onClose, onAssign }: DivisionsDialogProps) {
    const divisions: DepartmentDivision[] = department?.divisions ?? []

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <LampDesk className="w-4 h-4 text-primary" />
                        <span>{department?.department_name}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {divisions.length} division{divisions.length !== 1 ? "s" : ""}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 min-h-[180px] max-h-[400px] overflow-y-auto">
                    {divisions.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <GitBranch className="w-8 h-8 opacity-30" />
                            <span>No divisions under this department.</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {divisions.map((div) => (
                                <li
                                    key={div.division_id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <LampDesk className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-sm text-foreground">
                                        {div.division_name}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Footer with Assign Employees button ── */}
                <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => {
                            onClose()
                            if (department) onAssign(department)
                        }}
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign Employees
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Assign Employees Dialog ──────────────────────────────────────────────────

interface AssignEmployeesDialogProps {
    open: boolean
    department: Department | null
    onClose: () => void
}

function AssignEmployeesDialog({ open, department, onClose }: AssignEmployeesDialogProps) {
    const [employees, setEmployees] = useState<UnlinkedEmployee[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<number[]>([])
    const [search, setSearch] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // Fetch unlinked employees whenever the dialog opens
    useEffect(() => {
        if (!open) {
            setEmployees([])
            setSelected([])
            setSearch("")
            return
        }

        let cancelled = false
        setLoading(true)
        setSelected([])
        setSearch("")
        setEmployees([])

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content

        fetch(route("department.unlinked-employees"), {
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
            },
        })
            .then(async (r) => {
                if (cancelled) return
                const text = await r.text()
                let data: UnlinkedEmployee[]
                try {
                    data = JSON.parse(text)
                } catch {
                    if (!cancelled) toast("All employees are linked to a department.", {
                        style: {
                            background: "hsl(var(--muted))",
                            color: "hsl(var(--muted-foreground))",
                            border: "1px solid hsl(var(--border))",
                        },
                    })
                    return
                }
                if (!Array.isArray(data)) {
                    const msg = (data as unknown as { error?: string }).error
                    throw new Error(msg ?? `Unexpected response: ${text.slice(0, 100)}`)
                }
                if (!cancelled) {
                    setEmployees(data)
                    if (data.length === 0) {
                        toast("All employees are linked to a department.", {
                            style: {
                                background: "hsl(var(--muted))",
                                color: "hsl(var(--muted-foreground))",
                                border: "1px solid hsl(var(--border))",
                            },
                        })
                    }
                }
            })
            .catch((err) => {
                if (cancelled) return
                console.error("unlinkedEmployees fetch error:", err)
                toast.error("Failed to load employees", {
                    description: "Something went wrong. Please try again.",
                })
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [open])

    const filtered = employees.filter(
        (e) =>
            e.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (e.work_id ?? "").toLowerCase().includes(search.toLowerCase()),
    )

    function toggleEmployee(id: number) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        )
    }

    function toggleAll() {
        setSelected(
            selected.length === filtered.length ? [] : filtered.map((e) => e.employee_id),
        )
    }

    function handleSubmit() {
        if (!department || selected.length === 0) return
        setSubmitting(true)

        router.post(
            route("department.attach-employees", department.department_id),
            { employee_ids: selected },
            {
                onSuccess: () => {
                    toast.success(
                        `${selected.length} employee${selected.length !== 1 ? "s" : ""} assigned`,
                        { description: `Linked to ${department.department_name} successfully.` },
                    )
                    onClose()
                },
                onError: () => {
                    toast.error("Failed to assign employees", {
                        description: "Something went wrong. Please try again.",
                    })
                },
                onFinish: () => setSubmitting(false),
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UserPlus className="w-4 h-4 text-primary" />
                        Assign Employees
                        {department && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {department.department_name}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Search ── */}
                <div className="px-5 pt-4 pb-2">
                    <Input
                        placeholder="Search by name or work ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="text-sm h-8"
                    />
                </div>

                {/* ── Employee List ── */}
                <div className="px-5 py-2 min-h-[220px] max-h-[380px] overflow-y-auto">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                            Loading employees…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-8 h-8 opacity-30" />
                            <span>
                                {search
                                    ? "No employees match your search."
                                    : "All employees are already linked to a department."}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Select-all row */}
                            <div
                                className="flex items-center gap-3 py-2 mb-1 border-b border-border cursor-pointer select-none"
                                onClick={toggleAll}
                            >
                                <Checkbox
                                    checked={
                                        filtered.length > 0 &&
                                        selected.length === filtered.length
                                            ? true
                                            : selected.length > 0
                                              ? "indeterminate"
                                              : false
                                    }
                                    onCheckedChange={toggleAll}
                                    onClick={(e) => e.stopPropagation()}
                                    className="translate-y-0.5"
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Select all ({filtered.length})
                                </span>
                            </div>

                            <ul className="divide-y divide-border">
                                {filtered.map((emp) => (
                                    <li
                                        key={emp.employee_id}
                                        className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/30 rounded-sm px-1 -mx-1 select-none"
                                        onClick={() => toggleEmployee(emp.employee_id)}
                                    >
                                        <Checkbox
                                            checked={selected.includes(emp.employee_id)}
                                            onCheckedChange={() =>
                                                toggleEmployee(emp.employee_id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            className="translate-y-0.5 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {emp.full_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {emp.work_id ?? "—"}
                                                {emp.position_name && (
                                                    <> · {emp.position_name}</>
                                                )}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30" showCloseButton>
                    {selected.length > 0 && (
                        <span className="text-xs text-muted-foreground self-center">
                            {selected.length} employee{selected.length !== 1 ? "s" : ""} selected
                        </span>
                    )}
                    <Button
                        size="sm"
                        disabled={selected.length === 0 || submitting}
                        onClick={handleSubmit}
                        className="text-xs ml-auto"
                    >
                        {submitting
                            ? "Assigning…"
                            : selected.length > 0
                              ? `Assign (${selected.length})`
                              : "Assign"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
            put(route("department.update", editingDepartment!.department_id), {
                onSuccess: () => {
                    toast.success("Department updated", {
                        description: `"${data.department_name}" has been updated successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to update department", {
                        description: "Please check the form for errors and try again.",
                    })
                },
            })
        } else {
            post(route("department.store"), {
                onSuccess: () => {
                    toast.success("Department created", {
                        description: `"${data.department_name}" has been created successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to create department", {
                        description: "Please check the form for errors and try again.",
                    })
                },
            })
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="department_name"
                                    className="block text-xs font-medium text-foreground mb-1.5"
                                >
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
                                <label
                                    htmlFor="department_acronym"
                                    className="block text-xs font-medium text-foreground mb-1.5"
                                >
                                    Acronym <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="department_acronym"
                                    value={data.department_acronym}
                                    onChange={(e) =>
                                        setData("department_acronym", e.target.value.toUpperCase())
                                    }
                                    placeholder="e.g. HR"
                                    className="text-sm font-mono"
                                    maxLength={10}
                                />
                                <FieldError message={errors.department_acronym} />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="department_description"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Description
                            </label>
                            <Textarea
                                id="department_description"
                                value={data.department_description ?? ""}
                                onChange={(e) =>
                                    setData("department_description", e.target.value)
                                }
                                placeholder="Optional description of this department's responsibilities..."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.department_description} />
                        </div>
                    </div>

                    <DialogFooter
                        className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30"
                        showCloseButton
                    >
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing
                                ? "Saving…"
                                : isEdit
                                  ? "Update Department"
                                  : "Create Department"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentIndex({
    departments,
    totalDepartments,
    totalDivisions,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    // ── Department modal state ──
    const [modalOpen, setModalOpen] = useState(false)
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

    // ── Divisions dialog state ──
    const [divisionsDialogOpen, setDivisionsDialogOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

    // ── Assign employees dialog state ──
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [assignTargetDepartment, setAssignTargetDepartment] =
        useState<Department | null>(null)

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

    function openDivisions(department: Department) {
        setSelectedDepartment(department)
        setDivisionsDialogOpen(true)
    }

    function closeDivisions() {
        setDivisionsDialogOpen(false)
        setSelectedDepartment(null)
    }

    function openAssign(department: Department) {
        setAssignTargetDepartment(department)
        setAssignDialogOpen(true)
    }

    function closeAssign() {
        setAssignDialogOpen(false)
        setAssignTargetDepartment(null)
    }

    function handleDelete(department: Department) {
        toast.success("Department deleted", {
            description: `"${department.department_name}" has been removed.`,
        })
    }

    const columns = getColumns({ onEdit: openEdit, onDelete: handleDelete, onAssign: openAssign })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="max-w-200 w-full h-fit">
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <StatCard
                            title="Total Departments"
                            value={totalDepartments}
                            description="All registered departments"
                            icon={<Building2 className="size-4 text-primary" />}
                        />
                        <StatCard
                            title="Total Divisions"
                            value={totalDivisions}
                            description="Divisions across all departments"
                            icon={<LayoutGrid className="size-4 text-primary" />}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={departments}
                    getRowId={(row) => String(row.department_id)}
                    onRowClick={(row) => openDivisions(row.original)}
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
                        onSuccess: (count: number) => {
                            toast.success(
                                `${count} department${count !== 1 ? "s" : ""} deleted`,
                                {
                                    description:
                                        "The selected departments have been permanently removed.",
                                },
                            )
                        },
                        onError: () => {
                            toast.error("Bulk delete failed", {
                                description:
                                    "Some departments could not be deleted. Please try again.",
                            })
                        },
                    }}
                />
            </div>

            {/* ── Department Create/Edit Modal ── */}
            <DepartmentModal
                key={editingDepartment?.department_id ?? "create"}
                open={modalOpen}
                editingDepartment={editingDepartment}
                onClose={closeModal}
            />

            {/* ── Divisions Dialog ── */}
            <DivisionsDialog
                open={divisionsDialogOpen}
                department={selectedDepartment}
                onClose={closeDivisions}
                onAssign={openAssign}
            />

            {/* ── Assign Employees Dialog ── */}
            <AssignEmployeesDialog
                open={assignDialogOpen}
                department={assignTargetDepartment}
                onClose={closeAssign}
            />
        </AppLayout>
    )
}