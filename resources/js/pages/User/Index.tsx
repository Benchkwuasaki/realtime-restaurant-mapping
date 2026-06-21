import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { route } from "ziggy-js";

export default function User() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "User Management", href: route("user.index") },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            <h1>User Management Panel</h1>
        </AppLayout>
    )
}