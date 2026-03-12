/**
 * computedColumns.tsx
 *
 * Column definitions for the Step 3 "Employee Computation" DataTable.
 *
 * Place this file alongside the other columns files at:
 *   resources/js/components/Payroll/PayrollProcessing/components/computedColumns.tsx
 *
 * Usage in Index.tsx:
 *   import { computedColumns } from '.../components/computedColumns'
 */

import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { peso } from '@/components/Payroll/PayrollProcessing/data/utils';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';

// ─── Row shape ─────────────────────────────────────────────────────────────────
// Matches the shape produced by employeesWithStatus in Index.tsx.

export interface ComputedEmployeeRow {
    id: number;
    name: string;
    basicPay: number;
    allowances: number;
    grossPay: number;
    gsis: number;
    philhealth: number;
    pagibig: number;
    tax: number;
    absentDays: number;
    absentDeduction: number;
    lateMinutes: number;
    lateDeduction: number;
    internalOrgSavings: number;
    internalOrgSecond: number;
    internalOrgLoans: number;
    otherDeductionsMisc: number;
    totalDeductions: number;
    netPay: number;
    floorCutAmount: number;
    status: 'ok' | 'low';
}

// ─── Columns ───────────────────────────────────────────────────────────────────

export const computedColumns: DataTableColumnDef<ComputedEmployeeRow>[] = [
    // ── # — group row has rowSpan=2 so sub-header cell must be hidden ─────────
    {
        id: 'rowNumber',
        header: () => null,
        cell: ({ row }) => (
            <span className="text-xs text-slate-400">{row.index + 1}</span>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: 'border-r px-2 py-2.5 text-center w-8',
            headerClassName: 'hidden',
        },
    },

    // ── Employee Name — group row covers with rowSpan=2 ───────────────────────
    {
        accessorKey: 'name',
        header: () => null,
        cell: ({ getValue }) => (
            <span className="font-medium text-slate-800">{getValue<string>()}</span>
        ),
        enableHiding: false,
        meta: {
            className: 'border-r px-3 py-2.5',
            headerClassName: 'hidden',
        },
    },

    // ── Earnings ──────────────────────────────────────────────────────────────
    {
        accessorKey: 'basicPay',
        header: () => (
            <div className="text-center">
                <div>Basic Pay</div>
                <div className="text-[10px] font-normal text-blue-400">semi-monthly</div>
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="tabular-nums text-slate-700">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-blue-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'allowances',
        header: () => <div className="text-center">Allowances</div>,
        cell: ({ getValue }) => (
            <span className="tabular-nums text-slate-700">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-blue-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'grossPay',
        header: () => <div className="text-center font-semibold">Gross Pay</div>,
        cell: ({ getValue }) => (
            <span className="font-semibold tabular-nums text-blue-700">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-blue-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },

    // ── Deductions — Attendance ───────────────────────────────────────────────
    {
        id: 'absent',
        accessorKey: 'absentDeduction',
        header: () => (
            <div className="text-center">
                <div>Absent</div>
                <div className="text-[10px] font-normal text-orange-400">days / amt</div>
            </div>
        ),
        cell: ({ row }) => {
            const { absentDays, absentDeduction } = row.original;
            return absentDays > 0 ? (
                <div className="text-center">
                    <div className="text-[11px] text-orange-500">
                        {absentDays} day{absentDays !== 1 ? 's' : ''}
                    </div>
                    <div className="font-medium text-orange-600">{peso(absentDeduction)}</div>
                </div>
            ) : (
                <span className="text-slate-400">—</span>
            );
        },
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-orange-50/80 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        id: 'tardy',
        accessorKey: 'lateDeduction',
        header: () => (
            <div className="text-center">
                <div>Tardy</div>
                <div className="text-[10px] font-normal text-orange-400">mins / amt</div>
            </div>
        ),
        cell: ({ row }) => {
            const { lateMinutes, lateDeduction } = row.original;
            return lateMinutes > 0 ? (
                <div className="text-center">
                    <div className="text-[11px] text-orange-500">{lateMinutes} min</div>
                    <div className="font-medium text-orange-600">{peso(lateDeduction)}</div>
                </div>
            ) : (
                <span className="text-slate-400">—</span>
            );
        },
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-orange-50/80 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },

    // ── Deductions — Statutory ────────────────────────────────────────────────
    {
        accessorKey: 'gsis',
        header: () => <div className="text-center">GSIS</div>,
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'philhealth',
        header: () => <div className="text-center">PhilHealth</div>,
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'pagibig',
        header: () => <div className="text-center">Pag-IBIG</div>,
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'tax',
        header: () => <div className="text-center">Tax</div>,
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },

    // ── Deductions — Org ──────────────────────────────────────────────────────
    {
        id: 'orgSavingsDues',
        accessorFn: (row) => row.internalOrgSavings + row.internalOrgSecond,
        header: () => (
            <div className="text-center">
                <div>Org Savings</div>
                <div className="text-[10px] font-normal text-red-400">&amp; Dues</div>
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'internalOrgLoans',
        header: () => (
            <div className="text-center">
                <div>Org Loans</div>
                <div className="text-[10px] font-normal text-red-400">both cut-offs</div>
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'otherDeductionsMisc',
        header: () => (
            <div className="text-center">
                <div>Other Ded.</div>
                <div className="text-[10px] font-normal text-red-400">water, misc</div>
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="tabular-nums text-red-600">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
    {
        accessorKey: 'totalDeductions',
        header: () => <div className="text-center font-semibold">Total Ded.</div>,
        cell: ({ getValue }) => (
            <span className="font-semibold tabular-nums text-red-700">{peso(getValue<number>())}</span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-red-50/60 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },

    // ── Net Pay ───────────────────────────────────────────────────────────────
    {
        accessorKey: 'netPay',
        header: () => <div className="text-center">Net Pay</div>,
        cell: ({ row }) => (
            <span
                className={`font-bold tabular-nums ${
                    row.original.status === 'low' ? 'text-red-600' : 'text-green-700'
                }`}
            >
                {peso(row.original.netPay)}
            </span>
        ),
        meta: { className: 'border-r px-3 py-2.5 text-center', headerClassName: 'border-r border-b bg-green-50 px-3 py-1.5 text-center text-[11px] font-medium text-green-700' },
    },

    // ── Remarks ───────────────────────────────────────────────────────────────
    {
        id: 'remarks',
        accessorKey: 'status',
        header: () => <div className="text-center">Remarks</div>,
        cell: ({ row }) => {
            const { status, floorCutAmount } = row.original;
            return (
                <div className="flex flex-col items-center gap-1">
                    <Badge
                        variant={status === 'ok' ? 'secondary' : 'destructive'}
                        className={
                            status === 'ok'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300'
                                : ''
                        }
                    >
                        {status === 'ok' ? 'OK' : 'Low'}
                    </Badge>
                    {floorCutAmount > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        Cut
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                    <p className="text-xs">
                                        <span className="font-semibold">
                                            ₱{floorCutAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </span>{' '}
                                        in deductions were cut because applying them would bring net pay below
                                        the minimum take-home threshold.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
        enableSorting: false,
        meta: { className: 'px-3 py-2.5 text-center', headerClassName: 'border-b bg-slate-100 px-3 py-1.5 text-center text-[11px] font-medium text-slate-600' },
    },
];

// ─── Header group row cells ────────────────────────────────────────────────────
// Pass this to DataTable's `headerGroups` prop.
// Each entry maps to a <th> in the top group row, using rowSpan/colSpan.

export const computedHeaderGroups = [
    // # — spans both header rows
    {
        label: '#',
        rowSpan: 2,
        className: 'w-8 border-r border-b bg-slate-100 px-2 py-2 text-center text-xs font-semibold tracking-wide uppercase text-slate-500',
    },
    // Employee Name — spans both header rows
    {
        label: 'Employee Name',
        rowSpan: 2,
        className: 'border-r border-b bg-slate-100 px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase text-slate-600',
    },
    // Earnings — spans 3 sub-columns
    {
        label: 'Earnings',
        colSpan: 3,
        className: 'border-r border-b bg-blue-50 px-3 py-1.5 text-center text-xs font-semibold tracking-wide uppercase text-blue-700',
    },
    // Deductions — spans 10 sub-columns
    {
        label: (
            <>
                Deductions{' '}
                <span className="font-normal normal-case text-red-400">(based on monthly salary)</span>
            </>
        ),
        colSpan: 10,
        className: 'border-r border-b bg-red-50 px-3 py-1.5 text-center text-xs font-semibold tracking-wide uppercase text-red-700',
    },
    // Net Pay — spans both header rows
    {
        label: 'Net Pay',
        rowSpan: 2,
        className: 'border-r border-b bg-green-50 px-3 py-2 text-center text-xs font-semibold tracking-wide uppercase text-green-700',
    },
    // Remarks — spans both header rows
    {
        label: 'Remarks',
        rowSpan: 2,
        className: 'border-b bg-slate-100 px-3 py-2 text-center text-xs font-semibold tracking-wide uppercase text-slate-500',
    },
];