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

// ─── Columns ──────────────────────────────────────────────────────────────────

export function useLeaveBalanceColumns(
    leaveTypes: LeaveType[],
): DataTableColumnDef<LeaveBalanceRow>[] {
    return useMemo(() => [
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
        })),
    ], [leaveTypes])
}