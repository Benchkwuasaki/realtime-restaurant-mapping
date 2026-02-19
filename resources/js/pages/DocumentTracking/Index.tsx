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
            <div>
                <div className="flex h-full flex-1 flex-col overflow-x-auto rounded-xl p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3 ">
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <File className="size-10 shrink-0" />
                                <div className="flex flex-col">
                                    <CardTitle className="text-2xl font-mono font-thin">
                                        Total Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-mono">
                                        4
                                    </CardTitle>
                                    <CardDescription className="text-lg font-mono font-thin">
                                        Incoming and outgoing requests
                                    </CardDescription>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <Check className="size-10 shrink-0" />
                                <div className="flex flex-col">
                                    <CardTitle className="text-2xl font-mono font-thin">
                                        Total Done Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-mono">
                                        1
                                    </CardTitle>
                                    <CardDescription className="text-lg font-mono font-thin">
                                        Checked and reviewed requests
                                    </CardDescription>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <Inbox className="size-10 shrink-0" />
                                <div className="flex flex-col">
                                    <CardTitle className="text-2xl font-mono font-thin">
                                        Incoming Requests
                                    </CardTitle>
                                    <CardTitle className="text-3xl font-mono">
                                        3
                                    </CardTitle>
                                    <CardDescription className="text-lg font-mono font-thin">
                                        Requests to process
                                    </CardDescription>
                                </div>
                            </div>
                        </Card>
                    </div>
                    <TablePage />
                </div>
            </div>
        </AppLayout >
    );
}
