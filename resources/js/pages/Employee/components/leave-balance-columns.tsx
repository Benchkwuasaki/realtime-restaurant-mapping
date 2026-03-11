// resources/js/pages/Employee/partials/leave-balance-columns.tsx

import { type ColumnDef } from "@tanstack/react-table"
import { type LeaveBalance } from "../data/leave-balance-schema"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => Number(n).toFixed(1)

// ─── Column Definitions ───────────────────────────────────────────────────────

export const leaveBalanceColumns: ColumnDef<LeaveBalance>[] = [
    // ── Leave Type ────────────────────────────────────────────────────────────
    {
        accessorKey: "leave_type",
        header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
                Leave Type
            </span>
        ),
        cell: ({ row }) => {
            const name = row.original.leave_type?.leave_type_name
                ?? `Leave Type #${row.original.leave_type_id}`
            return (
                <span className="text-sm font-medium text-foreground">
                    {name}
                </span>
            )
        },
    },

    // ── Cycle Year ────────────────────────────────────────────────────────────
    {
        accessorKey: "cycle_year",
        header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
                Year
            </span>
        ),
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.original.cycle_year}
            </span>
        ),
    },

    // ── Total Days ────────────────────────────────────────────────────────────
    {
        accessorKey: "total_days",
        header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
                Total
            </span>
        ),
        cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground">
                {fmt(row.original.total_days)}
            </span>
        ),
    },

    // ── Used Days ─────────────────────────────────────────────────────────────
    {
        accessorKey: "used_days",
        header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
                Used
            </span>
        ),
        cell: ({ row }) => (
            <span className="text-sm font-medium text-amber-600">
                {fmt(row.original.used_days)}
            </span>
        ),
    },

    // ── Balance ───────────────────────────────────────────────────────────────
    {
        accessorKey: "balance",
        header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
                Balance
            </span>
        ),
        cell: ({ row }) => {
            const val = Number(row.original.balance)
            return (
                <span
                    className={`text-sm font-semibold ${
                        val <= 0
                            ? "text-destructive"
                            : "text-emerald-600"
                    }`}
                >
                    {fmt(val)}
                </span>
            )
        },
    },
]