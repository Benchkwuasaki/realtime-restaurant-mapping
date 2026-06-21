// resources/js/pages/Leave/MonthlyEarnedLeave/components/leave-balances-columns.tsx

import React, { useMemo } from "react"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { type LeaveType } from "../data/schema"
import { EmployeeAvatar } from "./history-columns"

// ─── Row type ─────────────────────────────────────────────────────────────────

export interface LeaveBalanceEntry {
    leave_type_id:   number
    leave_type_name: string
    total_days:      number
    used_days:       number
    balance:         number
}

export interface LeaveBalanceRow {
    employee_id:               number
    name:                      string
    avatar_url:                string | null
    department:                string
    employment_classification: string
    leave_balances:            LeaveBalanceEntry[]
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
// Renders the full row on mobile: employee info header + all leave balance
// entries as a compact grid. The name column owns this card; all dynamic
// leave-type columns intentionally omit mobileCard.

function MobileLeaveBalanceCard({ row }: { row: LeaveBalanceRow }) {
    return (
        <div className="flex flex-col bg-background overflow-hidden">
            {/* ── Employee header ── */}
            <div className="px-4 pt-4 pb-3 space-y-1">
                <div className="flex items-center gap-2.5">
                    <EmployeeAvatar url={row.avatar_url} name={row.name} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{row.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{row.department}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {row.employment_classification}
                    </span>
                </div>
            </div>

            {/* ── Leave balances grid ── */}
            {row.leave_balances.length > 0 ? (
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {row.leave_balances.map((lb) => (
                        <div
                            key={lb.leave_type_id}
                            className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                                {lb.leave_type_name}
                            </span>
                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <span className="text-sm font-bold text-primary tabular-nums">
                                    {lb.balance.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {lb.used_days.toFixed(2)}/{lb.total_days.toFixed(2)}
                                </span>
                            </div>
                            {/* Mini usage bar */}
                            <div className="h-1 rounded-full bg-muted overflow-hidden mt-1">
                                <div
                                    className="h-full rounded-full bg-primary/60 transition-all"
                                    style={{
                                        width: lb.total_days > 0
                                            ? `${Math.min((lb.used_days / lb.total_days) * 100, 100)}%`
                                            : "0%"
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="px-4 pb-4 text-xs text-muted-foreground">No leave balance data.</p>
            )}
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function useLeaveBalanceColumns(
    leaveTypes: LeaveType[],
): DataTableColumnDef<LeaveBalanceRow>[] {
    return useMemo(() => [
        // ── Employee ──────────────────────────────────────────────────────────
        // mobileCard renders the FULL card for the row.
        // All dynamic leave-type columns below intentionally omit mobileCard.
        {
            id:          "name",
            accessorKey: "name",
            header:      "Employee",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <EmployeeAvatar url={row.original.avatar_url} name={row.original.name} />
                    <span className="text-sm">{row.original.name}</span>
                </div>
            ),
            mobileCard: (row) => <MobileLeaveBalanceCard row={row} />,
        },
        {
            accessorKey: "department",
            header:      "Department",
            cell: ({ getValue }) => (
                <span className="text-muted-foreground text-sm">{getValue() as string}</span>
            ),
        },
        {
            accessorKey: "employment_classification",
            header:      "Employment Type",
            cell: ({ getValue }) => (
                <span className="text-muted-foreground text-sm">{getValue() as string}</span>
            ),
        },

        // ── Dynamic leave-type balance columns (desktop only) ─────────────────
        ...leaveTypes.map((lt): DataTableColumnDef<LeaveBalanceRow> => ({
            id:         `balance_${lt.leave_type_id}`,
            accessorFn: (row) => row.leave_balances.find((lb) => lb.leave_type_id === lt.leave_type_id)?.balance ?? null,
            header:     lt.leave_type_name,
            meta: {
                headerClassName: "text-center border-l border-border",
                className:       "text-center text-sm font-semibold text-primary border-l border-border",
            },
            cell: ({ row }) => {
                const b = row.original.leave_balances.find((lb) => lb.leave_type_id === lt.leave_type_id)
                return b
                    ? <>{b.balance.toFixed(2)}</>
                    : <span className="text-destructive">N/A</span>
            },
            // No mobileCard — covered by the name column's full card above
        })),
    ], [leaveTypes])
}