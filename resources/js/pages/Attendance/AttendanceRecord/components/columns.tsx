import { format, parseISO } from "date-fns"
import { AlertTriangle, Clock, Coffee, Timer, LogIn, ClipboardList} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import {
    STATUS_PILL, STATUS_DOT, STATUS_LABEL, STATUS_ICON,
    getEmployeeName, fmtTime, fmtMinutes, isOnLeave,
} from "../data/data"
import { type AttendanceRecord } from "../data/schema"

// ─── Shared "On leave" placeholder ───────────────────────────────────────────
// Rendered in every column between Time In and Slips for leave records.

function OnLeaveCell() {
    return (
        <span className="text-sm italic text-muted-foreground/60">
            On leave
        </span>
    )
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function PurposeBadge({ type }: { type: "personal" | "official" }) {
    return type === "personal"
        ? <Badge variant="secondary">Personal</Badge>
        : <Badge variant="default">Official</Badge>
}

// ─── Time cell ────────────────────────────────────────────────────────────────

function TimeCell({ actual, isLate = false }: { actual: string | null; isLate?: boolean }) {
    if (!actual) return <span className="text-muted-foreground/40 tabular-nums font-mono text-sm">—</span>
    return (
        <span className={cn("font-mono tabular-nums text-sm", isLate && "text-destructive")}>
            {fmtTime(actual)}
        </span>
    )
}

// ─── Time-in cell ─────────────────────────────────────────────────────────────

function TimeInCell({ record }: { record: AttendanceRecord }) {
    if (isOnLeave(record.status)) return <OnLeaveCell />

    const isLate = (record.late_minutes ?? 0) > 0

    if (record.time_in) {
        return (
            <span className={cn("font-mono tabular-nums text-sm", isLate && "text-destructive")}>
                {fmtTime(record.time_in)}
            </span>
        )
    }

    if (record.break_out) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-accent-foreground font-medium">
                <LogIn className="w-3 h-3" />No scan
            </span>
        )
    }

    return <span className="text-muted-foreground/40 tabular-nums font-mono text-sm">—</span>
}

// ─── Whereabout slip cell ─────────────────────────────────────────────────────

function WhereaboutSlipCell({ record }: { record: AttendanceRecord }) {
    if (isOnLeave(record.status)) return <OnLeaveCell />

    const slips = record.whereabout_slips ?? []
    if (slips.length === 0) return <span className="text-muted-foreground/40 text-sm">—</span>

    const hasPersonal = slips.some(s => s.purpose_type === "personal")
    const hasOfficial = slips.some(s => s.purpose_type === "official")
    const hasPending  = slips.some(s => s.status === "still_out")

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="blue" className="text-[10px] gap-1">
                <ClipboardList className="w-3 h-3" />
                {slips.length}
            </Badge>
            {hasPersonal && <PurposeBadge type="personal" />}
            {hasOfficial && <PurposeBadge type="official" />}
            {hasPending && (
                // TODO: replace with `text-warning` once a --warning token is added to the theme
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive/70">
                    <AlertTriangle className="w-3 h-3" />Pending
                </span>
            )}
        </div>
    )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileAttendanceCard({ row }: { row: AttendanceRecord }) {
    const name    = getEmployeeName(row)
    const status  = row.status
    const Icon    = STATUS_ICON[status] ?? STATUS_ICON.ABSENT
    const isLate  = (row.late_minutes ?? 0) > 0
    const onLeave = isOnLeave(status)
    const slips   = row.whereabout_slips ?? []

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 space-y-2">
                {/* Name + status badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[status] ?? "bg-muted-foreground")} />
                        <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", STATUS_PILL[status])}>
                        <Icon className="w-2.5 h-2.5" />
                        {STATUS_LABEL[status]}
                    </Badge>
                </div>

                {/* Work ID + date */}
                <div className="flex items-center justify-between pl-3.5">
                    <p className="text-[11px] font-mono text-muted-foreground">{row.employee?.work_id ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {row.date ? format(parseISO(row.date), "MMM d, yyyy") : "—"}
                    </p>
                </div>

                {/* On-leave banner */}
                {onLeave && (
                    <div className={cn(
                        "pl-3.5 flex items-center gap-1.5 text-xs font-semibold",
                        // ON_LEAVE_WP → full primary; ON_LEAVE_NP → muted primary
                        status === "ON_LEAVE_WP"
                            ? "text-primary"
                            : "text-primary/70",
                    )}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {status === "ON_LEAVE_WP" ? "On approved leave — with pay" : "On approved leave — no pay"}
                    </div>
                )}

                {/* Time in / out (only shown when not on leave) */}
                {!onLeave && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {row.time_in ? (
                                <span className={cn("font-mono", isLate && "text-destructive")}>
                                    {fmtTime(row.time_in)}
                                </span>
                            ) : row.break_out ? (
                                <span className="text-accent-foreground font-medium">No scan</span>
                            ) : (
                                <span className="font-mono">—</span>
                            )}
                            <span className="text-muted-foreground/40">in</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="font-mono">{fmtTime(row.time_out)}</span>
                            <span className="text-muted-foreground/40">out</span>
                        </div>
                        {isLate && (
                            <div className="flex items-center gap-1 text-destructive col-span-2">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span className="font-semibold">{fmtMinutes(row.late_minutes)} late</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Break times */}
                {!onLeave && (row.break_out || row.break_in) && (
                    <div className="pl-3.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Coffee className="w-3 h-3 shrink-0" />
                        <span>Break: {fmtTime(row.break_out)} → {fmtTime(row.break_in)}</span>
                    </div>
                )}

                {/* Whereabout slips */}
                {!onLeave && slips.length > 0 && (
                    <div className="pl-3.5 flex items-center gap-1.5 flex-wrap">
                        <ClipboardList className="w-3 h-3 text-primary" />
                        <span className="text-[11px] text-primary font-medium">
                            {slips.length} whereabout slip{slips.length > 1 ? "s" : ""}
                        </span>
                        {/* TODO: replace with `text-warning` once a --warning token is added to the theme */}
                        {slips.some(s => s.status === "still_out") && (
                            <span className="text-[10px] text-destructive/70 font-semibold">· Pending return</span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Footer: work hours ── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    <span>{onLeave ? "On leave" : `${fmtMinutes(row.work_minutes)} worked`}</span>
                </div>
                {!onLeave && isLate ? (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-semibold">{fmtMinutes(row.late_minutes)} late</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): DataTableColumnDef<AttendanceRecord>[] {
    return [
        // ── Employee ──────────────────────────────────────────────────────────
        {
            id: "employee_name",
            accessorFn: row => getEmployeeName(row),
            header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
            cell: ({ row }) => {
                const record = row.original
                const name   = getEmployeeName(record)
                return (
                    <div className="flex items-center gap-2.5 min-w-44">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {record.employee?.avatar_url ? (
                                <img src={record.employee.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</span>
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
            mobileCard: row => <MobileAttendanceCard row={row} />,
        },

        // ── Date ──────────────────────────────────────────────────────────────
        {
            accessorKey: "date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.date ? format(parseISO(row.original.date), "MMM d, yyyy") : "—"}
                </span>
            ),
        },

        // ── Time In ───────────────────────────────────────────────────────────
        {
            accessorKey: "time_in",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Time In" />,
            cell: ({ row }) => <TimeInCell record={row.original} />,
        },

        // ── Break Out ─────────────────────────────────────────────────────────
        {
            accessorKey: "break_out",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Break (Out)" />,
            cell: ({ row }) => isOnLeave(row.original.status)
                ? <OnLeaveCell />
                : <TimeCell actual={row.original.break_out} />,
        },

        // ── Break In ──────────────────────────────────────────────────────────
        {
            accessorKey: "break_in",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Break (In)" />,
            cell: ({ row }) => isOnLeave(row.original.status)
                ? <OnLeaveCell />
                : <TimeCell actual={row.original.break_in} />,
        },

        // ── Time Out ──────────────────────────────────────────────────────────
        {
            accessorKey: "time_out",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Time Out" />,
            cell: ({ row }) => isOnLeave(row.original.status)
                ? <OnLeaveCell />
                : <TimeCell actual={row.original.time_out} />,
        },

        // ── Late ──────────────────────────────────────────────────────────────
        {
            accessorKey: "late_minutes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Late" />,
            cell: ({ row }) => {
                if (isOnLeave(row.original.status)) return <OnLeaveCell />
                const late = row.original.late_minutes
                if (!late || late === 0) return <span className="text-muted-foreground/40 text-sm">—</span>
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        {fmtMinutes(late)}
                    </span>
                )
            },
        },

        // ── Work Hours ────────────────────────────────────────────────────────
        {
            accessorKey: "work_minutes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Work Hours" />,
            cell: ({ row }) => {
                if (isOnLeave(row.original.status)) return <OnLeaveCell />
                return (
                    <span className="text-sm font-mono tabular-nums">
                        {fmtMinutes(row.original.work_minutes)}
                    </span>
                )
            },
        },

        // ── Slips ─────────────────────────────────────────────────────────────
        {
            id: "whereabout_slips",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Slips" />,
            cell: ({ row }) => <WhereaboutSlipCell record={row.original} />,
            enableSorting: false,
        },

        // ── Status ────────────────────────────────────────────────────────────
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const s    = row.original.status
                const Icon = STATUS_ICON[s] ?? STATUS_ICON.ABSENT
                return (
                    <Badge variant="outline" className={cn("text-[10px] gap-1.5", STATUS_PILL[s])}>
                        <Icon className="w-3 h-3" />
                        {STATUS_LABEL[s]}
                    </Badge>
                )
            },
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },
    ]
}