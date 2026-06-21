import { Head, useForm } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import { Building2, Puzzle, LayoutGrid, UserPlus, Users } from "lucide-react"
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
import { getColumns } from "@/pages/Organization/Unit/components/columns"
import {
    type Division,
    type Unit,
    type UnitPosition,
} from "@/pages/Organization/Unit/data/schema"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    units: Unit[]
    divisions: Division[]
    totalUnits: number
    totalDivisions: number
    totalPositions: number
}

interface UnlinkedEmployee {
    employee_id: number
    full_name: string
    work_id: string | null
    position_name: string | null
    department_id: number | null
    division_id: number | null
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Units", href: "/organization/units" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Positions Dialog ─────────────────────────────────────────────────────────

interface PositionsDialogProps {
    open: boolean
    unit: Unit | null
    onClose: () => void
    onAssign: (unit: Unit) => void
}

function PositionsDialog({ open, unit, onClose, onAssign }: PositionsDialogProps) {
    const positions: UnitPosition[] = unit?.positions ?? []

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Puzzle className="w-4 h-4 text-primary" />
                        <span>{unit?.unit_name}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {positions.length} position{positions.length !== 1 ? "s" : ""}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 min-h-[180px] max-h-[400px] overflow-y-auto">
                    {positions.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Puzzle className="w-8 h-8 opacity-30" />
                            <span>No positions under this unit.</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {positions.map((pos) => (
                                <li
                                    key={pos.position_id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <Puzzle className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-sm text-foreground">
                                        {pos.position_name}
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
                            if (unit) onAssign(unit)
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

// ─── Assign Employees Dialog ──────────────────────────────────────────────────

interface AssignEmployeesDialogProps {
    open: boolean
    unit: Unit | null
    onClose: () => void
}

function AssignEmployeesDialog({ open, unit, onClose }: AssignEmployeesDialogProps) {
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

        if (!unit) return

        let cancelled = false
        setLoading(true)
        setSelected([])
        setSearch("")
        setEmployees([])

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content

        fetch(route("unit.unlinked-employees", unit.unit_id), {
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
                    if (!cancelled) toast("No eligible employees found for this unit.", {
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
                        toast("No eligible employees found for this unit.", {
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
                console.error("unit unlinkedEmployees fetch error:", err)
                toast.error("Failed to load employees", {
                    description: "Something went wrong. Please try again.",
                })
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [open, unit?.unit_id])

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
        if (!unit || selected.length === 0) return
        setSubmitting(true)

        router.post(
            route("unit.attach-employees", unit.unit_id),
            { employee_ids: selected },
            {
                onSuccess: () => {
                    toast.success(
                        `${selected.length} employee${selected.length !== 1 ? "s" : ""} assigned`,
                        { description: `Linked to ${unit.unit_name} successfully.` },
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

    // ── Group employees by their link status ──────────────────────────────────
    // Group 1: same division, no unit yet
    const sameDivision = filtered.filter(
        (e) => e.division_id !== null,
    )
    // Group 2: no division (and therefore no department, or same dept but no division)
    const noDivision = filtered.filter(
        (e) => e.division_id === null && e.department_id !== null,
    )
    // Group 3: fully unlinked (no department at all)
    const fullyUnlinked = filtered.filter(
        (e) => e.department_id === null,
    )

    const divisionName = unit?.division?.division_name ?? "this division"
    const departmentName = unit?.division?.department?.department_name ?? "this department"

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UserPlus className="w-4 h-4 text-primary" />
                        Assign Employees
                        {unit && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {unit.unit_name}
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
                                    : "No eligible employees found for this unit."}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* ── Select-all ── */}
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

                            {/* ── Group 1: same division, no unit ── */}
                            {sameDivision.length > 0 && (
                                <>
                                    {(noDivision.length > 0 || fullyUnlinked.length > 0) && (
                                        <p className="text-xs font-medium text-muted-foreground mt-2 mb-1 px-1">
                                            Same division — no unit yet
                                        </p>
                                    )}
                                    <ul className="divide-y divide-border">
                                        {sameDivision.map((emp) => (
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

                            {/* ── Group 2: same dept, no division ── */}
                            {noDivision.length > 0 && (
                                <>
                                    <p className="text-xs font-medium text-muted-foreground mt-3 mb-1 px-1">
                                        No division linked
                                        <span className="ml-1 font-normal text-muted-foreground/70">
                                            — will inherit {divisionName}
                                        </span>
                                    </p>
                                    <ul className="divide-y divide-border">
                                        {noDivision.map((emp) => (
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

                            {/* ── Group 3: fully unlinked ── */}
                            {fullyUnlinked.length > 0 && (
                                <>
                                    <p className="text-xs font-medium text-muted-foreground mt-3 mb-1 px-1">
                                        No department linked
                                        <span className="ml-1 font-normal text-muted-foreground/70">
                                            — will inherit {departmentName} &amp; {divisionName}
                                        </span>
                                    </p>
                                    <ul className="divide-y divide-border">
                                        {fullyUnlinked.map((emp) => (
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
        unit_name: editingUnit?.unit_name ?? "",
        unit_acronym: editingUnit?.unit_acronym ?? "",
        unit_description: editingUnit?.unit_description ?? "",
        division_id: editingUnit?.division_id ? String(editingUnit.division_id) : "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("unit.update", editingUnit!.unit_id), {
                onSuccess: () => {
                    toast.success("Unit updated", {
                        description: `"${data.unit_name}" has been updated successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to update unit", {
                        description: "Please check the form for errors and try again.",
                    })
                },
            })
        } else {
            post(route("unit.store"), {
                onSuccess: () => {
                    toast.success("Unit created", {
                        description: `"${data.unit_name}" has been created successfully.`,
                    })
                    handleClose()
                },
                onError: () => {
                    toast.error("Failed to create unit", {
                        description: "Please check the form for errors and try again.",
                    })
                },
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-2 gap-0 overflow-hidden w-md sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Unit" : "Create Unit"}
                    </DialogTitle>
                </DialogHeader>

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
                                    placeholder="e.g. Budget Unit"
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
                                    placeholder="e.g. BU"
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

                    <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30" showCloseButton>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Unit" : "Create Unit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UnitIndex({ units, divisions, totalUnits, totalDivisions, totalPositions }: Props) {
    // ── Unit modal state ──
    const [modalOpen, setModalOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

    // ── Positions dialog state ──
    const [positionsDialogOpen, setPositionsDialogOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

    // ── Assign employees dialog state ──
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [assignTargetUnit, setAssignTargetUnit] = useState<Unit | null>(null)

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

    function openPositions(unit: Unit) {
        setSelectedUnit(unit)
        setPositionsDialogOpen(true)
    }

    function closePositions() {
        setPositionsDialogOpen(false)
        setSelectedUnit(null)
    }

    function openAssign(unit: Unit) {
        setAssignTargetUnit(unit)
        setAssignDialogOpen(true)
    }

    function closeAssign() {
        setAssignDialogOpen(false)
        setAssignTargetUnit(null)
    }

    const columns = getColumns({ onEdit: openEdit, onAssign: openAssign })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Units" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="w-full max-w-300 h-fit">
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard title="Total Units" value={totalUnits} description="All registered units" icon={<Building2 className="size-4 text-primary" />} />
                        <StatCard title="Total Divisions" value={totalDivisions} description="Divisions with units" icon={<LayoutGrid className="size-4 text-primary" />} />
                        <StatCard title="Total Positions" value={totalPositions} description="Positions across all units" icon={<Puzzle className="size-4 text-primary" />} />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={units}
                    getRowId={(row) => String(row.unit_id)}
                    onRowClick={(row) => openPositions(row.original)}
                    searchColumnId="unit_name"
                    searchPlaceholder="Search units..."
                    filters={[
                        {
                            columnId: "division_name",
                            title: "Division",
                            options: Array.from(
                                new Map(
                                    divisions.map((d) => [
                                        d.division_name,
                                        { value: d.division_name, label: d.division_name },
                                    ])
                                ).values()
                            ),
                        },
                    ]}
                    addButton={{
                        label: "Create Unit",
                        onClick: openCreate,
                    }}
                    bulkDelete={{
                        route: route("unit.bulk-destroy"),
                        entityName: "Unit",
                        getId: (row) => (row as Unit).unit_id,
                    }}
                />
            </div>

            {/* ── Unit Create/Edit Modal ── */}
            <UnitModal
                key={editingUnit?.unit_id ?? "create"}
                open={modalOpen}
                editingUnit={editingUnit}
                divisions={divisions}
                onClose={closeModal}
            />

            {/* ── Positions Dialog ── */}
            <PositionsDialog
                open={positionsDialogOpen}
                unit={selectedUnit}
                onClose={closePositions}
                onAssign={openAssign}
            />

            {/* ── Assign Employees Dialog ── */}
            <AssignEmployeesDialog
                open={assignDialogOpen}
                unit={assignTargetUnit}
                onClose={closeAssign}
            />
        </AppLayout>
    )
}