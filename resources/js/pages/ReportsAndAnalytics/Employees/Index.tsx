import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTable } from '@/components/shared/data-table/data-table';
import { StatCard } from '@/components/shared/stat-card';
import { Users, UserCheck, UserMinus } from 'lucide-react';;

import {
    EMP_TYPES, STATUSES, GENDERS, EDUC_LEVELS,
    DEPT_COLOR_POOL, TYPE_COLORS, STATUS_CFG,
    blue, emerald, amber, violet, cyan, rose, indigo, slate,
    type Employee, type EmployeeReportProps, type EmployeeFilters, EMPTY_FILTERS,
} from './data/employee-report';
import { employeeMasterlistColumns, buildEmployeeTableFilters } from './components/employee-masterlist-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees Reports and Analytics',
        href: route('reports_and_analytics.employee-report.index'),
    },
];

/* ── Dept colour — same hash fn as in columns so colours stay in sync ──────── */
function deptColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_COLOR_POOL[Math.abs(hash) % DEPT_COLOR_POOL.length];
}

/* ── Shared card wrapper ─────────────────────────────────────────────────── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: 20, ...style }}>
        {children}
    </div>
);

const SH = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
    </div>
);

/* ── Badge helpers ───────────────────────────────────────────────────────── */
const STATUS_VARIANT: Record<string, 'green' | 'secondary'> = {
    Active: 'green',
    Inactive: 'secondary',
};
const TYPE_VARIANT: Record<string, 'outline' | 'default' | 'secondary'> = {
    Regular: 'default',
    Casual: 'secondary',
    'Job Order': 'outline',
};
function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>{status}</Badge>;
}
function TypeBadge({ type }: { type: string }) {
    return <Badge variant={TYPE_VARIANT[type] ?? 'secondary'}>{type}</Badge>;
}

/* ══════════════════════════════════════════
   ACTIVE FILTER CHIPS
══════════════════════════════════════════ */
function ActiveFilters({ filters, setFilters }: { filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void }) {
    const chips = [
        filters.status && { key: 'status' as const, label: filters.status, color: STATUS_CFG[filters.status]?.color ?? slate },
        filters.type && { key: 'type' as const, label: filters.type, color: TYPE_COLORS[filters.type] ?? slate },
        filters.dept && { key: 'dept' as const, label: filters.dept, color: deptColor(filters.dept) },
    ].filter(Boolean) as { key: keyof EmployeeFilters; label: string; color: string }[];

    if (!chips.length) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)' }}>Active filters:</span>
            {chips.map(c => (
                <button key={c.key} onClick={() => setFilters({ ...filters, [c.key]: '' })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: c.color, background: `${c.color}14`, border: `1px solid ${c.color}30`, cursor: 'pointer' }}>
                    {c.label} <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                </button>
            ))}
            <Button variant="ghost" size="xs" onClick={() => setFilters(EMPTY_FILTERS)} className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                Clear all
            </Button>
        </div>
    );
}

/* ══════════════════════════════════════════
   EMPLOYEE DETAIL DRAWER
══════════════════════════════════════════ */
function EmployeeDrawer({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
    const color = employee ? deptColor(employee.department) : blue;

    return (
        <Sheet open={!!employee} onOpenChange={(o) => { if (!o) onClose(); }}>
            <SheetContent side="right" className="flex flex-col w-[340px] sm:max-w-[340px] p-0 gap-0">
                {!employee ? null : (
                    <>
                        {/* Header */}
                        <SheetHeader className="flex-row items-start gap-3 p-5 border-b">
                            <Avatar size="sm">
                                <AvatarImage src={employee.avatarUrl ?? undefined} alt={employee.name} />
                                <AvatarFallback
                                    className="text-white text-xs font-black"
                                    style={{ background: color }}
                                >
                                    {employee.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-sm font-extrabold leading-tight truncate">
                                    {employee.name}
                                </SheetTitle>
                                <SheetDescription className="text-xs mt-0.5">
                                    {employee.position} · {employee.department}
                                </SheetDescription>
                                <div className="flex gap-1.5 mt-2">
                                    <StatusBadge status={employee.status} />
                                    <TypeBadge type={employee.type} />
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Detail rows */}
                        <div className="flex-1 overflow-y-auto px-5 py-3">
                            {([
                                { label: 'Work ID', value: employee.workId, mono: true },
                                { label: 'Email', value: employee.email },
                                { label: 'Salary Grade', value: employee.salaryGrade },
                                { label: 'Division', value: employee.division },
                                { label: 'Date Hired', value: employee.dateHired },
                                { label: 'Age', value: `${employee.age} yrs` },
                                { label: 'Gender', value: employee.gender },
                                { label: 'Education', value: employee.education },
                                { label: 'City', value: employee.city },
                                { label: 'State', value: employee.state },
                            ] as { label: string; value: string; mono?: boolean }[]).map((r, i, arr) => (
                                <div key={r.label}>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-semibold text-muted-foreground">{r.label}</span>
                                        <span className={`text-xs font-bold text-foreground ${r.mono ? 'font-mono' : ''}`}>
                                            {r.value || '—'}
                                        </span>
                                    </div>
                                    {i < arr.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <SheetFooter className="flex-row gap-2 p-4 border-t">
                            <SheetClose asChild>
                                <Button variant="outline" className="flex-1">Close</Button>
                            </SheetClose>
                            <Button className="flex-1" onClick={() => router.visit(route('employee.show', { employee: employee.id }))}>
                                View Profile
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
/* ══════════════════════════════════════════
   1. KPI STRIP
   Uses server-provided totals for the header cards;
   filtered counts are derived client-side for the charts.
══════════════════════════════════════════ */
function KpiStrip({
    totalEmployees, activeEmployees, inactiveEmployees,
    filters, setFilters,
}: {
    totalEmployees: number; activeEmployees: number; inactiveEmployees: number;
    filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void;
}) {
    const kpis = [
        {
            label: 'Total Employees',
            value: totalEmployees,
            description: 'All employees across all departments',
            icon: <Users className="size-5 m-1" />,
            statusFilter: '',
        },
        {
            label: 'Active',
            value: activeEmployees,
            description: 'Currently active employees',
            icon: <UserCheck className="size-5 m-1" />,
            statusFilter: 'Active',
        },
        {
            label: 'Inactive',
            value: inactiveEmployees,
            description: 'Currently inactive employees',
            icon: <UserMinus className="size-5 m-1" />,
            statusFilter: 'Inactive',
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {kpis.map(k => {
                const isActive = !!k.statusFilter && filters.status === k.statusFilter;
                const clickable = !!k.statusFilter;
                return (
                    <div
                        key={k.label}
                        onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.statusFilter ? '' : k.statusFilter })}
                        style={{
                            cursor: clickable ? 'pointer' : 'default',
                            transition: 'all .15s',
                            transform: isActive ? 'translateY(-1px)' : 'none',
                            outline: isActive ? `2px solid var(--primary)` : 'none',
                            outlineOffset: 2,
                            borderRadius: 16,
                        }}
                        onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = isActive ? 'translateY(-1px)' : 'none'; }}
                    >
                        <StatCard
                            title={k.label}
                            value={k.value}
                            description={
                                clickable
                                    ? isActive
                                        ? `✓ Filtering · ${k.description}`
                                        : k.description
                                    : k.description
                            }
                            icon={k.icon}
                        />
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════
   2. DEMOGRAPHICS
══════════════════════════════════════════ */
function Demographics({ employees }: { employees: Employee[] }) {
    const ageBuckets = [
        { label: '20–29', min: 20, max: 29 },
        { label: '30–39', min: 30, max: 39 },
        { label: '40–49', min: 40, max: 49 },
        { label: '50+', min: 50, max: 99 },
    ].map(b => ({ ...b, count: employees.filter(e => e.age >= b.min && e.age <= b.max).length }));

    const genderCounts = GENDERS.map(g => ({ label: g, count: employees.filter(e => e.gender === g).length }));
    const educCounts = EDUC_LEVELS.map(l => ({ label: l, count: employees.filter(e => e.education === l).length })).filter(e => e.count > 0);
    const maxEduc = Math.max(...educCounts.map(e => e.count), 1);
    const maxAge = Math.max(...ageBuckets.map(e => e.count), 1);
    const total = employees.length;
    const GENDER_COLORS: Record<string, string> = { Male: blue, Female: rose };

    return (
        <Card>
            <SH title="Employee Demographics" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                {/* Age */}
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age Groups</div>
                    {ageBuckets.map((b, i) => (
                        <div key={b.label} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>{b.label}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: [blue, indigo, violet, rose][i] }}>{b.count}</span>
                            </div>
                            <div style={{ height: 18, background: 'var(--muted)', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${(b.count / maxAge) * 100}%`, height: '100%', background: [blue, indigo, violet, rose][i], borderRadius: 6, transition: 'width .4s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gender */}
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</div>
                    {genderCounts.map(g => (
                        <div key={g.label} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{g.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: GENDER_COLORS[g.label] }}>
                                    {g.count} ({total ? ((g.count / total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                            <div style={{ height: 10, background: 'var(--muted)', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${total ? (g.count / total) * 100 : 0}%`, height: '100%', background: GENDER_COLORS[g.label], borderRadius: 6, transition: 'width .4s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Education */}
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education Level</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
                        {educCounts.map((e, i) => (
                            <TooltipProvider key={e.label}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', cursor: 'default' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--foreground)' }}>{e.count}</span>
                                            <div style={{ width: '100%', background: [emerald, cyan, blue, violet, amber, rose][i % 6], borderRadius: '4px 4px 0 0', height: `${(e.count / maxEduc) * 112}px`, transition: 'height .4s ease' }} />
                                            <span style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{e.label}: {e.count} employees</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>

            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   3. TYPE DISTRIBUTION
══════════════════════════════════════════ */
function TypeDistribution({ employees, filters, setFilters }: { employees: Employee[]; filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void }) {
    const [hov, setHov] = useState<string | null>(null);
    const counts = EMP_TYPES.map(t => ({ label: t, count: employees.filter(e => e.type === t).length, color: TYPE_COLORS[t] }));
    const total = employees.length;

    const toggle = (label: string) => setFilters({ ...filters, type: filters.type === label ? '' : label });

    return (
        <Card>
            <SH title="Employment Type Distribution" sub="Click a type to filter" />
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {counts.map(c => {
                    const isActive = filters.type === c.label;
                    return (
                        <div key={c.label}
                            onClick={() => toggle(c.label)}
                            onMouseEnter={() => setHov(c.label)}
                            onMouseLeave={() => setHov(null)}
                            style={{
                                flex: 1, background: `${c.color}10`, border: `1px solid ${isActive ? c.color : `${c.color}30`}`,
                                borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                                cursor: 'pointer', transition: 'all .15s',
                                opacity: filters.type && !isActive ? 0.45 : 1,
                                transform: hov === c.label ? 'translateY(-2px)' : 'none',
                                boxShadow: isActive ? `0 0 0 3px ${c.color}20` : 'none',
                            }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.count}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{c.label}</div>
                        </div>
                    );
                })}
            </div>
            <TooltipProvider>
                <div style={{ display: 'flex', height: 14, borderRadius: 8, overflow: 'hidden', gap: 1 }}>
                    {counts.map(c => (
                        <Tooltip key={c.label}>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => toggle(c.label)}
                                    style={{ width: `${total ? (c.count / total) * 100 : 0}%`, background: c.color, transition: 'width .4s, opacity .15s', cursor: 'pointer', opacity: filters.type && filters.type !== c.label ? 0.3 : 1 }}
                                />
                            </TooltipTrigger>
                            <TooltipContent>{c.label}: {c.count}</TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                {counts.map(c => (
                    <div key={c.label} onClick={() => toggle(c.label)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted-foreground)', cursor: 'pointer', opacity: filters.type && filters.type !== c.label ? 0.4 : 1, transition: 'opacity .15s' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                        {c.label}
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   4. DEPARTMENT DISTRIBUTION
   Departments are dynamic — derived from the actual data.
══════════════════════════════════════════ */
function DeptDistribution({ employees, filters, setFilters }: { employees: Employee[]; filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void }) {
    const [hov, setHov] = useState<string | null>(null);

    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const e of employees) map[e.department] = (map[e.department] ?? 0) + 1;
        return Object.entries(map)
            .map(([label, count]) => ({ label, count, color: deptColor(label) }))
            .sort((a, b) => b.count - a.count);
    }, [employees]);

    const max = Math.max(...counts.map(c => c.count), 1);
    const toggle = (label: string) => setFilters({ ...filters, dept: filters.dept === label ? '' : label });

    return (
        <Card>
            <SH title="Department Distribution" sub="Click a department to filter" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {counts.map(d => {
                    const isActive = filters.dept === d.label;
                    return (
                        <TooltipProvider key={d.label}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => toggle(d.label)}
                                        onMouseEnter={() => setHov(d.label)}
                                        onMouseLeave={() => setHov(null)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: filters.dept && !isActive ? 0.4 : 1, transition: 'opacity .15s' }}>
                                        <div style={{ width: 110, fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? d.color : 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color .15s' }}>{d.label}</div>
                                        <div style={{ flex: 1, height: 22, background: 'var(--muted)', borderRadius: 6, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${(d.count / max) * 100}%`, height: '100%',
                                                background: d.color, borderRadius: 6,
                                                display: 'flex', alignItems: 'center', paddingLeft: 8,
                                                transition: 'width .4s',
                                                opacity: hov && hov !== d.label && !isActive ? 0.6 : 1,
                                                outline: isActive ? `2px solid ${d.color}` : 'none',
                                                outlineOffset: 1,
                                            }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-foreground)', whiteSpace: 'nowrap' }}>{d.count}</span>
                                            </div>
                                        </div>
                                        <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: d.color, textAlign: 'right' }}>{d.count}</div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>{d.label}: {d.count} employees · click to filter</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   5. STATUS REPORT
══════════════════════════════════════════ */
function StatusReport({ employees, filters, setFilters }: { employees: Employee[]; filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void }) {
    return (
        <Card>
            <SH title="Employee Status Report" sub="Click a status to filter" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {STATUSES.map(s => {
                    const cfg = STATUS_CFG[s];
                    const count = employees.filter(e => e.status === s).length;
                    const isActive = filters.status === s;
                    return (
                        <div key={s}
                            onClick={() => setFilters({ ...filters, status: filters.status === s ? '' : s })}
                            style={{
                                background: cfg.bg, border: `1px solid ${isActive ? cfg.color : cfg.border}`,
                                borderRadius: 12, padding: 14, textAlign: 'center',
                                cursor: 'pointer', transition: 'all .15s',
                                boxShadow: isActive ? `0 0 0 3px ${cfg.color}25` : 'none',
                                transform: isActive ? 'translateY(-1px)' : 'none',
                                opacity: filters.status && !isActive ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = isActive ? 'translateY(-1px)' : 'none'; }}
                        >
                            <div style={{ fontSize: 20, color: cfg.color, marginBottom: 6 }}>{cfg.icon}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: cfg.color }}>{count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginTop: 2 }}>{s}</div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   6. MASTERLIST TABLE
══════════════════════════════════════════ */
function MasterlistTable({ employees, departments, onSelect }: { employees: Employee[]; departments: string[]; onSelect: (e: Employee) => void }) {
    const tableFilters = useMemo(() => buildEmployeeTableFilters(departments), [departments]);

    const exportCSV = () => {
        const cols = ['workId', 'name', 'department', 'position', 'type', 'status', 'dateHired', 'salaryGrade'] as const;
        const rows = [cols.join(','), ...employees.map(e => cols.map(c => `"${e[c]}"`).join(','))];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
        a.download = 'employee-masterlist.csv';
        a.click();
    };

    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <SH title="Employee Masterlist" sub={`${employees.length} employees shown · click a row for details`} />
                <Button variant="outline" size="sm" onClick={exportCSV}>⬇ Export CSV</Button>
            </div>

            <DataTable
                columns={employeeMasterlistColumns}
                data={employees}
                getRowId={(row) => row.id}
                onRowClick={(row) => onSelect(row.original)}
                searchColumnId="name"
                searchPlaceholder="Search name, work ID, department…"
                filters={tableFilters}
                defaultPageSize={10}
            />
        </Card>
    );
}

/* ══════════════════════════════════════════
   PAGE EXPORT
══════════════════════════════════════════ */
export default function Index() {
    const {
        employees = [],
        totalEmployees = 0,
        activeEmployees = 0,
        inactiveEmployees = 0,
        departments = [],
    } = usePage<EmployeeReportProps>().props;

    const props = usePage<EmployeeReportProps>().props;
    console.log('PAGE PROPS:', props);
    console.log('EMPLOYEES:', props.employees);
    console.log('EMPLOYEES LENGTH:', props.employees?.length);

    const [filters, setFilters] = useState<EmployeeFilters>(EMPTY_FILTERS);
    const [selected, setSelected] = useState<Employee | null>(null);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    /* Client-side filter applied to the analytics charts and masterlist.
       The DataTable handles its own search/filter independently. */
    const filtered = useMemo(() => {
        let r = employees;
        if (filters.status) r = r.filter(e => e.status === filters.status);
        if (filters.type) r = r.filter(e => e.type === filters.type);
        if (filters.dept) r = r.filter(e => e.department === filters.dept);
        return r;
    }, [employees, filters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Overview" />

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                            Employee Overview
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, marginBottom: 0 }}>
                            Workforce Analytics · MKWD — as of {date}
                        </p>
                    </div>
                </div>

                <ActiveFilters filters={filters} setFilters={setFilters} />

                <KpiStrip
                    totalEmployees={totalEmployees}
                    activeEmployees={activeEmployees}
                    inactiveEmployees={inactiveEmployees}
                    filters={filters}
                    setFilters={setFilters}
                />

                <Demographics employees={filtered} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <TypeDistribution employees={filtered} filters={filters} setFilters={setFilters} />
                    <StatusReport employees={filtered} filters={filters} setFilters={setFilters} />
                </div>

                <DeptDistribution employees={filtered} filters={filters} setFilters={setFilters} />
                <MasterlistTable employees={filtered} departments={departments} onSelect={setSelected} />

            </div>

            <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} />
        </AppLayout>
    );
}