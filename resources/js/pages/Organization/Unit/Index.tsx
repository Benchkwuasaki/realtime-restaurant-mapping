import { Head, useForm, usePage } from "@inertiajs/react"
import { Building2, Puzzle, LayoutGrid } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { DataTable } from "@/components/shared/data-table/data-table"

import { StatCard } from "@/components/shared/stat-card"
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Units", href: "/organization/units" },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────



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
}

function PositionsDialog({ open, unit, onClose }: PositionsDialogProps) {
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
            put(route("unit.update", editingUnit!.unit_id), { onSuccess: handleClose })
        } else {
            post(route("unit.store"), { onSuccess: handleClose })
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

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UnitIndex({ units, divisions, totalUnits, totalDivisions, totalPositions }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    // ── Unit modal state ──
    const [modalOpen, setModalOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

    // ── Positions dialog state ──
    const [positionsDialogOpen, setPositionsDialogOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Units" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="w-full max-w-300 h-fit">
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard title="Total Units" value={totalUnits} description="All registered units" icon={<Building2 className="size-4" />} />
                        <StatCard title="Total Divisions" value={totalDivisions} description="Divisions with units" icon={<LayoutGrid className="size-4" />} />
                        <StatCard title="Total Positions" value={totalPositions} description="Positions across all units" icon={<Puzzle className="size-4" />} />
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <DataTable
                    columns={getColumns({ onEdit: openEdit })}
                    data={units}
                    getRowId={(row) => String(row.unit_id)}
                    onRowClick={(row) => openPositions(row.original)}
                    searchColumnId="unit_name"
                    searchPlaceholder="Search units..."
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
            />
        </AppLayout>
    )
}