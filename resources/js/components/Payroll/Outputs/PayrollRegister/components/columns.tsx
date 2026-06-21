'use client';

import { router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { route } from 'ziggy-js';
import { format, parseISO } from 'date-fns';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Period {
    payroll_period_id: number;
    start_date: string;
    end_date: string;
    cut_off: string | null;
    employee_type: string | null;
    status: string;
    payroll_records_count: number;
    total_net_pay: number;
    total_basic_pay: number;
}

function formatPeriod(start: string, end: string): string {
    try {
        const s = parseISO(start);
        const e = parseISO(end);
        if (
            s.getMonth() === e.getMonth() &&
            s.getFullYear() === e.getFullYear()
        ) {
            return `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`;
        }
        return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    } catch {
        return `${start} – ${end}`;
    }
}

function peso(n: number): string {
    return (
        '₱' +
        n.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

// ── Columns ───────────────────────────────────────────────────────────────────

export const columns: DataTableColumnDef<Period>[] = [
    {
        id: 'period',
        accessorFn: (row) => formatPeriod(row.start_date, row.end_date),
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Period" />
        ),
        cell: ({ row }) => (
            <div className="min-w-[140px] font-medium">
                {formatPeriod(row.original.start_date, row.original.end_date)}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'cut_off',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Cut-off" />
        ),
        cell: ({ getValue }) => (
            <div className="min-w-[70px] text-muted-foreground">
                {(getValue() as string | null) ?? '—'}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
        filterFn: (row, _id, filterValues: string[]) =>
            filterValues.includes(row.original.cut_off ?? ''),
    },
    {
        accessorKey: 'employee_type',
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title="Employment Classification"
            />
        ),
        cell: ({ getValue }) => {
            const val = getValue() as string | null;

            const variant =
                val === 'Job Order'
                    ? 'outline'
                    : val === 'Casual'
                      ? 'secondary'
                      : 'default';

            return val ? (
                <Badge
                    variant={variant}
                    className="min-w-[80px] justify-center"
                >
                    {val}
                </Badge>
            ) : (
                <span className="text-muted-foreground">—</span>
            );
        },
        enableSorting: true,
        enableHiding: true,
        filterFn: (row, _id, filterValues: string[]) =>
            filterValues.includes(row.original.employee_type ?? ''),
    },
    {
        accessorKey: 'payroll_records_count',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Employees" />
        ),
        cell: ({ getValue }) => (
            <div className="min-w-[80px] tabular-nums">
                {getValue() as number}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'total_basic_pay',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Total Basic Pay" />
        ),
        cell: ({ getValue }) => (
            <div className="min-w-[130px] font-medium tabular-nums">
                {peso(getValue() as number)}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'total_net_pay',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Total Net Pay" />
        ),
        cell: ({ getValue }) => (
            <div className="min-w-[130px] font-semibold text-green-700 tabular-nums dark:text-green-400">
                {peso(getValue() as number)}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ getValue }) => {
            const status = getValue() as string;
            return (
                <Badge variant={status === 'Closed' ? 'green' : 'blue'}>
                    {status}
                </Badge>
            );
        },
        enableSorting: true,
        enableHiding: true,
        filterFn: (row, _id, filterValues: string[]) =>
            filterValues.includes(row.original.status),
    },
];
