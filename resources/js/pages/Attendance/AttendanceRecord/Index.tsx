import { Head } from "@inertiajs/react"
import { useState } from "react"
import { route } from "ziggy-js"
import { format, parseISO } from "date-fns"
import { AlertTriangle, Coffee, Timer, UserCheck, UserX } from "lucide-react"

import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { BreadcrumbItem } from "@/types"

import { getColumns } from "./components/columns"
import { statusOptions, STATUS_PILL, STATUS_ICON, STATUS_LABEL, fmtTime, fmtMinutes, getEmployeeName } from "./data/data"
import { type AttendanceRecord } from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecordWithHistory extends AttendanceRecord {
    history: AttendanceRecord[]
}

interface Props {
    records: RecordWithHistory[]
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

    const name = getEmployeeName(record)
    const history = record.history.length > 0 ? record.history : [record]

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {record.employee?.avatar_url ? (
                                <img src={record.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                    {name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-xs font-mono text-muted-foreground font-normal">{record.employee?.work_id ?? "—"}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 mt-2">
                    {history.map((r) => {
                        const Icon = STATUS_ICON[r.status] ?? STATUS_ICON.ABSENT
                        return (
                            <div key={r.date} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                                {/* Date row */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
                                    <span className="text-sm font-medium">
                                        {format(parseISO(r.date), "EEEE, MMM d, yyyy")}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_PILL[r.status] ?? "bg-muted text-muted-foreground"}`}>
                                        <Icon className="w-3 h-3" />
                                        {STATUS_LABEL[r.status]}
                                    </span>
                                </div>

                                {/* Times grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
                                    {[
                                        { label: "Time In", value: fmtTime(r.time_in), late: r.late_minutes && r.late_minutes > 0 },
                                        { label: "Break (Out)", value: fmtTime(r.break_out), late: false },
                                        { label: "Break (In)", value: fmtTime(r.break_in), late: false },
                                        { label: "Time Out", value: fmtTime(r.time_out), late: false },
                                    ].map(({ label, value, late }) => (
                                        <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 bg-background">
                                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
                                            <span className={`font-mono text-sm font-medium ${late ? "text-rose-500" : ""}`}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Timer className="w-3 h-3" />
                                        {fmtMinutes(r.work_minutes)} worked
                                    </div>
                                    {r.late_minutes && r.late_minutes > 0 ? (
                                        <div className="flex items-center gap-1 text-rose-500 font-semibold">
                                            <AlertTriangle className="w-3 h-3" />
                                            {fmtMinutes(r.late_minutes)} late
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceRecordIndex({ records }: Props) {
    const [selected, setSelected] = useState<RecordWithHistory | null>(null)

    // Stat counts from the latest record per employee
    const present = records.filter(r => r.status === "PRESENT").length
    const halfDay = records.filter(r => r.status === "HALF_DAY").length
    const absent = records.filter(r => r.status === "ABSENT").length
    const lateCount = records.filter(r => (r.late_minutes ?? 0) > 0).length

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Attendance Records</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Latest record per employee ·{" "}
                        <span className="font-semibold text-foreground">{records.length}</span> employees
                    </p>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        title="Present"
                        value={present}
                        description="Completed full day"
                        icon={<UserCheck className="w-4 h-4 m-2 text-emerald-600 dark:text-emerald-400" />}
                    />
                    <StatCard
                        title="Half Day"
                        value={halfDay}
                        description="Partial attendance"
                        icon={<Coffee className="w-4 h-4 m-2 text-amber-600 dark:text-amber-400" />}
                    />
                    <StatCard
                        title="Absent"
                        value={absent}
                        description="No attendance recorded"
                        icon={<UserX className="w-4 h-4 m-2 text-rose-600 dark:text-rose-400" />}
                    />
                    <StatCard
                        title="Late"
                        value={lateCount}
                        description="Exceeded grace period"
                        icon={<AlertTriangle className="w-4 h-4 m-2 text-orange-600 dark:text-orange-400" />}
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
                        {
                            columnId: "status",
                            title: "Status",
                            options: statusOptions,
                        },
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
        </AppLayout>
    )
}