import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { LeaveTabs } from './components/tab-navigation';
import { StatCard } from '@/components/shared/stat-card';
import {
    CalendarDays,
    HandCoins,
    IterationCcw,
    PackagePlus,
} from 'lucide-react';
import type { LeaveType, LeaveEntitlement } from './data/schema';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Settings', href: route('leave.leave-settings') },
];

type Props = {
    leave_types: LeaveType[];
    leave_entitlements: LeaveEntitlement[];
    total_leave_types: number;
    total_paid: number;
    total_convertible: number;
};

export default function LeaveSettingsTabNav({
    leave_types,
    leave_entitlements,
    total_leave_types,
    total_paid,
    total_convertible,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* page header title */}
            <Head title="Leave Settings" />

            {/* page whole content section */}
            <section className="w-full p-6">
                {/* stat card */}
                <section className="mb-6 grid max-w-300 grid-cols-1 gap-5 lg:grid-cols-4">
                    <StatCard
                        title="Total Leave Types"
                        value={total_leave_types}
                        description="Total No. of Leave Types"
                        icon={<CalendarDays className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Total Paid Leave"
                        value={total_paid}
                        description="Total No. of Paid Leave Types"
                        icon={<HandCoins className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Total Convertible Leave"
                        value={total_convertible}
                        description="Total No. of Convertible Leave Types"
                        icon={<IterationCcw className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Total Cumulative Leave"
                        value={total_convertible}
                        description="Total No. of Cumulative Leave Types"
                        icon={<PackagePlus className="size-4 text-primary" />}
                    />
                </section>

                {/* whole content area */}
                <section className="rounded-lg border border-secondary bg-card p-6">
                    {/* nav tab */}
                    <section className="">
                        <LeaveTabs
                            leave_types={leave_types}
                            leave_entitlements={leave_entitlements}
                        />
                    </section>
                </section>
            </section>
        </AppLayout>
    );
}
