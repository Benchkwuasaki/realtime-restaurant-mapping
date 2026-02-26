import { Head, router, useForm, usePage } from "@inertiajs/react"
import { Briefcase } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { getColumns } from "@/components/Organization/Position/components/columns"
import {
    type Department,
    type Division,
    type Position,
    type Unit,
} from "@/components/Organization/Position/data/schema"
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
    return <p className="text-xs text-destructive mt-1">{message}</p>
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
                    <div className="px-5 py-5 space-y-4">
                        {/* Position Name */}
                        <div>
                            <label htmlFor="position_name" className="block text-xs font-medium text-foreground mb-1.5">
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
                            <label htmlFor="department_id" className="block text-xs font-medium text-foreground mb-1.5">
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
                            <label htmlFor="division_id" className="block text-xs font-medium text-foreground mb-1.5">
                                Division <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.division_id}
                                onValueChange={(v) => {
                                    setData("division_id", v)
                                    setData("unit_id", "")
                                }}
                                disabled={!data.department_id}
                            >
                                <SelectTrigger id="division_id" className="text-sm">
                                    <SelectValue placeholder="Select division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredDivisions.map((d) => (
                                        <SelectItem key={d.division_id} value={String(d.division_id)}>
                                            {d.division_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.division_id} />
                        </div>

                        {/* Unit */}
                        <div>
                            <label htmlFor="unit_id" className="block text-xs font-medium text-foreground mb-1.5">
                                Unit <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <Select
                                value={data.unit_id}
                                onValueChange={(v) => setData("unit_id", v === "none" ? "" : v)}
                                disabled={!data.division_id}
                            >
                                <SelectTrigger id="unit_id" className="text-sm">
                                    <SelectValue placeholder="Select unit" />
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
                            <FieldError message={errors.unit_id} />
                        </div>

                        {/* Item Slots */}
                        <div>
                            <label htmlFor="item_slots" className="block text-xs font-medium text-foreground mb-1.5">
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
                                <p className="text-xs text-muted-foreground mt-1">
                                    Minimum {occupiedSlots} slot{occupiedSlots !== 1 ? "s" : ""} required ({occupiedSlots} currently occupied).
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Items will be auto-named: <span className="font-mono">{data.position_name || "Position"} Item 1</span>, <span className="font-mono">Item 2</span>…
                            </p>
                            <FieldError message={errors.item_slots} />
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Position" : "Create Position"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PositionIndex({ positions, departments, divisions, units }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen] = useState(false)
    const [editingPosition, setEditingPosition] = useState<Position | null>(null)

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

    // Delete is now handled inside DataTableRowActions via deleteAction()
    // — no separate DeleteAlertDialog state needed here
    const columns = getColumns({ onEdit: openEdit, onDelete: () => {} })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Positions
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {positions.length} position{positions.length !== 1 ? "s" : ""} across {departments.length} department{departments.length !== 1 ? "s" : ""}
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
                    data={positions}
                    getRowId={(row) => String(row.position_id)}
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

            <PositionModal
                key={editingPosition?.position_id ?? "create"}
                open={modalOpen}
                editingPosition={editingPosition}
                departments={departments}
                divisions={divisions}
                units={units}
                onClose={closeModal}
            />
        </AppLayout>
    )
}