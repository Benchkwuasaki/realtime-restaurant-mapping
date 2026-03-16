import { Head } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ActivityLogRow, columns } from "./components/columns"
import { route } from "ziggy-js"
import { DataTable } from "./components/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { ClipboardList, Clock, Users } from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Activity Logs",
        href: route("activity_logs.index"),
    },
]

type Props = {
    activity_logs: ActivityLogRow[]
    stat: {
        total_logs: number
        logs_24h: number
        active_users_24h: number
    }
}

export default function Index({ activity_logs, stat }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatCard
                        title="Total Logs"
                        value={stat.total_logs}
                        description="All recorded activity logs"
                        icon={<ClipboardList className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Logs (24 Hours)"
                        value={stat.logs_24h}
                        description="Logs created in the last 24 hours"
                        icon={<Clock className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Active Users (24h)"
                        value={stat.active_users_24h}
                        description="Unique users who generated logs"
                        icon={<Users className="size-4 text-primary" />}
                    />
                </div>

                <DataTable data={activity_logs} columns={columns} />
            </div>
        </AppLayout>
    )
}