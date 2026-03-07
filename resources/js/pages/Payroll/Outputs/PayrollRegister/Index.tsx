// resources/js/Pages/Payroll/Outputs/PayrollRegister/Index.tsx

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { FileText } from 'lucide-react';
import { route } from 'ziggy-js';

import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface Period {
    payroll_period_id: number;
    start_date: string;
    end_date: string;
    cut_off: string | null;
    status: string;
    payroll_records_count: number;
    total_net_pay: number;
    total_basic_pay: number;
}

interface Props {
    auth: { user: any };
    periods: Period[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    { title: 'Payroll Register', href: route('payroll-register.index') },
];

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

function buildColumns(): ColumnDef<Period>[] {
    return [
        {
            id: 'period',
            accessorFn: (row) => formatPeriod(row.start_date, row.end_date),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Period" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatPeriod(
                        row.original.start_date,
                        row.original.end_date,
                    )}
                </span>
            ),
        },
        {
            accessorKey: 'cut_off',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cut-off" />
            ),
            cell: ({ getValue }) => (
                <span className="text-muted-foreground">
                    {(getValue() as string | null) ?? '—'}
                </span>
            ),
            filterFn: (row, _id, filterValues: string[]) =>
                filterValues.includes(row.original.cut_off ?? ''),
        },
        {
            accessorKey: 'payroll_records_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employees" />
            ),
            cell: ({ getValue }) => (
                <span className="tabular-nums">{getValue() as number}</span>
            ),
        },
        {
            accessorKey: 'total_basic_pay',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Total Basic Pay"
                />
            ),
            cell: ({ getValue }) => (
                <span className="font-medium tabular-nums">
                    {peso(getValue() as number)}
                </span>
            ),
        },
        {
            accessorKey: 'total_net_pay',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Net Pay" />
            ),
            cell: ({ getValue }) => (
                <span className="font-semibold text-green-700 tabular-nums dark:text-green-400">
                    {peso(getValue() as number)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ getValue }) => {
                const status = getValue() as string;
                return (
                    <Badge
                        variant="outline"
                        className={
                            status === 'Closed'
                                ? 'border-green-500 text-green-600'
                                : 'border-blue-500 text-blue-600'
                        }
                    >
                        {status}
                    </Badge>
                );
            },
            filterFn: (row, _id, filterValues: string[]) =>
                filterValues.includes(row.original.status),
        },
        {
            id: 'actions',
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-950"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.visit(
                            route(
                                'payroll-register.show',
                                row.original.payroll_period_id,
                            ),
                        );
                    }}
                >
                    <FileText className="h-3.5 w-3.5" />
                    View Register
                </Button>
            ),
        },
    ];
}

export default function Index({ periods }: Props) {
    const columns = React.useMemo(() => buildColumns(), []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Register" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Payroll Register</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Select a processed period to view or print its payroll
                        register.
                    </p>
                </div>

                <DataTable
                    columns={columns}
                    data={periods ?? []}
                    getRowId={(row) => String(row.payroll_period_id)}
                    searchColumnId="period"
                    searchPlaceholder="Search period..."
                    filters={[
                        {
                            columnId: 'cut_off',
                            title: 'Cut-off',
                            options: [
                                { label: '1st Cut-off', value: '1st' },
                                { label: '2nd Cut-off', value: '2nd' },
                            ],
                        },
                        {
                            columnId: 'status',
                            title: 'Status',
                            options: [
                                { label: 'Processed', value: 'Processed' },
                                { label: 'Closed', value: 'Closed' },
                            ],
                        },
                    ]}
                    defaultPageSize={10}
                />
            </div>
        </AppLayout>
    );
}
