import { Head, useForm, usePage } from "@inertiajs/react"
import { Briefcase, Users } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { getColumns } from "@/components/Organization/Position/components/columns"
import {
    type Department,
    type Division,
    type Position,
    type PositionEmployee,
    type Unit,
} from "@/components/Organization/Position/data/schema"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    positions: Position[]
    departments: Department[]
    divisions: Division[]
    units: Unit[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Positions", href: "/organization/position" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ─── Employees Dialog ─────────────────────────────────────────────────────────

interface EmployeesDialogProps {
    open: boolean
    position: Position | null
    onClose: () => void
}

function EmployeesDialog({ open, position, onClose }: EmployeesDialogProps) {
    const employees: PositionEmployee[] = position?.employees ?? []

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{position?.position_name}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {employees.length} / {position?.total_slots ?? "?"} slots filled
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 min-h-[180px] max-h-[400px] overflow-y-auto">
                    {employees.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-8 h-8 opacity-30" />
                            <span>No employees assigned to this position.</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {employees.map((emp) => (
                                <li
                                    key={emp.id}
                                    className="flex items-center justify-between gap-3 py-2.5"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">
                                            {emp.first_name} {emp.last_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {emp.email ?? "No email set"}
                                        </span>
                                        <span className="text-xs text-muted-foreground/60">
                                            {emp.item_name}
                                        </span>
                                    </div>
                                    <Badge
                                        variant={emp.is_active ? "default" : "secondary"}
                                        className="shrink-0 text-xs"
                                    >
                                        {emp.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <DialogFooter className="border-t border-border bg-muted/30 px-5 py-3">
                    <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Position Modal ───────────────────────────────────────────────────────────

interface PositionModalProps {
    open: boolean
    editingPosition: Position | null
    departments: Department[]
    divisions: Division[]
    units: Unit[]
    onClose: () => void
}

function PositionModal({
    open,
    editingPosition,
    departments,
    divisions,
    units,
    onClose,
}: PositionModalProps) {
    const isEdit = editingPosition !== null

    const { data, setData, post, put, processing, errors, reset } = useForm({
        position_name: editingPosition?.position_name ?? "",
        department_id: editingPosition?.department_id ? String(editingPosition.department_id) : "",
        division_id: editingPosition?.division_id ? String(editingPosition.division_id) : "",
        unit_id: editingPosition?.unit_id ? String(editingPosition.unit_id) : "",
        item_slots: editingPosition?.total_slots ? String(editingPosition.total_slots) : "1",
    })

    const filteredDivisions = divisions.filter(
        (d) => !data.department_id || d.department_id === Number(data.department_id)
    )
    const filteredUnits = units.filter(
        (u) => !data.division_id || u.division_id === Number(data.division_id)
    )

    // ── Empty-state flags (only show after a parent selection is made) ──
    const noDivisions = !!data.department_id && filteredDivisions.length === 0
    const noUnits = !!data.division_id && filteredUnits.length === 0

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("position.update", editingPosition!.position_id), { onSuccess: handleClose })
        } else {
            post(route("position.store"), { onSuccess: handleClose })
        }
    }

    const occupiedSlots = editingPosition?.occupied_slots ?? 0

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Position" : "Create Position"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-5 py-5">

                        {/* Position Name */}
                        <div>
                            <label htmlFor="position_name" className="mb-1.5 block text-xs font-medium text-foreground">
                                Position Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="position_name"
                                value={data.position_name}
                                onChange={(e) => setData("position_name", e.target.value)}
                                placeholder="e.g. HR Officer"
                                className="text-sm"
                            />
                            <FieldError message={errors.position_name} />
                        </div>

                        {/* Department */}
                        <div>
                            <label htmlFor="department_id" className="mb-1.5 block text-xs font-medium text-foreground">
                                Department <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.department_id}
                                onValueChange={(v) => {
                                    setData("department_id", v)
                                    setData("division_id", "")
                                    setData("unit_id", "")
                                }}
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

                        {/* Division */}
                        <div>
                            <label htmlFor="division_id" className="mb-1.5 block text-xs font-medium text-foreground">
                                Division <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.division_id}
                                onValueChange={(v) => {
                                    setData("division_id", v)
                                    setData("unit_id", "")
                                }}
                                disabled={!data.department_id || noDivisions}
                            >
                                <SelectTrigger id="division_id" className="text-sm">
                                    <SelectValue placeholder={
                                        !data.department_id
                                            ? "Select a department first"
                                            : noDivisions
                                                ? "No divisions available"
                                                : "Select division"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredDivisions.map((d) => (
                                        <SelectItem key={d.division_id} value={String(d.division_id)}>
                                            {d.division_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {noDivisions && (
                                <p className="mt-1.5 text-xs text-destructive">
                                    This department has no divisions yet.{" "}

                                    <a href="/organization/divisions"
                                        target="_blank"
                                        className="underline underline-offset-2 hover:text-foreground"
                                    >
                                        Add one here.
                                    </a>
                                </p>
                            )}
                            <FieldError message={errors.division_id} />
                        </div>

                        {/* Unit */}
                        <div>
                            <label htmlFor="unit_id" className="mb-1.5 block text-xs font-medium text-foreground">
                                Unit <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <Select
                                value={data.unit_id}
                                onValueChange={(v) => setData("unit_id", v === "none" ? "" : v)}
                                disabled={!data.division_id || noUnits}
                            >
                                <SelectTrigger id="unit_id" className="text-sm">
                                    <SelectValue placeholder={
                                        !data.division_id
                                            ? "Select a division first"
                                            : noUnits
                                                ? "No units available"
                                                : "Select unit (optional)"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {filteredUnits.map((u) => (
                                        <SelectItem key={u.unit_id} value={String(u.unit_id)}>
                                            {u.unit_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {noUnits && (
                                <p className="mt-1.5 text-xs text-destructive">
                                    This division has no units yet.{" "}

                                    <a href="/organization/units"
                                        target="_blank"
                                        className="underline underline-offset-2 hover:text-foreground"
                                    >
                                        Add one here.
                                    </a>
                                </p>
                            )}
                            <FieldError message={errors.unit_id} />
                        </div>

                        {/* Item Slots */}
                        <div>
                            <label htmlFor="item_slots" className="mb-1.5 block text-xs font-medium text-foreground">
                                Item Slots <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="item_slots"
                                type="number"
                                min={isEdit ? occupiedSlots : 1}
                                max={100}
                                value={data.item_slots}
                                onChange={(e) => setData("item_slots", e.target.value)}
                                className="text-sm"
                            />
                            {isEdit && occupiedSlots > 0 && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Minimum {occupiedSlots} slot{occupiedSlots !== 1 ? "s" : ""} required ({occupiedSlots} currently occupied).
                                </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                Items will be auto-named:{" "}
                                <span className="font-mono">{data.position_name || "Position"} Item 1</span>,{" "}
                                <span className="font-mono">Item 2</span>…
                            </p>
                            <FieldError message={errors.item_slots} />
                        </div>
                    </div>

                    <DialogFooter className="border-t border-border bg-muted/30 px-5 py-4">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing || noDivisions}
                            className="text-xs"
                        >
                            {processing ? "Saving…" : isEdit ? "Update Position" : "Create Position"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent >
        </Dialog >
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PositionIndex({ positions, departments, divisions, units }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    // ── Position modal state ──
    const [modalOpen, setModalOpen] = useState(false)
    const [editingPosition, setEditingPosition] = useState<Position | null>(null)

    // ── Employees dialog state ──
    const [employeesDialogOpen, setEmployeesDialogOpen] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

    function openCreate() {
        setEditingPosition(null)
        setModalOpen(true)
    }

    function openEdit(position: Position) {
        setEditingPosition(position)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingPosition(null)
    }

    function openEmployees(position: Position) {
        setSelectedPosition(position)
        setEmployeesDialogOpen(true)
    }

    function closeEmployees() {
        setEmployeesDialogOpen(false)
        setSelectedPosition(null)
    }

    const columns = getColumns({ onEdit: openEdit, onDelete: () => { } })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />

            <div className="flex h-full flex-1 flex-col gap-6 px-6 py-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Positions
                        </h1>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {positions.length} position{positions.length !== 1 ? "s" : ""} across{" "}
                            {departments.length} department{departments.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={positions}
                    getRowId={(row) => String(row.position_id)}
                    onRowClick={(row) => openEmployees(row.original)}
                    searchColumnId="position_name"
                    searchPlaceholder="Search positions..."
                    filters={[
                        {
                            columnId: "department",
                            title: "Department",
                            options: departments.map((d) => ({
                                value: String(d.department_id),
                                label: d.department_name,
                            })),
                        },
                        {
                            columnId: "division",
                            title: "Division",
                            options: divisions.map((d) => ({
                                value: String(d.division_id),
                                label: d.division_name,
                            })),
                        },
                        {
                            columnId: "unit",
                            title: "Unit",
                            options: units.map((u) => ({
                                value: String(u.unit_id),
                                label: u.unit_name,
                            })),
                        },
                    ]}
                    addButton={{
                        label: "Create Position",
                        onClick: openCreate,
                    }}
                    bulkDelete={{
                        route: route("position.bulk-destroy"),
                        entityName: "Position",
                        getId: (row) => (row as Position).position_id,
                    }}
                />
            </div>

            {/* ── Position Create/Edit Modal ── */}
            <PositionModal
                key={editingPosition?.position_id ?? "create"}
                open={modalOpen}
                editingPosition={editingPosition}
                departments={departments}
                divisions={divisions}
                units={units}
                onClose={closeModal}
            />

            {/* ── Employees Dialog ── */}
            <EmployeesDialog
                open={employeesDialogOpen}
                position={selectedPosition}
                onClose={closeEmployees}
            />
        </AppLayout>
    )
}