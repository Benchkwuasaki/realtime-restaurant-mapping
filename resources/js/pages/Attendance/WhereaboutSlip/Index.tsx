import { Head, useForm, usePage } from "@inertiajs/react"
import { ClipboardList, Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"
import { cn } from "@/lib/utils"
import { getColumns } from "./components/columns"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import {
    type Employee,
    type WhereaboutSlip,
} from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    slips: WhereaboutSlip[]
    employees: Employee[]
}

interface SlipFormData {
    employee_id: string
    reviewed_and_noted_by_id: string
    approved_by_id: string
    attested_by_id: string
    date_filed: string
    purpose_type: string
    purpose_description: string
    time_out: string
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: route('whereabout-slip.index') },
    { title: "Whereabout Slips", href: route('whereabout-slip.index') },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

function getFullName(e: Employee) {
    return e.basic_info
        ? `${e.basic_info.first_name} ${e.basic_info.last_name}`
        : `Employee #${e.employee_id}`
}

// ─── EmployeeCombobox ─────────────────────────────────────────────────────────

interface EmployeeComboboxProps {
    id?: string
    placeholder?: string
    value: string
    onChange: (value: string) => void
    employees: Employee[]
}

function EmployeeCombobox({
    id,
    placeholder = "Select employee…",
    value,
    onChange,
    employees,
}: EmployeeComboboxProps) {
    const [open, setOpen] = useState(false)

    const selected = employees.find((e) => String(e.employee_id) === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-sm"
                >
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                        {selected ? getFullName(selected) : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
            >
                <Command
                    filter={(itemValue, search) => {
                        if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1
                        return 0
                    }}
                >
                    <CommandInput placeholder="Search employee…" className="text-sm" />
                    <CommandList className="max-h-52 overflow-y-auto">
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                            {employees.map((employee) => {
                                const fullName = getFullName(employee)
                                const empId = String(employee.employee_id)
                                return (
                                    <CommandItem
                                        key={empId}
                                        value={fullName}
                                        onSelect={() => {
                                            onChange(value === empId ? "" : empId)
                                            setOpen(false)
                                        }}
                                        className="text-sm"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === empId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {fullName}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

interface TimeInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
}

function TimeInput({ id, value, onChange }: TimeInputProps) {
    const normalized = value ? value.slice(0, 5) : ""

    return (
        <Input
            id={id}
            type="time"
            value={normalized}
            onChange={(e) => onChange(e.target.value ? `${e.target.value}:00` : "")}
            className="w-32 text-sm"
        />
    )
}

// ─── Slip Modal ───────────────────────────────────────────────────────────────

interface SlipModalProps {
    open: boolean
    editingSlip: WhereaboutSlip | null
    employees: Employee[]
    onClose: () => void
}

function SlipModal({ open, editingSlip, employees, onClose }: SlipModalProps) {
    const isEdit = editingSlip !== null

    const { data, setData, post, put, processing, errors, reset } = useForm<SlipFormData>({
        employee_id: editingSlip ? String(editingSlip.employee_id) : "",
        reviewed_and_noted_by_id: editingSlip ? String(editingSlip.reviewed_and_noted_by_id) : "",
        approved_by_id: editingSlip ? String(editingSlip.approved_by_id) : "",
        attested_by_id: editingSlip ? String(editingSlip.attested_by_id) : "",
        date_filed: editingSlip?.date_filed ?? "",
        purpose_type: editingSlip?.purpose_type ?? "",
        purpose_description: editingSlip?.purpose_description ?? "",
        time_out: editingSlip?.time_out ?? "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("whereabout-slip.update", editingSlip!.whereabout_slip_id), {
                onSuccess: handleClose,
            })
        } else {
            post(route("whereabout-slip.store"), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Whereabout Slip" : "Create Whereabout Slip"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                        {/* Employee */}
                        <div>
                            <label
                                htmlFor="employee_id"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Employee <span className="text-destructive">*</span>
                            </label>
                            <EmployeeCombobox
                                id="employee_id"
                                placeholder="Select employee…"
                                value={data.employee_id}
                                onChange={(v) => setData("employee_id", v)}
                                employees={employees}
                            />
                            <FieldError message={errors.employee_id} />
                        </div>

                        {/* Date Filed */}
                        <div>
                            <label
                                htmlFor="date_filed"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Date Filed <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="date_filed"
                                type="date"
                                value={data.date_filed}
                                onChange={(e) => setData("date_filed", e.target.value)}
                                className="text-sm"
                            />
                            <FieldError message={errors.date_filed} />
                        </div>

                        {/* Purpose Type */}
                        <div>
                            <label
                                htmlFor="purpose_type"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Purpose Type <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.purpose_type}
                                onValueChange={(v) => setData("purpose_type", v)}
                            >
                                <SelectTrigger id="purpose_type" className="text-sm">
                                    <SelectValue placeholder="Select type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="official">Official</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.purpose_type} />
                        </div>

                        {/* Purpose Description */}
                        <div>
                            <label
                                htmlFor="purpose_description"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Purpose Description <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                id="purpose_description"
                                value={data.purpose_description}
                                onChange={(e) => setData("purpose_description", e.target.value)}
                                placeholder="Describe the purpose of leaving…"
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.purpose_description} />
                        </div>

                        {/* Time Out */}
                        <div>
                            <label
                                htmlFor="time_out"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Time Out <span className="text-destructive">*</span>
                            </label>
                            <TimeInput
                                id="time_out"
                                value={data.time_out}
                                onChange={(v) => setData("time_out", v)}
                            />
                            <FieldError message={errors.time_out} />
                        </div>

                        {/* Reviewed & Noted By */}
                        <div>
                            <label
                                htmlFor="reviewed_and_noted_by_id"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Reviewed & Noted By <span className="text-destructive">*</span>
                            </label>
                            <EmployeeCombobox
                                id="reviewed_and_noted_by_id"
                                placeholder="Select employee…"
                                value={data.reviewed_and_noted_by_id}
                                onChange={(v) => setData("reviewed_and_noted_by_id", v)}
                                employees={employees}
                            />
                            <FieldError message={errors.reviewed_and_noted_by_id} />
                        </div>

                        {/* Approved By */}
                        <div>
                            <label
                                htmlFor="approved_by_id"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Approved By <span className="text-destructive">*</span>
                            </label>
                            <EmployeeCombobox
                                id="approved_by_id"
                                placeholder="Select employee…"
                                value={data.approved_by_id}
                                onChange={(v) => setData("approved_by_id", v)}
                                employees={employees}
                            />
                            <FieldError message={errors.approved_by_id} />
                        </div>

                        {/* Attested By */}
                        <div>
                            <label
                                htmlFor="attested_by_id"
                                className="block text-xs font-medium text-foreground mb-1.5"
                            >
                                Attested By <span className="text-destructive">*</span>
                            </label>
                            <EmployeeCombobox
                                id="attested_by_id"
                                placeholder="Select employee…"
                                value={data.attested_by_id}
                                onChange={(v) => setData("attested_by_id", v)}
                                employees={employees}
                            />
                            <FieldError message={errors.attested_by_id} />
                        </div>

                    </div>

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
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="text-xs"
                        >
                            {processing
                                ? "Saving…"
                                : isEdit
                                    ? "Update Slip"
                                    : "Create Slip"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhereaboutSlipIndex({ slips, employees }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen] = useState(false)
    const [editingSlip, setEditingSlip] = useState<WhereaboutSlip | null>(null)

    function openCreate() {
        setEditingSlip(null)
        setModalOpen(true)
    }

    function openEdit(slip: WhereaboutSlip) {
        setEditingSlip(slip)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingSlip(null)
    }

    const columns = getColumns({ onEdit: openEdit, onDelete: () => { } })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Whereabout Slips" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Whereabout Slips
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {slips.length} slip{slips.length !== 1 ? "s" : ""} on record
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
                    data={slips}
                    getRowId={(row) => String(row.whereabout_slip_id)}
                    searchColumnId="employee"
                    searchPlaceholder="Search employee…"
                    filters={[
                        {
                            columnId: "purpose_type",
                            title: "Purpose Type",
                            options: [
                                { value: "official", label: "Official" },
                                { value: "personal", label: "Personal" },
                            ],
                        },
                        {
                            columnId: "status",
                            title: "Status",
                            options: [
                                { value: "pending", label: "Pending" },
                                { value: "done", label: "Done" },
                            ],
                        },
                        {
                            columnId: "return_status",
                            title: "Return",
                            options: [
                                { value: "not_returned", label: "Not Returned" },
                                { value: "returned", label: "Returned" },
                            ],
                        },
                    ]}
                    addButton={{
                        label: "Create Slip",
                        onClick: openCreate,
                    }}
                    bulkDelete={{
                        route: route("whereabout-slip.bulk-destroy"),
                        entityName: "Whereabout Slip",
                        getId: (row) => (row as WhereaboutSlip).whereabout_slip_id,
                    }}
                />
            </div>

            <SlipModal
                key={editingSlip?.whereabout_slip_id ?? "create"}
                open={modalOpen}
                editingSlip={editingSlip}
                employees={employees}
                onClose={closeModal}
            />
        </AppLayout>
    )
}