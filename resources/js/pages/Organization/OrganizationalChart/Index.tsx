import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentNode } from './components/chart-nodes';
import type { Department } from './data/schema';

interface Props {
    organizationalChart: Department[];
}

export default function OrganizationalChart({ organizationalChart }: Props) {
    return (
        <AppLayout>
            <Head title="Organizational Chart" />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Organizational Chart
                    </h1>
                    <p className="text-gray-600 mt-2">
                        View your organization's structure, divisions, and team members
                    </p>
                </div>

                <div className="space-y-6">
                    {organizationalChart && organizationalChart.length > 0 ? (
                        organizationalChart.map((department) => (
                            <DepartmentNode
                                key={department.id}
                                department={department}
                            />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-gray-500">
                                    No departments found
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
