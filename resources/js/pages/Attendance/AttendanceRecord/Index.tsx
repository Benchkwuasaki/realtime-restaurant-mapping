import { Head, router, useForm } from "@inertiajs/react"
import { useEffect, useRef, useState } from "react"
import { route } from "ziggy-js"
import { format, parseISO } from "date-fns"
import {
    AlertTriangle, Coffee, RefreshCw, Timer, UserCheck,
    UserX, Settings, Plus, Trash2, Pencil, Star, StarOff, Check, X
} from "lucide-react"

import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
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
import { type AttendanceRecord, attendanceRecordSchema } from "./data/schema"

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
    if (!record) return null

    const name    = getEmployeeName(record)
    const history = record.history.length > 0 ? record.history : [record]

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
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
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 mt-2">
                    {history.map((r) => {
                        const Icon = STATUS_ICON[r.status] ?? STATUS_ICON.ABSENT
                        return (
                            <div key={r.date} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
                                    <span className="text-sm font-medium">
                                        {format(parseISO(r.date), "EEEE, MMM d, yyyy")}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_PILL[r.status] ?? "bg-muted text-muted-foreground"}`}>
                                        <Icon className="w-3 h-3" />
                                        {STATUS_LABEL[r.status]}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
                                    {[
                                        { label: "Time In",     value: fmtTime(r.time_in),   late: (r.late_minutes ?? 0) > 0 },
                                        { label: "Break (Out)", value: fmtTime(r.break_out),  late: false },
                                        { label: "Break (In)",  value: fmtTime(r.break_in),   late: false },
                                        { label: "Time Out",    value: fmtTime(r.time_out),   late: false },
                                    ].map(({ label, value, late }) => (
                                        <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 bg-background">
                                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
                                            <span className={`font-mono text-sm font-medium ${late ? "text-destructive" : ""}`}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Timer className="w-3 h-3" />
                                        {fmtMinutes(r.work_minutes)} worked
                                    </div>
                                    {(r.late_minutes ?? 0) > 0 && (
                                        <div className="flex items-center gap-1 text-destructive font-semibold">
                                            <AlertTriangle className="w-3 h-3" />
                                            {fmtMinutes(r.late_minutes)} late
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
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
            {/* Name */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Setting Name
                </Label>
                <Input placeholder="e.g. Standard Schedule" {...field("name")} />
            </div>

            {/* Cap fields */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { key: "early_time_in_minutes",  label: "Early Time-In Cap",  unit: "min" },
                    { key: "late_time_out_minutes",  label: "Late Time-Out Cap",  unit: "min" },
                ].map(({ key, label, unit }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {label}
                        </Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min={0}
                                className="pr-10"
                                {...field(key as keyof typeof EMPTY_FORM)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                {unit}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Default toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                    onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                        form.is_default ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${
                        form.is_default ? "translate-x-4" : "translate-x-0"
                    }`} />
                </div>
                <span className="text-sm text-muted-foreground">Set as default</span>
            </label>

            {/* Actions */}
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

function SettingsDialog({
    open,
    onClose,
    settings,
}: {
    open: boolean
    onClose: () => void
    settings: AttendanceSetting[]
}) {
    const [mode, setMode]             = useState<"list" | "create" | "edit">("list")
    const [editing, setEditing]       = useState<AttendanceSetting | null>(null)
    const [deleting, setDeleting]     = useState<AttendanceSetting | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function resetToList() {
        setMode("list")
        setEditing(null)
    }

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
        router.put(route("attendance-setting.update", setting.id), {
            ...setting,
            is_default: true,
        }, { preserveScroll: true })
    }

    useEffect(() => { if (open) resetToList() }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={v => !v && onClose()}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            {mode === "create" ? "New Attendance Setting"
                                : mode === "edit" ? `Edit — ${editing?.name}`
                                : "Attendance Settings"}
                        </DialogTitle>
                    </DialogHeader>

                    {/* ── Create form ── */}
                    {mode === "create" && (
                        <SettingForm
                            onSubmit={handleCreate}
                            onCancel={resetToList}
                            submitting={submitting}
                        />
                    )}

                    {/* ── Edit form ── */}
                    {mode === "edit" && editing && (
                        <SettingForm
                            initial={editing}
                            onSubmit={handleUpdate}
                            onCancel={resetToList}
                            submitting={submitting}
                        />
                    )}

                    {/* ── Settings list ── */}
                    {mode === "list" && (
                        <div className="flex flex-col gap-3 mt-1">
                            {settings.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No settings yet. Create one to get started.
                                </p>
                            )}

                            {settings.map(s => (
                                <div
                                    key={s.id}
                                    className={`rounded-lg border overflow-hidden transition-colors ${
                                        s.is_default
                                            ? "border-primary/40 bg-primary/5"
                                            : "border-border bg-background"
                                    }`}
                                >
                                    {/* Header row */}
                                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {s.is_default && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                                                    <Star className="w-2.5 h-2.5" />
                                                    Default
                                                </span>
                                            )}
                                            <span className="text-sm font-semibold truncate">{s.name}</span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {!s.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                    title="Set as default"
                                                    onClick={() => handleMarkDefault(s)}
                                                >
                                                    <StarOff className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
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
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleting(s)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Values grid — 2 cols now */}
                                    <div className="grid grid-cols-2 gap-px bg-border/50">
                                        {[
                                            { label: "Early Time-In",  value: `${s.early_time_in_minutes}m` },
                                            { label: "Late Time-Out",  value: `${s.late_time_out_minutes}m` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className={`flex flex-col gap-0.5 px-3 py-2 ${s.is_default ? "bg-primary/5" : "bg-background"}`}>
                                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
                                                <span className="font-mono text-sm font-semibold">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-1"
                                onClick={() => setMode("create")}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                New Setting
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete confirm ── */}
            <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Existing attendance records using this setting will not be affected.
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceRecordIndex({ records: initialRecords, settings }: Props) {
    const [records, setRecords]           = useState<RecordWithHistory[]>(initialRecords)
    const [selected, setSelected]         = useState<RecordWithHistory | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [echoConnected, setEchoConnected] = useState(false)
    const [recomputing, setRecomputing]   = useState(false)
    const channelRef = useRef<any>(null)

    // ── Stat counts ──────────────────────────────────────────────────────────
    const present   = records.filter(r => r.status === "PRESENT").length
    const halfDay   = records.filter(r => r.status === "HALF_DAY").length
    const absent    = records.filter(r => r.status === "ABSENT").length
    const lateCount = records.filter(r => (r.late_minutes ?? 0) > 0).length

    // ── Real-time ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined" || !(window as any).Echo) return

        const echo    = (window as any).Echo
        const channel = echo.channel("attendance-records")
        channelRef.current = channel

        channel
            .subscribed(() => setEchoConnected(true))
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

        return () => {
            echo.leave("attendance-records")
            setEchoConnected(false)
        }
    }, [])

    // ── Recompute ────────────────────────────────────────────────────────────
    function handleRecompute() {
        setRecomputing(true)
        router.post(
            route("attendance-record.recompute"),
            {},
            { onFinish: () => setRecomputing(false), preserveScroll: true }
        )
    }

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                {/* ── Header ── */}
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
                            size="sm"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="w-3.5 h-3.5 mr-1.5" />
                            Settings
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRecompute}
                            disabled={recomputing}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${recomputing ? "animate-spin" : ""}`} />
                            {recomputing ? "Queuing…" : "Recompute All"}
                        </Button>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        title="Present"
                        value={present}
                        description="Completed full day"
                        icon={<UserCheck className="w-4 h-4 m-2 text-primary" />}
                    />
                    <StatCard
                        title="Half Day"
                        value={halfDay}
                        description="Partial attendance"
                        icon={<Coffee className="w-4 h-4 m-2 text-secondary-foreground" />}
                    />
                    <StatCard
                        title="Absent"
                        value={absent}
                        description="No attendance recorded"
                        icon={<UserX className="w-4 h-4 m-2 text-destructive" />}
                    />
                    <StatCard
                        title="Late"
                        value={lateCount}
                        description="Arrived after scheduled time"
                        icon={<AlertTriangle className="w-4 h-4 m-2 text-accent-foreground" />}
                    />
                </div>

                {/* ── Data table ── */}
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

            {/* ── Dialogs ── */}
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