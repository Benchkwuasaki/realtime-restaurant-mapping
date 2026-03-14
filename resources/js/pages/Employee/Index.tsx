import { Head, router } from '@inertiajs/react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/shared/data-table/data-table';
import { StatCard } from '@/components/shared/stat-card';
import AppLayout from '@/layouts/app-layout';
import { columns } from '@/pages/Employee/components/columns';
import { type Employee } from '@/pages/Employee/data/schema';
import type { BreadcrumbItem } from '@/types';
import { toast } from "sonner"

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
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
]

const EmpClassFilterOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Job Order', label: 'Job Order' },
    { value: 'Casual', label: 'Casual' },
]

export default function Index({ employees, totalEmployees, activeEmployees, inactiveEmployees }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
                {/* ── Summary Cards ── */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatCard
                        title="Total Employees"
                        value={totalEmployees}
                        description="All registered employees"
                        icon={<Users className="size-5 m-2" />}
                    />
                    <StatCard
                        title="Active Employees"
                        value={activeEmployees}
                        description="Currently active employees"
                        icon={<UserCheck className="size-5 m-2 text-primary" />}
                    />
                    <StatCard
                        title="Inactive Employees"
                        value={inactiveEmployees}
                        description="On leave or inactive"
                        icon={<UserX className="size-5 m-2 text-destructive" />}
                    />
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
                        {
                            columnId: 'employmentClassification',
                            title: 'Employment Classification',
                            options: EmpClassFilterOptions,
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
                        onSuccess: (count) => toast.success('Employees deleted', {        
                            description: `${count} employee(s) removed successfully.`,
                        }),
                        onError: () => toast.error('Failed to delete employees', {        
                            description: 'Please check your permissions and try again.',
                        }),
                    }}
                />
            </div>
        </AppLayout>
    );
}