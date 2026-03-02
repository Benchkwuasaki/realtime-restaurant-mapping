import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentHierarchy } from './components/department-hierarchy';
import type { Department } from './data/schema';
import type { BreadcrumbItem } from '@/types';

interface Props {
    organizationalChart: Department[];
    departmentCount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Organisational Chart", href: "/organization/organizational_chart" },
];

export default function OrganizationalChart({ organizationalChart, departmentCount }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizational Chart" />

            <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                {/* Header with department count */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Organizational Chart</h1>
                    <p className="text-gray-600 mt-2">
                        Total Departments: <span className="font-semibold text-purple-600">{organizationalChart?.length || 0}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    {organizationalChart && organizationalChart.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <DepartmentHierarchy departments={organizationalChart} level={0} />
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-gray-500">
                                    No departments found in the database
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
