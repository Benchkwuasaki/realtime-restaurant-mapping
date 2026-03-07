import { Head, router } from '@inertiajs/react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/shared/data-table/data-table';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { columns } from '@/pages/Employee/components/columns';
import { type Employee } from '@/pages/Employee/data/schema';
import type { BreadcrumbItem } from '@/types';

interface Props {
    employees: Employee[];
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employee', href: route('employee.index') },
];

const statusFilterOptions = [
    { value: true,  label: 'Active' },
    { value: false, label: 'Inactive' },
]

export default function Index({ employees, totalEmployees, activeEmployees, inactiveEmployees }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
                {/* ── Summary Cards ── */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Total Employees</CardTitle>
                            <div className="bg-blue-100 p-2 rounded-md">
                                <Users className="size-5 text-blue-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">{totalEmployees}</CardTitle>
                        <CardDescription className="text-md font-thin">All registered employees</CardDescription>
                    </Card>
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Active Employees</CardTitle>
                            <div className="bg-green-100 p-2 rounded-md">
                                <UserCheck className="size-5 text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">{activeEmployees}</CardTitle>
                        <CardDescription className="text-md font-thin">Currently active employees</CardDescription>
                    </Card>
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Inactive Employees</CardTitle>
                            <div className="bg-red-100 p-2 rounded-md">
                                <UserX className="size-5 text-red-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">{inactiveEmployees}</CardTitle>
                        <CardDescription className="text-md font-thin">On leave or inactive</CardDescription>
                    </Card>
                </div>

                {/* ── Table ── */}
                <DataTable
                    data={employees}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    onRowClick={(row) => router.get(route('employee.show', row.original.id))}
                    searchColumnId="name"
                    searchPlaceholder="Search employees..."
                    filters={[
                        {
                            columnId: 'status',
                            title: 'Status',
                            options: statusFilterOptions,
                        },
                    ]}
                    addButton={{
                        label: 'Create Employee',
                        onClick: () => router.visit(route('employee.create')),
                    }}
                    bulkDelete={{
                        route: route('employee.bulk-destroy'),
                        entityName: 'Employee',
                        getId: (row) => (row as Employee).id,
                    }}
                />
            </div>
        </AppLayout>
    );
}