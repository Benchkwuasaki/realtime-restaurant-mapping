import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState, useMemo } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, LineChart, Line, Legend,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/data-table/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { StatCard } from '@/components/shared/stat-card';
import { CalendarCheck, ClipboardList, Clock, Umbrella } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Reports and Analytics',
        href: route('reports_and_analytics.leave-report.index'),
    },
];

/* ── Theme-aware color tokens ───────────────────────────────────────────────
   Using CSS variables so all colours respond to dark mode automatically.
   chart-1 → blue-ish  chart-2 → teal/green  chart-3 → pink/rose
   chart-4 → amber     chart-5 → cyan
   primary / destructive for semantic states.
─────────────────────────────────────────────────────────────────────────── */
const c1 = 'var(--chart-1)';   // blue
const c2 = 'var(--chart-2)';   // teal-green  (Approved / Active)
const c3 = 'var(--chart-3)';   // pink/rose   (Rejected / highlight)
const c4 = 'var(--chart-4)';   // amber       (Pending / warning)
const c5 = 'var(--chart-5)';   // cyan
const cSlate = 'var(--muted-foreground)';
const cDest = 'var(--destructive)';
const cPrimary = 'var(--primary)';

// Named aliases kept for clarity in the code below
const emerald = c2;
const amber = c4;
const rose = c3;
const blue = c1;
const violet = cPrimary;
const cyan = c5;
const indigo = cPrimary;
const orange = c4;
const slate = cSlate;
const pink = c3;

/* ── Recharts tooltip style ─────────────────────────────────────────────── */
const TT = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    fontSize: 11,
    padding: '6px 12px',
    boxShadow: 'var(--shadow-lg)',
};

/* ── Shared wrappers ────────────────────────────────────────────────────── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        ...style,
    }}>{children}</div>
);

const SH = ({ title, sub, accent }: { title: string; sub?: string; accent?: string }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {accent && <div style={{ width: 3, height: 16, borderRadius: 2, background: accent, flexShrink: 0 }} />}
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{title}</div>
        </div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3, paddingLeft: accent ? 11 : 0 }}>{sub}</div>}
    </div>
);

const Pill = ({ label, color }: { label: string; color: string }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 9px', borderRadius: 99,
        fontSize: 10, fontWeight: 700,
        color, background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
    }}>{label}</span>
);

/* ── Types & color maps ─────────────────────────────────────────────────── */

// Raw shape coming from Inertia (dates are ISO strings from PHP)
interface LeaveReqRaw {
    id: string; employee: string; dept: string; type: string;
    status: string; start: string; end: string; days: number;
}

// Runtime shape used throughout the page (dates hydrated to Date objects)
interface LeaveReq {
    id: string; employee: string; dept: string; type: string;
    status: string; start: Date; end: Date; days: number;
    week: number; month: number; year: number;
}

interface LeaveBalance {
    name: string; dept: string;
    total: number; used: number; remaining: number;
}

interface PageProps {
    requests?: LeaveReqRaw[];
    balances?: LeaveBalance[];
}

const TODAY = new Date();

const STATUS_COLORS: Record<string, string> = {
    Approved: emerald, Pending: amber, Rejected: rose, Cancelled: slate,
    Disapproved: rose, 'For Approval': amber, 'For Disapproval': orange,
};
const TYPE_COLORS: Record<string, string> = {
    Vacation: blue, Sick: rose, Maternity: pink, Paternity: cyan, Other: orange,
};
const DEPT_COLORS = [blue, emerald, amber, violet, cyan, rose, indigo, orange];

// Derive sorted unique lists from real data for chart axes / filter options
function getDepts(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.dept))].sort(); }
function getTypes(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.type))].sort(); }
function getStatuses(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.status))].sort(); }

// Hydrate raw ISO strings → Date objects and derive week/month/year
function hydrateRequests(raw: LeaveReqRaw[]): LeaveReq[] {
    return raw.map(r => {
        const start = new Date(r.start + 'T00:00:00');
        const end = new Date(r.end + 'T00:00:00');
        const week = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7);
        return { ...r, start, end, week, month: start.getMonth(), year: start.getFullYear() };
    });
}

interface Filters { status: string; type: string; dept: string; }
const EMPTY_FILTERS: Filters = { status: '', type: '', dept: '' };

function useFiltered(requests: LeaveReq[], filters: Filters) {
    return useMemo(() => {
        let r = requests;
        if (filters.status) r = r.filter(x => x.status === filters.status);
        if (filters.type) r = r.filter(x => x.type === filters.type);
        if (filters.dept) r = r.filter(x => x.dept === filters.dept);
        return r;
    }, [requests, filters]);
}

/* ══════════════════════════════════════
   ACTIVE FILTER CHIPS
══════════════════════════════════════ */
function ActiveFilters({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
    const active = Object.entries(filters).filter(([, v]) => v !== '');
    if (active.length === 0) return null;
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Filtering:</span>
            {active.map(([k, v]) => {
                const color = k === 'status' ? STATUS_COLORS[v] : k === 'type' ? TYPE_COLORS[v] : violet;
                return (
                    <button key={k} onClick={() => setFilters({ ...filters, [k]: '' })}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700,
                            color,
                            background: `color-mix(in oklch, ${color} 12%, transparent)`,
                            border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
                            cursor: 'pointer',
                        }}>
                        {v} <span style={{ opacity: 0.6 }}>✕</span>
                    </button>
                );
            })}
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 text-xs px-2">
                Clear all
            </Button>
        </div>
    );
}

/* ══════════════════════════════════════
   1. KPI CARDS
══════════════════════════════════════ */
function KpiCards({ requests, allRequests, filters, setFilters }: { requests: LeaveReq[]; allRequests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const total    = allRequests.length;
    const approved = allRequests.filter(r => r.status === 'Approved').length;
    const onLeave  = allRequests.filter(r => r.status === 'Approved' && r.start <= TODAY && r.end >= TODAY).length;
    const pending  = allRequests.filter(r => r.status === 'Pending').length;

    const kpis = [
        {
            title: 'Total Leave Requests',
            value: total,
            description: 'All time',
            icon: <ClipboardList className="size-4" />,
            filterStatus: '',
        },
        {
            title: 'Approved Leaves',
            value: approved,
            description: total > 0 ? `${((approved / total) * 100).toFixed(1)}% approval rate` : 'No requests yet',
            icon: <CalendarCheck className="size-4" />,
            filterStatus: 'Approved',
        },
        {
            title: 'Currently On Leave',
            value: onLeave,
            description: 'As of today',
            icon: <Umbrella className="size-4" />,
            filterStatus: '',
        },
        {
            title: 'Pending Approval',
            value: pending,
            description: 'Awaiting action',
            icon: <Clock className="size-4" />,
            filterStatus: 'Pending',
        },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {kpis.map(k => {
                const isActive  = !!k.filterStatus && filters.status === k.filterStatus;
                const clickable = !!k.filterStatus;
                return (
                    <div
                        key={k.title}
                        onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.filterStatus ? '' : k.filterStatus })}
                        className={`transition-all ${clickable ? 'cursor-pointer' : ''} ${isActive ? '-translate-y-0.5' : ''}`}
                        style={{
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: isActive ? `0 0 0 2px color-mix(in oklch, var(--primary) 40%, transparent)` : undefined,
                        }}
                    >
                        <StatCard
                            title={k.title}
                            value={k.value}
                            description={k.description}
                            icon={k.icon}
                        />
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════
   2. LEAVE STATUS DISTRIBUTION
══════════════════════════════════════ */
function LeaveStatusDist({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hovSeg, setHovSeg] = useState<string | null>(null);

    const statuses = getStatuses(requests);
    const data = statuses.map(s => ({
        name: s,
        value: requests.filter(r => r.status === s).length,
        color: STATUS_COLORS[s] ?? slate,
    }));
    const total = data.reduce((s, d) => s + d.value, 0);
    const toggle = (name: string) => setFilters({ ...filters, status: filters.status === name ? '' : name });

    return (
        <Card>
            <SH title="Leave Status Distribution" accent={indigo} />
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                    <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                            <Pie data={data} dataKey="value" cx="50%" cy="50%"
                                innerRadius={50} outerRadius={80}
                                paddingAngle={3} startAngle={90} endAngle={-270} stroke="none"
                                onClick={(d) => toggle(d.name)}
                                style={{ cursor: 'pointer' }}>
                                {data.map((d, i) => (
                                    <Cell key={i} fill={d.color}
                                        opacity={filters.status && filters.status !== d.name ? 0.25 : hovSeg && hovSeg !== d.name ? 0.5 : 1}
                                        onMouseEnter={() => setHovSeg(d.name)}
                                        onMouseLeave={() => setHovSeg(null)}
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={TT} formatter={(v: any, n: any) => [v, n]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.map(d => {
                        const isActive = filters.status === d.name;
                        return (
                            <div key={d.name}
                                onClick={() => toggle(d.name)}
                                onMouseEnter={() => setHovSeg(d.name)}
                                onMouseLeave={() => setHovSeg(null)}
                                style={{ cursor: 'pointer', opacity: filters.status && !isActive ? 0.45 : 1, transition: 'opacity .15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, outline: isActive ? `2px solid ${d.color}` : 'none', outlineOffset: 1 }} />
                                        <span style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: 'var(--foreground)' }}>{d.name}</span>
                                    </div>
                                </div>
                                <div style={{ height: 6, background: 'var(--muted)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <div style={{ width: `${total ? (d.value / total) * 100 : 0}%`, height: '100%', background: d.color, borderRadius: 'var(--radius-sm)', transition: 'width .4s' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   3. LEAVE TYPES MOST USED
══════════════════════════════════════ */
function LeaveTypesChart({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hov, setHov] = useState<string | null>(null);

    const types = getTypes(requests);
    const data = types.map(t => ({
        name: t,
        count: requests.filter(r => r.type === t).length,
        color: TYPE_COLORS[t] ?? slate,
    })).sort((a, b) => b.count - a.count);

    const maxCount = data[0]?.count || 1;
    const toggle = (name: string) => setFilters({ ...filters, type: filters.type === name ? '' : name });

    return (
        <Card>
            <SH title="Most Used Leave Types" accent={cyan} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.map((d, i) => {
                    const isActive = filters.type === d.name;
                    return (
                        <div key={d.name}
                            onClick={() => toggle(d.name)}
                            onMouseEnter={() => setHov(d.name)}
                            onMouseLeave={() => setHov(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: filters.type && !isActive ? 0.4 : 1, transition: 'opacity .15s' }}>
                            <div style={{ width: 20, fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'right' }}>{i + 1}</div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, outline: isActive ? `2px solid ${d.color}` : 'none', outlineOffset: 1 }} />
                            <div style={{ width: 80, fontSize: 12, fontWeight: isActive ? 800 : 600, color: 'var(--foreground)' }}>{d.name}</div>
                            <div style={{ flex: 1, height: 22, background: 'var(--muted)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${maxCount ? (d.count / maxCount) * 100 : 0}%`, height: '100%',
                                    background: d.color, borderRadius: 'var(--radius-sm)',
                                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                                    transition: 'width .4s',
                                    opacity: hov && hov !== d.name ? 0.6 : 1,
                                }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-foreground)', whiteSpace: 'nowrap' }}>{d.count}</span>
                                </div>
                            </div>
                            <div style={{ width: 32, fontSize: 11, fontWeight: 700, color: d.color, textAlign: 'right' }}>{d.count}</div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   4. LEAVE REQUEST OVER TIME
══════════════════════════════════════ */
function LeaveOvertime({ requests }: { requests: LeaveReq[] }) {
    const [view, setView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    const years = useMemo(() => [...new Set(requests.map(r => r.year))].sort(), [requests]);

    const weeklyData = useMemo(() => {
        const currentYear = TODAY.getFullYear();
        const currentMonth = TODAY.getMonth();
        const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
        return weeks.map((w, i) => ({
            label: w,
            count: requests.filter(r => r.year === currentYear && r.month <= currentMonth && r.week === (i % 5) + 1).length,
        }));
    }, [requests]);

    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const yr1 = years[years.length - 2] ?? years[0];
        const yr2 = years[years.length - 1] ?? TODAY.getFullYear();
        return months.map((m, i) => ({
            label: m,
            [String(yr1)]: requests.filter(r => r.year === yr1 && r.month === i).length,
            [String(yr2)]: requests.filter(r => r.year === yr2 && r.month === i).length,
        }));
    }, [requests, years]);

    const yearlyData = useMemo(() =>
        years.map(y => ({ label: String(y), count: requests.filter(r => r.year === y).length }))
        , [requests, years]);

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <SH title="Leave Request Over Time" accent={blue} sub="Trend of requests across periods" />
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                    <TabsList className="h-7">
                        <TabsTrigger value="weekly" className="text-xs px-2 h-5">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly" className="text-xs px-2 h-5">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="text-xs px-2 h-5">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {view === 'monthly' ? (
                        <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TT} />
                            <Line type="monotone" dataKey={String(years[years.length - 2] ?? years[0])} stroke={slate} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey={String(years[years.length - 1] ?? TODAY.getFullYear())} stroke={blue} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
                        </LineChart>
                    ) : (
                        <BarChart data={view === 'weekly' ? weeklyData : yearlyData}
                            margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={view === 'yearly' ? 40 : 20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TT} cursor={{ fill: 'var(--muted)' }} />
                            <Bar dataKey="count" fill={blue} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   5. LEAVE BY DEPARTMENT
══════════════════════════════════════ */
function LeaveByDept({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hov, setHov] = useState<string | null>(null);

    const depts = getDepts(requests);
    const data = depts.map((d, i) => ({
        dept: d,
        count: requests.filter(r => r.dept === d).length,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
    })).sort((a, b) => b.count - a.count);

    const toggle = (dept: string) => setFilters({ ...filters, dept: filters.dept === dept ? '' : dept });

    return (
        <Card>
            <SH title="Leave by Department" accent={violet} sub="Click a bar to filter" />
            <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 60, bottom: 0 }} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="dept"
                            tick={(props) => {
                                const { x, y, payload } = props;
                                const isActive = filters.dept === payload.value;
                                return (
                                    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fontWeight={isActive ? 800 : 600}
                                        fill={isActive ? DEPT_COLORS[depts.indexOf(payload.value) % DEPT_COLORS.length] : 'var(--foreground)'}>
                                        {payload.value}
                                    </text>
                                );
                            }}
                            axisLine={false} tickLine={false} width={60} />
                        <Tooltip contentStyle={TT} cursor={{ fill: 'var(--muted)' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}
                            onClick={(d) => toggle(d.dept)}
                            style={{ cursor: 'pointer' }}>
                            {data.map((d, i) => (
                                <Cell key={i} fill={d.color}
                                    opacity={filters.dept && filters.dept !== d.dept ? 0.25 : hov && hov !== d.dept ? 0.6 : 1}
                                    onMouseEnter={() => setHov(d.dept)}
                                    onMouseLeave={() => setHov(null)}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   7. LEAVE BALANCE REPORT
══════════════════════════════════════ */
const leaveBalanceColumns: ColumnDef<LeaveBalance>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Employee" />),
        cell: ({ row }) => <span className="font-semibold">{row.getValue('name')}</span>,
    },
    {
        accessorKey: 'dept',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Department" />),

        cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('dept')}</span>,
    },
    {
        accessorKey: 'total',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Total" />),

        cell: ({ row }) => <div className="text-left font-bold">{row.getValue('total')}</div>,
    },
    {
        accessorKey: 'used',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Used" />),

        cell: ({ row }) => (
            <div className="text-left font-bold pl-3" style={{ color: amber }}>{row.getValue('used')}</div>
        ),
    },
    {
        accessorKey: 'remaining',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Remaining" className='text-center' />),

        cell: ({ row }) => (
            <div className="text-left font-bold pl-5" style={{ color: emerald }}>{row.getValue('remaining')}</div>
        ),
    },
    {
        id: 'usage',
        header: ({ column }) => (<DataTableColumnHeader column={column} title="Usage" />),

        cell: ({ row }) => {
            const total = row.getValue<number>('total');
            const used = row.getValue<number>('used');
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const color = pct > 80 ? rose : pct > 50 ? amber : emerald;
            return (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full" />
                    </div>
                    <span style={{ color, minWidth: 32 }} className="text-xs font-bold text-right">{pct}%</span>
                </div>
            );
        },
    },
];

function LeaveBalanceReport({ balances }: { balances: LeaveBalance[] }) {
    const depts = useMemo(() => [...new Set(balances.map(b => b.dept))].sort(), [balances]);

    return (
        <Card>
            <SH title="Leave Balance Report" accent={cyan} sub="Per employee leave allocation and usage" />
            <DataTable
                columns={leaveBalanceColumns}
                data={balances}
                getRowId={(row) => row.name}
                searchColumnId="name"
                searchPlaceholder="Search employee…"
                filters={[
                    {
                        columnId: 'dept',
                        title: 'Department',
                        options: depts.map(d => ({ label: d, value: d })),
                    },
                ]}
            />
        </Card>
    );
}

/* ══════════════════════════════════════
   8. LEAVE CALENDAR VIEW
   Matches the LeaveCalendarIndex module:
   - Full border-grid layout
   - starting / ending / ongoing status dots
   - Click-cell tooltip with grouped employee names
   - Prev / Next / Today navigation
══════════════════════════════════════ */

const CAL_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const CAL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type DayStatus = 'starting' | 'ending' | 'ongoing';
type DayEntry = { name: string; dept: string; type: string; days: number; status: DayStatus };
type DayMap = Record<string, DayEntry[]>;

const CAL_STATUS_DOT: Record<DayStatus, string> = {
    starting: 'bg-primary',
    ending: 'bg-destructive',
    ongoing: 'bg-muted-foreground',
};
const CAL_STATUS_LABEL: Record<DayStatus, string> = {
    starting: 'Starting',
    ending: 'Ending',
    ongoing: 'On Leave',
};

function calToKey(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildCalDayMap(requests: LeaveReq[]): DayMap {
    const map: DayMap = {};
    const approved = requests.filter(r => r.status === 'Approved');
    for (const r of approved) {
        const cursor = new Date(r.start);
        while (cursor <= r.end) {
            const key = calToKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
            const isStart = cursor.getTime() === r.start.getTime();
            const isEnd = cursor.getTime() === r.end.getTime();
            const status: DayStatus = isStart ? 'starting' : isEnd ? 'ending' : 'ongoing';
            if (!map[key]) map[key] = [];
            map[key].push({ name: r.employee, dept: r.dept, type: r.type, days: r.days, status });
            cursor.setDate(cursor.getDate() + 1);
        }
    }
    return map;
}

function LeaveCalendar({ requests }: { requests: LeaveReq[] }) {
    const today = new Date();

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedKey, setSelectedKey] = useState<string>(
        calToKey(today.getFullYear(), today.getMonth(), today.getDate())
    );

    const dayMap = useMemo(() => buildCalDayMap(requests), [requests]);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: { day: number; current: boolean; key: string | null }[] = [];
    for (let i = firstDay - 1; i >= 0; i--)
        cells.push({ day: daysInPrev - i, current: false, key: null });
    for (let d = 1; d <= daysInMonth; d++)
        cells.push({ day: d, current: true, key: calToKey(year, month, d) });
    let next = 1;
    while (cells.length % 7 !== 0)
        cells.push({ day: next++, current: false, key: null });

    const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }
    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }
    function goToday() {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
        setSelectedKey(calToKey(today.getFullYear(), today.getMonth(), today.getDate()));
    }

    function isToday(cell: { day: number; current: boolean }) {
        return cell.current &&
            cell.day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    }

    const selectedEntries = dayMap[selectedKey] ?? [];
    const selectedDate = new Date(selectedKey + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    const grouped: Record<DayStatus, DayEntry[]> = { starting: [], ending: [], ongoing: [] };
    for (const e of selectedEntries) grouped[e.status].push(e);

    return (
        <Card className="p-0 overflow-hidden h-[50rem]">
            <div className="flex h-225">

                {/* ── Calendar pane ── */}
                <div className="flex flex-col min-w-0 w-[70%]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 border-b border-border h-[3.75rem]">
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                                    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <h2 className="text-base font-semibold text-foreground min-w-[160px] text-center">
                                {CAL_MONTHS[month]} <span className="text-muted-foreground font-normal">{year}</span>
                            </h2>
                            <button onClick={nextMonth} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground">
                            {(Object.keys(CAL_STATUS_DOT) as DayStatus[]).map(s => (
                                <span key={s} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${CAL_STATUS_DOT[s]}`} />
                                    {CAL_STATUS_LABEL[s]}
                                </span>
                            ))}
                        </div>

                        <button onClick={goToday} className="px-2.5 py-1 text-xs font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                            Today
                        </button>
                    </div>

                    {/* Day labels */}
                    <div className="grid grid-cols-7 border-b border-border">
                        {CAL_DAYS.map((d, i) => (
                            <div key={d} className={`py-2 text-center text-xs font-bold tracking-widest text-muted-foreground ${i < 6 ? 'border-r border-border' : ''}`}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 flex flex-col">
                        {weeks.map((week, wi) => (
                            <div key={wi} className={`grid grid-cols-7 flex-1 ${wi < weeks.length - 1 ? 'border-b border-border' : ''}`}>
                                {week.map((cell, ci) => {
                                    const isSelected = cell.key === selectedKey;
                                    const todayCell = isToday(cell);
                                    const entries = cell.key ? (dayMap[cell.key] ?? []) : [];
                                    const counts = {
                                        starting: entries.filter(e => e.status === 'starting').length,
                                        ending: entries.filter(e => e.status === 'ending').length,
                                        ongoing: entries.filter(e => e.status === 'ongoing').length,
                                    };

                                    return (
                                        <div
                                            key={ci}
                                            onClick={() => { if (cell.current && cell.key) setSelectedKey(cell.key); }}
                                            className={[
                                                'relative flex items-center justify-center transition-colors min-h-[4.6rem]',
                                                ci < 6 ? 'border-r border-border' : '',
                                                !cell.current
                                                    ? 'bg-muted/30 cursor-default'
                                                    : isSelected
                                                        ? 'bg-primary cursor-pointer'
                                                        : 'hover:bg-accent/40 cursor-pointer',
                                            ].join(' ')}
                                        >
                                            {/* Day number */}
                                            <div className={[
                                                'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium leading-none',
                                                !cell.current
                                                    ? 'text-muted-foreground/40'
                                                    : isSelected
                                                        ? 'text-primary-foreground'
                                                        : todayCell
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'text-foreground',
                                            ].join(' ')}>
                                                {cell.day}
                                            </div>

                                            {/* Status dots — top-right */}
                                            {cell.current && entries.length > 0 && (
                                                <div className="absolute top-2 right-2 flex flex-row-reverse items-center gap-1 flex-wrap-reverse justify-start">
                                                    {(['starting', 'ending', 'ongoing'] as DayStatus[]).map(s =>
                                                        counts[s] > 0 ? (
                                                            <span key={s} className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-primary-foreground/70' : CAL_STATUS_DOT[s]}`} />
                                                        ) : null
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Always-visible side panel ── */}
                <div className="w-[30%] shrink-0 border-l border-border flex flex-col">
                    {/* Panel header */}
                    <div className="px-4 border-b border-border flex flex-col justify-center h-[3.75rem]">
                        <div className="text-sm font-bold text-foreground leading-tight">
                            {new Date(selectedKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(selectedKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                            {selectedEntries.length > 0 && (
                                <span className="ml-1.5">· {selectedEntries.length} on leave</span>
                            )}
                        </div>
                    </div>

                    {/* Panel body */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {selectedEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-2">
                                <div className="text-2xl">🌿</div>
                                <p className="text-xs text-muted-foreground">No approved leaves on this day.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {(['starting', 'ending', 'ongoing'] as DayStatus[]).map(status =>
                                    grouped[status].length > 0 ? (
                                        <div key={status}>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                                {CAL_STATUS_LABEL[status]}
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                {grouped[status].map((entry, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/60 border border-border">
                                                        <Avatar size="sm" className="shrink-0 mt-0.5">
                                                            <AvatarFallback
                                                                className="text-white text-xs font-black"
                                                                style={{ background: DEPT_COLORS[entry.dept.charCodeAt(0) % DEPT_COLORS.length] }}
                                                            >
                                                                {entry.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-semibold text-foreground truncate">{entry.name}</div>
                                                            <div className="text-[10px] text-muted-foreground truncate">{entry.dept}</div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CAL_STATUS_DOT[status]}`} />
                                                                <span className="text-[10px] text-muted-foreground">{entry.type} · {entry.days}d</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   9. HIGH LEAVE FREQUENCY EMPLOYEES
══════════════════════════════════════ */
function HighFrequencyEmployees({ requests }: { requests: LeaveReq[] }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const freqMap: Record<string, { name: string; count: number; totalDays: number; dept: string; types: Set<string>; statuses: Record<string, number> }> = {};
    requests.forEach(r => {
        if (!freqMap[r.employee]) freqMap[r.employee] = { name: r.employee, count: 0, totalDays: 0, dept: r.dept, types: new Set(), statuses: {} };
        freqMap[r.employee].count++;
        freqMap[r.employee].totalDays += r.days;
        freqMap[r.employee].types.add(r.type);
        freqMap[r.employee].statuses[r.status] = (freqMap[r.employee].statuses[r.status] ?? 0) + 1;
    });

    const sorted = Object.values(freqMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((e, i) => ({ ...e, types: Array.from(e.types), rank: i + 1 }));

    const maxCount = sorted[0]?.count ?? 1;
    const RANK_COLORS = [amber, rose, orange, violet, blue];

    return (
        <Card>
            <SH title="High Leave Frequency Employees" accent={rose} sub="Top 10 employees by number of leave requests · click to expand" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sorted.map((e, i) => {
                    const riskColor = e.count >= 12 ? rose : e.count >= 8 ? amber : emerald;
                    const isExpanded = expanded === e.name;
                    return (
                        <div key={e.name}
                            onClick={() => setExpanded(isExpanded ? null : e.name)}
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${isExpanded ? riskColor : i < 3 ? `color-mix(in oklch,${riskColor} 30%,transparent)` : 'var(--border)'}`,
                                background: isExpanded ? `color-mix(in oklch,${riskColor} 8%,transparent)` : i < 3 ? `color-mix(in oklch,${riskColor} 5%,transparent)` : 'var(--card)',
                                cursor: 'pointer', transition: 'all .15s', overflow: 'hidden',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                                {/* Rank badge */}
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: i < 3 ? RANK_COLORS[i] : 'var(--muted)', color: i < 3 ? 'var(--primary-foreground)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{e.rank}</div>
                                {/* Avatar */}
                                <Avatar size="sm">
                                    <AvatarFallback
                                        className="text-white text-xs font-black"
                                        style={{ background: DEPT_COLORS[e.dept.charCodeAt(0) % DEPT_COLORS.length] }}
                                    >
                                        {e.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Name + dept */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>{e.name}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{e.dept}</span>
                                        {e.types.map(t => <Pill key={t} label={t} color={TYPE_COLORS[t] ?? slate} />)}
                                    </div>
                                </div>
                                {/* Stats */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{e.count}</div>
                                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>requests</div>
                                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 1 }}>{e.totalDays}d total</div>
                                </div>
                                {/* Mini bar */}
                                <div style={{ width: 80, flexShrink: 0 }}>
                                    <div style={{ height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${(e.count / maxCount) * 100}%`, height: '100%', background: riskColor, borderRadius: 3 }} />
                                    </div>
                                </div>
                                {/* Chevron */}
                                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</div>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '0 14px 12px 14px', borderTop: `1px solid color-mix(in oklch,${riskColor} 20%,transparent)` }}>
                                    <div style={{ display: 'flex', gap: 20, paddingTop: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>By Status</div>
                                            {Object.entries(e.statuses).map(([s, n]) => (
                                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s] ?? slate }} />
                                                    <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{s}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[s] ?? slate }}>{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Summary</div>
                                            <div style={{ fontSize: 11, color: 'var(--foreground)' }}>Avg {(e.totalDays / e.count).toFixed(1)} days per request</div>
                                            <div style={{ fontSize: 11, color: riskColor, fontWeight: 700, marginTop: 3 }}>
                                                {e.count >= 12 ? '⚠ High risk — review recommended' : e.count >= 8 ? '⚡ Above average frequency' : '✓ Normal frequency'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
export default function LeaveOverview({ requests: rawRequests = [], balances = [] }: PageProps) {
    const requests = useMemo(() => hydrateRequests(rawRequests), [rawRequests]);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const filteredRequests = useFiltered(requests, filters);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Overview" />

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)', background: 'var(--background)', height: '100%', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 22, borderRadius: 2, background: emerald }} />
                            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>Leave Overview</h1>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, paddingLeft: 11 }}>
                            Comprehensive leave analytics — as of {date}
                        </p>
                    </div>
                </div>

                <ActiveFilters filters={filters} setFilters={setFilters} />
                <KpiCards requests={filteredRequests} allRequests={requests} filters={filters} setFilters={setFilters} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <LeaveStatusDist requests={filteredRequests} filters={filters} setFilters={setFilters} />
                    <LeaveTypesChart requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <LeaveOvertime requests={filteredRequests} />
                    <LeaveByDept requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                <LeaveCalendar requests={filteredRequests} />
                <LeaveBalanceReport balances={balances} />
                <HighFrequencyEmployees requests={filteredRequests} />

            </div>
        </AppLayout>
    );
}