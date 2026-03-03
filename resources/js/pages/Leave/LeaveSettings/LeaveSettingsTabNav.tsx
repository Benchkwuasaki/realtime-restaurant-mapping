import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { LeaveTabs } from './components/tab-navigation';
import { StatCard } from '@/components/shared/stat-card';
import { Building2 } from 'lucide-react';
import type { LeaveType } from "./data/schema";

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Leave Settings', href: route('leave.leave-settings') },
];

// type LeaveType = {
//   leave_type_id: number;
//   leave_type_name: string;
//   leave_type_description: string;
//   eligible_sex: string;
//   is_paid: boolean;
//   is_convertible: boolean;
// }

type Props = {
  leave_types: LeaveType[];
}

export default function LeaveSettingsTabNav({ leave_types }: Props) {

  return (
    <AppLayout breadcrumbs={breadcrumbs}>

      {/* page header title */}
      <Head title="Leave Settings" />

      {/* page whole content section */}
      <section className="w-full p-6">

        {/* stat card */}
        <section className="max-w-300 grid  grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
          <StatCard title="Total Leave Types" value={100} description="Total No. of Leave Types" icon={<Building2 className="size-4" />} />
          <StatCard title="Total Paid" value={100} description="Total No. of Paid Leave" icon={<Building2 className="size-4" />} />
          <StatCard title="Total Convertible" value={100} description="Total No. of Convertible Leave" icon={<Building2 className="size-4" />} />
        </section>

        {/* whole content area */}
        <section className="bg-card p-6 rounded-lg border border-secondary">

          {/* nav tab */}
          <section className="">
            <LeaveTabs leave_types={leave_types} />
          </section>

          {/* Table */}
          <section>
            {/* <DataTable
              columns={getColumns({ onEdit: openEdit })}
              data={units}
              getRowId={(row) => String(row.unit_id)}
              onRowClick={(row) => openPositions(row.original)}
              searchColumnId="unit_name"
              searchPlaceholder="Search units..."
              addButton={{
                label: "Create Unit",
                onClick: openCreate,
              }}
              bulkDelete={{
                route: route("unit.bulk-destroy"),
                entityName: "Unit",
                getId: (row) => (row as Unit).unit_id,
              }}
            /> */}
          </section>

        </section>
      </section>
    </AppLayout>
  );
}