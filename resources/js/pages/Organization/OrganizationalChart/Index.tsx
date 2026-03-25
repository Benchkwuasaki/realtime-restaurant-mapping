import { Head, Link } from '@inertiajs/react';
import { Building2, Layers, Users, ChevronRight, Network } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Department } from './data/schema';

interface Props {
    organizationalChart: Department[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organization', href: '#' },
    { title: 'Organizational Chart', href: '/organization/organizational_chart' },
];

function countEmployees(dept: Department): number {
    const top = (dept.topPositions ?? []).reduce((s, p) => s + (p.employees?.length ?? 0), 0);
    const div = (dept.divisions ?? []).reduce((ds, d) =>
        ds + (d.positions ?? []).reduce((ps, p) => ps + (p.employees?.length ?? 0), 0), 0);
    const unit = (dept.divisions ?? []).reduce((ds, d) =>
        ds + (d.units ?? []).reduce((us, u) =>
            us + (u.positions ?? []).reduce((ps, p) => ps + (p.employees?.length ?? 0), 0), 0), 0);
    return top + div + unit;
}

function getDeptHead(dept: Department) {
    const emp = dept.topPositions?.[0]?.employees?.[0];
    if (!emp) return null;
    return {
        name: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '),
        position: dept.topPositions?.[0]?.name ?? '',
        initials: [emp.firstName, emp.lastName]
            .filter(Boolean).map(n => n.charAt(0).toUpperCase()).join(''),
        avatarUrl: emp.avatarUrl,
    };
}

export default function OrganizationalChartIndex({ organizationalChart }: Props) {
    const departments = organizationalChart ?? [];
    const totalEmployees = departments.reduce((s, d) => s + countEmployees(d), 0);
    const totalDivisions = departments.reduce((s, d) => s + (d.divisions?.length ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizational Chart" />

            <div className="min-h-screen bg-background">
                <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

                    {/* Page header */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10
                            flex items-center justify-center shrink-0">
                            <Network className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-foreground">
                            Organizational Chart
                        </h1>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard
                            title="Departments"
                            value={departments.length}
                            icon={<Building2 className="h-4 w-4 text-primary" />}
                        />
                        <StatCard
                            title="Divisions"
                            value={totalDivisions}
                            icon={<Layers className="h-4 w-4 text-primary" />}
                        />
                        <StatCard
                            title="Employees"
                            value={totalEmployees}
                            icon={<Users className="h-4 w-4 text-primary" />}
                        />
                    </div>

                    {/* Section label */}
                    <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        Departments
                    </div>

                    {/* Department grid */}
                    {departments.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg shadow-sm
                            flex flex-col items-center justify-center py-16 sm:py-20">
                            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/20 mb-3 sm:mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">No departments found</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 text-center px-4">
                                Departments will appear here once they are added.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {departments.map(dept => {
                                const empCount = countEmployees(dept);
                                const divCount = dept.divisions?.length ?? 0;

                                return (
                                    <Link
                                        key={dept.id}
                                        href={`/organization/organizational_chart/${dept.id}`}
                                        className="group block bg-card border border-border rounded-lg
                                            shadow-sm hover:shadow-md hover:border-primary/40
                                            active:scale-[0.98] transition-all duration-200 overflow-hidden"
                                    >
                                        <div className="h-1 bg-primary/50 group-hover:bg-primary
                                            transition-colors duration-200" />

                                        <div className="p-3 sm:p-4">
                                            {/* Icon + badge */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full
                                                    bg-accent ring-2 ring-border flex items-center justify-center shrink-0">
                                                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                                                </div>
                                                <Badge variant="outline" className="font-mono text-xs shrink-0 ml-2">
                                                    {dept.acronym}
                                                </Badge>
                                            </div>

                                            {/* Name */}
                                            <h2 className="text-sm font-bold text-foreground leading-tight
                                                mb-0.5 line-clamp-2 group-hover:text-primary
                                                transition-colors duration-200">
                                                {dept.name}
                                            </h2>

                                            {/* Stats + arrow */}
                                            <div className="flex items-center justify-between
                                                pt-2.5 border-t border-border mt-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Layers className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {divCount} {divCount === 1 ? 'division' : 'divisions'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {empCount} {empCount === 1 ? 'employee' : 'employees'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/40
                                                    group-hover:text-primary group-hover:translate-x-0.5
                                                    transition-all duration-200 shrink-0" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}