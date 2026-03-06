import { format, parseISO } from "date-fns"
import { AlertTriangle, Clock, Coffee, Timer } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import {
    STATUS_PILL, STATUS_DOT, STATUS_LABEL, STATUS_ICON,
    getEmployeeName, fmtTime, fmtMinutes,
} from "../data/data"
import { type AttendanceRecord } from "../data/schema"

// ─── Time cell ────────────────────────────────────────────────────────────────

function TimeCell({ actual, scheduled }: { actual: string | null; scheduled: string | null }) {
    if (!actual) return <span className="text-muted-foreground/40 tabular-nums font-mono text-sm">—</span>
    // Late = arrived after scheduled (only used for time_in context)
    const isLate = !!scheduled && actual > scheduled
    return (
        <span className={`font-mono tabular-nums text-sm ${isLate ? "text-rose-500" : ""}`}>
            {fmtTime(actual)}
        </span>
    )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileAttendanceCard({ row }: { row: AttendanceRecord }) {
    const name   = getEmployeeName(row)
    const status = row.status
    const Icon   = STATUS_ICON[status] ?? STATUS_ICON.ABSENT

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
                {/* Name + status */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status] ?? "bg-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[status] ?? "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {STATUS_LABEL[status]}
                    </span>
                </div>

                {/* Work ID + latest date */}
                <div className="flex items-center justify-between pl-3.5">
                    <p className="text-[11px] font-mono text-muted-foreground">{row.employee?.work_id ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {row.date ? format(parseISO(row.date), "MMM d, yyyy") : "—"}
                    </p>
                </div>

                {/* Time summary */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="font-mono">{fmtTime(row.time_in)}</span>
                        <span className="text-muted-foreground/40">in</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="font-mono">{fmtTime(row.time_out)}</span>
                        <span className="text-muted-foreground/40">out</span>
                    </div>
                    {row.late_minutes != null && row.late_minutes > 0 && (
                        <div className="flex items-center gap-1 text-rose-500 col-span-2">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="font-semibold">{fmtMinutes(row.late_minutes)} late</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    {fmtMinutes(row.work_minutes)} worked
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coffee className="w-3 h-3" />
                    {fmtTime(row.break_out)} → {fmtTime(row.break_in)}
                </div>
            </div>
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): DataTableColumnDef<AttendanceRecord>[] {
    return [
        // Select
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={v => row.toggleSelected(!!v)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={e => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // Employee
        {
            id: "employee_name",
            accessorFn: row => getEmployeeName(row),
            header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
            cell: ({ row }) => {
                const record = row.original
                const name   = getEmployeeName(record)
                return (
                    <div className="flex items-center gap-2.5 min-w-44">
                        <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {record.employee?.avatar_url ? (
                                <img src={record.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                    {name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{name}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">{record.employee?.work_id ?? "—"}</p>
                        </div>
                    </div>
                )
            },
            filterFn: (row, _id, value: string) => {
                const name = getEmployeeName(row.original).toLowerCase()
                const wid  = (row.original.employee?.work_id ?? "").toLowerCase()
                return name.includes(value.toLowerCase()) || wid.includes(value.toLowerCase())
            },
            mobileCard: (row) => <MobileAttendanceCard row={row} />,
        },

        // Latest Date
        {
            accessorKey: "date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.date ? format(parseISO(row.original.date), "MMM d, yyyy") : "—"}
                </span>
            ),
        },

        // Time In
        {
            accessorKey: "time_in",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Time In" />,
            cell: ({ row }) => (
                <TimeCell actual={row.original.time_in} scheduled={row.original.scheduled_time_in} />
            ),
        },

        // Break Out
        {
            accessorKey: "break_out",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Break (Out)" />,
            cell: ({ row }) => (
                <TimeCell actual={row.original.break_out} scheduled={row.original.scheduled_break_out} />
            ),
        },

        // Break In
        {
            accessorKey: "break_in",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Break (In)" />,
            cell: ({ row }) => (
                <TimeCell actual={row.original.break_in} scheduled={row.original.scheduled_break_in} />
            ),
        },

        // Time Out
        {
            accessorKey: "time_out",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Time Out" />,
            cell: ({ row }) => (
                <TimeCell actual={row.original.time_out} scheduled={row.original.scheduled_time_out} />
            ),
        },

        // Late
        {
            accessorKey: "late_minutes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Late" />,
            cell: ({ row }) => {
                const late = row.original.late_minutes
                if (!late || late === 0)
                    return <span className="text-muted-foreground/40 text-sm">—</span>
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                        {fmtMinutes(late)}
                    </span>
                )
            },
        },

        // Work Hours
        {
            accessorKey: "work_minutes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Work Hours" />,
            cell: ({ row }) => (
                <span className="text-sm font-mono tabular-nums">
                    {fmtMinutes(row.original.work_minutes)}
                </span>
            ),
        },

        // Status
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const s    = row.original.status
                const Icon = STATUS_ICON[s] ?? STATUS_ICON.ABSENT
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border-0 ${STATUS_PILL[s] ?? "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-3 h-3" />
                        {STATUS_LABEL[s]}
                    </span>
                )
            },
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },
    ]
}