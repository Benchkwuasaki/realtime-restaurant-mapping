import { Building2, Users } from "lucide-react"
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
    const r = Number(rate) || 0
    const cat = rateCategory(r)       // ← r, not rate
    const Icon = RATE_ICON[cat]
    return (
        <Badge className={cn("text-[10px] font-semibold gap-1 border", RATE_PILL[cat])}>
            <Icon className="w-2.5 h-2.5" />
            {r.toFixed(1)}%           {/* ← r, not rate */}
        </Badge>
    )
}

export function RateBar({ rate }: { rate: number }) {
    const r = Number(rate) || 0
    const cat = rateCategory(r)       // ← r, not rate
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                <div
                    className={cn("h-full rounded-full transition-all", RATE_BAR_FILL[cat])}
                    style={{ width: `${Math.min(r, 100)}%` }}
                />
            </div>
            <span className={cn("text-xs font-semibold tabular-nums", RATE_TEXT[cat])}>
                {r.toFixed(1)}%       {/* ← r, not rate */}
            </span>
        </div>
    )
}

// ─── Rating label cell ────────────────────────────────────────────────────────

function RatingCell({ rate }: { rate: number }) {
    const cat = rateCategory(rate)
    const Icon = RATE_ICON[cat]
    return (
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", RATE_TEXT[cat])}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {RATE_LABEL[cat]}
        </span>
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
            accessorKey: "rate",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Attendance Rate" />,
            cell: ({ row }) => <RateBar rate={Number(row.original.rate) || 0} />,
        },
        // ── Virtual column — drives faceted filter, renders the rating label ──
        {
            id: "rate_category",
            accessorFn: row => rateCategory(Number(row.rate) || 0),  // ← and here
            header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
            cell: ({ row }) => <RatingCell rate={Number(row.original.rate) || 0} />,  // ← and here
            filterFn: (row, _columnId, filterValues: string[]) =>
                filterValues.includes(rateCategory(Number(row.original.rate) || 0)),  // ← and here
            enableSorting: false,
        },
    ]
}

// ─── Footer row (page-aware totals via DataTable footerRow prop) ──────────────

export function buildDeptFooterRow(
    pageRows: Row<DepartmentStat>[],
    visibleColumnIds: string[],         // ← add this
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
        cell("present", t.present, "text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400"),
        cell("late", t.late > 0 ? t.late : "—", "text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400"),
        cell("half_day", t.half_day > 0 ? t.half_day : "—", "text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400"),
        cell("absent", t.absent > 0 ? t.absent : "—", "text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400"),
        cell("rate", <RateBar rate={t.avgRate} />),
        cell("rate_category", <RateBadge rate={t.avgRate} />),
    ]
}