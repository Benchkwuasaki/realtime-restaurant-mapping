import { Head } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { CalendarCheck, ChevronDown, ClipboardList, Clock, Umbrella } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, LineChart, Line, Legend,
} from 'recharts';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Reports and Analytics',
        href: route('reports_and_analytics.leave-report.index'),
    },
];

/* ── Theme-aware color tokens ─────────────────────────────────────────────── */
const c1 = 'var(--chart-1)';
const c2 = 'var(--chart-2)';
const c3 = 'var(--chart-3)';
const c4 = 'var(--chart-4)';
const c5 = 'var(--chart-5)';
const cSlate   = 'var(--muted-foreground)';
const cPrimary = 'var(--primary)';

const emerald = c2;
const amber   = c4;
const rose    = c3;
const blue    = c1;
const violet  = cPrimary;
const cyan    = c5;
const indigo  = cPrimary;
const orange  = c4;
const slate   = cSlate;
const pink    = c3;

const TT = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    fontSize: 11,
    padding: '6px 12px',
    boxShadow: 'var(--shadow-lg)',
};

/* ── Shared wrappers ──────────────────────────────────────────────────────── */
const Card = ({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
    <div className={className} style={{
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

/* ── Types ────────────────────────────────────────────────────────────────── */
interface LeaveReqRaw {
    id: string; employee: string; dept: string; type: string;
    status: string; start: string; end: string; days: number;
}

interface LeaveReq {
    id: string; employee: string; dept: string; type: string;
    status: string; start: Date; end: Date; days: number;
    week: number; month: number; year: number;
}

interface EmployeeLeaveEntry {
    leave_type_id:   number;
    leave_type_name: string;
    is_paid:         boolean;
    total_days:      number;
    used_days:       number;
    balance:         number;
}

interface EmployeeLeaveBalance {
    employee_id: number;
    name:        string;
    work_id:     string;
    position:    string;
    department:  string;
    division:    string | null;
    unit:        string | null;
    avatar_url:  string | null;
    leaves:      EmployeeLeaveEntry[];
}

interface PageProps {
    requests?: LeaveReqRaw[];
    balances?: EmployeeLeaveBalance[];
}

const TODAY = new Date();
const DEPT_COLORS = [blue, emerald, amber, violet, cyan, rose, indigo, orange];

const STATUS_COLORS: Record<string, string> = {
    Approved: emerald, Pending: amber, Rejected: rose, Cancelled: slate,
    Disapproved: rose, 'For Approval': amber, 'For Disapproval': orange,
};
const TYPE_COLORS: Record<string, string> = {
    Vacation: blue, Sick: rose, Maternity: pink, Paternity: cyan, Other: orange,
};

function getDepts(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.dept))].sort(); }
function getTypes(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.type))].sort(); }
function getStatuses(requests: LeaveReq[]) { return [...new Set(requests.map(r => r.status))].sort(); }

function hydrateRequests(raw: LeaveReqRaw[]): LeaveReq[] {
    return raw.map(r => {
        const start = new Date(r.start + 'T00:00:00');
        const end   = new Date(r.end   + 'T00:00:00');
        const week  = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7);
        return { ...r, start, end, week, month: start.getMonth(), year: start.getFullYear() };
    });
}

interface Filters { status: string; type: string; dept: string; }
const EMPTY_FILTERS: Filters = { status: '', type: '', dept: '' };

function useFiltered(requests: LeaveReq[], filters: Filters) {
    return useMemo(() => {
        let r = requests;
        if (filters.status) r = r.filter(x => x.status === filters.status);
        if (filters.type)   r = r.filter(x => x.type   === filters.type);
        if (filters.dept)   r = r.filter(x => x.dept   === filters.dept);
        return r;
    }, [requests, filters]);
}

/* ── Balance helpers ──────────────────────────────────────────────────────── */
function deptColor(dept: string) {
    return DEPT_COLORS[dept.charCodeAt(0) % DEPT_COLORS.length];
}
function usagePct(used: number, total: number) {
    return total > 0 ? Math.round((used / total) * 100) : 0;
}
function usageColor(pct: number) {
    if (pct > 80) return rose;
    if (pct > 50) return amber;
    return emerald;
}
function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

interface BalanceSummaryRow {
    employee_id: number;
    name:        string;
    department:  string;
    leave_count: number;
    total_days:  number;
    used_days:   number;
    balance:     number;
    usage_pct:   number;
}

function toSummaryRows(balances: EmployeeLeaveBalance[]): BalanceSummaryRow[] {
    return balances.map(b => {
        const total = b.leaves.reduce((s, l) => s + Number(l.total_days), 0);
        const used  = b.leaves.reduce((s, l) => s + Number(l.used_days),  0);
        return {
            employee_id: b.employee_id,
            name:        b.name,
            department:  b.department,
            leave_count: b.leaves.length,
            total_days:  total,
            used_days:   used,
            balance:     total - used,
            usage_pct:   usagePct(used, total),
        };
    });
}

/* ══════════════════════════════════════
   ACTIVE FILTER CHIPS
══════════════════════════════════════ */
function ActiveFilters({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
    const active = Object.entries(filters).filter(([, v]) => v !== '');
    if (active.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filtering:</span>
            {active.map(([k, v]) => {
                const color = k === 'status' ? STATUS_COLORS[v] : k === 'type' ? TYPE_COLORS[v] : violet;
                return (
                    <button key={k} onClick={() => setFilters({ ...filters, [k]: '' })}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700, color,
                            background: `color-mix(in oklch, ${color} 12%, transparent)`,
                            border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
                            cursor: 'pointer',
                        }}>
                        {v} <span style={{ opacity: 0.6 }}>✕</span>
                    </button>
                );
            })}
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}
                className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                Clear all
            </Button>
        </div>
    );
}

/* ══════════════════════════════════════
   1. KPI CARDS — 2-col mobile, 4-col md+
══════════════════════════════════════ */
function KpiCards({ requests, allRequests, filters, setFilters }: {
    requests: LeaveReq[]; allRequests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void;
}) {
    const total    = allRequests.length;
    const approved = allRequests.filter(r => r.status === 'Approved').length;
    const onLeave  = allRequests.filter(r => r.status === 'Approved' && r.start <= TODAY && r.end >= TODAY).length;
    const pending  = allRequests.filter(r => r.status === 'Pending').length;

    const kpis = [
        { title: 'Total Leave Requests', value: total,    description: 'All time',        icon: <ClipboardList className="size-4 text-primary" />, filterStatus: '' },
        { title: 'Approved Leaves',      value: approved, description: total > 0 ? `${((approved / total) * 100).toFixed(1)}% approval rate` : 'No requests yet', icon: <CalendarCheck className="size-4 text-primary" />, filterStatus: 'Approved' },
        { title: 'Currently On Leave',   value: onLeave,  description: 'As of today',     icon: <Umbrella className="size-4 text-primary" />,      filterStatus: '' },
        { title: 'Pending Approval',     value: pending,  description: 'Awaiting action', icon: <Clock className="size-4 text-primary" />,         filterStatus: 'Pending' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map(k => {
                const isActive  = !!k.filterStatus && filters.status === k.filterStatus;
                const clickable = !!k.filterStatus;
                return (
                    <div key={k.title}
                        onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.filterStatus ? '' : k.filterStatus })}
                        className={`transition-all ${clickable ? 'cursor-pointer' : ''} ${isActive ? '-translate-y-0.5' : ''}`}
                        style={{ borderRadius: 'var(--radius-xl)', boxShadow: isActive ? `0 0 0 2px color-mix(in oklch, var(--primary) 40%, transparent)` : undefined }}>
                        <StatCard title={k.title} value={k.value} description={k.description} icon={k.icon} />
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
    const data     = statuses.map(s => ({ name: s, value: requests.filter(r => r.status === s).length, color: STATUS_COLORS[s] ?? slate }));
    const total    = data.reduce((s, d) => s + d.value, 0);
    const toggle   = (name: string) => setFilters({ ...filters, status: filters.status === name ? '' : name });

    return (
        <Card>
            <SH title="Leave Status Distribution" accent={indigo} />
            {/* Stack vertically on mobile, row on sm+ */}
            <div className="flex flex-col gap-4 sm:flex-col  sm:gap-6">
                <div className="flex justify-center sm:justify-center sm:shrink-0">
                    <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                            <Pie data={data} dataKey="value" cx="50%" cy="50%"
                                innerRadius={44} outerRadius={72} paddingAngle={3}
                                startAngle={90} endAngle={-270} stroke="none"
                                onClick={(d) => toggle(d.name)} style={{ cursor: 'pointer' }}>
                                {data.map((d, i) => (
                                    <Cell key={i} fill={d.color}
                                        opacity={filters.status && filters.status !== d.name ? 0.25 : hovSeg && hovSeg !== d.name ? 0.5 : 1}
                                        onMouseEnter={() => setHovSeg(d.name)}
                                        onMouseLeave={() => setHovSeg(null)} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={TT} formatter={(v: any, n: any) => [v, n]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5 flex-1">
                    {data.map(d => {
                        const isActive = filters.status === d.name;
                        return (
                            <div key={d.name} onClick={() => toggle(d.name)}
                                onMouseEnter={() => setHovSeg(d.name)} onMouseLeave={() => setHovSeg(null)}
                                style={{ cursor: 'pointer', opacity: filters.status && !isActive ? 0.45 : 1, transition: 'opacity .15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, outline: isActive ? `2px solid ${d.color}` : 'none', outlineOffset: 1 }} />
                                        <span style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: 'var(--foreground)' }}>{d.name}</span>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.value}</span>
                                </div>
                                <div style={{ height: 5, background: 'var(--muted)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
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

    const types    = getTypes(requests);
    const data     = types.map(t => ({ name: t, count: requests.filter(r => r.type === t).length, color: TYPE_COLORS[t] ?? slate })).sort((a, b) => b.count - a.count);
    const maxCount = data[0]?.count || 1;
    const toggle   = (name: string) => setFilters({ ...filters, type: filters.type === name ? '' : name });

    return (
        <Card>
            <SH title="Most Used Leave Types" accent={cyan} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.map((d, i) => {
                    const isActive = filters.type === d.name;
                    return (
                        <div key={d.name} onClick={() => toggle(d.name)}
                            onMouseEnter={() => setHov(d.name)} onMouseLeave={() => setHov(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: filters.type && !isActive ? 0.4 : 1, transition: 'opacity .15s' }}>
                            <div style={{ width: 18, fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, outline: isActive ? `2px solid ${d.color}` : 'none', outlineOffset: 1 }} />
                            <div style={{ width: 72, fontSize: 12, fontWeight: isActive ? 800 : 600, color: 'var(--foreground)', flexShrink: 0 }}>{d.name}</div>
                            <div style={{ flex: 1, height: 22, background: 'var(--muted)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', minWidth: 0 }}>
                                <div style={{ width: `${maxCount ? (d.count / maxCount) * 100 : 0}%`, height: '100%', background: d.color, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', paddingLeft: 8, transition: 'width .4s', opacity: hov && hov !== d.name ? 0.6 : 1, minWidth: 28 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-foreground)', whiteSpace: 'nowrap' }}>{d.count}</span>
                                </div>
                            </div>
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
        const currentYear  = TODAY.getFullYear();
        const currentMonth = TODAY.getMonth();
        const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
        return weeks.map((w, i) => ({
            label: w,
            count: requests.filter(r => r.year === currentYear && r.month <= currentMonth && r.week === (i % 5) + 1).length,
        }));
    }, [requests]);

    const monthlyData = useMemo(() => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <SH title="Leave Request Over Time" accent={blue} sub="Trend of requests across periods" />
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                    <TabsList className="h-7">
                        <TabsTrigger value="weekly"  className="h-5 px-2 text-xs">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly" className="h-5 px-2 text-xs">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly"  className="h-5 px-2 text-xs">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {view === 'monthly' ? (
                        <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TT} />
                            <Line type="monotone" dataKey={String(years[years.length - 2] ?? years[0])} stroke={slate} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey={String(years[years.length - 1] ?? TODAY.getFullYear())} stroke={blue} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
                        </LineChart>
                    ) : (
                        <BarChart data={view === 'weekly' ? weeklyData : yearlyData}
                            margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={view === 'yearly' ? 36 : 16}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
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

    const depts  = getDepts(requests);
    const data   = depts.map((d, i) => ({ dept: d, count: requests.filter(r => r.dept === d).length, color: DEPT_COLORS[i % DEPT_COLORS.length] })).sort((a, b) => b.count - a.count);
    const toggle = (dept: string) => setFilters({ ...filters, dept: filters.dept === dept ? '' : dept });

    return (
        <Card>
            <SH title="Leave by Department" accent={violet} sub="Click a bar to filter" />
            <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="dept"
                            tick={(props) => {
                                const { x, y, payload } = props;
                                const isActive = filters.dept === payload.value;
                                const label = payload.value.length > 12 ? payload.value.slice(0, 11) + '…' : payload.value;
                                return (
                                    <text x={x} y={y} dy={4} textAnchor="end" fontSize={9} fontWeight={isActive ? 800 : 600}
                                        fill={isActive ? DEPT_COLORS[depts.indexOf(payload.value) % DEPT_COLORS.length] : 'var(--foreground)'}>
                                        {label}
                                    </text>
                                );
                            }}
                            axisLine={false} tickLine={false} width={72} />
                        <Tooltip contentStyle={TT} cursor={{ fill: 'var(--muted)' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} onClick={(d) => toggle(d.dept)} style={{ cursor: 'pointer' }}>
                            {data.map((d, i) => (
                                <Cell key={i} fill={d.color}
                                    opacity={filters.dept && filters.dept !== d.dept ? 0.25 : hov && hov !== d.dept ? 0.6 : 1}
                                    onMouseEnter={() => setHov(d.dept)} onMouseLeave={() => setHov(null)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   6. LEAVE BALANCE REPORT + DRAWER
══════════════════════════════════════ */
function UsageBar({ pct }: { pct: number }) {
    const color = usageColor(pct);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="min-w-[28px] text-right text-xs font-bold" style={{ color }}>{pct}%</span>
        </div>
    );
}

function LeaveBalanceDrawer({ employee, open, onOpenChange }: {
    employee: EmployeeLeaveBalance | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    if (!employee) return null;

    const totalDays  = employee.leaves.reduce((s, l) => s + Number(l.total_days), 0);
    const usedDays   = employee.leaves.reduce((s, l) => s + Number(l.used_days),  0);
    const overallPct = usagePct(usedDays, totalDays);
    const color      = deptColor(employee.department);

    return (
        <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className="right-0 left-auto h-full w-full rounded-none"
                style={{ maxWidth: '35rem' }}
            >
                <DrawerHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="size-12 shrink-0">
                            {employee.avatar_url
                                ? <img src={employee.avatar_url} alt={employee.name} />
                                : <AvatarFallback className="text-sm font-bold text-white" style={{ background: color }}>{initials(employee.name)}</AvatarFallback>
                            }
                        </Avatar>
                        <div className="min-w-0">
                            <DrawerTitle className="truncate text-base">{employee.name}</DrawerTitle>
                            <DrawerDescription className="truncate text-sm">{employee.position}</DrawerDescription>
                            <p className="mt-0.5 text-xs text-muted-foreground">ID: {employee.work_id}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Department</p>
                            <p className="mt-0.5 text-sm font-medium">{employee.department}</p>
                        </div>
                        {employee.division && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Division</p>
                                <p className="mt-0.5 text-sm font-medium">{employee.division}</p>
                            </div>
                        )}
                        {employee.unit && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unit</p>
                                <p className="mt-0.5 text-sm font-medium">{employee.unit}</p>
                            </div>
                        )}
                    </div>

                    <Separator className="mt-4" />
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {([
                            { label: 'Total days', value: totalDays,            color: 'var(--foreground)' },
                            { label: 'Used days',  value: usedDays,             color: amber               },
                            { label: 'Remaining',  value: totalDays - usedDays, color: emerald             },
                        ] as const).map(s => (
                            <div key={s.label} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                <p className="text-base font-bold tabular-nums sm:text-lg" style={{ color: s.color }}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Overall usage</span>
                            <span className="font-semibold" style={{ color: usageColor(overallPct) }}>{overallPct}%</span>
                        </div>
                        <UsageBar pct={overallPct} />
                    </div>
                </DrawerHeader>

                <Separator />

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leave balances</p>

                    <div className="mb-1 grid grid-cols-[1fr_36px_36px_36px_56px] gap-x-1 px-1">
                        {['Leave type', 'Total', 'Used', 'Bal.', 'Usage'].map(h => (
                            <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
                        ))}
                    </div>

                    <div className="flex flex-col divide-y divide-border">
                        {employee.leaves.map(leave => {
                            const pct   = usagePct(Number(leave.used_days), Number(leave.total_days));
                            const color = usageColor(pct);
                            return (
                                <div key={leave.leave_type_id}
                                    className="grid grid-cols-[1fr_36px_36px_36px_56px] items-center gap-x-1 px-1 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium leading-tight">{leave.leave_type_name}</p>
                                        {leave.is_paid && (
                                            <Badge variant="outline" className="mt-0.5 h-4 px-1 text-[9px] font-semibold">Paid</Badge>
                                        )}
                                    </div>
                                    <span className="text-center text-xs font-semibold tabular-nums">{leave.total_days}</span>
                                    <span className="text-center text-xs tabular-nums" style={{ color: amber }}>{leave.used_days}</span>
                                    <span className="text-center text-xs font-semibold tabular-nums" style={{ color: emerald }}>{leave.balance}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                        <span className="w-6 text-right text-[10px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function LeaveBalanceReport({ balances }: { balances: EmployeeLeaveBalance[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const summaryRows = useMemo(() => toSummaryRows(balances), [balances]);
    const depts       = useMemo(() => [...new Set(balances.map(b => b.department))].sort(), [balances]);

    const selectedEmployee = useMemo(
        () => balances.find(b => b.employee_id === selectedId) ?? null,
        [balances, selectedId],
    );

    function handleRowClick(id: number) {
        setSelectedId(id);
        setDrawerOpen(true);
    }

    // Using DataTableColumnDef to support mobileCard
    const columns = useMemo((): DataTableColumnDef<BalanceSummaryRow>[] => [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
            cell: ({ row }) => {
                const color = deptColor(row.original.department);
                return (
                    <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="text-xs font-bold text-white" style={{ background: color }}>
                                {initials(row.original.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-tight">{row.original.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.original.department}</p>
                        </div>
                    </div>
                );
            },
            // Mobile card: show everything in a compact card layout
            mobileCard: (row) => {
                const color = deptColor(row.department);
                const pct   = row.usage_pct;
                const uColor = usageColor(pct);
                return (
                    <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="size-9 shrink-0 mt-0.5">
                            <AvatarFallback className="text-xs font-bold text-white" style={{ background: color }}>
                                {initials(row.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            {/* Name + dept */}
                            <p className="text-sm font-semibold leading-tight truncate">{row.name}</p>
                            <p className="text-xs text-muted-foreground truncate mb-2">{row.department} · {row.leave_count} leave types</p>
                            {/* Stats row */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Total</p>
                                    <p className="text-xs font-bold">{row.total_days}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Used</p>
                                    <p className="text-xs font-bold" style={{ color: amber }}>{row.used_days}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Left</p>
                                    <p className="text-xs font-bold" style={{ color: emerald }}>{row.balance}</p>
                                </div>
                            </div>
                            {/* Usage bar */}
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: uColor }} />
                                </div>
                                <span className="text-[10px] font-bold tabular-nums" style={{ color: uColor }}>{pct}%</span>
                            </div>
                        </div>
                        {/* Tap hint */}
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-1">Tap for details</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'department',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
            cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.department}</span>,
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'leave_count',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Leave types" />,
            cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.leave_count} types</span>,
        },
        {
            accessorKey: 'total_days',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
            cell: ({ row }) => <span className="font-semibold">{row.original.total_days}</span>,
        },
        {
            accessorKey: 'used_days',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Used" />,
            cell: ({ row }) => <span className="font-bold" style={{ color: amber }}>{row.original.used_days}</span>,
        },
        {
            accessorKey: 'balance',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Remaining" />,
            cell: ({ row }) => <span className="font-bold" style={{ color: emerald }}>{row.original.balance}</span>,
        },
        {
            id: 'usage',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Overall usage" />,
            cell: ({ row }) => <UsageBar pct={row.original.usage_pct} />,
        },
    ], [balances]);

    return (
        <>
            <Card>
                <SH title="Leave Balance Report" accent={cyan} sub="Per-employee leave allocation and usage — click a row for full breakdown" />
                <DataTable
                    columns={columns}
                    data={summaryRows}
                    getRowId={(row) => String(row.employee_id)}
                    onRowClick={(row) => handleRowClick(row.original.employee_id)}
                    searchColumnId="name"
                    searchPlaceholder="Search employee…"
                    filters={[{
                        columnId: 'department',
                        title:    'Department',
                        options:  depts.map(d => ({ label: d, value: d })),
                    }]}
                />
            </Card>

            <LeaveBalanceDrawer
                employee={selectedEmployee}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </>
    );
}

/* ══════════════════════════════════════
   7. LEAVE CALENDAR VIEW
   Mobile: stacked (cal then panel)
   md+:    70/30 side-by-side
══════════════════════════════════════ */
const CAL_DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type DayStatus = 'starting' | 'ending' | 'ongoing';
type DayEntry  = { name: string; dept: string; type: string; days: number; status: DayStatus };
type DayMap    = Record<string, DayEntry[]>;

const CAL_STATUS_DOT: Record<DayStatus, string> = {
    starting: 'bg-primary',
    ending:   'bg-destructive',
    ongoing:  'bg-muted-foreground',
};
const CAL_STATUS_LABEL: Record<DayStatus, string> = {
    starting: 'Starting',
    ending:   'Ending',
    ongoing:  'On Leave',
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
            const key     = calToKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
            const isStart = cursor.getTime() === r.start.getTime();
            const isEnd   = cursor.getTime() === r.end.getTime();
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
    const [year,        setYear]        = useState(today.getFullYear());
    const [month,       setMonth]       = useState(today.getMonth());
    const [selectedKey, setSelectedKey] = useState<string>(calToKey(today.getFullYear(), today.getMonth(), today.getDate()));
    const [panelOpen,   setPanelOpen]   = useState(false);

    const dayMap      = useMemo(() => buildCalDayMap(requests), [requests]);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const cells: { day: number; current: boolean; key: string | null }[] = [];
    for (let i = firstDay - 1; i >= 0; i--)
        cells.push({ day: daysInPrev - i, current: false, key: null });
    for (let d = 1; d <= daysInMonth; d++)
        cells.push({ day: d, current: true, key: calToKey(year, month, d) });
    let next = 1;
    while (cells.length % 7 !== 0)
        cells.push({ day: next++, current: false, key: null });

    const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

    function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
    function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
    function goToday()   { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedKey(calToKey(today.getFullYear(), today.getMonth(), today.getDate())); }
    function isToday(cell: { day: number; current: boolean }) {
        return cell.current && cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    }

    const selectedEntries = dayMap[selectedKey] ?? [];
    const grouped: Record<DayStatus, DayEntry[]> = { starting: [], ending: [], ongoing: [] };
    for (const e of selectedEntries) grouped[e.status].push(e);

    function handleDayClick(cell: { current: boolean; key: string | null }) {
        if (!cell.current || !cell.key) return;
        setSelectedKey(cell.key);
        setPanelOpen(true);  // auto-open panel on mobile tap
    }

    const selectedDateLabel = new Date(selectedKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const selectedDayLabel  = new Date(selectedKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <Card className="overflow-hidden p-0">
            <div className="flex flex-col md:flex-row md:items-stretch">

                {/* ── Calendar pane ── */}
                <div className="flex min-w-0 flex-col md:w-[70%]">
                    {/* Nav row */}
                    <div className="flex h-12 items-center justify-between border-b border-border px-3 sm:h-14 sm:px-5">
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <h2 className="min-w-[120px] text-center text-sm font-semibold text-foreground sm:min-w-[160px] sm:text-base">
                                {CAL_MONTHS[month]} <span className="font-normal text-muted-foreground">{year}</span>
                            </h2>
                            <button onClick={nextMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                        {/* Legend — hidden on mobile */}
                        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                            {(Object.keys(CAL_STATUS_DOT) as DayStatus[]).map(s => (
                                <span key={s} className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${CAL_STATUS_DOT[s]}`} />
                                    {CAL_STATUS_LABEL[s]}
                                </span>
                            ))}
                        </div>
                        <button onClick={goToday} className="rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">Today</button>
                    </div>

                    {/* Day-of-week labels */}
                    <div className="grid grid-cols-7 border-b border-border">
                        {CAL_DAYS.map((d, i) => (
                            <div key={d} className={`py-1.5 text-center text-[9px] font-bold tracking-widest text-muted-foreground sm:py-2 sm:text-xs ${i < 6 ? 'border-r border-border' : ''}`}>
                                <span className="sm:hidden">{d[0]}</span>
                                <span className="hidden sm:inline">{d}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid cells */}
                    <div className="flex flex-col">
                        {weeks.map((week, wi) => (
                            <div key={wi} className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-border' : ''}`}>
                                {week.map((cell, ci) => {
                                    const isSelected = cell.key === selectedKey;
                                    const todayCell  = isToday(cell);
                                    const entries    = cell.key ? (dayMap[cell.key] ?? []) : [];
                                    const counts     = {
                                        starting: entries.filter(e => e.status === 'starting').length,
                                        ending:   entries.filter(e => e.status === 'ending').length,
                                        ongoing:  entries.filter(e => e.status === 'ongoing').length,
                                    };
                                    return (
                                        <div key={ci}
                                            onClick={() => handleDayClick(cell)}
                                            className={[
                                                'relative flex items-center justify-center transition-colors',
                                                'min-h-[2.5rem] sm:min-h-[4.6rem]',
                                                ci < 6 ? 'border-r border-border' : '',
                                                !cell.current
                                                    ? 'cursor-default bg-muted/30'
                                                    : isSelected
                                                        ? 'cursor-pointer bg-primary'
                                                        : 'cursor-pointer hover:bg-accent/40',
                                            ].join(' ')}>
                                            <div className={[
                                                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium leading-none',
                                                'sm:h-7 sm:w-7 sm:text-sm',
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
                                            {cell.current && entries.length > 0 && (
                                                <div className="absolute right-0.5 top-0.5 flex flex-row-reverse flex-wrap-reverse items-center justify-start gap-0.5 sm:right-2 sm:top-2 sm:gap-1">
                                                    {(['starting','ending','ongoing'] as DayStatus[]).map(s =>
                                                        counts[s] > 0
                                                            ? <span key={s} className={`h-1 w-1 shrink-0 rounded-full sm:h-2 sm:w-2 ${isSelected ? 'bg-primary-foreground/70' : CAL_STATUS_DOT[s]}`} />
                                                            : null
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Mobile legend row below grid */}
                    <div className="flex items-center justify-center gap-4 border-t border-border px-3 py-2 text-[10px] text-muted-foreground sm:hidden">
                        {(Object.keys(CAL_STATUS_DOT) as DayStatus[]).map(s => (
                            <span key={s} className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${CAL_STATUS_DOT[s]}`} />
                                {CAL_STATUS_LABEL[s]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Side / bottom panel — desktop always visible, mobile as collapsible ── */}
                <div className="flex flex-col border-t border-border md:w-[30%] md:shrink-0 md:border-l md:border-t-0">
                    {/* Panel header — acts as toggle on mobile */}
                    <button
                        onClick={() => setPanelOpen(v => !v)}
                        className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border px-4 text-left sm:h-14 md:cursor-default"
                    >
                        <div>
                            <div className="text-sm font-bold leading-tight text-foreground">{selectedDateLabel}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                                {selectedDayLabel}
                                {selectedEntries.length > 0 && <span className="ml-1.5">· {selectedEntries.length} on leave</span>}
                            </div>
                        </div>
                        {/* Chevron indicator only on mobile */}
                        <ChevronDown
                            size={16}
                            className={`shrink-0 text-muted-foreground transition-transform duration-200 md:hidden ${panelOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Panel body — always visible on md+, collapsible on mobile */}
                    <div className={`overflow-y-auto px-4 py-3 ${panelOpen ? 'max-h-72 sm:max-h-80' : 'hidden'} md:block md:max-h-[520px]`}>
                        {selectedEntries.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
                                <div className="text-lg">🌿</div>
                                <p className="text-xs text-muted-foreground">No approved leaves on this day.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {(['starting','ending','ongoing'] as DayStatus[]).map(status =>
                                    grouped[status].length > 0 ? (
                                        <div key={status}>
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{CAL_STATUS_LABEL[status]}</p>
                                            <div className="flex flex-col gap-2">
                                                {grouped[status].map((entry, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/60 p-2.5">
                                                        <Avatar size="sm" className="mt-0.5 shrink-0">
                                                            <AvatarFallback className="text-xs font-black text-white" style={{ background: DEPT_COLORS[entry.dept.charCodeAt(0) % DEPT_COLORS.length] }}>
                                                                {entry.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-xs font-semibold text-foreground">{entry.name}</div>
                                                            <div className="truncate text-[10px] text-muted-foreground">{entry.dept}</div>
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CAL_STATUS_DOT[status]}`} />
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
   8. HIGH LEAVE FREQUENCY EMPLOYEES
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

    const sorted      = Object.values(freqMap).sort((a, b) => b.count - a.count).slice(0, 10).map((e, i) => ({ ...e, types: Array.from(e.types), rank: i + 1 }));
    const maxCount    = sorted[0]?.count ?? 1;
    const RANK_COLORS = [amber, rose, orange, violet, blue];

    return (
        <Card>
            <SH title="High Leave Frequency Employees" accent={rose} sub="Top 10 employees by number of leave requests · tap to expand" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sorted.map((e, i) => {
                    const riskColor  = e.count >= 12 ? rose : e.count >= 8 ? amber : emerald;
                    const isExpanded = expanded === e.name;
                    return (
                        <div key={e.name} onClick={() => setExpanded(isExpanded ? null : e.name)}
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${isExpanded ? riskColor : i < 3 ? `color-mix(in oklch,${riskColor} 30%,transparent)` : 'var(--border)'}`,
                                background: isExpanded ? `color-mix(in oklch,${riskColor} 8%,transparent)` : i < 3 ? `color-mix(in oklch,${riskColor} 5%,transparent)` : 'var(--card)',
                                cursor: 'pointer', transition: 'all .15s', overflow: 'hidden',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                                {/* Rank badge */}
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: i < 3 ? RANK_COLORS[i] : 'var(--muted)', color: i < 3 ? 'var(--primary-foreground)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>{e.rank}</div>
                                <Avatar size="sm">
                                    <AvatarFallback className="text-xs font-black text-white" style={{ background: DEPT_COLORS[e.dept.charCodeAt(0) % DEPT_COLORS.length] }}>{e.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>{e.name}</div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{e.dept}</span>
                                        {/* Type pills hidden on mobile */}
                                        <span className="hidden sm:contents">
                                            {e.types.map(t => <Pill key={t} label={t} color={TYPE_COLORS[t] ?? slate} />)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{e.count}</div>
                                    <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>requests</div>
                                    <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 1 }}>{e.totalDays}d</div>
                                </div>
                                {/* Mini bar — hidden on mobile */}
                                <div className="hidden sm:block" style={{ width: 72, flexShrink: 0 }}>
                                    <div style={{ height: 5, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${(e.count / maxCount) * 100}%`, height: '100%', background: riskColor, borderRadius: 3 }} />
                                    </div>
                                </div>
                                <ChevronDown size={13} className="shrink-0 text-muted-foreground transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                            </div>
                            {isExpanded && (
                                <div style={{ padding: '0 12px 12px 12px', borderTop: `1px solid color-mix(in oklch,${riskColor} 20%,transparent)` }}>
                                    <div style={{ display: 'flex', gap: 12, paddingTop: 10, flexWrap: 'wrap' }}>
                                        {/* Type pills shown here on mobile when expanded */}
                                        {e.types.length > 0 && (
                                            <div className="sm:hidden w-full mb-1 flex flex-wrap gap-1">
                                                {e.types.map(t => <Pill key={t} label={t} color={TYPE_COLORS[t] ?? slate} />)}
                                            </div>
                                        )}
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
                                        <div style={{ flex: 1, minWidth: 140 }}>
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
    const requests             = useMemo(() => hydrateRequests(rawRequests), [rawRequests]);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const filteredRequests      = useFiltered(requests, filters);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Overview" />

            <div className="flex flex-col gap-4 overflow-y-auto p-3 sm:p-6"
                style={{ fontFamily: 'var(--font-sans)', background: 'var(--background)', height: '100%' }}>

                {/* Page header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 20, borderRadius: 2, background: emerald }} />
                            <h1 className="text-lg font-black tracking-tight sm:text-lg" style={{ color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                                Leave Overview
                            </h1>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0, paddingLeft: 11 }}>
                            Comprehensive leave analytics — as of {date}
                        </p>
                    </div>
                </div>

                <ActiveFilters filters={filters} setFilters={setFilters} />
                <KpiCards requests={filteredRequests} allRequests={requests} filters={filters} setFilters={setFilters} />

                {/* Charts — 1 col mobile, 2 col md+ */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <LeaveStatusDist requests={filteredRequests} filters={filters} setFilters={setFilters} />
                    <LeaveTypesChart requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <LeaveOvertime requests={filteredRequests} />
                    <LeaveByDept   requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                <LeaveCalendar requests={filteredRequests} />
                <LeaveBalanceReport balances={balances} />
                <HighFrequencyEmployees requests={filteredRequests} />

            </div>
        </AppLayout>
    );
} 