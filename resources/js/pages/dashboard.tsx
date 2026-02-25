import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { route } from "ziggy-js"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: route('dashboard'),
  },
];

export default function Dashboard() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Dashboard hehe
            </h2>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
