// resources/js/Pages/Payroll/Outputs/PayrollRegister/Index.tsx

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, Landmark, TrendingUp } from 'lucide-react';
import { route } from 'ziggy-js';

import { DataTable } from '@/components/shared/data-table/data-table';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
    columns,
    type Period,
} from '@/components/Payroll/Outputs/PayrollRegister/components/columns';
import type { BreadcrumbItem } from '@/types';

interface Props {
    auth: { user: any };
    periods: Period[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    { title: 'Payroll Register', href: route('payroll-register.index') },
];

function peso(n: number): string {
    return (
        '₱' +
        n.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export default function Index({ periods }: Props) {
    const totalNetPay = periods.reduce((sum, p) => sum + p.total_net_pay, 0);
    const totalBasicPay = periods.reduce(
        (sum, p) => sum + p.total_basic_pay,
        0,
    );

    const employmentClassificationOptions = React.useMemo(() => {
        const unique = Array.from(
            new Set(
                periods
                    .map((p) => p.employee_type)
                    .filter((t): t is string => !!t),
            ),
        ).sort();
        return unique.map((val) => ({ label: val, value: val }));
    }, [periods]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Register" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
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
                    onRowClick={(row) =>
                        router.visit(
                            route(
                                'payroll-register.show',
                                row.original.payroll_period_id,
                            ),
                        )
                    }
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
                            columnId: 'employee_type',
                            title: 'Employment Classification',
                            options: employmentClassificationOptions,
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
