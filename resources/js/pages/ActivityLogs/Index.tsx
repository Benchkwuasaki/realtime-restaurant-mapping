import { Head } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ActivityLogRow, columns } from "./components/columns"
import { route } from "ziggy-js"
import { DataTable } from "./components/data-table"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
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

            <div className="h-full flex-1 flex-col gap-8 p-8 md:flex">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Total Logs */}
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Total Logs</CardTitle>
                            <div className="bg-blue-100 p-2 rounded-md">
                                <ClipboardList className="size-5 text-blue-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">{stat.total_logs}</CardTitle>
                        <CardDescription className="text-md font-thin">
                            All recorded activity logs
                        </CardDescription>
                    </Card>

                    {/* Logs (24h) */}
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Logs (24 Hours)</CardTitle>
                            <div className="bg-green-100 p-2 rounded-md">
                                <Clock className="size-5 text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">{stat.logs_24h}</CardTitle>
                        <CardDescription className="text-md font-thin">
                            Logs created in the last 24 hours
                        </CardDescription>
                    </Card>

                    {/* Active Users (24h) */}
                    <Card className="p-4 gap-0">
                        <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-md font-thin">Active Users (24h)</CardTitle>
                            <div className="bg-red-100 p-2 rounded-md">
                                <Users className="size-5 text-red-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl mb-1">
                            {stat.active_users_24h}
                        </CardTitle>
                        <CardDescription className="text-md font-thin">
                            Unique users who generated logs
                        </CardDescription>
                    </Card>
                </div>

                <DataTable data={activity_logs} columns={columns} />
            </div>
        </AppLayout>
    )
}