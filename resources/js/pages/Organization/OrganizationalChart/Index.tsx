import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { OrgChartHierarchy } from './components/org-chart-hierarchy';
import type { Department } from './data/schema';
import type { BreadcrumbItem } from '@/types';

interface Props {
    organizationalChart: Department[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Organisational Chart", href: "/organization/organizational_chart" },
];

export default function OrganizationalChart({ organizationalChart }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizational Chart" />

            <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                <div className="space-y-8">
                    {organizationalChart && organizationalChart.length > 0 ? (
                        <OrgChartHierarchy departments={organizationalChart} />
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
