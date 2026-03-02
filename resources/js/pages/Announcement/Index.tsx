import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { route } from "ziggy-js";

export default function User() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Announcements", href: route("announcement.index") },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <h1>Announcements Panel</h1>
        </AppLayout>
    )
}