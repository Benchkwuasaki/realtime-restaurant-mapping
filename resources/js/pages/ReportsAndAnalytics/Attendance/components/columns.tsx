import { Building2, Users, Umbrella } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TableCell } from "@/components/ui/table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import type { Row } from "@tanstack/react-table"
import {
    type DepartmentStat,
    type RateCategory,
    rateCategory,
    computeDeptTotals,
    RATE_PILL,
    RATE_BAR_FILL,
    RATE_TEXT,
    RATE_LABEL,
    RATE_ICON,
} from "../data/data"

// ─── Rate badge ───────────────────────────────────────────────────────────────

export function RateBadge({ rate }: { rate: number }) {
    const r   = Number(rate) || 0
    const cat = rateCategory(r)
    const Icon = RATE_ICON[cat]
    return (
        <Badge className={cn("text-[10px] font-semibold gap-1 border", RATE_PILL[cat])}>
            <Icon className="w-2.5 h-2.5" />
            {r.toFixed(1)}%
        </Badge>
    )
}

export function RateBar({ rate }: { rate: number }) {
    const r   = Number(rate) || 0
    const cat = rateCategory(r)
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                <div
                    className={cn("h-full rounded-full transition-all", RATE_BAR_FILL[cat])}
                    style={{ width: `${Math.min(r, 100)}%` }}
                />
            </div>
            <span className={cn("text-xs font-semibold tabular-nums", RATE_TEXT[cat])}>
                {r.toFixed(1)}%
            </span>
        </div>
    )
}

// ─── Rating label cell ────────────────────────────────────────────────────────

function RatingCell({ rate }: { rate: number }) {
    const cat  = rateCategory(rate)
    const Icon = RATE_ICON[cat]
    return (
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", RATE_TEXT[cat])}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {RATE_LABEL[cat]}
        </span>
    )
}

// ─── Leave cell ───────────────────────────────────────────────────────────────

function LeaveCell({ row }: { row: DepartmentStat }) {
    const total = row.on_leave
    if (total === 0) return <span className="text-muted-foreground/40 text-sm">—</span>

    return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
            <span className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                <Umbrella className="w-3 h-3" />
                {total}
            </span>
            {row.on_leave_wp > 0 && (
                <span className="text-[10px] text-blue-500 dark:text-blue-400">WP:{row.on_leave_wp}</span>
            )}
            {row.on_leave_np > 0 && (
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400">NP:{row.on_leave_np}</span>
            )}
        </div>
    )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileDeptCard({ row }: { row: DepartmentStat }) {
    const r    = Number(row.rate) || 0
    const cat  = rateCategory(r)
    const Icon = RATE_ICON[cat]

    const stats: { label: string; value: number | string; className: string }[] = [
        {
            label:     "Present",
            value:     row.present,
            className: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label:     "Late",
            value:     row.late > 0 ? row.late : "—",
            className: row.late > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40",
        },
        {
            label:     "Half Day",
            value:     row.half_day > 0 ? row.half_day : "—",
            className: row.half_day > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground/40",
        },
        {
            label:     "Absent",
            value:     row.absent > 0 ? row.absent : "—",
            className: row.absent > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground/40",
        },
        {
            label:     "Leave",
            value:     row.on_leave > 0 ? row.on_leave : "—",
            className: row.on_leave > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/40",
        },
    ]

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{row.department}</span>
                </div>
                <Badge className={cn("text-[10px] font-semibold gap-1 border shrink-0", RATE_PILL[cat])}>
                    <Icon className="w-2.5 h-2.5" />
                    {RATE_LABEL[cat]}
                </Badge>
            </div>

            {/* ── Stat grid ── */}
            <div className="px-4 grid grid-cols-5 gap-1.5 pb-3">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/30 border border-border py-2"
                    >
                        <span className={cn("text-base font-black tabular-nums leading-none", s.className)}>
                            {s.value}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Leave breakdown detail ── */}
            {row.on_leave > 0 && (
                <div className="px-4 pb-2 flex items-center gap-3 text-[11px]">
                    <Umbrella className="w-3 h-3 text-blue-500 shrink-0" />
                    {row.on_leave_wp > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            WP: {row.on_leave_wp}
                        </span>
                    )}
                    {row.on_leave_np > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            NP: {row.on_leave_np}
                        </span>
                    )}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium tabular-nums">{row.total} total</span>
                </div>
                <RateBar rate={r} />
            </div>
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getDeptColumns(): DataTableColumnDef<DepartmentStat>[] {
    return [
        {
            accessorKey: "department",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5 min-w-36">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{row.original.department}</span>
                </div>
            ),
            mobileCard: (row) => <MobileDeptCard row={row} />,
        },
        {
            accessorKey: "total",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {row.original.total}
                </div>
            ),
        },
        {
            accessorKey: "present",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Present" />,
            cell: ({ row }) => (
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {row.original.present}
                </span>
            ),
        },
        {
            accessorKey: "late",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Late" />,
            cell: ({ row }) => (
                <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    row.original.late > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground/40",
                )}>
                    {row.original.late > 0 ? row.original.late : "—"}
                </span>
            ),
        },
        {
            accessorKey: "half_day",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Half Day" />,
            cell: ({ row }) => (
                <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    row.original.half_day > 0
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-muted-foreground/40",
                )}>
                    {row.original.half_day > 0 ? row.original.half_day : "—"}
                </span>
            ),
        },
        {
            accessorKey: "absent",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Absent" />,
            cell: ({ row }) => (
                <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    row.original.absent > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground/40",
                )}>
                    {row.original.absent > 0 ? row.original.absent : "—"}
                </span>
            ),
        },
        {
            // Combined leave column: shows total + WP/NP breakdown
            accessorKey: "on_leave",
            header: ({ column }) => <DataTableColumnHeader column={column} title="On Leave" />,
            cell: ({ row }) => <LeaveCell row={row.original} />,
        },
        {
            accessorKey: "rate",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Attendance Rate" />,
            cell: ({ row }) => <RateBar rate={Number(row.original.rate) || 0} />,
        },
        {
            id: "rate_category",
            accessorFn: row => rateCategory(Number(row.rate) || 0),
            header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
            cell: ({ row }) => <RatingCell rate={Number(row.original.rate) || 0} />,
            filterFn: (row, _columnId, filterValues: string[]) =>
                filterValues.includes(rateCategory(Number(row.original.rate) || 0)),
            enableSorting: false,
        },
    ]
}

// ─── Footer row ───────────────────────────────────────────────────────────────

export function buildDeptFooterRow(
    pageRows: Row<DepartmentStat>[],
    visibleColumnIds: string[],
): React.ReactNode[] {
    const t = computeDeptTotals(pageRows.map(r => r.original))

    const cell = (id: string, content: React.ReactNode, className = "") =>
        visibleColumnIds.includes(id)
            ? <TableCell key={id} className={`py-2.5 px-4 ${className}`}>{content}</TableCell>
            : null

    return [
        <TableCell key="dept" className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Totals
        </TableCell>,
        cell("total",
            <div className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-foreground">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {t.total}
            </div>
        ),
        cell("present",  t.present,              "text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400"),
        cell("late",     t.late > 0 ? t.late : "—",           "text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400"),
        cell("half_day", t.half_day > 0 ? t.half_day : "—",   "text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400"),
        cell("absent",   t.absent > 0 ? t.absent : "—",       "text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400"),
        cell("on_leave",
            t.on_leave > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                    <Umbrella className="w-3.5 h-3.5" />
                    {t.on_leave}
                </span>
            ) : "—"
        ),
        cell("rate",          <RateBar rate={t.avgRate} />),
        cell("rate_category", <RateBadge rate={t.avgRate} />),
    ]
}