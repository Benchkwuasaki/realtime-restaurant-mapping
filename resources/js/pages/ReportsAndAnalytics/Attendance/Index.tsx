import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports and Analytics',
        href: route('reports_and_analytics.attendance-report.index'),
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports and Analytics" />
            <div>
                <h1>Attendance Reports and Analytics hehe</h1>
            </div>
        </AppLayout>
    );
}
