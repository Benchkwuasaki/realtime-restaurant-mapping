import { Head, router } from "@inertiajs/react"
import { useEffect, useRef, useState } from "react"
import { route } from "ziggy-js"
import { format, parseISO } from "date-fns"
import {
    AlertTriangle, BadgeCheck, Coffee, Timer, UserCheck,
    UserX, Settings, Plus, Trash2, Pencil,
    Check, X, ClipboardList, MapPin, ChevronDown, ChevronRight,
    Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"

import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { BreadcrumbItem } from "@/types"

import { getColumns } from "./components/columns"
import {
    statusOptions,
    STATUS_PILL,
    STATUS_ICON,
    STATUS_LABEL,
    fmtTime,
    fmtMinutes,
    getEmployeeName,
} from "./data/data"
import { type AttendanceRecord, type WhereaboutSlip, attendanceRecordSchema } from "./data/schema"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarDays } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecordWithHistory extends AttendanceRecord {
    history: AttendanceRecord[]
}

interface AttendanceSetting {
    id: number
    name: string
    early_time_in_minutes: number
    late_time_out_minutes: number
    is_default: boolean
}

interface Props {
    records: RecordWithHistory[]
    archived: RecordWithHistory[]
    settings: AttendanceSetting[]
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Records", href: route("attendance-record.index") },
]

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function PurposeBadge({ type }: { type: "personal" | "official" }) {
    return type === "personal"
        ? <Badge variant="secondary">Personal</Badge>
        : <Badge variant="default">Official</Badge>
}

function ReturnBadge({ status }: { status: "returned" | "not_returned" }) {
    return status === "returned"
        ? <Badge variant="green">Returned</Badge>
        : <Badge variant="yellow">Not Returned</Badge>
}

// ─── Whereabout Slip list ─────────────────────────────────────────────────────

function WhereaboutSlipList({ slips, hasTimedOut }: { slips: WhereaboutSlip[]; hasTimedOut: boolean }) {
    if (slips.length === 0) return null

    return (
        <div className="flex flex-col gap-1.5">
            {slips.map(slip => {
                const isPersonal = slip.purpose_type === "personal"
                const isReturned = slip.return_status === "returned"
                const isDeducted = isPersonal && isReturned && slip.minutes_gone != null && hasTimedOut
                const isPendingDeduction = isPersonal && isReturned && slip.minutes_gone != null && !hasTimedOut

                return (
                    <div
                        key={slip.whereabout_slip_id}
                        className={cn(
                            "rounded-lg border bg-background overflow-hidden",
                            isDeducted ? "border-rose-300 dark:border-rose-800" : "border-border",
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium truncate max-w-[220px]">{slip.purpose_description}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <PurposeBadge type={slip.purpose_type} />
                                <ReturnBadge status={slip.return_status} />
                            </div>
                        </div>

                        {/* Time grid */}
                        <div className="grid grid-cols-3 gap-px bg-border/40">
                            {[
                                { label: "Left At", value: fmtTime(slip.time_out) },
                                { label: "Returned At", value: slip.time_returned ? fmtTime(slip.time_returned) : "—" },
                                { label: "Duration", value: slip.minutes_gone != null ? fmtMinutes(slip.minutes_gone) : "—", highlight: isDeducted },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} className="flex flex-col gap-0.5 px-3 py-2 bg-background">
                                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
                                    <span className={cn("text-xs font-mono font-medium", highlight && "text-rose-600 dark:text-rose-400")}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Deduction notice */}
                        {isPersonal && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold border-t",
                                isDeducted
                                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
                                    : isPendingDeduction
                                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                        : "bg-muted/30 text-muted-foreground border-border/40",
                            )}>
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {isDeducted
                                    ? `${fmtMinutes(slip.minutes_gone)} deducted from work hours`
                                    : isPendingDeduction
                                        ? "Will be deducted once employee clocks out"
                                        : "No deduction — employee has not returned yet"}
                            </div>
                        )}

                        {!isPersonal && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border/40 bg-muted/10">
                                <ClipboardList className="w-3 h-3 shrink-0" />
                                Official — no deduction applied
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── History Table Row ────────────────────────────────────────────────────────

function HistoryTableRow({ r }: { r: AttendanceRecord }) {
    const [expanded, setExpanded] = useState(false)

    const Icon = STATUS_ICON[r.status] ?? STATUS_ICON.ABSENT
    const slips = r.whereabout_slips ?? []
    const hasTimedOut = !!r.time_out
    const isLate = (r.late_minutes ?? 0) > 0
    const hasSlips = slips.length > 0

    const personalDeductionMins = hasTimedOut
        ? slips
            .filter(s => s.purpose_type === "personal" && s.return_status === "returned" && s.minutes_gone != null)
            .reduce((sum, s) => sum + (s.minutes_gone ?? 0), 0)
        : 0

    return (
        <>
            <tr
                className={cn(
                    "border-b border-border/50 transition-colors",
                    hasSlips ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20",
                    expanded && "bg-muted/30",
                )}
                onClick={() => hasSlips && setExpanded(e => !e)}
            >
                <td className="w-8 pl-3 py-2.5">
                    {hasSlips
                        ? expanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        : <span className="w-3.5 h-3.5 block" />}
                </td>

                <td className="py-2.5 pr-4 text-xs font-medium whitespace-nowrap">
                    {format(parseISO(r.date), "EEE, MMM d, yyyy")}
                </td>

                <td className="py-2.5 pr-4">
                    <Badge variant="outline" className={cn("text-[10px] gap-1", STATUS_PILL[r.status])}>
                        <Icon className="w-2.5 h-2.5" />
                        {STATUS_LABEL[r.status]}
                    </Badge>
                </td>

                <td className="py-2.5 pr-4">
                    <span className={cn("text-xs font-mono", isLate && "text-rose-600 dark:text-rose-400 font-semibold")}>
                        {fmtTime(r.time_in)}
                    </span>
                </td>

                <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">{fmtTime(r.break_out)}</td>
                <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">{fmtTime(r.break_in)}</td>
                <td className="py-2.5 pr-4 text-xs font-mono text-foreground">{fmtTime(r.time_out)}</td>
                <td className="py-2.5 pr-4 text-xs font-mono font-semibold">{fmtMinutes(r.work_minutes)}</td>

                <td className="py-2.5 pr-4">
                    {isLate
                        ? <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">{fmtMinutes(r.late_minutes)}</span>
                        : <span className="text-xs text-muted-foreground/40 font-mono">—</span>}
                </td>

                <td className="py-2.5 pr-3">
                    {personalDeductionMins > 0
                        ? <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">-{fmtMinutes(personalDeductionMins)}</span>
                        : slips.some(s => s.purpose_type === "personal" && s.return_status === "returned" && !hasTimedOut)
                            ? <span className="text-[10px] text-amber-500 font-semibold">Pending</span>
                            : <span className="text-xs text-muted-foreground/40 font-mono">—</span>}
                </td>
            </tr>

            {expanded && hasSlips && (
                <tr className="bg-muted/10 border-b border-border/50">
                    <td colSpan={10} className="px-4 pb-3 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                            <ClipboardList className="w-3 h-3" />
                            Whereabout Slips
                        </div>
                        <WhereaboutSlipList slips={slips} hasTimedOut={hasTimedOut} />
                    </td>
                </tr>
            )}
        </>
    )
}

// ─── History Dialog ───────────────────────────────────────────────────────────

function HistoryDialog({ record, open, onClose }: {
    record: RecordWithHistory | null; open: boolean; onClose: () => void
}) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date(),
    })

    useEffect(() => {
        if (open) {
            setDateRange({
                from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                to: new Date(),
            })
        }
    }, [open])

    if (!record) return null

    const name = getEmployeeName(record)

    function toLocalDate(s: string): Date {
        if (s.length > 10) { const d = new Date(s); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
        const [y, m, d] = s.split('-').map(Number)
        return new Date(y, m - 1, d)
    }

    const allRecords = [record, ...record.history].filter(
        (r, i, arr) => arr.findIndex(x => toLocalDate(x.date).getTime() === toLocalDate(r.date).getTime()) === i
    )

    const from = dateRange?.from ?? null
    const to = dateRange?.to ?? null
    const filtered = allRecords.filter(r => {
        const d = toLocalDate(r.date)
        if (from && d < from) return false
        if (to && d > to) return false
        return true
    })

    const dateLabel = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
            : format(dateRange.from, "MMM d, yyyy")
        : "Pick a date range"

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="w-[98vw] max-w-[1400px] sm:max-w-[1400px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {record.employee?.avatar_url ? (
                                <img src={record.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-xs font-mono text-muted-foreground font-normal">{record.employee?.work_id ?? "—"}</p>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* ── Date Range Filter ── */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/20 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium shrink-0">Filter by date</span>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 font-normal"
                            >
                                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className={dateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                                    {dateLabel}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                            />
                        </PopoverContent>
                    </Popover>

                    {dateRange && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => setDateRange(undefined)}
                        >
                            <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="overflow-auto flex-1 min-h-0">
                    {filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            No records match the selected date range.
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <tr className="border-b border-border">
                                    <th className="w-8 pl-3 py-2.5" />
                                    {[
                                        { label: "Date" },
                                        { label: "Status" },
                                        { label: "Time In" },
                                        { label: "Break (Out)" },
                                        { label: "Break (In)" },
                                        { label: "Time Out" },
                                        { label: "Work Hrs", icon: <Timer className="w-3 h-3" /> },
                                        { label: "Late", icon: <AlertTriangle className="w-3 h-3" /> },
                                        { label: "Slip Ded.", icon: <ClipboardList className="w-3 h-3" /> },
                                    ].map(({ label, icon }) => (
                                        <th key={label} className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                            {icon ? <span className="flex items-center gap-1">{icon}{label}</span> : label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => <HistoryTableRow key={r.date} r={r} />)}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const WINDOW_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480]

function fmtMins(n: number): string {
    if (n === 0) return "None"
    if (n >= 60) { const h = Math.floor(n / 60); const m = n % 60; return m === 0 ? `${h}h` : `${h}h ${m}m` }
    return `${n} min`
}

const EMPTY_FORM = { name: "", early_time_in_minutes: 60, late_time_out_minutes: 60, is_default: false }

function SettingForm({ initial, onSubmit, onCancel, submitting, isExistingDefault = false }: {
    initial?: Partial<typeof EMPTY_FORM>
    onSubmit: (data: typeof EMPTY_FORM) => void
    onCancel: () => void
    submitting: boolean
    isExistingDefault?: boolean
}) {
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, ...initial })
    function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
        setForm(f => ({ ...f, [key]: value }))
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setting Name</Label>
                <Input placeholder="e.g. Standard Schedule" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {([
                    { key: "early_time_in_minutes" as const, label: "Early Time-In", description: "How early before scheduled time-in scans are accepted" },
                    { key: "late_time_out_minutes" as const, label: "Late Time-Out", description: "How late after scheduled time-out scans are accepted" },
                ] as const).map(({ key, label, description }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
                        <p className="text-[10px] text-muted-foreground/70 -mt-0.5 leading-tight">{description}</p>
                        <select
                            value={form[key]}
                            onChange={e => set(key, Number(e.target.value))}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {WINDOW_OPTIONS.map(o => <option key={o} value={o}>{fmtMins(o)}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            <div className={cn("flex items-center justify-between rounded-lg border border-border px-3.5 py-3", isExistingDefault && "opacity-60 pointer-events-none")}>
                <div>
                    <p className="text-sm font-medium">Set as default</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isExistingDefault ? "Already the default setting" : "Used for all attendance calculations"}
                    </p>
                </div>
                <div
                    onClick={() => !isExistingDefault && set("is_default", !form.is_default)}
                    className={cn(
                        "w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer",
                        form.is_default ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform",
                        form.is_default ? "translate-x-4" : "translate-x-0",
                    )} />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={() => onSubmit(form)} disabled={submitting}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {submitting ? "Saving…" : "Save"}
                </Button>
            </div>
        </div>
    )
}

function SettingsDialog({ open, onClose, settings }: { open: boolean; onClose: () => void; settings: AttendanceSetting[] }) {
    const [mode, setMode] = useState<"list" | "create" | "edit">("list")
    const [editing, setEditing] = useState<AttendanceSetting | null>(null)
    const [deleting, setDeleting] = useState<AttendanceSetting | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function resetToList() { setMode("list"); setEditing(null) }

    function handleCreate(data: typeof EMPTY_FORM) {
        setSubmitting(true)
        router.post(route("attendance-settings.store"), data, { preserveScroll: true, onFinish: () => { setSubmitting(false); resetToList() } })
    }
    function handleUpdate(data: typeof EMPTY_FORM) {
        if (!editing) return
        setSubmitting(true)
        router.put(route("attendance-settings.update", editing.id), data, { preserveScroll: true, onFinish: () => { setSubmitting(false); resetToList() } })
    }
    function handleDelete() {
        if (!deleting) return
        router.delete(route("attendance-settings.destroy", deleting.id), { preserveScroll: true, onFinish: () => setDeleting(null) })
    }

    useEffect(() => { if (open) resetToList() }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={v => !v && onClose()}>
                <DialogContent className="max-w-lg w-full gap-0 p-0 overflow-hidden flex flex-col max-h-[80vh] [&>button]:top-4">                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-2.5">
                            {mode !== "list" && (
                                <button
                                    onClick={resetToList}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                            )}
                            <div>
                                <p className="text-sm font-semibold leading-none">
                                    {mode === "create" ? "New Policy" : mode === "edit" ? "Edit Policy" : "Attendance Settings"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {mode === "create"
                                        ? "Define scan acceptance windows"
                                        : mode === "edit"
                                            ? editing?.name
                                            : `${settings.length} ${settings.length === 1 ? "policy" : "policies"} configured`}
                                </p>
                            </div>
                        </div>
                        {mode === "list" && (
                            <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 mr-7" onClick={() => setMode("create")}>
                                <Plus className="w-3.5 h-3.5" /> New Setting
                            </Button>
                        )}
                    </div>

                    {/* ── Form (create / edit) ── */}
                    {(mode === "create" || (mode === "edit" && editing)) && (
                        <div className="px-5 py-4 overflow-y-auto">
                            <SettingForm
                                key={editing?.id ?? "create"}
                                initial={editing ?? undefined}
                                onSubmit={mode === "create" ? handleCreate : handleUpdate}
                                onCancel={resetToList}
                                submitting={submitting}
                                isExistingDefault={editing?.is_default}
                            />
                        </div>
                    )}

                    {/* ── Card list ── */}
                    {mode === "list" && (
                        <>
                            {/* Scrollable area */}
                            <div className="overflow-y-auto flex-1 min-h-0">
                                {settings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-muted-foreground opacity-40" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium">No settings yet</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Create your first attendance policy</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => setMode("create")}>
                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Setting
                                        </Button>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm border-collapse table-fixed">
                                        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-full">
                                                    Policy Name
                                                </th>
                                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-28">
                                                    Early Time-In
                                                </th>
                                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-28">
                                                    Late Time-Out
                                                </th>
                                                <th className="w-20" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settings.map(s => (
                                                <tr
                                                    key={s.id}
                                                    className={cn(
                                                        "group border-b border-border/50 transition-colors",
                                                        s.is_default ? "bg-primary/5" : "hover:bg-muted/30",
                                                    )}
                                                >
                                                    {/* Name */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full shrink-0 ring-2",
                                                                s.is_default
                                                                    ? "bg-primary ring-primary/30"
                                                                    : "bg-border ring-transparent",
                                                            )} />
                                                            <span className="font-medium truncate">{s.name}</span>
                                                            {s.is_default && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                                                                    <BadgeCheck className="w-3 h-3" /> Default
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Early time-in */}
                                                    <td className="px-5 py-3.5">
                                                        <span className={cn(
                                                            "inline-flex items-center font-mono text-xs font-medium px-2.5 py-1 rounded-md",
                                                            s.early_time_in_minutes === 0
                                                                ? "text-muted-foreground/50"
                                                                : "text-foreground bg-muted border border-border/60",
                                                        )}>
                                                            {fmtMins(s.early_time_in_minutes)}
                                                        </span>
                                                    </td>

                                                    {/* Late time-out */}
                                                    <td className="px-5 py-3.5">
                                                        <span className={cn(
                                                            "inline-flex items-center font-mono text-xs font-medium px-2.5 py-1 rounded-md",
                                                            s.late_time_out_minutes === 0
                                                                ? "text-muted-foreground/50"
                                                                : "text-foreground bg-muted border border-border/60",
                                                        )}>
                                                            {fmtMins(s.late_time_out_minutes)}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="pr-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                onClick={() => { setEditing(s); setMode("edit") }}
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            {!s.is_default && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                    onClick={() => setDeleting(s)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pinned footer */}
                            {settings.length > 0 && (
                                <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/20 mt-auto">
                                    <p className="text-xs text-muted-foreground">
                                        Only the <span className="font-semibold text-foreground">Default</span> policy applies to attendance computation
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Existing attendance records will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={handleDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}


function ArchivesDialog({
    open,
    onClose,
    archived,
}: {
    open: boolean
    onClose: () => void
    archived: RecordWithHistory[]
}) {
    const [selected, setSelected] = useState<RecordWithHistory | null>(null)

    useEffect(() => { if (!open) setSelected(null) }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={v => !v && onClose()}>
                <DialogContent className="w-[95vw] !max-w-[1000px] h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                                <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Archived Records</p>
                                <p className="text-xs text-muted-foreground font-normal">
                                    Attendance history for deleted employees
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                        {archived.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                                <Archive className="w-8 h-8 opacity-30" />
                                <p className="text-sm">No archived records</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm border-collapse table-fixed">
                                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-[40%]">
                                            Employee
                                        </th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-[20%]">
                                            Last Date
                                        </th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-[20%]">
                                            Last Status
                                        </th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-[15%]">
                                            Records
                                        </th>
                                        <th className="w-[5%]" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {archived.map(r => {
                                        const name = getEmployeeName(r)
                                        const Icon = STATUS_ICON[r.status] ?? STATUS_ICON.ABSENT
                                        const totalRecords = 1 + (r.history?.length ?? 0)
                                        return (
                                            <tr
                                                key={r.employee_id}
                                                className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors group"
                                                onClick={() => setSelected(r)}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center opacity-60">
                                                            {r.employee?.avatar_url ? (
                                                                <img src={r.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-muted-foreground">{name.slice(0, 2).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate text-muted-foreground">{name}</p>
                                                            <p className="text-[10px] font-mono text-muted-foreground/60">{r.employee?.work_id ?? "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                                                    {format(parseISO(r.date), "MMM d, yyyy")}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant="outline" className={cn("text-[10px] gap-1 opacity-80", STATUS_PILL[r.status])}>
                                                        <Icon className="w-2.5 h-2.5" />
                                                        {STATUS_LABEL[r.status]}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted-foreground">
                                                    {totalRecords} day{totalRecords !== 1 ? "s" : ""}
                                                </td>
                                                <td className="pr-5 py-4 text-right">
                                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors inline" />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <HistoryDialog record={selected} open={!!selected} onClose={() => setSelected(null)} />
        </>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceRecordIndex({ records: initialRecords, archived, settings }: Props) {
    const [records, setRecords] = useState<RecordWithHistory[]>(initialRecords)
    const [selected, setSelected] = useState<RecordWithHistory | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [archivesOpen, setArchivesOpen] = useState(false)
    const channelRef = useRef<any>(null)

    const present = records.filter(r => r.status === "PRESENT").length
    const halfDay = records.filter(r => r.status === "HALF_DAY").length
    const absent = records.filter(r => r.status === "ABSENT").length
    const lateCount = records.filter(r => (r.late_minutes ?? 0) > 0).length

    useEffect(() => {
        if (typeof window === "undefined" || !(window as any).Echo) return
        const echo = (window as any).Echo
        const channel = echo.channel("attendance-records")
        channelRef.current = channel

        channel
            .subscribed(() => { })
            .listen(".record.updated", (incoming: AttendanceRecord) => {
                const parsed = attendanceRecordSchema.safeParse(incoming)
                if (!parsed.success) return
                const updated = parsed.data

                setRecords(prev => {
                    const idx = prev.findIndex(r => r.employee_id === updated.employee_id)
                    if (idx === -1) return [{ ...updated, history: [] }, ...prev]
                    const existing = prev[idx]
                    if (existing.date === updated.date) {
                        const next = [...prev]; next[idx] = { ...updated, history: existing.history }; return next
                    }
                    const next = [...prev]; next[idx] = { ...updated, history: [existing, ...existing.history] }; return next
                })

                setSelected(prev => {
                    if (!prev || prev.employee_id !== updated.employee_id) return prev
                    if (prev.date === updated.date) return { ...updated, history: prev.history }
                    return { ...updated, history: [prev, ...prev.history] }
                })
            })

        return () => { echo.leave("attendance-records") }
    }, [])

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
                {/* ── Header row ── */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Attendance Records</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Latest record per employee ·{" "}
                            <span className="font-semibold text-foreground">{records.length}</span> employees
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 relative"
                            onClick={() => setArchivesOpen(true)}
                            title="Archived Records"
                        >
                            <Archive className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
                        </Button>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard title="Present" value={present} description="Completed full day" icon={<UserCheck className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Half Day" value={halfDay} description="Partial attendance" icon={<Coffee className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Absent" value={absent} description="No attendance recorded" icon={<UserX className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Late" value={lateCount} description="Arrived after scheduled time" icon={<AlertTriangle className="w-4 h-4 m-2 text-primary" />} />
                </div>

                {/* ── Table ── */}
                <DataTable
                    columns={columns}
                    data={records}
                    getRowId={row => String(row.employee_id)}
                    searchColumnId="employee_name"
                    searchPlaceholder="Search by name or work ID…"
                    filters={[{ columnId: "status", title: "Status", options: statusOptions }]}
                    onRowClick={row => setSelected(row.original as RecordWithHistory)}
                />
            </div>

            <HistoryDialog record={selected} open={!!selected} onClose={() => setSelected(null)} />
            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} />
            <ArchivesDialog open={archivesOpen} onClose={() => setArchivesOpen(false)} archived={archived} />
        </AppLayout>
    )
}