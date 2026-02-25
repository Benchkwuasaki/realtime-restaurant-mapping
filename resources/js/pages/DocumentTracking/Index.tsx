import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import TablePage from '@/components/DocumentTracking/page';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { File, Inbox, Check } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Document Tracking',
        href: 'document_tracking',
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Tracking" />
            <div className="mx-10 mt-5">
                <div className="flex h-full flex-1 flex-col overflow-x-auto rounded-xl p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-base font-medium text-gray-700">
                                        Total Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-bold mt-2">
                                        4
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-400 mt-1">
                                        Incoming and outgoing requests
                                    </CardDescription>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 shrink-0">
                                    <File className="size-5 text-blue-500" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-base font-medium text-gray-700">
                                        Total Done Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-bold mt-2">
                                        1
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-400 mt-1">
                                        Checked and reviewed requests
                                    </CardDescription>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 shrink-0">
                                    <Check className="size-5 text-green-500" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-base font-medium text-gray-700">
                                        Incoming Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-bold mt-2">
                                        3
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-400 mt-1">
                                        Requests to process
                                    </CardDescription>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 shrink-0">
                                    <Inbox className="size-5 text-red-400" />
                                </div>
                            </div>
                        </Card>
                    </div>
                    <TablePage />
                </div>
            </div>
        </AppLayout>
    );
}