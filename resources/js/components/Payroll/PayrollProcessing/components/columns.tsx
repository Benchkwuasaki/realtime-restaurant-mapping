// resources/js/pages/Payroll/Processing/components/columns.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import {
    type PayrollEmployee,
    type AttendanceRecord,
    type FinalizedEmployee,
} from '../data/types';
import { peso } from '../data/utils';

// ─── Step 2: Load Employees ────────────────────────────────────────────────────
//
// Uses a factory function because cells close over live state from Index.tsx:
//   - includedEmployeeIds / filteredEmployees  → checkbox checked + dim states
//   - attendance                               → absent/late input values
//   - setAllIncluded / setEmployeeIncluded     → checkbox onChange handlers
//   - updateAttendance                         → absent/late onChange handlers
//
// Call this inside useMemo() in Index.tsx so the columns only rebuild when
// the relevant state slices actually change.

export interface LoadEmployeeColumnsOptions {
    includedEmployeeIds: number[];
    filteredEmployees: PayrollEmployee[];
    attendance: Record<number, AttendanceRecord>;
    setAllIncluded: (include: boolean) => void;
    setEmployeeIncluded: (id: number, include: boolean) => void;
    updateAttendance: (
        employeeId: number,
        field: keyof AttendanceRecord,
        value: string,
    ) => void;
}

export function createLoadEmployeeColumns(
    options: LoadEmployeeColumnsOptions,
): DataTableColumnDef<PayrollEmployee>[] {
    const {
        includedEmployeeIds,
        filteredEmployees,
        attendance,
        setAllIncluded,
        setEmployeeIncluded,
        updateAttendance,
    } = options;

    return [
        // ── Include / exclude checkbox ─────────────────────────────────────────
        {
            id: 'included',
            header: () => (
                <div className="flex justify-center">
                    <Checkbox
                        checked={
                            filteredEmployees.length > 0 &&
                            includedEmployeeIds.length ===
                                filteredEmployees.length
                                ? true
                                : includedEmployeeIds.length === 0
                                  ? false
                                  : 'indeterminate'
                        }
                        onCheckedChange={(checked) =>
                            setAllIncluded(
                                checked === true || checked === 'indeterminate',
                            )
                        }
                    />
                </div>
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={included}
                            onCheckedChange={(checked) =>
                                setEmployeeIncluded(
                                    row.original.id,
                                    checked === true,
                                )
                            }
                        />
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
        },

        // ── Row number ─────────────────────────────────────────────────────────
        {
            id: 'index',
            header: '#',
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums">
                    {row.index + 1}
                </span>
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // ── Employee name ──────────────────────────────────────────────────────
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee Name" />
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <span
                        className={`font-medium ${!included ? 'opacity-40' : ''}`}
                    >
                        {row.original.name}
                    </span>
                );
            },
        },

        // ── Position ───────────────────────────────────────────────────────────
        {
            accessorKey: 'position',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Position Title" />
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <span
                        className={`text-sm text-muted-foreground ${!included ? 'opacity-40' : ''}`}
                    >
                        {row.original.position}
                    </span>
                );
            },
        },

        // ── Salary grade & step ────────────────────────────────────────────────
        {
            accessorKey: 'salary_grade',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Salary Grade & Step"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <div
                        className={`flex justify-center ${!included ? 'opacity-40' : ''}`}
                    >
                        {row.original.salary_grade ? (
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                                SG {row.original.salary_grade} – Step{' '}
                                {row.original.salary_step ?? 1}
                            </Badge>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">
                                —
                            </span>
                        )}
                    </div>
                );
            },
        },

        // ── Basic pay ──────────────────────────────────────────────────────────
        {
            accessorKey: 'basic_pay',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Basic Pay (Semi-Mo.)"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <span
                        className={`block text-center font-medium tabular-nums ${!included ? 'opacity-40' : ''}`}
                    >
                        {peso(row.original.basic_pay)}
                    </span>
                );
            },
        },

        // ── Absent days input ──────────────────────────────────────────────────
        {
            id: 'absent_days',
            header: 'Absent Days',
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <InputGroup className="mx-auto w-28">
                        <InputGroupInput
                            type="number"
                            min={0}
                            max={31}
                            value={
                                attendance[row.original.id]?.absent_days ?? 0
                            }
                            onChange={(e) =>
                                updateAttendance(
                                    row.original.id,
                                    'absent_days',
                                    e.target.value,
                                )
                            }
                            disabled={!included}
                            className="text-center"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>days</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                );
            },
            enableSorting: false,
        },

        // ── Late minutes input ─────────────────────────────────────────────────
        {
            id: 'late_minutes',
            header: 'Late (mins)',
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <InputGroup className="mx-auto w-28">
                        <InputGroupInput
                            type="number"
                            min={0}
                            value={
                                attendance[row.original.id]?.late_minutes ?? 0
                            }
                            onChange={(e) =>
                                updateAttendance(
                                    row.original.id,
                                    'late_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!included}
                            className="text-center"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                );
            },
            enableSorting: false,
        },

        // ── Undertime minutes ─────────────────────────────────────────────────
        // Auto-derived from work_minutes vs expected schedule; editable by HR.
        // Deducted from payroll at the same per-minute rate as late minutes.
        {
            id: 'undertime_minutes',
            header: 'Undertime (mins)',
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                return (
                    <InputGroup className="mx-auto w-28">
                        <InputGroupInput
                            type="number"
                            min={0}
                            value={
                                attendance[row.original.id]
                                    ?.undertime_minutes ?? 0
                            }
                            onChange={(e) =>
                                updateAttendance(
                                    row.original.id,
                                    'undertime_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!included}
                            className="text-center"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                );
            },
            enableSorting: false,
        },

        // ── Personal Slip minutes (CHARGEABLE) ────────────────────────────────
        // Personal slips are deducted from payroll at the per-minute rate.
        // Pre-filled from whereabout_slips; editable so HR can correct values.
        {
            id: 'personal_slip_minutes',
            header: () => (
                <span>
                    Personal Slip{' '}
                    <span className="text-[10px] font-normal text-amber-500">
                        (chargeable)
                    </span>
                </span>
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                const val =
                    attendance[row.original.id]?.personal_slip_minutes ?? 0;
                return (
                    <InputGroup
                        className={`mx-auto w-28 ${val > 0 ? 'ring-1 ring-amber-300' : ''}`}
                    >
                        <InputGroupInput
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) =>
                                updateAttendance(
                                    row.original.id,
                                    'personal_slip_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!included}
                            className="text-center"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                );
            },
            enableSorting: false,
        },

        // ── Official Slip minutes (AUTHORISED — no deduction) ────────────────
        // Official slips are authorised absences. They are pre-filled from the
        // whereabout_slips table and shown for transparency, but they do NOT
        // produce any payroll deduction.
        {
            id: 'official_slip_minutes',
            header: () => (
                <span className="text-blue-700">
                    Official Slip{' '}
                    <span className="text-[10px] font-normal text-blue-400">
                        (no deduction)
                    </span>
                </span>
            ),
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                const val =
                    attendance[row.original.id]?.official_slip_minutes ?? 0;
                return (
                    <InputGroup
                        className={`mx-auto w-28 ${val > 0 ? 'ring-1 ring-blue-200' : ''}`}
                    >
                        <InputGroupInput
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) =>
                                updateAttendance(
                                    row.original.id,
                                    'official_slip_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!included}
                            className="text-center text-blue-700"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                );
            },
            enableSorting: false,
        },

        // ── Total Work Hours (read-only display) ──────────────────────────────
        // SUM(work_minutes) / 60 across attended days, computed server-side.
        // Not editable — reflects actual recorded work time from attendance_records.
        {
            id: 'total_work_hours',
            header: 'Work Hours',
            cell: ({ row }) => {
                const included = includedEmployeeIds.includes(row.original.id);
                const hrs = attendance[row.original.id]?.total_work_hours ?? 0;
                return (
                    <span
                        className={`block text-center text-sm text-muted-foreground tabular-nums ${!included ? 'opacity-40' : ''}`}
                    >
                        {hrs > 0 ? `${Number(hrs).toFixed(1)} h` : '—'}
                    </span>
                );
            },
            enableSorting: false,
        },
    ];
}

// ─── Step 5: Finalized Payroll ─────────────────────────────────────────────────
//
// Static export — cells only read from row.original, no external state needed.
// Mirrors the pattern used in Employee/components/columns.tsx.

export const finalizedColumns: DataTableColumnDef<FinalizedEmployee>[] = [
    // ── Row number ─────────────────────────────────────────────────────────────
    {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground tabular-nums">
                {row.index + 1}
            </span>
        ),
        enableSorting: false,
        enableHiding: false,
    },

    // ── Employee name ──────────────────────────────────────────────────────────
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Employee Name" />
        ),
        cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
        ),
    },

    // ── Gross pay ──────────────────────────────────────────────────────────────
    {
        accessorKey: 'grossPay',
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title="Gross Pay"
                className="justify-end"
            />
        ),
        cell: ({ row }) => (
            <span className="block text-right tabular-nums">
                {peso(row.original.grossPay)}
            </span>
        ),
    },

    // ── Total deductions ───────────────────────────────────────────────────────
    {
        accessorKey: 'totalDeductions',
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title="Total Deductions"
                className="justify-end"
            />
        ),
        cell: ({ row }) => (
            <span className="block text-right text-red-600 tabular-nums">
                {peso(row.original.totalDeductions)}
            </span>
        ),
    },

    // ── Net pay ────────────────────────────────────────────────────────────────
    {
        accessorKey: 'netPay',
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title="Net Pay"
                className="justify-end"
            />
        ),
        cell: ({ row }) => (
            <span
                className={`block text-right font-semibold tabular-nums ${
                    row.original.status === 'low'
                        ? 'text-red-600'
                        : 'text-green-700'
                }`}
            >
                {peso(row.original.netPay)}
            </span>
        ),
    },

    // ── Floor check status badge ───────────────────────────────────────────────
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <div className="flex justify-center">
                <Badge
                    variant={
                        row.original.status === 'ok'
                            ? 'secondary'
                            : 'destructive'
                    }
                    className={
                        row.original.status === 'ok'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300'
                            : ''
                    }
                >
                    {row.original.status === 'ok' ? 'OK' : 'Low'}
                </Badge>
            </div>
        ),
        filterFn: (row, _id, filterValues: string[]) =>
            filterValues.length === 0 ||
            filterValues.includes(row.original.status),
    },
];
