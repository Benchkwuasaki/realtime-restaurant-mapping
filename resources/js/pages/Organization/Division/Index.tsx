import { Head, useForm } from "@inertiajs/react"
import { BrickWall, Building2, Layers, LayoutGrid } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
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
}

function UnitsDialog({ open, division, onClose }: UnitsDialogProps) {
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
            </DialogContent>
        </Dialog>
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

    const columns = getColumns({ onEdit: openEdit })

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
                            icon={<Building2 className="size-4" />}
                        />
                        <StatCard
                            title="Total Departments"
                            value={totalDepartments}
                            description="Departments with divisions"
                            icon={<LayoutGrid className="size-4" />}
                        />
                        <StatCard
                            title="Total Units"
                            value={totalUnits}
                            description="Units across all divisions"
                            icon={<Layers className="size-4" />}
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
            />
        </AppLayout>
    )
}