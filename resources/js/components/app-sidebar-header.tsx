import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';

const sampleLongBreadcrumbs: BreadcrumbItemType[] = [
    { title: 'Breadcrumb 1', href: '/b1' },
    { title: 'Breadcrumb 2', href: '/b2' },
    { title: 'Breadcrumb 3', href: '/b3' },
    { title: 'Breadcrumb 4', href: '/b4' },
    { title: 'Breadcrumb 5', href: '/b5' },
    { title: 'Breadcrumb 6', href: '/b6' },
    { title: 'Breadcrumb 7', href: '/b7' },
    { title: 'Breadcrumb 8', href: '/b8' },
    { title: 'Breadcrumb 9', href: '/b9' },
    { title: 'Breadcrumb 10', href: '/b10' },
    { title: 'Breadcrumb 11', href: '/b11' },
    { title: 'Breadcrumb 12', href: '/b12' },
]

export function AppSidebarHeader({
    breadcrumbs = sampleLongBreadcrumbs,
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <div className="min-w-0 flex-1">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    )
}