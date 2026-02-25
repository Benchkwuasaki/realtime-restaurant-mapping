import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ActivityLogRow, columns } from './components/columns';
import { route } from 'ziggy-js';
import { DataTable } from './components/data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity Logs',
        href: route('activity_logs.index'),
    },
];

type Props = {
    activity_logs: ActivityLogRow[];
}

export default function Index({ activity_logs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            <div className="h-full flex-1 flex-col gap-8 p-8 md:flex">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Welcome back!
                        </h2>
                        <p className="text-muted-foreground">
                            Here&apos;s a list of your tasks for this month.
                        </p>
                    </div>
                </div>
                <DataTable data={activity_logs} columns={columns} />
            </div>
        </AppLayout>
    );
}
