import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { LeaveTabs } from './components/tab-navigation';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Leave Settings', href: route('leave.leave-settings') },
];

export default function TabNav() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>

      {/* page header title */}
      <Head title="Leave Settings" />

      {/* page whole content section */}
      <section className="w-full p-6">

        {/* stat card */}
        <section>
          {/* <h1>INSERT CARD HERE</h1> */}
        </section>

        {/* whole contetn area */}
        <section className="bg-card p-6 rounded-lg border border-secondary">

          {/* nav tab */}
          <section className="">
            <LeaveTabs />
          </section>

          {/* Table */}
          <section>
            {/* <h1>Insert table here</h1> */}
          </section>
          
        </section>
      </section>

<section></section>
    </AppLayout>
  );
}
