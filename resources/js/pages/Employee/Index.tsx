import { Head } from '@inertiajs/react';
import TaskPage from '@/components/Employeee/page';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
