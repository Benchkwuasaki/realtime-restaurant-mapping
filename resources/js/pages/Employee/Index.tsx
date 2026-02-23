import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import TablePage from '@/components/Employeee/page';
import TaskPage from '@/components/Employeee/page';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: 'employee',
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee" />
            <div className='p-4'>
                <TaskPage />
            </div>
        </AppLayout>
    );
}
