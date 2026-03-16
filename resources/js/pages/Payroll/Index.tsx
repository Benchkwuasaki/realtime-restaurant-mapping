import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: route('payroll.index'),
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Payroll hehe
                        </h2>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
