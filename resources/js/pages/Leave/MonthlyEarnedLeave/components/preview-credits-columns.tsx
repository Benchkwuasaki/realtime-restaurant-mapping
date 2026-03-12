// resources/js/pages/Leave/MonthlyEarnedLeave/components/preview-credits-columns.tsx

import React, { useMemo } from "react"
import { type DataTableHeaderGroupCell } from "@/components/shared/data-table/data-table"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import { CreditBadge, EmployeeAvatar } from "./history-columns"
import { type LeaveType, type PreviewRow, type CreditStatus } from "../data/schema"

// ─── Row type ─────────────────────────────────────────────────────────────────

export type PreviewCreditRow = {
    employee_id:              number
    name:                     string
    department:               string
    employment_classification: string
    avatar_url:               string | null
    credit_status:            CreditStatus
    minutes_worked:           number
    leaves: Record<number, { before: number; credit: number; after: number }>
}

// ─── Row builder ──────────────────────────────────────────────────────────────

export function buildPreviewCreditRows(previews: PreviewRow[]): PreviewCreditRow[] {
    const map = new Map<number, PreviewCreditRow>()
    for (const row of previews) {
        if (!map.has(row.employee_id)) {
            map.set(row.employee_id, {
                employee_id:              row.employee_id,
                name:                     row.name,
                department:               row.department,
                employment_classification: row.employment_classification,
                avatar_url:               row.avatar_url,
                credit_status:            row.credit_status,
                minutes_worked:           row.minutes_worked,
                leaves:                   {},
            })
        }
        map.get(row.employee_id)!.leaves[row.leave_type_id] = {
            before: row.balance_before,
            credit: row.accrual_earned,
            after:  row.balance_after,
        }
    }
    return Array.from(map.values())
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function usePreviewCreditColumns(
    leaveTypes: LeaveType[],
): DataTableColumnDef<PreviewCreditRow>[] {
    return useMemo(() => {
        const cols: DataTableColumnDef<PreviewCreditRow>[] = [
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
            {
                accessorKey: "minutes_worked",
                header:      "Attendance",
                meta:        { headerClassName: "text-center", className: "text-center" },
                cell: ({ getValue }) => (
                    <span className="text-muted-foreground text-sm">{getValue() as number} min</span>
                ),
            },
        ]

        for (const lt of leaveTypes) {
            cols.push(
                {
                    id:         `lt_${lt.leave_type_id}_before`,
                    accessorFn: (row) => row.leaves[lt.leave_type_id]?.before ?? 0,
                    header:     "Balance",
                    meta: {
                        headerClassName: "text-center text-xs font-normal text-muted-foreground",
                        className:       "text-center text-muted-foreground text-sm border-l border-border",
                    },
                    cell: ({ row }) => {
                        const d = row.original.leaves[lt.leave_type_id]
                        return <>{d ? d.before.toFixed(2) : "0.00"}</>
                    },
                },
                {
                    id:         `lt_${lt.leave_type_id}_credit`,
                    accessorFn: (row) => row.leaves[lt.leave_type_id]?.credit ?? 0,
                    header:     "Credit",
                    meta: {
                        headerClassName: "text-center text-xs font-normal text-muted-foreground",
                        className:       "text-center text-sm font-medium text-green-600 dark:text-green-400",
                    },
                    cell: ({ row }) => {
                        const d = row.original.leaves[lt.leave_type_id]
                        return <>{d ? `+${d.credit.toFixed(2)}` : "+0.00"}</>
                    },
                },
                {
                    id:         `lt_${lt.leave_type_id}_after`,
                    accessorFn: (row) => row.leaves[lt.leave_type_id]?.after ?? 0,
                    header:     "New Balance",
                    meta: {
                        headerClassName: "text-center text-xs font-normal text-muted-foreground",
                        className:       "text-center text-sm font-medium text-primary",
                    },
                    cell: ({ row }) => {
                        const d = row.original.leaves[lt.leave_type_id]
                        return <>{d ? d.after.toFixed(2) : "0.00"}</>
                    },
                },
            )
        }

        cols.push({
            accessorKey: "credit_status",
            header:      "Status",
            meta:        { headerClassName: "text-center", className: "text-center" },
            cell: ({ getValue }) => <CreditBadge status={getValue() as CreditStatus} />,
        })

        return cols
    }, [leaveTypes])
}

// ─── Header groups ────────────────────────────────────────────────────────────

export function usePreviewCreditHeaderGroups(
    leaveTypes: LeaveType[],
): DataTableHeaderGroupCell[] {
    return useMemo(() => {
        const groups: DataTableHeaderGroupCell[] = [
            { label: "Employee",        rowSpan: 2  },
            { label: "Department",      rowSpan: 2 },
            { label: "Employment Type", rowSpan: 2 },
            { label: "Attendance",      rowSpan: 2 },
        ]
        for (const lt of leaveTypes) {
            groups.push({
                label:     lt.leave_type_name,
                colSpan:   3,
            })
        }
        groups.push({ label: "Status", rowSpan: 2 })
        return groups
    }, [leaveTypes])
}