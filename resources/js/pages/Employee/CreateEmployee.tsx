import { useForm, router, Head } from "@inertiajs/react"
import {
    BadgeCheck, BriefcaseBusiness, User, MapPin, Users, Landmark,
    GraduationCap, Award, Plus, Trash2, List, Save, Pencil,
} from "lucide-react"
import { type FormEventHandler, useState, useMemo, useEffect } from "react"
import { route } from "ziggy-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Stepper } from "@/components/ui/stepper"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast, Toaster } from "sonner"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Position {
    position_name: string
    position_type: "Regular" | "Casual" | "Job Order"
    department_id?: number | null
    division_id?: number | null
    unit_id?: number | null
    department?: { department_name: string }
    division?: { division_name: string }
    unit?: { unit_name: string }
}

export interface Item {
    item_id: number
    is_occupied: boolean
    position?: Position
}

export interface SalaryGradeStep {
    salary_grade_step_id: number
    salary_grade: number
    step: number
    monthly_salary: number
}

export interface EmploymentClassification {
    id: number
    name: string
    description?: string
}

export interface CreateEmployeeProps {
    items: Item[]
    salaryGradeSteps: SalaryGradeStep[]
    employmentClassifications: EmploymentClassification[]
}

// ─── Collection row types ─────────────────────────────────────────────────────

interface AddressRow    { [key: string]: string; street_address: string; city: string; state: string; zip_code: string }
interface FamilyRow     { [key: string]: string; full_name: string; contact_number: string; relationship: string }
interface GovernmentRow { [key: string]: string; account_type: string; account_number: string }
interface EducationRow  { [key: string]: string; level: string; school_name: string; school_address: string; graduation_date: string; degree: string }
interface EligibilityRow{ [key: string]: string; eligibility_name: string; year_passed: string }

// ─── Position group ───────────────────────────────────────────────────────────

interface PositionGroup {
    groupKey: string          // composite key: name::deptId::divId::unitId
    positionName: string
    displayLabel: string      // e.g. "Job Order — Dept A / Div B"
    position: Position | undefined
    items: Item[]
    totalSlots: number
    availableSlots: number
    isFull: boolean
}

function buildPositionGroups(items: Item[]): PositionGroup[] {
    const map = new Map<string, PositionGroup>()
    for (const item of items) {
        const pos = item.position
        // Composite key — same position name in different org levels = different group
        const key = pos
            ? [pos.position_name, pos.department_id ?? "null", pos.division_id ?? "null", pos.unit_id ?? "null"].join("::")
            : `__item_${item.item_id}`

        if (!map.has(key)) {
            // Build a human-readable label showing org context
            const parts: string[] = []
            if (pos?.department?.department_name) parts.push(pos.department.department_name)
            if (pos?.division?.division_name)     parts.push(pos.division.division_name)
            if (pos?.unit?.unit_name)             parts.push(pos.unit.unit_name)
            const orgLabel  = parts.join(" / ")
            const displayLabel = orgLabel
                ? `${pos?.position_name ?? `Item #${item.item_id}`} — ${orgLabel}`
                : (pos?.position_name ?? `Item #${item.item_id}`)

            map.set(key, {
                groupKey: key,
                positionName: pos?.position_name ?? `Item #${item.item_id}`,
                displayLabel,
                position: pos,
                items: [],
                totalSlots: 0,
                availableSlots: 0,
                isFull: false,
            })
        }
        const grp = map.get(key)!
        grp.items.push(item)
        grp.totalSlots++
        if (!item.is_occupied) grp.availableSlots++
    }
    for (const grp of map.values()) grp.isFull = grp.availableSlots === 0
    return Array.from(map.values()).sort((a, b) => a.displayLabel.localeCompare(b.displayLabel))
}

// ─── Position type helpers ────────────────────────────────────────────────────

// Uses position_type from DB — clean, no name-based detection
const JOB_ORDER_CLASSIFICATION = "Job Order"

function isJobOrderPosition(grp: PositionGroup): boolean {
    return grp.position?.position_type === "Job Order"
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
    { title: "Personal Information",  description: "Step 1", icon: User },
    { title: "Employment Details",    description: "Step 2", icon: BriefcaseBusiness },
    { title: "Address",               description: "Step 3", icon: MapPin },
    { title: "Family Information",    description: "Step 4", icon: Users },
    { title: "Government Accounts",   description: "Step 5", icon: Landmark },
    { title: "Education",             description: "Step 6", icon: GraduationCap },
    { title: "Eligibility",           description: "Step 7", icon: Award },
    { title: "Review & Submit",       description: "Step 8", icon: BadgeCheck },
]

const REQUIRED: Record<number, { field: string; label: string }[]> = {
    0: [
        { field: "first_name",   label: "First Name" },
        { field: "last_name",    label: "Last Name" },
        { field: "birth_date",   label: "Date of Birth" },
        { field: "sex",          label: "Sex" },
        { field: "civil_status", label: "Civil Status" },
        { field: "phone_number", label: "Phone Number" },
    ],
    1: [
        { field: "item_id",                   label: "Position" },
        { field: "salary_grade_step_id",      label: "Salary Grade & Step" },
        { field: "employment_classification", label: "Employment Classification" },
        { field: "work_email",                label: "Work Email" },
        { field: "password",                  label: "Password" },
        { field: "date_applied",              label: "Date Applied" },
        { field: "date_hired",                label: "Date Hired" },
        { field: "work_schedule_start",       label: "Schedule Start" },
        { field: "work_schedule_end",         label: "Schedule End" },
        { field: "status",                    label: "Status" },
    ],
}

type ErrFn     = (field: string) => string | undefined
type SetDataFn = (field: string, value: string) => void

// ─── Small helpers ────────────────────────────────────────────────────────────

function Req() {
    return <span className="text-destructive ml-0.5">*</span>
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex gap-2 text-sm py-0.5">
            <span className="w-56 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="text-foreground">
                {value || <span className="italic text-muted-foreground/50">—</span>}
            </span>
        </div>
    )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b pb-1">
            {children}
        </h3>
    )
}

function EmptyState({ label }: { label: string }) {
    return <p className="text-sm text-muted-foreground italic py-2">{label}</p>
}

function CollectionSection({ title, onAdd, addLabel, children }: {
    title?: string; onAdd: () => void; addLabel: string; children: React.ReactNode
}) {
    return (
        <div className="space-y-4">
            {title && <p className="text-sm text-muted-foreground">{title}</p>}
            {children}
            <Button type="button" variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> {addLabel}
            </Button>
        </div>
    )
}

function RowCard({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
    return (
        <div className="relative border rounded-md p-4 bg-muted/30">
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            {children}
        </div>
    )
}

// ─── Manage Classifications Dialog ────────────────────────────────────────────

function ManageClassificationsDialog({
    open,
    onClose,
    classifications,
    onCreated,
}: {
    open: boolean
    onClose: () => void
    classifications: EmploymentClassification[]
    onCreated: (name: string) => void
}) {
    const [addForm,  setAddForm]  = useState({ name: "", description: "" })
    const [editId,   setEditId]   = useState<number | null>(null)
    const [editForm, setEditForm] = useState({ name: "", description: "" })
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [loading,  setLoading]  = useState(false)

    const openEdit = (c: EmploymentClassification) => {
        setEditId(c.id)
        setEditForm({ name: c.name, description: c.description ?? "" })
    }

    const handleAdd = () => {
        if (!addForm.name.trim()) return
        setLoading(true)
        const nameToSelect = addForm.name.trim()
        router.post(route("employee.employment-classification.store"), addForm, {
            preserveScroll: true,
            onSuccess: () => {
                setAddForm({ name: "", description: "" })
                onCreated(nameToSelect)
            },
            onFinish: () => setLoading(false),
        })
    }

    const handleUpdate = () => {
        if (!editId || !editForm.name.trim()) return
        setLoading(true)
        router.put(route("employee.employment-classification.update", editId), editForm, {
            preserveScroll: true,
            onSuccess: () => setEditId(null),
            onFinish: () => setLoading(false),
        })
    }

    const handleDelete = () => {
        if (!deleteId) return
        setLoading(true)
        router.delete(route("employee.employment-classification.destroy", deleteId), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
            onFinish: () => setLoading(false),
        })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={v => !v && onClose()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Employment Classifications</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {classifications.length === 0 ? (
                                <div className="px-5 py-6 text-center text-sm text-muted-foreground italic">
                                    No classifications yet. Add one below.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {classifications.map(c => (
                                        <div key={c.id}>
                                            {editId === c.id ? (
                                                <div className="px-4 py-3 space-y-2 bg-muted/20">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Name</Label>
                                                        <Input
                                                            value={editForm.name}
                                                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Description</Label>
                                                        <Input
                                                            value={editForm.description}
                                                            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                                            placeholder="Optional description…"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                                                        <Button size="sm" onClick={handleUpdate} disabled={loading || !editForm.name.trim()}>
                                                            <Save className="w-3.5 h-3.5 mr-1.5" />Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                                                        {c.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteId(c.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Add New Classification
                            </p>
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Name *</Label>
                                <Input
                                    value={addForm.name}
                                    onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Contract of Service"
                                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Description</Label>
                                <Input
                                    value={addForm.description}
                                    onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Optional description…"
                                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAdd}
                                    disabled={loading || !addForm.name.trim()}
                                    className="gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />Add Classification
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Classification?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the classification from the list. Existing employees already assigned to it will keep their current value.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── PersonalStep ─────────────────────────────────────────────────────────────

function PersonalStep({ data, setData, err }: {
    data: {
        first_name: string; last_name: string; middle_name: string; name_extension: string
        birth_date: string; sex: string; civil_status: string; place_of_birth: string
        personal_email: string; phone_number: string
    }
    setData: SetDataFn; err: ErrFn
}) {
    return (
        <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2">
                <FieldLabel htmlFor="first_name">First Name <Req /></FieldLabel>
                <Input id="first_name" value={data.first_name} onChange={e => setData("first_name", e.target.value)} placeholder="John" />
                <FieldError message={err("first_name")} />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="last_name">Last Name <Req /></FieldLabel>
                <Input id="last_name" value={data.last_name} onChange={e => setData("last_name", e.target.value)} placeholder="Doe" />
                <FieldError message={err("last_name")} />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
                <Input id="middle_name" value={data.middle_name} onChange={e => setData("middle_name", e.target.value)} placeholder="Santos" />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="name_extension">Name Extension</FieldLabel>
                <Input id="name_extension" value={data.name_extension} onChange={e => setData("name_extension", e.target.value)} placeholder="Jr., Sr., III" />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="birth_date">Date of Birth <Req /></FieldLabel>
                <Input id="birth_date" type="date" value={data.birth_date} onChange={e => setData("birth_date", e.target.value)} />
                <FieldError message={err("birth_date")} />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="sex">Sex <Req /></FieldLabel>
                <Select value={data.sex} onValueChange={v => setData("sex", v)}>
                    <SelectTrigger id="sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Male</SelectItem>
                        <SelectItem value="0">Female</SelectItem>
                    </SelectContent>
                </Select>
                <FieldError message={err("sex")} />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="civil_status">Civil Status <Req /></FieldLabel>
                <Select value={data.civil_status} onValueChange={v => setData("civil_status", v)}>
                    <SelectTrigger id="civil_status"><SelectValue placeholder="Select civil status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                </Select>
                <FieldError message={err("civil_status")} />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="place_of_birth">Place of Birth</FieldLabel>
                <Input id="place_of_birth" value={data.place_of_birth} onChange={e => setData("place_of_birth", e.target.value)} placeholder="Manila, Philippines" />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="personal_email">Personal Email</FieldLabel>
                <Input id="personal_email" type="email" value={data.personal_email} onChange={e => setData("personal_email", e.target.value)} placeholder="johndoe@gmail.com" />
            </div>
            <div className="space-y-2">
                <FieldLabel htmlFor="phone_number">Phone Number <Req /></FieldLabel>
                <Input id="phone_number" value={data.phone_number} onChange={e => setData("phone_number", e.target.value)} placeholder="09XXXXXXXXXX" />
                <FieldError message={err("phone_number")} />
            </div>
        </div>
    )
}

// ─── EmploymentStep ───────────────────────────────────────────────────────────

function EmploymentStep({ data, setData, err, items, salaryGradeSteps, employmentClassifications }: {
    data: {
        item_id: string; selected_position_name: string; salary_grade_step_id: string
        employment_classification: string; work_email: string; password: string
        date_applied: string; date_hired: string; work_schedule_start: string
        work_schedule_end: string; status: string; salary_grade: string; step: string
    }
    setData: SetDataFn; err: ErrFn
    items: Item[]; salaryGradeSteps: SalaryGradeStep[]; employmentClassifications: EmploymentClassification[]
}) {
    const [manageOpen, setManageOpen] = useState(false)
    const [pendingSelection, setPendingSelection] = useState<string | null>(null)

    useEffect(() => {
        if (!pendingSelection) return
        const found = employmentClassifications.find(c => c.name === pendingSelection)
        if (found) {
            setData("employment_classification", found.name)
            setPendingSelection(null)
        }
    }, [employmentClassifications, pendingSelection])

    const handleCreated = (name: string) => {
        setPendingSelection(name)
        setManageOpen(false)
    }

    // ── Build all position groups once ────────────────────────────────────────
    const allPositionGroups = useMemo(() => buildPositionGroups(items), [items])

    // ── Filter by position_type based on selected classification ──────────────
    // 'Job Order' classification → show only position_type = 'Job Order'
    // Any other classification  → show only position_type = 'Regular' or 'Casual'
    const positionGroups = useMemo(() => {
        if (!data.employment_classification) return []

        const isJOClassification = data.employment_classification === JOB_ORDER_CLASSIFICATION

        return allPositionGroups.filter(grp =>
            isJOClassification
                ? isJobOrderPosition(grp)           // Job Order classification → JO positions only
                : !isJobOrderPosition(grp)           // All others → Regular/Casual positions only
        )
    }, [allPositionGroups, data.employment_classification])

    const selectedGroup = useMemo(
        () => positionGroups.find(g => g.groupKey === data.selected_position_name),
        [positionGroups, data.selected_position_name]
    )

    const handleClassificationSelect = (value: string) => {
        setData("employment_classification", value)
        // Clear position selection when classification changes
        // since the available positions list will change completely
        setData("selected_position_name", "")
        setData("item_id", "")
    }

    const handlePositionSelect = (groupKey: string) => {
        const grp = positionGroups.find(g => g.groupKey === groupKey)
        if (!grp) return
        const firstAvailable = grp.items.find(i => !i.is_occupied)
        setData("selected_position_name", groupKey)
        setData("item_id", firstAvailable ? firstAvailable.item_id.toString() : "")
    }

    const positionDisabled = !data.employment_classification

    // ── Hint text shown below the position dropdown ────────────────────────────
    const positionHint = useMemo(() => {
        if (!data.employment_classification) return null
        const isJO = data.employment_classification === JOB_ORDER_CLASSIFICATION
        if (positionGroups.length === 0) {
            return isJO
                ? "No Job Order positions available. Create one under Organization → Job Order Positions."
                : "No Regular/Casual positions available."
        }
        return isJO
            ? "Showing Job Order positions only."
            : "Showing Regular and Casual positions only."
    }, [data.employment_classification, positionGroups])

    return (
        <>
            <div className="grid grid-cols-3 gap-5">

                {/* Employment Classification */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="employment_classification">Employment Classification <Req /></FieldLabel>
                    <div className="flex gap-2">
                        <Select value={data.employment_classification} onValueChange={handleClassificationSelect}>
                            <SelectTrigger id="employment_classification" className="flex-1">
                                <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                                {employmentClassifications.map(c => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setManageOpen(true)}
                            title="Manage classifications"
                            className="shrink-0"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                    <FieldError message={err("employment_classification")} />
                </div>

                {/* Position — filtered by classification */}
                <div className="space-y-2 col-span-2">
                    <FieldLabel htmlFor="position">Position <Req /></FieldLabel>
                    <Select
                        value={data.selected_position_name}
                        onValueChange={handlePositionSelect}
                        disabled={positionDisabled}
                    >
                        <SelectTrigger id="position">
                            <SelectValue placeholder={
                                positionDisabled
                                    ? "Select a classification first…"
                                    : positionGroups.length === 0
                                        ? "No positions available for this classification"
                                        : "Select a position…"
                            } />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                            {!positionDisabled && positionGroups.length === 0 && (
                                <SelectItem value="_none" disabled>
                                    No positions available for this classification
                                </SelectItem>
                            )}
                            {positionGroups.map(grp => {
                                const isDisabled = grp.isFull
                                return (
                                    <SelectItem key={grp.groupKey} value={grp.groupKey} disabled={isDisabled} className="py-2.5">
                                        <div className="flex items-center justify-between gap-3 w-full">
                                            <span className={isDisabled ? "text-muted-foreground/50" : ""}>{grp.displayLabel}</span>
                                            {grp.totalSlots > 1 && (
                                                isDisabled
                                                    ? <Badge className="text-[10px] font-bold bg-destructive/10 text-destructive border-0 rounded-md px-2 py-0.5 shrink-0">Full</Badge>
                                                    : <Badge className="text-[10px] font-semibold bg-accent text-accent-foreground border-0 rounded-md px-2 py-0.5 shrink-0">{grp.availableSlots}/{grp.totalSlots} open</Badge>
                                            )}
                                            {grp.totalSlots === 1 && isDisabled && (
                                                <Badge className="text-[10px] font-bold bg-destructive/10 text-destructive border-0 rounded-md px-2 py-0.5 shrink-0">Full</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>

                    {/* Hint text — tells user which type of positions are shown */}
                    {positionHint && (
                        <p className="text-xs text-muted-foreground">{positionHint}</p>
                    )}

                    {selectedGroup && selectedGroup.totalSlots > 1 && (
                        <p className="text-xs text-muted-foreground">
                            {selectedGroup.availableSlots === 0
                                ? "All slots are currently occupied."
                                : `${selectedGroup.availableSlots} of ${selectedGroup.totalSlots} slots available — a slot will be auto-assigned.`}
                        </p>
                    )}
                    <FieldError message={err("item_id")} />

                    {/* Org context card */}
                    {selectedGroup?.position && (
                        <div className="rounded-lg border border-border divide-y divide-border bg-muted/20 mt-1">
                            {selectedGroup.position.department && (
                                <div className="flex justify-between px-4 py-2">
                                    <span className="text-xs text-muted-foreground">Department</span>
                                    <span className="text-xs font-medium text-foreground">{selectedGroup.position.department.department_name}</span>
                                </div>
                            )}
                            {selectedGroup.position.division && (
                                <div className="flex justify-between px-4 py-2">
                                    <span className="text-xs text-muted-foreground">Division</span>
                                    <span className="text-xs font-medium text-foreground">{selectedGroup.position.division.division_name}</span>
                                </div>
                            )}
                            {selectedGroup.position.unit && (
                                <div className="flex justify-between px-4 py-2">
                                    <span className="text-xs text-muted-foreground">Unit</span>
                                    <span className="text-xs font-medium text-foreground">{selectedGroup.position.unit.unit_name}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Salary Grade */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="salary_grade">Salary Grade <Req /></FieldLabel>
                    <Select value={data.salary_grade} onValueChange={v => { setData("salary_grade", v); setData("salary_grade_step_id", "") }}>
                        <SelectTrigger id="salary_grade"><SelectValue placeholder="Select salary grade" /></SelectTrigger>
                        <SelectContent>
                            {salaryGradeSteps.length === 0 && <SelectItem value="_empty" disabled>No salary grades available</SelectItem>}
                            {[...new Set(salaryGradeSteps.map(s => s.salary_grade))].sort((a, b) => a - b).map(grade => (
                                <SelectItem key={grade} value={String(grade)}>SG {grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError message={err("salary_grade")} />
                </div>

                {/* Step */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="salary_grade_step_id">Step <Req /></FieldLabel>
                    <Select value={data.salary_grade_step_id} onValueChange={v => setData("salary_grade_step_id", v)} disabled={!data.salary_grade}>
                        <SelectTrigger id="salary_grade_step_id">
                            <SelectValue placeholder={data.salary_grade ? "Select step" : "Select a grade first"} />
                        </SelectTrigger>
                        <SelectContent>
                            {salaryGradeSteps
                                .filter(s => String(s.salary_grade) === data.salary_grade)
                                .sort((a, b) => a.step - b.step)
                                .map(sgs => (
                                    <SelectItem key={sgs.salary_grade_step_id} value={String(sgs.salary_grade_step_id)}>
                                        Step {sgs.step} — ₱{Number(sgs.monthly_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    <FieldError message={err("salary_grade_step_id")} />
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="status">Status <Req /></FieldLabel>
                    <Select value={data.status} onValueChange={v => setData("status", v)}>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Active</SelectItem>
                            <SelectItem value="0">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <FieldError message={err("status")} />
                </div>

                {/* Work Email */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="work_email">Work Email <Req /></FieldLabel>
                    <Input id="work_email" type="email" value={data.work_email} onChange={e => setData("work_email", e.target.value)} placeholder="johndoe@agency.gov.ph" />
                    <FieldError message={err("work_email")} />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="password">Password <Req /></FieldLabel>
                    <Input id="password" type="password" value={data.password} onChange={e => setData("password", e.target.value)} placeholder="Min. 8 characters" />
                    <FieldError message={err("password")} />
                </div>

                {/* Date Applied */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="date_applied">Date Applied <Req /></FieldLabel>
                    <Input id="date_applied" type="date" value={data.date_applied} onChange={e => setData("date_applied", e.target.value)} />
                    <FieldError message={err("date_applied")} />
                </div>

                {/* Date Hired */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="date_hired">Date Hired <Req /></FieldLabel>
                    <Input id="date_hired" type="date" value={data.date_hired} onChange={e => setData("date_hired", e.target.value)} />
                    <FieldError message={err("date_hired")} />
                </div>

                {/* Schedule Start */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="work_schedule_start">Schedule Start <Req /></FieldLabel>
                    <Input id="work_schedule_start" type="time" value={data.work_schedule_start} onChange={e => setData("work_schedule_start", e.target.value)} />
                    <FieldError message={err("work_schedule_start")} />
                </div>

                {/* Schedule End */}
                <div className="space-y-2">
                    <FieldLabel htmlFor="work_schedule_end">Schedule End <Req /></FieldLabel>
                    <Input id="work_schedule_end" type="time" value={data.work_schedule_end} onChange={e => setData("work_schedule_end", e.target.value)} />
                    <FieldError message={err("work_schedule_end")} />
                </div>

            </div>

            <ManageClassificationsDialog
                open={manageOpen}
                onClose={() => setManageOpen(false)}
                classifications={employmentClassifications}
                onCreated={handleCreated}
            />
        </>
    )
}

// ─── Remaining steps (unchanged) ──────────────────────────────────────────────

const RELATIONSHIPS            = ["Spouse", "Parent", "Sibling", "Child", "Guardian", "Emergency Contact"]
const GOVERNMENT_ACCOUNT_TYPES = ["SSS", "PhilHealth", "GSIS", "TIN", "Pag-IBIG", "Other"]
const EDUCATION_LEVELS         = ["Elementary", "Secondary", "Vocational / Technical", "Bachelor's Degree", "Master's Degree", "Doctorate", "Post-Doctorate"]

function AddressStep({ rows, setRows, err }: { rows: AddressRow[]; setRows: (r: AddressRow[]) => void; err: ErrFn }) {
    const add    = () => setRows([...rows, { street_address: "", city: "", state: "", zip_code: "" }])
    const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))
    const update = (i: number, field: keyof AddressRow, value: string) => {
        const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
    }
    return (
        <CollectionSection title="Add one or more addresses for this employee." onAdd={add} addLabel="Add Address">
            {rows.length === 0 && (<><EmptyState label="No addresses added yet." /><FieldError message={err("addresses")} /></>)}
            {rows.map((row, i) => (
                <RowCard key={i} onRemove={() => remove(i)}>
                    <div className="grid grid-cols-2 gap-4 pr-6">
                        <div className="col-span-2 space-y-1.5">
                            <FieldLabel>Street Address <Req /></FieldLabel>
                            <Input value={row.street_address} onChange={e => update(i, "street_address", e.target.value)} placeholder="123 Rizal Street" className={err(`addresses.${i}.street_address`) ? "border-destructive" : ""} />
                            <FieldError message={err(`addresses.${i}.street_address`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>City <Req /></FieldLabel>
                            <Input value={row.city} onChange={e => update(i, "city", e.target.value)} placeholder="Manila" className={err(`addresses.${i}.city`) ? "border-destructive" : ""} />
                            <FieldError message={err(`addresses.${i}.city`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Province / State <Req /></FieldLabel>
                            <Input value={row.state} onChange={e => update(i, "state", e.target.value)} placeholder="Metro Manila" className={err(`addresses.${i}.state`) ? "border-destructive" : ""} />
                            <FieldError message={err(`addresses.${i}.state`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>ZIP Code <Req /></FieldLabel>
                            <Input value={row.zip_code} onChange={e => update(i, "zip_code", e.target.value)} placeholder="1000" className={err(`addresses.${i}.zip_code`) ? "border-destructive" : ""} />
                            <FieldError message={err(`addresses.${i}.zip_code`)} />
                        </div>
                    </div>
                </RowCard>
            ))}
        </CollectionSection>
    )
}

function FamilyStep({ rows, setRows, err }: { rows: FamilyRow[]; setRows: (r: FamilyRow[]) => void; err: ErrFn }) {
    const add    = () => setRows([...rows, { full_name: "", contact_number: "", relationship: "" }])
    const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))
    const update = (i: number, field: keyof FamilyRow, value: string) => {
        const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
    }
    return (
        <CollectionSection title="Add family members or emergency contacts." onAdd={add} addLabel="Add Family Member">
            {rows.length === 0 && (<><EmptyState label="No family members added yet." /><FieldError message={err("family")} /></>)}
            {rows.map((row, i) => (
                <RowCard key={i} onRemove={() => remove(i)}>
                    <div className="grid grid-cols-3 gap-4 pr-6">
                        <div className="space-y-1.5">
                            <FieldLabel>Full Name <Req /></FieldLabel>
                            <Input value={row.full_name} onChange={e => update(i, "full_name", e.target.value)} placeholder="Maria Santos" className={err(`family.${i}.full_name`) ? "border-destructive" : ""} />
                            <FieldError message={err(`family.${i}.full_name`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Contact Number</FieldLabel>
                            <Input value={row.contact_number} onChange={e => update(i, "contact_number", e.target.value)} placeholder="09XXXXXXXXXX" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Relationship <Req /></FieldLabel>
                            <Select value={row.relationship} onValueChange={v => update(i, "relationship", v)}>
                                <SelectTrigger className={err(`family.${i}.relationship`) ? "border-destructive" : ""}><SelectValue placeholder="Select relationship" /></SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FieldError message={err(`family.${i}.relationship`)} />
                        </div>
                    </div>
                </RowCard>
            ))}
        </CollectionSection>
    )
}

function GovernmentStep({ rows, setRows, err }: { rows: GovernmentRow[]; setRows: (r: GovernmentRow[]) => void; err: ErrFn }) {
    const add    = () => setRows([...rows, { account_type: "", account_number: "" }])
    const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))
    const update = (i: number, field: keyof GovernmentRow, value: string) => {
        const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
    }
    return (
        <CollectionSection title="Add government ID numbers (SSS, PhilHealth, GSIS, TIN, Pag-IBIG, etc.)." onAdd={add} addLabel="Add Account">
            {rows.length === 0 && (<><EmptyState label="No government accounts added yet." /><FieldError message={err("government")} /></>)}
            {rows.map((row, i) => (
                <RowCard key={i} onRemove={() => remove(i)}>
                    <div className="grid grid-cols-2 gap-4 pr-6">
                        <div className="space-y-1.5">
                            <FieldLabel>Account Type <Req /></FieldLabel>
                            <Select value={row.account_type} onValueChange={v => update(i, "account_type", v)}>
                                <SelectTrigger className={err(`government.${i}.account_type`) ? "border-destructive" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {GOVERNMENT_ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FieldError message={err(`government.${i}.account_type`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>ID Number <Req /></FieldLabel>
                            <Input value={row.account_number} onChange={e => update(i, "account_number", e.target.value)} placeholder="XXXX-XXXX-XXXX" className={err(`government.${i}.account_number`) ? "border-destructive" : ""} />
                            <FieldError message={err(`government.${i}.account_number`)} />
                        </div>
                    </div>
                </RowCard>
            ))}
        </CollectionSection>
    )
}

function EducationStep({ rows, setRows, err }: { rows: EducationRow[]; setRows: (r: EducationRow[]) => void; err: ErrFn }) {
    const add    = () => setRows([...rows, { level: "", school_name: "", school_address: "", graduation_date: "", degree: "" }])
    const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))
    const update = (i: number, field: keyof EducationRow, value: string) => {
        const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
    }
    return (
        <CollectionSection title="Add educational attainment records." onAdd={add} addLabel="Add Education Record">
            {rows.length === 0 && (<><EmptyState label="No education records added yet." /><FieldError message={err("education")} /></>)}
            {rows.map((row, i) => (
                <RowCard key={i} onRemove={() => remove(i)}>
                    <div className="grid grid-cols-3 gap-4 pr-6">
                        <div className="space-y-1.5">
                            <FieldLabel>Level <Req /></FieldLabel>
                            <Select value={row.level} onValueChange={v => update(i, "level", v)}>
                                <SelectTrigger className={err(`education.${i}.level`) ? "border-destructive" : ""}><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent>
                                    {EDUCATION_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FieldError message={err(`education.${i}.level`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>School Name <Req /></FieldLabel>
                            <Input value={row.school_name} onChange={e => update(i, "school_name", e.target.value)} placeholder="University of the Philippines" className={err(`education.${i}.school_name`) ? "border-destructive focus-visible:ring-destructive" : ""} />
                            <FieldError message={err(`education.${i}.school_name`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>School Address</FieldLabel>
                            <Input value={row.school_address} onChange={e => update(i, "school_address", e.target.value)} placeholder="Diliman, Quezon City" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Degree / Course</FieldLabel>
                            <Input value={row.degree} onChange={e => update(i, "degree", e.target.value)} placeholder="BS Computer Science" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Graduation Date</FieldLabel>
                            <Input type="date" value={row.graduation_date} onChange={e => update(i, "graduation_date", e.target.value)} />
                        </div>
                    </div>
                </RowCard>
            ))}
        </CollectionSection>
    )
}

function EligibilityStep({ rows, setRows, err }: { rows: EligibilityRow[]; setRows: (r: EligibilityRow[]) => void; err: ErrFn }) {
    const add    = () => setRows([...rows, { eligibility_name: "", year_passed: "" }])
    const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))
    const update = (i: number, field: keyof EligibilityRow, value: string) => {
        const next = [...rows]; next[i] = { ...next[i], [field]: value }; setRows(next)
    }
    return (
        <CollectionSection title="Add civil service eligibilities or professional licenses." onAdd={add} addLabel="Add Eligibility">
            {rows.length === 0 && (<><EmptyState label="No eligibility records added yet." /><FieldError message={err("eligibility")} /></>)}
            {rows.map((row, i) => (
                <RowCard key={i} onRemove={() => remove(i)}>
                    <div className="grid grid-cols-2 gap-4 pr-6">
                        <div className="space-y-1.5">
                            <FieldLabel>Eligibility Name <Req /></FieldLabel>
                            <Input value={row.eligibility_name} onChange={e => update(i, "eligibility_name", e.target.value)} placeholder="Career Service Professional" className={err(`eligibility.${i}.eligibility_name`) ? "border-destructive" : ""} />
                            <FieldError message={err(`eligibility.${i}.eligibility_name`)} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Date Passed <Req /></FieldLabel>
                            <Input type="date" value={row.year_passed} onChange={e => update(i, "year_passed", e.target.value)} className={err(`eligibility.${i}.year_passed`) ? "border-destructive" : ""} />
                            <FieldError message={err(`eligibility.${i}.year_passed`)} />
                        </div>
                    </div>
                </RowCard>
            ))}
        </CollectionSection>
    )
}

// ─── ReviewStep ───────────────────────────────────────────────────────────────

function ReviewStep({ data, items, salaryGradeSteps, addresses, family, government, education, eligibility }: {
    data: {
        first_name: string; last_name: string; middle_name: string; name_extension: string
        birth_date: string; sex: string; civil_status: string; place_of_birth: string
        personal_email: string; phone_number: string; item_id: string
        selected_position_name: string; salary_grade_step_id: string
        employment_classification: string; work_email: string
        date_applied: string; date_hired: string
        work_schedule_start: string; work_schedule_end: string; status: string
    }
    items: Item[]; salaryGradeSteps: SalaryGradeStep[]
    addresses: AddressRow[]; family: FamilyRow[]; government: GovernmentRow[]
    education: EducationRow[]; eligibility: EligibilityRow[]
}) {
    const selectedSGS    = salaryGradeSteps.find(s => String(s.salary_grade_step_id) === data.salary_grade_step_id)
    const positionGroups = useMemo(() => buildPositionGroups(items), [items])
    const selectedGroup  = positionGroups.find(g => g.groupKey === data.selected_position_name)

    const positionDisplay = selectedGroup
        ? (selectedGroup.totalSlots > 1
            ? `${selectedGroup.displayLabel} (auto-assigned slot)`
            : selectedGroup.displayLabel)
        : undefined

    return (
        <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground mb-1">
                Review all information below. Use <strong>Previous</strong> to go back and make changes.
            </p>

            <SectionHeading>Personal Information</SectionHeading>
            <ReviewRow label="First Name"     value={data.first_name} />
            <ReviewRow label="Last Name"      value={data.last_name} />
            <ReviewRow label="Middle Name"    value={data.middle_name} />
            <ReviewRow label="Name Extension" value={data.name_extension} />
            <ReviewRow label="Date of Birth"  value={data.birth_date} />
            <ReviewRow label="Sex"            value={data.sex === "1" ? "Male" : data.sex === "0" ? "Female" : undefined} />
            <ReviewRow label="Civil Status"   value={data.civil_status ? data.civil_status.charAt(0).toUpperCase() + data.civil_status.slice(1) : undefined} />
            <ReviewRow label="Place of Birth" value={data.place_of_birth} />
            <ReviewRow label="Personal Email" value={data.personal_email} />
            <ReviewRow label="Phone Number"   value={data.phone_number} />

            <SectionHeading>Employment Details</SectionHeading>
            <ReviewRow label="Position"                   value={positionDisplay} />
            {selectedGroup?.position?.department && <ReviewRow label="Department" value={selectedGroup.position.department.department_name} />}
            {selectedGroup?.position?.division   && <ReviewRow label="Division"   value={selectedGroup.position.division.division_name} />}
            {selectedGroup?.position?.unit       && <ReviewRow label="Unit"       value={selectedGroup.position.unit.unit_name} />}
            <ReviewRow label="Employment Classification"  value={data.employment_classification || undefined} />
            <ReviewRow
                label="Salary Grade & Step"
                value={selectedSGS
                    ? `SG ${selectedSGS.salary_grade} — Step ${selectedSGS.step} (₱${Number(selectedSGS.monthly_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })})`
                    : data.salary_grade_step_id || undefined}
            />
            <ReviewRow label="Status"        value={data.status === "1" ? "Active" : data.status === "0" ? "Inactive" : undefined} />
            <ReviewRow label="Work Email"    value={data.work_email} />
            <ReviewRow label="Date Applied"  value={data.date_applied} />
            <ReviewRow label="Date Hired"    value={data.date_hired} />
            <ReviewRow label="Work Schedule" value={data.work_schedule_start && data.work_schedule_end ? `${data.work_schedule_start} – ${data.work_schedule_end}` : undefined} />

            <SectionHeading>Addresses ({addresses.length})</SectionHeading>
            {addresses.length === 0 ? <EmptyState label="No addresses provided." /> : addresses.map((a, i) => (
                <div key={i} className="text-sm py-0.5">{i + 1}. {[a.street_address, a.city, a.state, a.zip_code].filter(Boolean).join(", ")}</div>
            ))}

            <SectionHeading>Family / Emergency Contacts ({family.length})</SectionHeading>
            {family.length === 0 ? <EmptyState label="No family members provided." /> : family.map((f, i) => (
                <div key={i} className="text-sm py-0.5">{i + 1}. {f.full_name} {f.relationship && `(${f.relationship})`} {f.contact_number && `— ${f.contact_number}`}</div>
            ))}

            <SectionHeading>Government Accounts ({government.length})</SectionHeading>
            {government.length === 0 ? <EmptyState label="No government accounts provided." /> : government.map((g, i) => (
                <div key={i} className="text-sm py-0.5">{i + 1}. {g.account_type} — {g.account_number}</div>
            ))}

            <SectionHeading>Education ({education.length})</SectionHeading>
            {education.length === 0 ? <EmptyState label="No education records provided." /> : education.map((e, i) => (
                <div key={i} className="text-sm py-0.5">{i + 1}. {e.level} {e.degree && `— ${e.degree}`}, {e.school_name} {e.graduation_date && `(${e.graduation_date})`}</div>
            ))}

            <SectionHeading>Eligibility ({eligibility.length})</SectionHeading>
            {eligibility.length === 0 ? <EmptyState label="No eligibility records provided." /> : eligibility.map((e, i) => (
                <div key={i} className="text-sm py-0.5">{i + 1}. {e.eligibility_name} {e.year_passed && `— Passed: ${e.year_passed}`}</div>
            ))}
        </div>
    )
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employee', href: '/employee' },
    { title: 'Create Employee', href: '/employee/create' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateEmployee({ items, salaryGradeSteps, employmentClassifications }: CreateEmployeeProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [stepErrors,  setStepErrors]  = useState<Record<string, string>>({})
    const [processing,  setProcessing]  = useState(false)

    const [addresses,   setAddresses]   = useState<AddressRow[]>([{ street_address: "", city: "", state: "", zip_code: "" }])
    const [family,      setFamily]      = useState<FamilyRow[]>([{ full_name: "", contact_number: "", relationship: "" }])
    const [government,  setGovernment]  = useState<GovernmentRow[]>([{ account_type: "", account_number: "" }])
    const [education,   setEducation]   = useState<EducationRow[]>([{ level: "", school_name: "", school_address: "", graduation_date: "", degree: "" }])
    const [eligibility, setEligibility] = useState<EligibilityRow[]>([{ eligibility_name: "", year_passed: "" }])

    const CurrentIcon = steps[currentStep].icon
    const isLastStep  = currentStep === steps.length - 1

    const { data, setData, errors, setError, clearErrors } = useForm({
        first_name: "", last_name: "", middle_name: "", name_extension: "",
        birth_date: "", sex: "", personal_email: "", phone_number: "",
        civil_status: "", place_of_birth: "",
        item_id: "",
        selected_position_name: "",
        salary_grade_step_id: "",
        employment_classification: "",
        work_email: "", password: "", date_applied: "", date_hired: "",
        work_schedule_start: "", work_schedule_end: "", status: "",
        salary_grade: "", step: "",
    })

    function validateStep(step: number): Record<string, string> {
        const rules = REQUIRED[step] ?? []
        const newErrors: Record<string, string> = {}

        for (const { field, label } of rules) {
            const value = (data as Record<string, string>)[field]
            if (!value || value.trim() === "") newErrors[field] = `${label} is required.`
        }

        if (step === 1 && data.password && data.password.length < 8) {
            newErrors["password"] = "Password must be at least 8 characters."
        }

        if (step === 2) {
            if (addresses.length === 0) newErrors["addresses"] = "At least one address is required."
            addresses.forEach((row, i) => {
                if (!row.street_address.trim()) newErrors[`addresses.${i}.street_address`] = "Street Address is required."
                if (!row.city.trim())           newErrors[`addresses.${i}.city`]           = "City is required."
                if (!row.state.trim())          newErrors[`addresses.${i}.state`]          = "Province / State is required."
                if (!row.zip_code.trim())       newErrors[`addresses.${i}.zip_code`]       = "ZIP Code is required."
            })
        }

        if (step === 3) {
            if (family.length === 0) newErrors["family"] = "At least one family member or emergency contact is required."
            family.forEach((row, i) => {
                if (!row.full_name.trim())    newErrors[`family.${i}.full_name`]    = "Full Name is required."
                if (!row.relationship.trim()) newErrors[`family.${i}.relationship`] = "Relationship is required."
            })
        }

        if (step === 4) {
            if (government.length === 0) newErrors["government"] = "At least one government account is required."
            government.forEach((row, i) => {
                if (!row.account_type.trim())   newErrors[`government.${i}.account_type`]   = "Account Type is required."
                if (!row.account_number.trim()) newErrors[`government.${i}.account_number`] = "ID Number is required."
            })
        }

        if (step === 5) {
            if (education.length === 0) newErrors["education"] = "At least one education record is required."
            education.forEach((row, i) => {
                if (!row.school_name.trim()) newErrors[`education.${i}.school_name`] = "School Name is required."
                if (!row.level.trim())       newErrors[`education.${i}.level`]       = "Level is required."
            })
        }

        if (step === 6) {
            if (eligibility.length === 0) newErrors["eligibility"] = "At least one eligibility record is required."
            eligibility.forEach((row, i) => {
                if (!row.eligibility_name.trim()) newErrors[`eligibility.${i}.eligibility_name`] = "Eligibility Name is required."
                if (!row.year_passed.trim())      newErrors[`eligibility.${i}.year_passed`]      = "Date Passed is required."
            })
        }

        setStepErrors(newErrors)
        return newErrors
    }

    function handleNext() {
        const errs = validateStep(currentStep)
        if (Object.keys(errs).length === 0) {
            setStepErrors({})
            setCurrentStep(s => Math.min(s + 1, steps.length - 1))
        } else {
            toast.error("Please fill up required fields.", { duration: 4000 })
        }
    }

    function handlePrev() {
        setStepErrors({})
        setCurrentStep(s => Math.max(s - 1, 0))
    }

    function err(field: string): string | undefined {
        return stepErrors[field] ?? (errors as Record<string, string>)[field]
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        router.post(
            route("employee.store"),
            {
                ...data,
                addresses,
                family_info:             family,
                government_accounts:     government,
                education,
                eligibility_information: eligibility,
            },
            {
                onStart:  () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError:  (errs) => {
                    const errMap = errs as Record<string, string>
                    setStepErrors(errMap)
                    const messages = Object.values(errMap)
                    if (messages.length > 0) {
                        toast.error("Please fix the following errors", {
                            description: messages.join("\n"),
                            duration: 8000,
                        })
                    }
                },
            },
        )
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />
            <div className="px-10 pt-5">
                <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

                <form onSubmit={e => e.preventDefault()}>
                    <div className="mt-8 p-6 border rounded-md">
                        <h2 className="flex items-center gap-2 text-lg font-semibold mb-6">
                            <CurrentIcon className="w-5 h-5" />
                            {steps[currentStep].title}
                        </h2>

                        {currentStep === 0 && <PersonalStep data={data} setData={setData} err={err} />}
                        {currentStep === 1 && (
                            <EmploymentStep
                                data={data}
                                setData={setData}
                                err={err}
                                items={items}
                                salaryGradeSteps={salaryGradeSteps}
                                employmentClassifications={employmentClassifications}
                            />
                        )}
                        {currentStep === 2 && <AddressStep     rows={addresses}   setRows={setAddresses}   err={err} />}
                        {currentStep === 3 && <FamilyStep      rows={family}      setRows={setFamily}      err={err} />}
                        {currentStep === 4 && <GovernmentStep  rows={government}  setRows={setGovernment}  err={err} />}
                        {currentStep === 5 && <EducationStep   rows={education}   setRows={setEducation}   err={err} />}
                        {currentStep === 6 && <EligibilityStep rows={eligibility} setRows={setEligibility} err={err} />}
                        {currentStep === 7 && (
                            <ReviewStep
                                data={data}
                                items={items}
                                salaryGradeSteps={salaryGradeSteps}
                                addresses={addresses}
                                family={family}
                                government={government}
                                education={education}
                                eligibility={eligibility}
                            />
                        )}

                        <div className="flex justify-between mt-8">
                            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
                                Previous
                            </Button>
                            {isLastStep ? (
                                <Button type="button" onClick={submit} disabled={processing}>
                                    {processing ? "Submitting…" : "Submit Employee"}
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleNext}>Next</Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}