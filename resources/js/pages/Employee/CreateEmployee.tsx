import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import TaskPage from '@/components/Employeee/page';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: '/employee',
    },
    {
        title: 'Create Employee',
        href: '/employee/create',
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />
            <div className='p-4'>
                Hi
            </div>
        </AppLayout>
    );
}
