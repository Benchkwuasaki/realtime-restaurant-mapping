import { useState, useMemo } from "react"
import React from "react"
import { Head, router } from "@inertiajs/react"
import { route } from "ziggy-js"
import {
    Pencil, Mail, Phone, Calendar, MapPin, User, Heart, Home,
    Briefcase, Clock, FileText, Landmark, Camera, XCircle,
    Eye, EyeOff, Plus, Trash2, Save, ChevronUp,
    Pen, Upload, Download, FolderOpen, ArrowLeftRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import AppLayout from "@/layouts/app-layout"
import { type BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department { department_name: string }
interface Division { division_name: string }
interface Unit { unit_name: string }
interface Position {
    position_name: string
    department?: Department
    division?: Division
    unit?: Unit
}
interface Item {
    item_id: number
    is_occupied: boolean       // ← NEW: true if another employee holds this slot
    position?: Position
}
interface SalaryGradeStep {
    salary_grade_step_id: number
    salary_grade: number
    step: number
    monthly_salary: number
}
interface Address {
    id?: number
    street_address?: string
    city?: string
    state?: string
    zip_code?: string
}
interface Education {
    level?: string
    school_name: string
    school_address?: string
    degree?: string
    graduation_date?: string
}
interface FamilyMember {
    full_name: string
    relationship?: string
    contact_number?: string
}
interface BasicInfo {
    first_name: string
    last_name: string
    middle_name?: string
    name_extension?: string
    full_name: string
    birth_date?: string
    sex?: boolean
    civil_status?: string
    place_of_birth?: string
    personal_email?: string
    phone_number?: string
    addresses?: Address[]
    educations?: Education[]
    family_info?: FamilyMember[]
}
interface GovernmentAccount {
    government_account_id: number
    account_type: string
    account_number: string
}
interface EligibilityInfo {
    eligibility_information_id: number
    eligibility_name: string
    year_passed?: string
}
interface Allowance {
    allowance_type: string
    amount: number
}
interface LeaveBalance {
    id: number
    leave_type: string
    remaining: number
    used: number
}
interface LeaveAvailment {
    id: number
    employee_name: string
    employee_avatar?: string
    leave_type: string
    leave_date_start: string
    leave_date_end: string
    duration: number
    date_filed: string
    status: "Approved" | "Pending" | "Rejected"
}
interface UploadedFile {
    id: number
    file_name: string
    file_size: number
    created_at: string
    file_url: string
}
interface SeminarTraining {
    id: number
    seminar_name: string
    organizer?: string
    date_attended?: string
}
interface ServiceRecord {
    id: number
    position_name: string
    department_name?: string
    year_start?: string
    year_end?: string
}
interface Employee {
    employee_id: number
    work_email: string
    employment_classification: string
    date_applied?: string
    date_hired?: string
    work_schedule_start?: string
    work_schedule_end?: string
    status: boolean
    basic_info?: BasicInfo
    item?: Item
    salary_grade_step?: SalaryGradeStep
    allowances?: Allowance[]
    eligibility_information?: EligibilityInfo[]
    government_accounts?: GovernmentAccount[]
    leave_balances?: LeaveBalance[]
    leave_availments?: LeaveAvailment[]
    uploadedFiles?: UploadedFile[]
    seminarsAndTrainings?: SeminarTraining[]
    serviceRecords?: ServiceRecord[]
}
interface Props {
    employee: Employee
    items: Item[]
}

// ─── Position group (derived from items list) ─────────────────────────────────

interface PositionGroup {
    positionName: string
    position: Position | undefined
    items: Item[]
    totalSlots: number
    availableSlots: number
    isFull: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string) {
    if (!date) return undefined
    return new Date(date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
}
function fmtShort(date?: string) {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}
function cap(str?: string) {
    if (!str) return undefined
    return str.charAt(0).toUpperCase() + str.slice(1)
}
function toInputDate(date?: string) {
    if (!date) return ""
    return date.slice(0, 10)
}

/** Build position groups from the flat items array. */
function buildPositionGroups(items: Item[]): PositionGroup[] {
    const map = new Map<string, PositionGroup>()

    for (const item of items) {
        const key = item.position?.position_name ?? `__item_${item.item_id}`
        if (!map.has(key)) {
            map.set(key, {
                positionName: item.position?.position_name ?? `Item #${item.item_id}`,
                position: item.position,
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

    // Compute isFull after all items are grouped
    for (const grp of map.values()) {
        grp.isFull = grp.availableSlots === 0
    }

    return Array.from(map.values()).sort((a, b) =>
        a.positionName.localeCompare(b.positionName)
    )
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, onEdit }: {
    icon: React.ElementType; label: string; value?: string; onEdit?: () => void
}) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0 group/row">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm text-foreground font-medium leading-snug break-words">
                    {value || <span className="text-muted-foreground/40 font-normal italic text-xs">Not provided</span>}
                </p>
            </div>
            {onEdit && (
                <Button size={"icon-xs"} onClick={onEdit} variant={"ghost"}>
                    <Pencil className="w-3 h-3" />
                </Button>
            )}
        </div>
    )
}

// ─── DetailCard ───────────────────────────────────────────────────────────────

function DetailCard({ title, value, isStatus = false, statusValue, onToggleStatus, onEdit }: {
    title: string; value?: string; isStatus?: boolean; statusValue?: boolean
    onToggleStatus?: () => void; onEdit?: () => void
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">{title}</span>
                {isStatus ? (
                    <Switch checked={statusValue} onCheckedChange={onToggleStatus} className="scale-90" />
                ) : onEdit ? (
                    <Button size={'icon-xs'} onClick={onEdit} variant={"ghost"}>
                        <Pencil className="w-3 h-3" />
                    </Button>
                ) : null}
            </div>
            <div className="flex items-center gap-2">
                {isStatus ? (
                    statusValue ? (
                        <>
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <Badge className="text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border-0 rounded-md px-2.5 py-0.5">Active</Badge>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 rounded-full bg-destructive" />
                            </div>
                            <Badge className="text-xs font-semibold bg-destructive/10 text-destructive border-0 rounded-md px-2.5 py-0.5">Inactive</Badge>
                        </>
                    )
                ) : value ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <Badge className="text-xs font-semibold bg-primary text-primary-foreground border-0 rounded-md px-2.5 py-0.5 max-w-full truncate">{value}</Badge>
                    </>
                ) : (
                    <>
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
                        </div>
                        <span className="text-sm text-muted-foreground/50 italic font-normal">Not set</span>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Basic Info Edit Dialog ────────────────────────────────────────────────────

function BasicInfoEditDialog({ employee, open, onClose }: { employee: Employee; open: boolean; onClose: () => void }) {
    const basic = employee.basic_info
    const firstAddress = (basic?.addresses ?? [])[0]

    const [form, setForm] = useState({
        first_name: basic?.first_name ?? "",
        last_name: basic?.last_name ?? "",
        middle_name: basic?.middle_name ?? "",
        name_extension: basic?.name_extension ?? "",
        birth_date: toInputDate(basic?.birth_date),
        sex: basic?.sex !== undefined ? String(Number(basic.sex)) : "",
        civil_status: basic?.civil_status ?? "",
        place_of_birth: basic?.place_of_birth ?? "",
        personal_email: basic?.personal_email ?? "",
        phone_number: basic?.phone_number ?? "",
        street_address: firstAddress?.street_address ?? "",
        city: firstAddress?.city ?? "",
        state: firstAddress?.state ?? "",
        zip_code: firstAddress?.zip_code ?? "",
    })
    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
    const save = () => router.put(route("employee.update", employee.employee_id), form, { preserveScroll: true, onSuccess: onClose })

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Basic Information</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">First Name *</Label><Input value={form.first_name} onChange={e => set("first_name", e.target.value)} /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Last Name *</Label><Input value={form.last_name} onChange={e => set("last_name", e.target.value)} /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Middle Name</Label><Input value={form.middle_name} onChange={e => set("middle_name", e.target.value)} /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Extension</Label><Input value={form.name_extension} onChange={e => set("name_extension", e.target.value)} placeholder="Jr., Sr., III…" /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Date of Birth</Label><Input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} /></div>
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Sex</Label>
                        <Select value={form.sex} onValueChange={v => set("sex", v)}>
                            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent><SelectItem value="1">Male</SelectItem><SelectItem value="0">Female</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Civil Status</Label>
                        <Select value={form.civil_status} onValueChange={v => set("civil_status", v)}>
                            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Place of Birth</Label><Input value={form.place_of_birth} onChange={e => set("place_of_birth", e.target.value)} /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Personal Email</Label><Input type="email" value={form.personal_email} onChange={e => set("personal_email", e.target.value)} /></div>
                    <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Phone Number</Label><Input value={form.phone_number} onChange={e => set("phone_number", e.target.value)} /></div>
                </div>
                <div className="border-t border-border pt-3 mt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Address</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Street Address</Label><Input value={form.street_address} onChange={e => set("street_address", e.target.value)} /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Province / State</Label><Input value={form.state} onChange={e => set("state", e.target.value)} /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Zip Code</Label><Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!form.first_name || !form.last_name}><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Salary Grade Edit Dialog ─────────────────────────────────────────────────

function SalaryEditDialog({ employee, open, onClose }: { employee: Employee; open: boolean; onClose: () => void }) {
    const sgs = employee.salary_grade_step
    const [form, setForm] = useState({ salary_grade_step_id: sgs?.salary_grade_step_id?.toString() ?? "" })
    const save = () => router.put(route("employee.update", employee.employee_id), form, { preserveScroll: true, onSuccess: onClose })

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Edit Salary Classification</DialogTitle></DialogHeader>
                <div className="py-2 space-y-3">
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Salary Grade Step ID</Label>
                        <Input
                            type="number"
                            value={form.salary_grade_step_id}
                            onChange={e => setForm({ salary_grade_step_id: e.target.value })}
                            placeholder="Enter salary grade step ID"
                        />
                        {sgs && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Current: SG-{sgs.salary_grade}, Step {sgs.step} — ₱{Number(sgs.monthly_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!form.salary_grade_step_id}><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Employment Edit Dialog ───────────────────────────────────────────────────

type EditField =
    | "position"
    | "date_hired"
    | "unit_division_department"
    | "employment_classification"
    | "date_applied"
    | "work_schedule"
    | null

function EmploymentEditDialog({ employee, field, onClose, items }: {
    employee: Employee
    field: EditField
    onClose: () => void
    items: Item[]
}) {
    const open = field !== null

    // ── Build position groups once ────────────────────────────────────────────
    const positionGroups = useMemo(() => buildPositionGroups(items), [items])

    // ── Derive the currently-selected position name from the employee's item ──
    const currentItemId = employee.item?.item_id?.toString() ?? ""
    const currentPositionName = useMemo(() => {
        return items.find(i => i.item_id.toString() === currentItemId)?.position?.position_name ?? ""
    }, [items, currentItemId])

    // ── Form state ────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        // We store the resolved item_id internally for submission
        item_id: currentItemId,
        // We track which position group is "selected" in the UI
        selected_position_name: currentPositionName,
        date_hired: toInputDate(employee.date_hired),
        date_applied: toInputDate(employee.date_applied),
        employment_classification: employee.employment_classification ?? "",
        work_schedule_start: employee.work_schedule_start ?? "",
        work_schedule_end: employee.work_schedule_end ?? "",
    })

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    /**
     * When the user picks a position from the dropdown:
     * 1. If the employee's current item belongs to this group → keep their item_id
     *    (they're reassigning to the same position, no slot change needed)
     * 2. Otherwise → pick the first available (non-occupied) slot
     */
    const handlePositionSelect = (positionName: string) => {
        const grp = positionGroups.find(g => g.positionName === positionName)
        if (!grp) return

        // Does the current employee already hold a slot in this group?
        const ownSlot = grp.items.find(i => i.item_id.toString() === currentItemId)
        if (ownSlot) {
            setForm(p => ({ ...p, selected_position_name: positionName, item_id: ownSlot.item_id.toString() }))
            return
        }

        // Otherwise assign first available slot
        const firstAvailable = grp.items.find(i => !i.is_occupied)
        setForm(p => ({
            ...p,
            selected_position_name: positionName,
            item_id: firstAvailable ? firstAvailable.item_id.toString() : "",
        }))
    }

    // Derive the selected group for the info panel below the select
    const selectedGroup = useMemo(() =>
        positionGroups.find(g => g.positionName === form.selected_position_name),
        [positionGroups, form.selected_position_name]
    )

    // ── Save ──────────────────────────────────────────────────────────────────
    const save = () => {
        let data: Record<string, string> = {}
        if (field === "position") data = { item_id: form.item_id }
        if (field === "date_hired") data = { date_hired: form.date_hired }
        if (field === "date_applied") data = { date_applied: form.date_applied }
        if (field === "employment_classification") data = { employment_classification: form.employment_classification }
        if (field === "work_schedule") data = { work_schedule_start: form.work_schedule_start, work_schedule_end: form.work_schedule_end }
        router.put(route("employee.update", employee.employee_id), data, { preserveScroll: true, onSuccess: onClose })
    }

    const titles: Record<NonNullable<EditField>, string> = {
        position: "Edit Position",
        date_hired: "Edit Date Hired",
        unit_division_department: "Unit / Division / Department",
        employment_classification: "Edit Employment Classification",
        date_applied: "Edit Date Applied",
        work_schedule: "Edit Work Schedule",
    }

    // Can only save if a valid (non-full, or own) item is resolved
    const positionSaveDisabled = !form.item_id

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{field ? titles[field] : ""}</DialogTitle>
                </DialogHeader>

                <div className="py-2 space-y-3">

                    {/* ── POSITION FIELD ─────────────────────────────────────── */}
                    {field === "position" && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">
                                    Position
                                </Label>

                                <Select
                                    value={form.selected_position_name}
                                    onValueChange={handlePositionSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a position…" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72">
                                        {positionGroups.map(grp => {
                                            /**
                                             * A group is disabled when ALL slots are occupied
                                             * AND the current employee is not one of the occupants.
                                             * (If they're already in this group, they can stay there.)
                                             */
                                            const employeeIsInGroup = grp.items.some(
                                                i => i.item_id.toString() === currentItemId
                                            )
                                            const isDisabled = grp.isFull && !employeeIsInGroup

                                            return (
                                                <SelectItem
                                                    key={grp.positionName}
                                                    value={grp.positionName}
                                                    disabled={isDisabled}
                                                    className="py-2.5"
                                                >
                                                    <div className="flex items-center justify-between gap-3 w-full">
                                                        {/* Position name */}
                                                        <span className={isDisabled ? "text-muted-foreground/50" : ""}>
                                                            {grp.positionName}
                                                        </span>

                                                        {/* Slot badge */}
                                                        {grp.totalSlots > 1 && (
                                                            isDisabled ? (
                                                                <Badge className="text-[10px] font-bold bg-destructive/10 text-destructive border-0 rounded-md px-2 py-0.5 shrink-0">
                                                                    Full
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="text-[10px] font-semibold bg-accent text-accent-foreground border-0 rounded-md px-2 py-0.5 shrink-0">
                                                                    {grp.availableSlots}/{grp.totalSlots} open
                                                                </Badge>
                                                            )
                                                        )}

                                                        {/* Single-slot full indicator */}
                                                        {grp.totalSlots === 1 && isDisabled && (
                                                            <Badge className="text-[10px] font-bold bg-destructive/10 text-destructive border-0 rounded-md px-2 py-0.5 shrink-0">
                                                                Full
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>

                                {/* Helper text showing available slots for selected position */}
                                {selectedGroup && selectedGroup.totalSlots > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        {selectedGroup.availableSlots === 0
                                            ? "All slots are currently occupied."
                                            : `${selectedGroup.availableSlots} of ${selectedGroup.totalSlots} slot${selectedGroup.totalSlots > 1 ? "s" : ""} available — a slot will be auto-assigned.`
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Info panel: department / division / unit */}
                            {selectedGroup?.position && (
                                <div className="rounded-lg border border-border divide-y divide-border bg-muted/20">
                                    {selectedGroup.position.department && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-xs text-muted-foreground">Department</span>
                                            <span className="text-xs font-medium text-foreground">
                                                {selectedGroup.position.department.department_name}
                                            </span>
                                        </div>
                                    )}
                                    {selectedGroup.position.division && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-xs text-muted-foreground">Division</span>
                                            <span className="text-xs font-medium text-foreground">
                                                {selectedGroup.position.division.division_name}
                                            </span>
                                        </div>
                                    )}
                                    {selectedGroup.position.unit && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-xs text-muted-foreground">Unit</span>
                                            <span className="text-xs font-medium text-foreground">
                                                {selectedGroup.position.unit.unit_name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── OTHER FIELDS (unchanged) ───────────────────────────── */}
                    {field === "date_hired" && (
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Date Hired</Label>
                            <Input type="date" value={form.date_hired} onChange={e => set("date_hired", e.target.value)} autoFocus />
                        </div>
                    )}
                    {field === "unit_division_department" && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Unit, Division, and Department are determined by the assigned <strong>Position</strong>. To change them, update the Position.
                            </p>
                            <div className="rounded-lg border border-border divide-y divide-border">
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-sm text-muted-foreground">Unit</span>
                                    <span className="text-sm font-medium text-foreground">{employee.item?.position?.unit?.unit_name ?? "—"}</span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-sm text-muted-foreground">Division</span>
                                    <span className="text-sm font-medium text-foreground">{employee.item?.position?.division?.division_name ?? "—"}</span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-sm text-muted-foreground">Department</span>
                                    <span className="text-sm font-medium text-foreground">{employee.item?.position?.department?.department_name ?? "—"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {field === "employment_classification" && (
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Employment Classification</Label>
                            <Select value={form.employment_classification} onValueChange={v => set("employment_classification", v)}>
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Job Order">Job Order</SelectItem>
                                    <SelectItem value="Casual">Casual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {field === "date_applied" && (
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Date Applied</Label>
                            <Input type="date" value={form.date_applied} onChange={e => set("date_applied", e.target.value)} autoFocus />
                        </div>
                    )}
                    {field === "work_schedule" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Start Time</Label>
                                <Input type="time" value={form.work_schedule_start} onChange={e => set("work_schedule_start", e.target.value)} autoFocus />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">End Time</Label>
                                <Input type="time" value={form.work_schedule_end} onChange={e => set("work_schedule_end", e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {field !== "unit_division_department" && (
                        <Button onClick={save} disabled={field === "position" && positionSaveDisabled}>
                            <Save className="w-3.5 h-3.5 mr-1.5" />Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Employment Tab ───────────────────────────────────────────────────────────

function EmploymentDetailsTab({ employee, items }: { employee: Employee; items: Item[] }) {
    const position = employee.item?.position
    const [editField, setEditField] = useState<EditField>(null)
    const toggleStatus = () => router.patch(route("employee.toggleStatus", employee.employee_id), {}, { preserveScroll: true })

    return (
        <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
                <DetailCard title="Position" value={position?.position_name} onEdit={() => setEditField("position")} />
                <DetailCard title="Date Hired" value={fmt(employee.date_hired)} onEdit={() => setEditField("date_hired")} />
                <DetailCard title="Status" isStatus statusValue={employee.status} onToggleStatus={toggleStatus} />
                <DetailCard title="Unit" value={position?.unit?.unit_name} onEdit={() => setEditField("unit_division_department")} />
                <DetailCard title="Division" value={position?.division?.division_name} onEdit={() => setEditField("unit_division_department")} />
                <DetailCard title="Department" value={position?.department?.department_name} onEdit={() => setEditField("unit_division_department")} />
                <DetailCard title="Employment Classification" value={employee.employment_classification} onEdit={() => setEditField("employment_classification")} />
                <DetailCard title="Date Applied" value={fmt(employee.date_applied)} onEdit={() => setEditField("date_applied")} />
                <DetailCard
                    title="Work Schedule"
                    value={employee.work_schedule_start && employee.work_schedule_end
                        ? `${employee.work_schedule_start} – ${employee.work_schedule_end}`
                        : undefined}
                    onEdit={() => setEditField("work_schedule")}
                />
            </div>
            <EmploymentEditDialog employee={employee} field={editField} onClose={() => setEditField(null)} items={items} />
        </div>
    )
}

// ─── Compensation Tab ─────────────────────────────────────────────────────────

function CompensationTab({ employee }: { employee: Employee }) {
    const sgs = employee.salary_grade_step
    const allowances = employee.allowances ?? []
    const [salaryEditOpen, setSalaryEditOpen] = useState(false)

    return (
        <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                        <span className="text-sm font-bold text-foreground">Salary Classification</span>
                        <Button onClick={() => setSalaryEditOpen(true)} variant="ghost" size="icon-xs">
                            <Pen className="w-3 h-3" />
                        </Button>
                    </div>
                    {sgs ? (
                        <div className="divide-y divide-border">
                            <div className="flex items-center justify-between px-5 py-3"><span className="text-sm text-muted-foreground">Salary Grade</span><span className="text-sm font-bold text-foreground">SG-{sgs.salary_grade}</span></div>
                            <div className="flex items-center justify-between px-5 py-3"><span className="text-sm text-muted-foreground">Step Number</span><span className="text-sm font-bold text-foreground">Step {sgs.step}</span></div>
                            <div className="flex items-center justify-between px-5 py-3"><span className="text-sm text-muted-foreground">Amount</span><span className="text-sm font-bold text-foreground">₱{Number(sgs.monthly_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground italic">No salary data.</div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                        <span className="text-sm font-bold text-foreground">Allowances</span>
                    </div>
                    {allowances.length > 0 ? (
                        <div className="divide-y divide-border">
                            {allowances.map((a, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3">
                                    <span className="text-sm text-muted-foreground">{a.allowance_type}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-foreground">₱{Number(a.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                                        <Badge className="text-[10px] font-semibold bg-accent text-accent-foreground border-0 rounded-md px-2 py-0.5">Present</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground italic">No allowances on file.</div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Payroll Data</span>
                </div>
                <div className="px-5 py-8 text-center text-sm text-muted-foreground italic">No payroll data available.</div>
            </div>

            <SalaryEditDialog employee={employee} open={salaryEditOpen} onClose={() => setSalaryEditOpen(false)} />
        </div>
    )
}

// ─── Leave Information Tab ────────────────────────────────────────────────────

function LeaveInformationTab({ employee }: { employee: Employee }) {
    const balances = employee.leave_balances ?? []
    const availments = employee.leave_availments ?? []

    const [balanceDialog, setBalanceDialog] = useState<{
        open: boolean; id?: number; leave_type: string; remaining: string; used: string
    }>({ open: false, leave_type: "", remaining: "", used: "" })
    const [deleteBalanceId, setDeleteBalanceId] = useState<number | null>(null)

    const openBalanceDialog = (b?: LeaveBalance) => setBalanceDialog({
        open: true, id: b?.id,
        leave_type: b?.leave_type ?? "",
        remaining: b?.remaining?.toString() ?? "",
        used: b?.used?.toString() ?? "",
    })

    const saveBalance = () => {
        const data = {
            leave_type: balanceDialog.leave_type,
            remaining: parseFloat(balanceDialog.remaining),
            used: parseFloat(balanceDialog.used),
        }
        if (balanceDialog.id) {
            router.put(
                route("employee.leave-balance.update", { employee: employee.employee_id, balance: balanceDialog.id }),
                data,
                { preserveScroll: true, onSuccess: () => setBalanceDialog(p => ({ ...p, open: false })) }
            )
        } else {
            router.post(
                route("employee.leave-balance.store", employee.employee_id),
                data,
                { preserveScroll: true, onSuccess: () => setBalanceDialog(p => ({ ...p, open: false })) }
            )
        }
    }

    const confirmDeleteBalance = () => {
        if (!deleteBalanceId) return
        router.delete(
            route("employee.leave-balance.destroy", { employee: employee.employee_id, balance: deleteBalanceId }),
            { preserveScroll: true, onSuccess: () => setDeleteBalanceId(null) }
        )
    }

    return (
        <div className="p-5 space-y-5">
            {/* Leave Balances */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Leave Balances</span>
                    <button onClick={() => openBalanceDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-[auto_1fr_120px_120px_80px] items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/30">
                    <div className="w-5" />
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">Leave Type <ChevronUp className="w-3 h-3" /></span>
                    <span className="text-xs font-semibold text-muted-foreground text-right">Remaining</span>
                    <span className="text-xs font-semibold text-muted-foreground text-right">Used</span>
                    <span className="text-xs font-semibold text-muted-foreground text-right">Actions</span>
                </div>
                {balances.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No leave balances on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openBalanceDialog()} className="gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Leave Balance
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {balances.map(b => (
                            <div key={b.id} className="grid grid-cols-[auto_1fr_120px_120px_80px] items-center gap-2 px-5 py-3 hover:bg-muted/20 transition-colors group/row">
                                <Checkbox className="w-4 h-4" />
                                <span className="text-sm text-muted-foreground">{b.leave_type}</span>
                                <span className="text-sm text-foreground font-medium text-right">{b.remaining}</span>
                                <span className="text-sm text-foreground font-medium text-right">{b.used}</span>
                                <div className="flex items-center justify-end gap-1">
                                    <Button onClick={() => openBalanceDialog(b)} variant="ghost" size="icon-xs">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button onClick={() => setDeleteBalanceId(b.id)} variant="ghost" size="icon-xs">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leave Availments */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Leave Availments</span>
                    <button className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-[auto_auto_1fr_1fr_100px_110px_100px] items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/30">
                    <div className="w-5" />
                    <div className="w-8" />
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">Leave Type <ChevronUp className="w-3 h-3" /></span>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">Leave Date <ChevronUp className="w-3 h-3" /></span>
                    <span className="text-xs font-semibold text-muted-foreground">Duration</span>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">Date Filed <ChevronUp className="w-3 h-3" /></span>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">Status <ChevronUp className="w-3 h-3" /></span>
                </div>
                {availments.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground italic">No leave availments on record.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {availments.map(a => (
                            <div key={a.id} className="grid grid-cols-[auto_auto_1fr_1fr_100px_110px_100px] items-center gap-2 px-5 py-3 hover:bg-muted/20 transition-colors">
                                <Checkbox className="w-4 h-4" />
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                                    <img
                                        src={a.employee_avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(a.employee_name)}&background=5854cc&color=fff&size=32`}
                                        alt={a.employee_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-foreground font-medium truncate">{a.employee_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{a.leave_type}</p>
                                </div>
                                <span className="text-sm text-muted-foreground">{fmtShort(a.leave_date_start)} — {fmtShort(a.leave_date_end)}</span>
                                <span className="text-sm text-foreground font-medium">{a.duration} days</span>
                                <span className="text-sm text-muted-foreground">{fmtShort(a.date_filed)}</span>
                                <Badge className={`text-[10px] font-bold border-0 rounded-full px-2.5 py-0.5 w-fit ${a.status === "Approved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" :
                                        a.status === "Pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" :
                                            "bg-destructive/10 text-destructive"
                                    }`}>● {a.status}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leave Balance Dialog */}
            <Dialog open={balanceDialog.open} onOpenChange={open => setBalanceDialog(p => ({ ...p, open }))}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{balanceDialog.id ? "Edit" : "Add"} Leave Balance</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Leave Type</Label>
                            <Select value={balanceDialog.leave_type} onValueChange={v => setBalanceDialog(p => ({ ...p, leave_type: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select leave type…" /></SelectTrigger>
                                <SelectContent>
                                    {["Vacation Leave", "Sick Leave", "Special Leave", "Bereavement Leave", "Maternity/Paternity Leave", "Privilege Leave"].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Remaining</Label><Input type="number" step="0.1" value={balanceDialog.remaining} onChange={e => setBalanceDialog(p => ({ ...p, remaining: e.target.value }))} /></div>
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Used</Label><Input type="number" step="0.1" value={balanceDialog.used} onChange={e => setBalanceDialog(p => ({ ...p, used: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBalanceDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveBalance} disabled={!balanceDialog.leave_type}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteBalanceId} onOpenChange={open => !open && setDeleteBalanceId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Leave Balance</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this leave balance? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteBalance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ─── Government & Eligibility Tab ─────────────────────────────────────────────

const STANDARD_GOV_ID_TYPES = ["GSIS", "PhilHealth", "Pag-IBIG", "TIN"]

function GovernmentEligibilityTab({ employee }: { employee: Employee }) {
    const govAccounts = employee.government_accounts ?? []
    const eligibilities = employee.eligibility_information ?? []

    const [visibleIds, setVisibleIds] = useState<Record<string, boolean>>({})
    const toggleVisibility = (key: string) => setVisibleIds(prev => ({ ...prev, [key]: !prev[key] }))

    const [govDialog, setGovDialog] = useState<{
        open: boolean; mode: "standard" | "custom"
        type: string; id?: number; value: string; customTypeName: string
    }>({ open: false, mode: "standard", type: "", value: "", customTypeName: "" })

    const openEditGovDialog = (type: string, existing: GovernmentAccount) =>
        setGovDialog({ open: true, mode: "standard", type, id: existing.government_account_id, value: existing.account_number, customTypeName: "" })

    const openAddCustomDialog = () =>
        setGovDialog({ open: true, mode: "custom", type: "", id: undefined, value: "", customTypeName: "" })

    const saveGovAccount = () => {
        if (!govDialog.value.trim()) return
        const accountType = govDialog.mode === "custom" ? govDialog.customTypeName : govDialog.type
        if (!accountType.trim()) return

        if (govDialog.id) {
            router.put(
                route("employee.government-account.update", { employee: employee.employee_id, account: govDialog.id }),
                { account_number: govDialog.value },
                { preserveScroll: true, onSuccess: () => setGovDialog(p => ({ ...p, open: false })) }
            )
        } else {
            router.post(
                route("employee.government-account.store", employee.employee_id),
                { account_type: accountType, account_number: govDialog.value },
                { preserveScroll: true, onSuccess: () => setGovDialog(p => ({ ...p, open: false })) }
            )
        }
    }

    const accountMap = Object.fromEntries(govAccounts.map(g => [g.account_type.toLowerCase(), g]))
    const standardKeys = STANDARD_GOV_ID_TYPES.map(t => t.toLowerCase())
    const extraAccounts = govAccounts.filter(g => !standardKeys.includes(g.account_type.toLowerCase()))

    const [eligDialog, setEligDialog] = useState<{ open: boolean; id?: number; name: string; year: string }>
        ({ open: false, name: "", year: "" })

    const openEligDialog = (existing?: EligibilityInfo) =>
        setEligDialog({
            open: true,
            id: existing?.eligibility_information_id,
            name: existing?.eligibility_name ?? "",
            year: existing?.year_passed?.slice(0, 10) ?? "",
        })

    const saveEligibility = () => {
        if (!eligDialog.name.trim()) return
        const data = { eligibility_name: eligDialog.name, year_passed: eligDialog.year || null }
        if (eligDialog.id) {
            router.put(
                route("employee.eligibility.update", { employee: employee.employee_id, eligibility: eligDialog.id }),
                data,
                { preserveScroll: true, onSuccess: () => setEligDialog(p => ({ ...p, open: false })) }
            )
        } else {
            router.post(
                route("employee.eligibility.store", employee.employee_id),
                data,
                { preserveScroll: true, onSuccess: () => setEligDialog(p => ({ ...p, open: false })) }
            )
        }
    }

    return (
        <div className="p-5 space-y-5">
            {/* Government IDs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Government ID Numbers</span>
                    <button onClick={openAddCustomDialog} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="divide-y divide-border">
                    {STANDARD_GOV_ID_TYPES.map(type => {
                        const key = type.toLowerCase()
                        const account = accountMap[key]
                        const isVisible = visibleIds[key]
                        return (
                            <div key={type} className="flex items-center gap-4 px-5 py-3">
                                <span className="text-sm text-foreground w-28 shrink-0 font-medium">{type}</span>
                                <span className="flex-1 text-sm text-muted-foreground font-mono tracking-widest">
                                    {account
                                        ? (isVisible ? account.account_number : "•".repeat(10))
                                        : <span className="italic text-muted-foreground/40 font-sans tracking-normal text-xs">Not provided</span>
                                    }
                                </span>
                                <div className="flex items-center gap-1">
                                    {account ? (
                                        <>
                                            <button onClick={() => toggleVisibility(key)} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                            <Button onClick={() => openEditGovDialog(type, account)} variant={"ghost"} size={"icon-xs"}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setGovDialog({ open: true, mode: "standard", type, id: undefined, value: "", customTypeName: "" })} variant={"ghost"} size={"icon-xs"}>
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {extraAccounts.map(account => {
                        const key = account.account_type.toLowerCase()
                        const isVisible = visibleIds[key]
                        return (
                            <div key={account.government_account_id} className="flex items-center gap-4 px-5 py-3">
                                <span className="text-sm text-foreground w-28 shrink-0 font-medium">{account.account_type}</span>
                                <span className="flex-1 text-sm text-muted-foreground font-mono tracking-widest">
                                    {isVisible ? account.account_number : "•".repeat(10)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => toggleVisibility(key)} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <Button onClick={() => openEditGovDialog(account.account_type, account)} variant="ghost" size="icon-xs">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Eligibility */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Eligibility and Credentials</span>
                    <button onClick={() => openEligDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {eligibilities.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No eligibility records on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openEligDialog()} className="gap-1.5">
                            <Plus className="w-3.5 h-3.5" />Add Eligibility
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {eligibilities.map(e => (
                            <div key={e.eligibility_information_id} className="flex items-center gap-4 px-5 py-3">
                                <span className="text-sm text-foreground flex-1 font-medium">{e.eligibility_name}</span>
                                <span className="text-sm text-muted-foreground w-36 text-right shrink-0">{e.year_passed ? fmt(e.year_passed) : "—"}</span>
                                <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border-0 rounded-md px-2.5 py-0.5 shrink-0">✓ Active</Badge>
                                <Button onClick={() => openEligDialog(e)} variant={"ghost"} size={"icon-xs"}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Government ID Dialog */}
            <Dialog open={govDialog.open} onOpenChange={open => setGovDialog(p => ({ ...p, open }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {govDialog.id
                                ? `Edit ${govDialog.type} Number`
                                : govDialog.mode === "custom"
                                    ? "Add Government ID"
                                    : `Add ${govDialog.type} Number`
                            }
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        {govDialog.mode === "custom" && !govDialog.id && (
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">ID Type / Name</Label>
                                <Input value={govDialog.customTypeName} onChange={e => setGovDialog(p => ({ ...p, customTypeName: e.target.value }))} placeholder="e.g. Postal ID, Voter's ID…" autoFocus />
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Account / ID Number</Label>
                            <Input
                                value={govDialog.value}
                                onChange={e => setGovDialog(p => ({ ...p, value: e.target.value }))}
                                placeholder={`Enter ${govDialog.mode === "custom" ? govDialog.customTypeName || "ID" : govDialog.type} number`}
                                className="font-mono"
                                autoFocus={govDialog.mode !== "custom"}
                                onKeyDown={e => e.key === "Enter" && saveGovAccount()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGovDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveGovAccount} disabled={!govDialog.value.trim() || (govDialog.mode === "custom" && !govDialog.id && !govDialog.customTypeName.trim())}>
                            <Save className="w-3.5 h-3.5 mr-1.5" />Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Eligibility Dialog */}
            <Dialog open={eligDialog.open} onOpenChange={open => setEligDialog(p => ({ ...p, open }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{eligDialog.id ? "Edit" : "Add"} Eligibility</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Eligibility Name</Label>
                            <Input value={eligDialog.name} onChange={e => setEligDialog(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Career Service Professional" autoFocus />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Year Passed</Label>
                            <Input type="date" value={eligDialog.year} onChange={e => setEligDialog(p => ({ ...p, year: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEligDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveEligibility} disabled={!eligDialog.name.trim()}>
                            <Save className="w-3.5 h-3.5 mr-1.5" />Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── Background Information Tab ───────────────────────────────────────────────

function BackgroundInformationTab({ employee }: { employee: Employee }) {
    const basic = employee.basic_info
    const familyMembers = basic?.family_info ?? []
    const educations = basic?.educations ?? []
    const seminars = employee.seminarsAndTrainings ?? []
    const serviceRecs = employee.serviceRecords ?? []

    // ── Family ────────────────────────────────────────────────────
    const [familyDialog, setFamilyDialog] = useState<{
        open: boolean; index?: number
        full_name: string; relationship: string; contact_number: string
    }>({ open: false, full_name: "", relationship: "", contact_number: "" })
    const [deleteFamilyIndex, setDeleteFamilyIndex] = useState<number | null>(null)

    const openFamilyDialog = (member?: FamilyMember, index?: number) =>
        setFamilyDialog({ open: true, index, full_name: member?.full_name ?? "", relationship: member?.relationship ?? "", contact_number: member?.contact_number ?? "" })

    const saveFamilyMember = () => {
        const data = { full_name: familyDialog.full_name, relationship: familyDialog.relationship, contact_number: familyDialog.contact_number }
        if (familyDialog.index !== undefined) {
            router.put(route("employee.family.update", { employee: employee.employee_id, index: familyDialog.index }), data, { preserveScroll: true, onSuccess: () => setFamilyDialog(p => ({ ...p, open: false })) })
        } else {
            router.post(route("employee.family.store", employee.employee_id), data, { preserveScroll: true, onSuccess: () => setFamilyDialog(p => ({ ...p, open: false })) })
        }
    }

    const confirmDeleteFamily = () => {
        if (deleteFamilyIndex === null) return
        router.delete(route("employee.family.destroy", { employee: employee.employee_id, index: deleteFamilyIndex }), { preserveScroll: true, onSuccess: () => setDeleteFamilyIndex(null) })
    }

    // ── Education ──────────────────────────────────────────────────
    const [educDialog, setEducDialog] = useState<{
        open: boolean; index?: number
        level: string; school_name: string; school_address: string; degree: string; graduation_date: string
    }>({ open: false, level: "", school_name: "", school_address: "", degree: "", graduation_date: "" })
    const [deleteEducIndex, setDeleteEducIndex] = useState<number | null>(null)

    const openEducDialog = (edu?: Education, index?: number) =>
        setEducDialog({ open: true, index, level: edu?.level ?? "", school_name: edu?.school_name ?? "", school_address: edu?.school_address ?? "", degree: edu?.degree ?? "", graduation_date: toInputDate(edu?.graduation_date) })

    const saveEducation = () => {
        const data = { level: educDialog.level, school_name: educDialog.school_name, school_address: educDialog.school_address, degree: educDialog.degree, graduation_date: educDialog.graduation_date || null }
        if (educDialog.index !== undefined) {
            router.put(route("employee.education.update", { employee: employee.employee_id, index: educDialog.index }), data, { preserveScroll: true, onSuccess: () => setEducDialog(p => ({ ...p, open: false })) })
        } else {
            router.post(route("employee.education.store", employee.employee_id), data, { preserveScroll: true, onSuccess: () => setEducDialog(p => ({ ...p, open: false })) })
        }
    }

    const confirmDeleteEduc = () => {
        if (deleteEducIndex === null) return
        router.delete(route("employee.education.destroy", { employee: employee.employee_id, index: deleteEducIndex }), { preserveScroll: true, onSuccess: () => setDeleteEducIndex(null) })
    }

    const educByLevel = educations.reduce<Record<string, Education[]>>((acc, edu) => {
        const key = edu.level ?? "Other"
        if (!acc[key]) acc[key] = []
        acc[key].push(edu)
        return acc
    }, {})

    // ── Seminars ───────────────────────────────────────────────────
    const [seminarDialog, setSeminarDialog] = useState<{
        open: boolean; id?: number; seminar_name: string; organizer: string; date_attended: string
    }>({ open: false, seminar_name: "", organizer: "", date_attended: "" })
    const [deleteSeminarId, setDeleteSeminarId] = useState<number | null>(null)

    const openSeminarDialog = (s?: SeminarTraining) =>
        setSeminarDialog({ open: true, id: s?.id, seminar_name: s?.seminar_name ?? "", organizer: s?.organizer ?? "", date_attended: toInputDate(s?.date_attended) })

    const saveSeminar = () => {
        const data = { seminar_name: seminarDialog.seminar_name, organizer: seminarDialog.organizer, date_attended: seminarDialog.date_attended || null }
        if (seminarDialog.id) {
            router.put(route("employee.seminar.update", { employee: employee.employee_id, seminar: seminarDialog.id }), data, { preserveScroll: true, onSuccess: () => setSeminarDialog(p => ({ ...p, open: false })) })
        } else {
            router.post(route("employee.seminar.store", employee.employee_id), data, { preserveScroll: true, onSuccess: () => setSeminarDialog(p => ({ ...p, open: false })) })
        }
    }

    const confirmDeleteSeminar = () => {
        if (!deleteSeminarId) return
        router.delete(route("employee.seminar.destroy", { employee: employee.employee_id, seminar: deleteSeminarId }), { preserveScroll: true, onSuccess: () => setDeleteSeminarId(null) })
    }

    // ── Service Records ────────────────────────────────────────────
    const [serviceDialog, setServiceDialog] = useState<{
        open: boolean; id?: number; position_name: string; department_name: string; year_start: string; year_end: string
    }>({ open: false, position_name: "", department_name: "", year_start: "", year_end: "" })
    const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null)

    const openServiceDialog = (s?: ServiceRecord) =>
        setServiceDialog({ open: true, id: s?.id, position_name: s?.position_name ?? "", department_name: s?.department_name ?? "", year_start: s?.year_start ?? "", year_end: s?.year_end ?? "" })

    const saveServiceRecord = () => {
        const data = { position_name: serviceDialog.position_name, department_name: serviceDialog.department_name, year_start: serviceDialog.year_start, year_end: serviceDialog.year_end }
        if (serviceDialog.id) {
            router.put(route("employee.service-record.update", { employee: employee.employee_id, record: serviceDialog.id }), data, { preserveScroll: true, onSuccess: () => setServiceDialog(p => ({ ...p, open: false })) })
        } else {
            router.post(route("employee.service-record.store", employee.employee_id), data, { preserveScroll: true, onSuccess: () => setServiceDialog(p => ({ ...p, open: false })) })
        }
    }

    const confirmDeleteService = () => {
        if (!deleteServiceId) return
        router.delete(route("employee.service-record.destroy", { employee: employee.employee_id, record: deleteServiceId }), { preserveScroll: true, onSuccess: () => setDeleteServiceId(null) })
    }

    return (
        <div className="p-5 space-y-5">

            {/* ── Family Information ───────────────────────────────── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Family Information</span>
                    <button onClick={() => openFamilyDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {familyMembers.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No family information on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openFamilyDialog()} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Family Member</Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {familyMembers.map((member, i) => (
                            <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_80px] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                <Checkbox className="w-4 h-4" />
                                <span className="text-sm text-foreground font-medium">{member.full_name}</span>
                                <span className="text-sm text-muted-foreground">{member.relationship ?? "—"}</span>
                                <span className="text-sm text-muted-foreground">{member.contact_number ?? "—"}</span>
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon-xs" onClick={() => openFamilyDialog(member, i)}><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteFamilyIndex(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Educational Background ───────────────────────────── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Educational Background</span>
                    <button onClick={() => openEducDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {educations.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No educational records on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openEducDialog()} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Education</Button>
                    </div>
                ) : (
                    Object.entries(educByLevel).map(([level, edus]) => (
                        <div key={level}>
                            <div className="px-5 py-2 bg-muted/30 border-y border-border">
                                <span className="text-xs font-semibold text-muted-foreground">{level}</span>
                            </div>
                            <div className="divide-y divide-border">
                                {edus.map((edu, i) => {
                                    const globalIndex = educations.indexOf(edu)
                                    return (
                                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_80px_100px_80px] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                            <Checkbox className="w-4 h-4" />
                                            <span className="text-sm text-foreground font-medium">{edu.school_name}</span>
                                            <span className="text-sm text-muted-foreground">{edu.school_address ?? "—"}</span>
                                            <span className="text-sm text-muted-foreground">{edu.degree ?? "—"}</span>
                                            <span className="text-sm text-muted-foreground text-right">{edu.graduation_date ? new Date(edu.graduation_date).getFullYear() : "—"}</span>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon-xs" onClick={() => openEducDialog(edu, globalIndex)}><Pencil className="w-3.5 h-3.5" /></Button>
                                                <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteEducIndex(globalIndex)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Seminars and Trainings ───────────────────────────── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Seminars and Trainings</span>
                    <button onClick={() => openSeminarDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {seminars.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No seminars or trainings on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openSeminarDialog()} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Seminar</Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {seminars.map(s => (
                            <div key={s.id} className="grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                <Checkbox className="w-4 h-4" />
                                <span className="text-sm text-foreground font-medium">{s.seminar_name}</span>
                                <span className="text-sm text-muted-foreground">{s.organizer ?? "—"}</span>
                                <span className="text-sm text-muted-foreground text-right">{fmtShort(s.date_attended)}</span>
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon-xs" onClick={() => openSeminarDialog(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteSeminarId(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Service Records ──────────────────────────────────── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Service Records</span>
                    <button onClick={() => openServiceDialog()} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {serviceRecs.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-sm text-muted-foreground italic mb-3">No service records on file.</p>
                        <Button variant="outline" size="sm" onClick={() => openServiceDialog()} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Service Record</Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {serviceRecs.map(s => (
                            <div key={s.id} className="grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                <Checkbox className="w-4 h-4" />
                                <span className="text-sm text-foreground font-medium">{s.position_name}</span>
                                <span className="text-sm text-muted-foreground">{s.department_name ?? "—"}</span>
                                <span className="text-sm text-muted-foreground text-right">{s.year_start && s.year_end ? `${s.year_start}–${s.year_end}` : s.year_start ?? "—"}</span>
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon-xs" onClick={() => openServiceDialog(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteServiceId(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ DIALOGS ══════════════════════════════════════════ */}

            {/* Family Dialog */}
            <Dialog open={familyDialog.open} onOpenChange={o => setFamilyDialog(p => ({ ...p, open: o }))}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{familyDialog.index !== undefined ? "Edit" : "Add"} Family Member</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Full Name *</Label>
                            <Input value={familyDialog.full_name} onChange={e => setFamilyDialog(p => ({ ...p, full_name: e.target.value }))} autoFocus /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Relationship</Label>
                            <Select value={familyDialog.relationship} onValueChange={v => setFamilyDialog(p => ({ ...p, relationship: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    {["Spouse", "Child", "Parent", "Sibling", "Guardian", "Other"].map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Contact Number</Label>
                            <Input value={familyDialog.contact_number} onChange={e => setFamilyDialog(p => ({ ...p, contact_number: e.target.value }))} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFamilyDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveFamilyMember} disabled={!familyDialog.full_name.trim()}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Education Dialog */}
            <Dialog open={educDialog.open} onOpenChange={o => setEducDialog(p => ({ ...p, open: o }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{educDialog.index !== undefined ? "Edit" : "Add"} Education</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Education Level</Label>
                            <Select value={educDialog.level} onValueChange={v => setEducDialog(p => ({ ...p, level: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select level…" /></SelectTrigger>
                                <SelectContent>
                                    {["Elementary Education", "Secondary Education", "Vocational / Technical", "Bachelor's Degree", "Master's Degree", "Doctorate", "Other"].map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">School Name *</Label>
                            <Input value={educDialog.school_name} onChange={e => setEducDialog(p => ({ ...p, school_name: e.target.value }))} autoFocus /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">School Address</Label>
                            <Input value={educDialog.school_address} onChange={e => setEducDialog(p => ({ ...p, school_address: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Degree / Course</Label>
                                <Input value={educDialog.degree} onChange={e => setEducDialog(p => ({ ...p, degree: e.target.value }))} /></div>
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Graduation Date</Label>
                                <Input type="date" value={educDialog.graduation_date} onChange={e => setEducDialog(p => ({ ...p, graduation_date: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEducDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveEducation} disabled={!educDialog.school_name.trim()}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Seminar Dialog */}
            <Dialog open={seminarDialog.open} onOpenChange={o => setSeminarDialog(p => ({ ...p, open: o }))}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{seminarDialog.id ? "Edit" : "Add"} Seminar / Training</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Seminar / Training Name *</Label>
                            <Input value={seminarDialog.seminar_name} onChange={e => setSeminarDialog(p => ({ ...p, seminar_name: e.target.value }))} autoFocus /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Organizer</Label>
                            <Input value={seminarDialog.organizer} onChange={e => setSeminarDialog(p => ({ ...p, organizer: e.target.value }))} /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Date Attended</Label>
                            <Input type="date" value={seminarDialog.date_attended} onChange={e => setSeminarDialog(p => ({ ...p, date_attended: e.target.value }))} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSeminarDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveSeminar} disabled={!seminarDialog.seminar_name.trim()}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Service Record Dialog */}
            <Dialog open={serviceDialog.open} onOpenChange={o => setServiceDialog(p => ({ ...p, open: o }))}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{serviceDialog.id ? "Edit" : "Add"} Service Record</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Position Name *</Label>
                            <Input value={serviceDialog.position_name} onChange={e => setServiceDialog(p => ({ ...p, position_name: e.target.value }))} autoFocus /></div>
                        <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Department</Label>
                            <Input value={serviceDialog.department_name} onChange={e => setServiceDialog(p => ({ ...p, department_name: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Year Start</Label>
                                <Input type="number" min="1900" max="2100" placeholder="e.g. 2020" value={serviceDialog.year_start} onChange={e => setServiceDialog(p => ({ ...p, year_start: e.target.value }))} /></div>
                            <div><Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Year End</Label>
                                <Input type="number" min="1900" max="2100" placeholder="e.g. 2026" value={serviceDialog.year_end} onChange={e => setServiceDialog(p => ({ ...p, year_end: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                        <Button onClick={saveServiceRecord} disabled={!serviceDialog.position_name.trim()}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirms */}
            {[
                { open: deleteFamilyIndex !== null, onClose: () => setDeleteFamilyIndex(null), onConfirm: confirmDeleteFamily, label: "family member" },
                { open: deleteEducIndex !== null, onClose: () => setDeleteEducIndex(null), onConfirm: confirmDeleteEduc, label: "education record" },
                { open: !!deleteSeminarId, onClose: () => setDeleteSeminarId(null), onConfirm: confirmDeleteSeminar, label: "seminar" },
                { open: !!deleteServiceId, onClose: () => setDeleteServiceId(null), onConfirm: confirmDeleteService, label: "service record" },
            ].map(({ open, onClose, onConfirm, label }) => (
                <AlertDialog key={label} open={open} onOpenChange={o => !o && onClose()}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ))}
        </div>
    )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ employee }: { employee: Employee }) {
    const uploadedFiles = employee.uploadedFiles ?? []
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append("file", file)
        router.post(route("employee.file.store", employee.employee_id), formData, { preserveScroll: true })
        e.target.value = ""
    }

    const confirmDeleteFile = () => {
        if (!deleteFileId) return
        router.delete(
            route("employee.file.destroy", { employee: employee.employee_id, file: deleteFileId }),
            { preserveScroll: true, onSuccess: () => setDeleteFileId(null) }
        )
    }

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    return (
        <div className="p-5">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <span className="text-sm font-bold text-foreground">Uploaded Files</span>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        title="Upload file"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>

                {uploadedFiles.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground italic mb-3">No files uploaded yet.</p>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                            <Upload className="w-3.5 h-3.5" /> Upload File
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {uploadedFiles.map(file => (
                            <div key={file.id} className="grid grid-cols-[auto_1fr_120px_160px_80px] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                <Checkbox className="w-4 h-4" />
                                <span className="text-sm text-foreground truncate">{file.file_name}</span>
                                <span className="text-sm text-muted-foreground text-right">{formatBytes(file.file_size)}</span>
                                <span className="text-sm text-muted-foreground text-right">{fmtShort(file.created_at)}</span>
                                <div className="flex items-center justify-end gap-1">
                                    <a href={file.file_url} download>
                                        <Button variant="ghost" size="icon-xs" title="Download">
                                            <Download className="w-3.5 h-3.5" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteFileId(file.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteFileId} onOpenChange={o => !o && setDeleteFileId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete File?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the file. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowEmployee({ employee, items }: Props) {
    const basic = employee.basic_info
    const position = employee.item?.position
    const firstAddress = (basic?.addresses ?? [])[0]
    const addressStr = firstAddress
        ? [firstAddress.street_address, firstAddress.city, firstAddress.state].filter(Boolean).join(", ")
        : undefined

    const [basicEditOpen, setBasicEditOpen] = useState(false)

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Employee", href: route("employee.index") },
        { title: "Employee Profile", href: "#" },
    ]

    const tabs = [
        { value: "employment", label: "Employment Details", icon: Briefcase },
        { value: "compensation", label: "Compensation", icon: FileText },
        { value: "leave", label: "Leave Information", icon: Calendar },
        { value: "time", label: "Time Records", icon: Clock },
        { value: "government", label: "Government Eligibility", icon: Landmark },
        { value: "background", label: "Background Information", icon: User },
        { value: "documents", label: "Documents", icon: FolderOpen },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${basic?.full_name ?? "Employee"} — Profile`} />
            <div className="flex gap-5 p-5 min-h-full bg-background">

                {/* ── Left Panel ── */}
                <div className="w-72 shrink-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="relative flex flex-col items-center pt-8 pb-5 px-5 bg-gradient-to-b from-accent/30 to-card border-b border-border">
                        <div className="absolute top-3 right-3">
                            <Button size={"icon-xs"} onClick={() => setBasicEditOpen(true)} variant={"ghost"}>
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-card shadow-lg ring-2 ring-primary/20">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(basic?.full_name ?? "E")}&background=5854cc&color=fff&size=96`}
                                    alt={basic?.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity border-2 border-card">
                                <Camera className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="mt-4 text-center">
                            <h1 className="text-base font-bold text-foreground leading-tight">{basic?.full_name ?? "—"}</h1>
                            <p className="text-xs text-primary font-semibold mt-0.5">{position?.position_name ?? "No Position Assigned"}</p>
                        </div>
                        <Badge className={`mt-2.5 text-[10px] font-bold border-0 rounded-full px-3 py-0.5 ${employee.status ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                            {employee.status ? "● Active" : "● Inactive"}
                        </Badge>
                    </div>

                    <div className="flex-1 px-4 py-3 overflow-y-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Basic Information</p>
                        <InfoRow icon={Mail} label="Email" value={basic?.personal_email} />
                        <InfoRow icon={Phone} label="Contact Number" value={basic?.phone_number} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={fmt(basic?.birth_date)} />
                        <InfoRow icon={MapPin} label="Place of Birth" value={basic?.place_of_birth} />
                        <InfoRow icon={User} label="Sex" value={basic?.sex !== undefined ? (basic.sex ? "Male" : "Female") : undefined} />
                        <InfoRow icon={Heart} label="Civil Status" value={cap(basic?.civil_status)} />
                        <InfoRow icon={Home} label="Address" value={addressStr} />
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Work Email</p>
                        <p className="text-xs text-foreground/70 font-medium truncate">{employee.work_email}</p>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-w-0">
                    <Tabs defaultValue="employment" className="flex flex-col flex-1">
                        <div className="border-b border-border px-4 pt-1 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                            <TabsList className="h-auto bg-transparent gap-0 p-0 flex flex-nowrap w-max min-w-full">
                                {tabs.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="employment" className="flex-1 mt-0 overflow-y-auto"><EmploymentDetailsTab employee={employee} items={items} /></TabsContent>
                        <TabsContent value="compensation" className="flex-1 mt-0 overflow-y-auto"><CompensationTab employee={employee} /></TabsContent>
                        <TabsContent value="leave" className="flex-1 mt-0 overflow-y-auto"><LeaveInformationTab employee={employee} /></TabsContent>
                        <TabsContent value="time" className="flex-1 mt-0 overflow-y-auto">
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <Clock className="w-10 h-10 text-muted-foreground/30" />
                                <p className="text-sm italic text-muted-foreground">Time records coming soon.</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="government" className="flex-1 mt-0 overflow-y-auto"><GovernmentEligibilityTab employee={employee} /></TabsContent>
                        <TabsContent value="background" className="flex-1 mt-0 overflow-y-auto"><BackgroundInformationTab employee={employee} /></TabsContent>
                        <TabsContent value="documents" className="flex-1 mt-0 overflow-y-auto"><DocumentsTab employee={employee} /></TabsContent>
                    </Tabs>
                </div>
            </div>

            <BasicInfoEditDialog employee={employee} open={basicEditOpen} onClose={() => setBasicEditOpen(false)} />
        </AppLayout>
    )
}