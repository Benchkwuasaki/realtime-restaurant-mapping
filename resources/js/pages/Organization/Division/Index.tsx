import { Head, useForm } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import { BrickWall, Building2, Layers, LayoutGrid, UserPlus, Users } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import { getColumns } from "@/pages/Organization/Division/components/columns"
import {
    type Department,
    type Division,
    type DivisionUnit,
} from "@/pages/Organization/Division/data/schema"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    divisions: Division[]
    departments: Department[]
    totalDivisions: number
    totalUnits: number
    totalDepartments: number
}

interface UnlinkedEmployee {
    employee_id: number
    full_name: string
    work_id: string | null
    position_name: string | null
    department_id: number | null
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Divisions", href: "/organization/division" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Units Dialog ─────────────────────────────────────────────────────────────

interface UnitsDialogProps {
    open: boolean
    division: Division | null
    onClose: () => void
    onAssign: (division: Division) => void
}

function UnitsDialog({ open, division, onClose, onAssign }: UnitsDialogProps) {
    const units: DivisionUnit[] = division?.units ?? []

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <BrickWall className="w-4 h-4 text-primary" />
                        <span>{division?.division_name}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {units.length} unit{units.length !== 1 ? "s" : ""}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 min-h-[180px] max-h-[400px] overflow-y-auto">
                    {units.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <BrickWall className="w-8 h-8 opacity-30" />
                            <span>No units under this division.</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {units.map((unit) => (
                                <li
                                    key={unit.unit_id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <Layers className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-sm text-foreground">
                                        {unit.unit_name}
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
                            if (division) onAssign(division)
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
    division: Division | null
    onClose: () => void
}

function AssignEmployeesDialog({ open, division, onClose }: AssignEmployeesDialogProps) {
    const [employees, setEmployees] = useState<UnlinkedEmployee[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<number[]>([])
    const [search, setSearch] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) {
            setEmployees([])
            setSelected([])
            setSearch("")
            return
        }

        if (!division) return

        let cancelled = false
        setLoading(true)
        setSelected([])
        setSearch("")
        setEmployees([])

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content

        fetch(route("division.unlinked-employees", division.division_id), {
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
                    if (!cancelled) toast("No eligible employees found for this division.", {
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
                        toast("No eligible employees found for this division.", {
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
                console.error("division unlinkedEmployees fetch error:", err)
                toast.error("Failed to load employees", {
                    description: "Something went wrong. Please try again.",
                })
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [open, division?.division_id])

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
        if (!division || selected.length === 0) return
        setSubmitting(true)

        router.post(
            route("division.attach-employees", division.division_id),
            { employee_ids: selected },
            {
                onSuccess: () => {
                    toast.success(
                        `${selected.length} employee${selected.length !== 1 ? "s" : ""} assigned`,
                        { description: `Linked to ${division.division_name} successfully.` },
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

    // Separate employees into two groups for display clarity
    const unlinkedFromDept = filtered.filter((e) => e.department_id === null)
    const sameDept = filtered.filter((e) => e.department_id !== null)

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UserPlus className="w-4 h-4 text-primary" />
                        Assign Employees
                        {division && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {division.division_name}
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
                                    : "No eligible employees found for this division."}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* ── Select-all row ── */}
                            <div
                                className="flex items-center gap-3 py-2 mb-1 border-b border-border cursor-pointer select-none"
                                onClick={toggleAll}
                            >
                                <Checkbox
                                    checked={
                                        filtered.length > 0 && selected.length === filtered.length
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

                            {/* ── Same-department employees ── */}
                            {sameDept.length > 0 && (
                                <>
                                    {unlinkedFromDept.length > 0 && (
                                        <p className="text-xs font-medium text-muted-foreground mt-2 mb-1 px-1">
                                            Same department — no division yet
                                        </p>
                                    )}
                                    <ul className="divide-y divide-border">
                                        {sameDept.map((emp) => (
                                            <EmployeeRow
                                                key={emp.employee_id}
                                                emp={emp}
                                                selected={selected}
                                                onToggle={toggleEmployee}
                                            />
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* ── Unlinked employees (no department) ── */}
                            {unlinkedFromDept.length > 0 && (
                                <>
                                    <p className="text-xs font-medium text-muted-foreground mt-3 mb-1 px-1">
                                        No department linked
                                        <span className="ml-1 font-normal text-muted-foreground/70">
                                            — will inherit {division?.department?.department_name ?? "this department"}
                                        </span>
                                    </p>
                                    <ul className="divide-y divide-border">
                                        {unlinkedFromDept.map((emp) => (
                                            <EmployeeRow
                                                key={emp.employee_id}
                                                emp={emp}
                                                selected={selected}
                                                onToggle={toggleEmployee}
                                            />
                                        ))}
                                    </ul>
                                </>
                            )}
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

// ─── Employee Row ─────────────────────────────────────────────────────────────

interface EmployeeRowProps {
    emp: UnlinkedEmployee
    selected: number[]
    onToggle: (id: number) => void
}

function EmployeeRow({ emp, selected, onToggle }: EmployeeRowProps) {
    return (
        <li
            className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/30 rounded-sm px-1 -mx-1 select-none"
            onClick={() => onToggle(emp.employee_id)}
        >
            <Checkbox
                checked={selected.includes(emp.employee_id)}
                onCheckedChange={() => onToggle(emp.employee_id)}
                onClick={(e) => e.stopPropagation()}
                className="translate-y-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {emp.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {emp.work_id ?? "—"}
                    {emp.position_name && <> · {emp.position_name}</>}
                </p>
            </div>
        </li>
    )
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
        division_name: editingDivision?.division_name ?? "",
        division_acronym: editingDivision?.division_acronym ?? "",
        division_description: editingDivision?.division_description ?? "",
        department_id: editingDivision?.department_id
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
            put(route("division.update", editingDivision!.division_id), {
                onSuccess: () => {
                    toast.success("Division updated", {
                        description: `"${data.division_name}" has been updated successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to update division", {
                        description: "Please check the form for errors and try again.",
                    })
                },
            })
        } else {
            post(route("division.store"), {
                onSuccess: () => {
                    toast.success("Division created", {
                        description: `"${data.division_name}" has been created successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to create division", {
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
                        {isEdit ? "Edit Division" : "Create Division"}
                    </DialogTitle>
                </DialogHeader>

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

                    <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30" showCloseButton>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Division" : "Create Division"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivisionIndex({ divisions, departments, totalDivisions, totalUnits, totalDepartments }: Props) {
    // ── Division modal state ──
    const [modalOpen, setModalOpen] = useState(false)
    const [editingDivision, setEditingDivision] = useState<Division | null>(null)

    // ── Units dialog state ──
    const [unitsDialogOpen, setUnitsDialogOpen] = useState(false)
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)

    // ── Assign employees dialog state ──
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [assignTargetDivision, setAssignTargetDivision] = useState<Division | null>(null)

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

    function openUnits(division: Division) {
        setSelectedDivision(division)
        setUnitsDialogOpen(true)
    }

    function closeUnits() {
        setUnitsDialogOpen(false)
        setSelectedDivision(null)
    }

    function openAssign(division: Division) {
        setAssignTargetDivision(division)
        setAssignDialogOpen(true)
    }

    function closeAssign() {
        setAssignDialogOpen(false)
        setAssignTargetDivision(null)
    }

    const columns = getColumns({ onEdit: openEdit, onAssign: openAssign })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Divisions" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-4">
                <div className="w-full max-w-300">
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Total Divisions"
                            value={totalDivisions}
                            description="All registered divisions"
                            icon={<Building2 className="size-4 text-primary" />}
                        />
                        <StatCard
                            title="Total Departments"
                            value={totalDepartments}
                            description="Departments with divisions"
                            icon={<LayoutGrid className="size-4 text-primary" />}
                        />
                        <StatCard
                            title="Total Units"
                            value={totalUnits}
                            description="Units across all divisions"
                            icon={<Layers className="size-4 text-primary" />}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={divisions}
                    getRowId={(row) => String(row.division_id)}
                    onRowClick={(row) => openUnits(row.original)}
                    searchColumnId="division_name"
                    searchPlaceholder="Search divisions..."
                    filters={[
                        {
                            columnId: "department",
                            title: "Department",
                            options: departments.map((d) => ({
                                value: String(d.department_id),
                                label: d.department_name,
                            })),
                        },
                    ]}
                    addButton={{
                        label: "Create Division",
                        onClick: openCreate,
                    }}
                    bulkDelete={{
                        route: route("division.bulk-destroy"),
                        entityName: "Division",
                        getId: (row) => (row as Division).division_id,
                    }}
                />
            </div>

            {/* ── Division Create/Edit Modal ── */}
            <DivisionModal
                key={editingDivision?.division_id ?? "create"}
                open={modalOpen}
                editingDivision={editingDivision}
                departments={departments}
                onClose={closeModal}
            />

            {/* ── Units Dialog ── */}
            <UnitsDialog
                open={unitsDialogOpen}
                division={selectedDivision}
                onClose={closeUnits}
                onAssign={openAssign}
            />

            {/* ── Assign Employees Dialog ── */}
            <AssignEmployeesDialog
                open={assignDialogOpen}
                division={assignTargetDivision}
                onClose={closeAssign}
            />
        </AppLayout>
    )
}