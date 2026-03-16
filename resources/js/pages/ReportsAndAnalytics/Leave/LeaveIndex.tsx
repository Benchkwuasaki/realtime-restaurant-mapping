import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Reports',
        href: route('reports.leave'),
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Reports" />
            <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Leave Reports Here
                        </h2>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}