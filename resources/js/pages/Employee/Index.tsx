import { Head } from '@inertiajs/react';
import TaskPage from '@/components/Employeee/page';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX } from "lucide-react";

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
            <div className='m-5'>
                <div className="flex h-full flex-1 flex-col overflow-x-auto rounded-xl p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <Card className="p-4 border border-gray-200 gap-0">
                            <div className="flex items-start justify-between mb-2">
                                <CardTitle className="text-md font-thin">
                                    Total Employees
                                </CardTitle>
                                <div className="bg-blue-100 p-2 rounded-md">
                                    <Users className="size-5 text-blue-500" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl mb-1">
                                24
                            </CardTitle>
                            <CardDescription className="text-md font-thin">
                                All registered employees
                            </CardDescription>
                        </Card>
                        <Card className="p-4 border border-gray-200 gap-0">
                            <div className="flex items-start justify-between mb-2">
                                <CardTitle className="text-md font-thin">
                                    Active Employees
                                </CardTitle>
                                <div className="bg-green-100 p-2 rounded-md">
                                    <UserCheck className="size-5 text-green-500" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl mb-1">
                                20
                            </CardTitle>
                            <CardDescription className="text-md font-thin">
                                Currently active employees
                            </CardDescription>
                        </Card>
                        <Card className="p-4 border border-gray-200 gap-0">
                            <div className="flex items-start justify-between mb-2">
                                <CardTitle className="text-md font-thin">
                                    Inactive Employees
                                </CardTitle>
                                <div className="bg-red-100 p-2 rounded-md">
                                    <UserX className="size-5 text-red-500" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl mb-1">
                                4
                            </CardTitle>
                            <CardDescription className="text-md font-thin">
                                On leave or inactive
                            </CardDescription>
                        </Card>
                    </div>
                    <TaskPage />
                </div>
            </div>
        </AppLayout>
    );
}  