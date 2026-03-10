import { Head, router } from "@inertiajs/react"
import { useEffect, useRef, useState } from "react"
import { route } from "ziggy-js"
import { format, parseISO } from "date-fns"
import {
    AlertTriangle, Coffee, RefreshCw, Timer, UserCheck,
    UserX, Settings, Plus, Trash2, Pencil, Star, StarOff,
    Check, X, ClipboardList, MapPin, ChevronDown, ChevronRight,
} from "lucide-react"

import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
    settings: AttendanceSetting[]
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Records", href: route("attendance-record.index") },
]

// ─── Whereabout Slip list (inside history dialog) ─────────────────────────────

function WhereaboutSlipList({
    slips,
    hasTimedOut,
}: {
    slips: WhereaboutSlip[]
    hasTimedOut: boolean
}) {
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
                        className={`rounded-lg border bg-background overflow-hidden ${
                            isDeducted ? "border-destructive/30" : "border-border"
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium truncate max-w-[220px]">
                                    {slip.purpose_description}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                    variant={isPersonal ? "secondary" : "default"}
                                    className="text-[10px] px-1.5 py-0 h-4"
                                >
                                    {isPersonal ? "Personal" : "Official"}
                                </Badge>
                                <Badge
                                    variant={isReturned ? "green" : "yellow"}
                                    className="text-[10px] px-1.5 py-0 h-4"
                                >
                                    {isReturned ? "Returned" : "Not Returned"}
                                </Badge>
                            </div>
                        </div>

                        {/* Time grid */}
                        <div className="grid grid-cols-3 gap-px bg-border/40">
                            <div className="flex flex-col gap-0.5 px-3 py-2 bg-background">
                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Left At</span>
                                <span className="text-xs font-mono font-medium">{fmtTime(slip.time_out)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 px-3 py-2 bg-background">
                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Returned At</span>
                                <span className="text-xs font-mono font-medium">
                                    {slip.time_returned ? fmtTime(slip.time_returned) : "—"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 px-3 py-2 bg-background">
                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Duration</span>
                                <span className={`text-xs font-mono font-medium ${isDeducted ? "text-destructive" : ""}`}>
                                    {slip.minutes_gone != null ? fmtMinutes(slip.minutes_gone) : "—"}
                                </span>
                            </div>
                        </div>

                        {/* Deduction notice */}
                        {isPersonal && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold ${
                                isDeducted
                                    ? "bg-destructive/5 text-destructive border-t border-destructive/20"
                                    : isPendingDeduction
                                        ? "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-t border-amber-500/20"
                                        : "bg-muted/30 text-muted-foreground border-t border-border/40"
                            }`}>
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {isDeducted
                                    ? `${fmtMinutes(slip.minutes_gone)} deducted from work hours`
                                    : isPendingDeduction
                                        ? "Will be deducted once employee clocks out"
                                        : "No deduction — employee has not returned yet"}
                            </div>
                        )}

                        {/* Official slip note */}
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

    const Icon            = STATUS_ICON[r.status] ?? STATUS_ICON.ABSENT
    const slips           = r.whereabout_slips ?? []
    const hasTimedOut     = !!r.time_out
    const isLate          = (r.late_minutes ?? 0) > 0
    const hasSlips        = slips.length > 0

    const personalDeductionMins = hasTimedOut
        ? slips
            .filter(s => s.purpose_type === "personal" && s.return_status === "returned" && s.minutes_gone != null)
            .reduce((sum, s) => sum + (s.minutes_gone ?? 0), 0)
        : 0

    return (
        <>
            <tr
                className={`border-b border-border/50 transition-colors ${
                    hasSlips ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20"
                } ${expanded ? "bg-muted/30" : ""}`}
                onClick={() => hasSlips && setExpanded(e => !e)}
            >
                {/* Expand toggle */}
                <td className="w-8 pl-3 py-2.5">
                    {hasSlips ? (
                        expanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                        <span className="w-3.5 h-3.5 block" />
                    )}
                </td>

                {/* Date */}
                <td className="py-2.5 pr-4 text-xs font-medium whitespace-nowrap">
                    {format(parseISO(r.date), "EEE, MMM d, yyyy")}
                </td>

                {/* Status */}
                <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${STATUS_PILL[r.status] ?? "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {STATUS_LABEL[r.status]}
                    </span>
                </td>

                {/* Time In */}
                <td className="py-2.5 pr-4">
                    <span className={`text-xs font-mono ${isLate ? "text-destructive font-semibold" : "text-foreground"}`}>
                        {fmtTime(r.time_in)}
                    </span>
                </td>

                {/* Break Out */}
                <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">
                    {fmtTime(r.break_out)}
                </td>

                {/* Break In */}
                <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">
                    {fmtTime(r.break_in)}
                </td>

                {/* Time Out */}
                <td className="py-2.5 pr-4 text-xs font-mono text-foreground">
                    {fmtTime(r.time_out)}
                </td>

                {/* Work Hours */}
                <td className="py-2.5 pr-4 text-xs font-mono font-semibold">
                    {fmtMinutes(r.work_minutes)}
                </td>

                {/* Late */}
                <td className="py-2.5 pr-4">
                    {isLate ? (
                        <span className="text-xs font-mono font-semibold text-destructive">
                            {fmtMinutes(r.late_minutes)}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                    )}
                </td>

                {/* Slip Deduction */}
                <td className="py-2.5 pr-3">
                    {personalDeductionMins > 0 ? (
                        <span className="text-xs font-mono font-semibold text-destructive">
                            -{fmtMinutes(personalDeductionMins)}
                        </span>
                    ) : slips.some(s => s.purpose_type === "personal" && s.return_status === "returned" && !hasTimedOut) ? (
                        <span className="text-[10px] text-amber-500 font-semibold">Pending</span>
                    ) : (
                        <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                    )}
                </td>
            </tr>

            {/* Expanded slips row */}
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

function HistoryDialog({
    record,
    open,
    onClose,
}: {
    record: RecordWithHistory | null
    open: boolean
    onClose: () => void
}) {
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo,   setDateTo]   = useState("")

    // Reset filters when dialog opens
    useEffect(() => {
        if (open) { setDateFrom(""); setDateTo("") }
    }, [open])

    if (!record) return null

    const name = getEmployeeName(record)

    // Always include the current record + its history, deduplicated by date
    const allRecords = [record, ...record.history].filter(
        (r, i, arr) => arr.findIndex(x => toLocalDate(x.date).getTime() === toLocalDate(r.date).getTime()) === i
    )

    // Convert any date value (YYYY-MM-DD or full ISO UTC string) to a local-midnight Date.
    // Laravel may send "2026-02-08T16:00:00.000000Z" for a Feb 9 Manila record because
    // it stores timestamps in UTC. We must use local date components, not slice(0,10).
    function toLocalDate(s: string): Date {
        if (s.length > 10) {
            // Full ISO datetime — new Date() parses as UTC, getFullYear/Month/Date return LOCAL
            const d = new Date(s)
            return new Date(d.getFullYear(), d.getMonth(), d.getDate())
        }
        // Plain "YYYY-MM-DD" from <input type="date"> — split to avoid UTC-midnight trap
        const [y, m, d] = s.split('-').map(Number)
        return new Date(y, m - 1, d)
    }

    const from = dateFrom ? toLocalDate(dateFrom) : null
    const to   = dateTo   ? toLocalDate(dateTo)   : null

    const filtered = allRecords.filter(r => {
        const d = toLocalDate(r.date)
        if (from && d < from) return false
        if (to   && d > to)   return false
        return true
    })

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="w-[98vw] max-w-[1400px] sm:max-w-[1400px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                {/* ── Header ── */}
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {record.employee?.avatar_url ? (
                                <img src={record.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-primary">
                                    {name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-xs font-mono text-muted-foreground font-normal">
                                {record.employee?.work_id ?? "—"}
                            </p>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* ── Date filters ── */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/20 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium shrink-0">Filter by date</span>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="h-7 text-xs w-36"
                            placeholder="From"
                        />
                        <span className="text-muted-foreground text-xs">—</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="h-7 text-xs w-36"
                            placeholder="To"
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => { setDateFrom(""); setDateTo("") }}
                        >
                            <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {/* ── Scrollable table ── */}
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
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Date</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Time In</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Break (Out)</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Break (In)</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Time Out</th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                        <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Work Hrs</span>
                                    </th>
                                    <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Late</span>
                                    </th>
                                    <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                                        <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Slip Ded.</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <HistoryTableRow key={r.date} r={r} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Setting Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    name: "",
    early_time_in_minutes: 60,
    late_time_out_minutes: 60,
    is_default: false,
}

function SettingForm({
    initial,
    onSubmit,
    onCancel,
    submitting,
}: {
    initial?: Partial<typeof EMPTY_FORM>
    onSubmit: (data: typeof EMPTY_FORM) => void
    onCancel: () => void
    submitting: boolean
}) {
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, ...initial })

    function field(key: keyof typeof EMPTY_FORM) {
        return {
            value: form[key] as any,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.type === "number" ? Number(e.target.value) : e.target.value
                setForm(f => ({ ...f, [key]: val }))
            },
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Setting Name
                </Label>
                <Input placeholder="e.g. Standard Schedule" {...field("name")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { key: "early_time_in_minutes", label: "Early Time-In Cap", unit: "min" },
                    { key: "late_time_out_minutes", label: "Late Time-Out Cap", unit: "min" },
                ].map(({ key, label, unit }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {label}
                        </Label>
                        <div className="relative">
                            <Input type="number" min={0} className="pr-10" {...field(key as keyof typeof EMPTY_FORM)} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                {unit}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                    onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_default ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${form.is_default ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-muted-foreground">Set as default</span>
            </label>

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

// ─── Settings Dialog ──────────────────────────────────────────────────────────

function SettingsDialog({ open, onClose, settings }: { open: boolean; onClose: () => void; settings: AttendanceSetting[] }) {
    const [mode, setMode]             = useState<"list" | "create" | "edit">("list")
    const [editing, setEditing]       = useState<AttendanceSetting | null>(null)
    const [deleting, setDeleting]     = useState<AttendanceSetting | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function resetToList() { setMode("list"); setEditing(null) }

    function handleCreate(data: typeof EMPTY_FORM) {
        setSubmitting(true)
        router.post(route("attendance-setting.store"), data, {
            preserveScroll: true,
            onFinish: () => { setSubmitting(false); resetToList() },
        })
    }

    function handleUpdate(data: typeof EMPTY_FORM) {
        if (!editing) return
        setSubmitting(true)
        router.put(route("attendance-setting.update", editing.id), data, {
            preserveScroll: true,
            onFinish: () => { setSubmitting(false); resetToList() },
        })
    }

    function handleDelete() {
        if (!deleting) return
        router.delete(route("attendance-setting.destroy", deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        })
    }

    function handleMarkDefault(setting: AttendanceSetting) {
        router.put(route("attendance-setting.update", setting.id), { ...setting, is_default: true }, { preserveScroll: true })
    }

    useEffect(() => { if (open) resetToList() }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={v => !v && onClose()}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            {mode === "create" ? "New Attendance Setting" : mode === "edit" ? `Edit — ${editing?.name}` : "Attendance Settings"}
                        </DialogTitle>
                    </DialogHeader>

                    {mode === "create" && <SettingForm onSubmit={handleCreate} onCancel={resetToList} submitting={submitting} />}
                    {mode === "edit" && editing && <SettingForm initial={editing} onSubmit={handleUpdate} onCancel={resetToList} submitting={submitting} />}

                    {mode === "list" && (
                        <div className="flex flex-col gap-3 mt-1">
                            {settings.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">No settings yet.</p>
                            )}
                            {settings.map(s => (
                                <div key={s.id} className={`rounded-lg border overflow-hidden transition-colors ${s.is_default ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
                                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {s.is_default && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                                                    <Star className="w-2.5 h-2.5" /> Default
                                                </span>
                                            )}
                                            <span className="text-sm font-semibold truncate">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!s.is_default && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleMarkDefault(s)}>
                                                    <StarOff className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setEditing(s); setMode("edit") }}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            {!s.is_default && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleting(s)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-px bg-border/50">
                                        {[
                                            { label: "Early Time-In", value: `${s.early_time_in_minutes}m` },
                                            { label: "Late Time-Out", value: `${s.late_time_out_minutes}m` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className={`flex flex-col gap-0.5 px-3 py-2 ${s.is_default ? "bg-primary/5" : "bg-background"}`}>
                                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
                                                <span className="font-mono text-sm font-semibold">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => setMode("create")}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Setting
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Existing records will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceRecordIndex({ records: initialRecords, settings }: Props) {
    const [records, setRecords]           = useState<RecordWithHistory[]>(initialRecords)
    const [selected, setSelected]         = useState<RecordWithHistory | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [recomputing, setRecomputing]   = useState(false)
    const channelRef = useRef<any>(null)

    const present   = records.filter(r => r.status === "PRESENT").length
    const halfDay   = records.filter(r => r.status === "HALF_DAY").length
    const absent    = records.filter(r => r.status === "ABSENT").length
    const lateCount = records.filter(r => (r.late_minutes ?? 0) > 0).length

    useEffect(() => {
        if (typeof window === "undefined" || !(window as any).Echo) return
        const echo    = (window as any).Echo
        const channel = echo.channel("attendance-records")
        channelRef.current = channel

        channel
            .subscribed(() => {})
            .listen(".record.updated", (incoming: AttendanceRecord) => {
                const parsed = attendanceRecordSchema.safeParse(incoming)
                if (!parsed.success) return
                const updated = parsed.data

                setRecords(prev => {
                    const idx = prev.findIndex(r => r.employee_id === updated.employee_id)
                    if (idx === -1) return [{ ...updated, history: [] }, ...prev]
                    const existing = prev[idx]
                    if (existing.date === updated.date) {
                        const next = [...prev]
                        next[idx] = { ...updated, history: existing.history }
                        return next
                    }
                    const next = [...prev]
                    next[idx] = { ...updated, history: [existing, ...existing.history] }
                    return next
                })

                setSelected(prev => {
                    if (!prev || prev.employee_id !== updated.employee_id) return prev
                    if (prev.date === updated.date) return { ...updated, history: prev.history }
                    return { ...updated, history: [prev, ...prev.history] }
                })
            })

        return () => { echo.leave("attendance-records") }
    }, [])

    function handleRecompute() {
        setRecomputing(true)
        router.post(route("attendance-record.recompute"), {}, {
            onFinish: () => setRecomputing(false),
            preserveScroll: true,
        })
    }

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Attendance Records</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Latest record per employee ·{" "}
                            <span className="font-semibold text-foreground">{records.length}</span> employees
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRecompute} disabled={recomputing}>
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${recomputing ? "animate-spin" : ""}`} />
                            {recomputing ? "Queuing…" : "Recompute All"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard title="Present"  value={present}   description="Completed full day"        icon={<UserCheck    className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Half Day" value={halfDay}   description="Partial attendance"        icon={<Coffee       className="w-4 h-4 m-2 text-secondary-foreground" />} />
                    <StatCard title="Absent"   value={absent}    description="No attendance recorded"    icon={<UserX        className="w-4 h-4 m-2 text-destructive" />} />
                    <StatCard title="Late"     value={lateCount} description="Arrived after scheduled time" icon={<AlertTriangle className="w-4 h-4 m-2 text-accent-foreground" />} />
                </div>

                <DataTable
                    columns={columns}
                    data={records}
                    getRowId={row => String(row.id)}
                    searchColumnId="employee_name"
                    searchPlaceholder="Search by name or work ID…"
                    filters={[
                        { columnId: "status", title: "Status", options: statusOptions },
                    ]}
                    defaultPageSize={25}
                    onRowClick={row => setSelected(row.original as RecordWithHistory)}
                />
            </div>

            <HistoryDialog
                record={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
            />

            <SettingsDialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
            />
        </AppLayout>
    )
}