import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState, useMemo } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, LineChart, Line, Legend,
} from 'recharts';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Reports and Analytics',
        href: route('reports_and_analytics.leave-report.index'),
    },
];


const emerald = '#10b981';
const amber   = '#f59e0b';
const rose    = '#f43f5e';
const blue    = '#3b82f6';
const violet  = '#8b5cf6';
const cyan    = '#06b6d4';
const indigo  = '#6366f1';
const orange  = '#f97316';
const slate   = '#64748b';
const pink    = '#ec4899';


const TT = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    fontSize: 11,
    padding: '6px 12px',
    boxShadow: 'var(--shadow-lg)',
};


const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
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
        color, background: `${color}14`,
        border: `1px solid ${color}30`,
    }}>{label}</span>
);



const DEPTS = ['Admin','Operations','Finance','HR','IT','Security','Engineering','Legal'];
const LEAVE_TYPES = ['Vacation','Sick','Maternity','Paternity','Other'];
const LEAVE_STATUS = ['Approved','Pending','Rejected','Cancelled'];
const EMPLOYEES_NAMES = [
    'Maria Santos','Juan dela Cruz','Ana Reyes','Pedro Garcia','Rosa Mendoza',
    'Carlos Bautista','Elena Cruz','Miguel Torres','Luz Villanueva','Ramon Aquino',
    'Maricel Flores','Antonio Ramos','Josephine Castillo','Eduardo Morales','Cristina Lim',
    'Roberto Chan','Marilou Tan','Fernando Uy','Gloria Sy','Rodrigo Go',
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const STATUS_COLORS: Record<string, string> = {
    Approved: emerald, Pending: amber, Rejected: rose, Cancelled: slate,
};
const TYPE_COLORS: Record<string, string> = {
    Vacation: blue, Sick: rose, Maternity: pink, Paternity: cyan, Other: orange,
};
const DEPT_COLORS = [blue, emerald, amber, violet, cyan, rose, indigo, orange];

interface LeaveReq {
    id: string; employee: string; dept: string; type: string;
    status: string; start: Date; end: Date; days: number;
    week: number; month: number; year: number;
}

const TODAY = new Date(2025, 2, 11);

const LEAVE_REQUESTS: LeaveReq[] = Array.from({ length: 200 }, (_, i) => {
    const year  = 2024 + (Math.random() < 0.4 ? 0 : 1);
    const month = randInt(0, year === 2025 ? 2 : 11);
    const day   = randInt(1, 25);
    const start = new Date(year, month, day);
    const dur   = randInt(1, 14);
    const end   = new Date(start.getTime() + dur * 86400000);
    const week  = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7);
    return {
        id: `LV-${String(i + 1).padStart(4, '0')}`,
        employee: EMPLOYEES_NAMES[i % 20],
        dept: rand(DEPTS), type: rand(LEAVE_TYPES),
        status: rand(LEAVE_STATUS),
        start, end, days: dur,
        week, month: start.getMonth(), year: start.getFullYear(),
    };
});

const LEAVE_BALANCE = EMPLOYEES_NAMES.map(name => {
    const total = 30;
    const used  = randInt(0, 28);
    return { name, dept: rand(DEPTS), total, used, remaining: total - used };
});

interface Filters { status: string; type: string; dept: string; }
const EMPTY_FILTERS: Filters = { status: '', type: '', dept: '' };

function useFiltered(filters: Filters) {
    return useMemo(() => {
        let r = LEAVE_REQUESTS;
        if (filters.status) r = r.filter(x => x.status === filters.status);
        if (filters.type)   r = r.filter(x => x.type   === filters.type);
        if (filters.dept)   r = r.filter(x => x.dept   === filters.dept);
        return r;
    }, [filters]);
}


function ActiveFilters({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
    const active = Object.entries(filters).filter(([, v]) => v !== '');
    if (active.length === 0) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>Filtering:</span>
            {active.map(([k, v]) => {
                const color = k === 'status' ? STATUS_COLORS[v] : k === 'type' ? TYPE_COLORS[v] : violet;
                return (
                    <button key={k} onClick={() => setFilters({ ...filters, [k]: '' })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}30`, cursor: 'pointer' }}>
                        {v} <span style={{ opacity: 0.6 }}>✕</span>
                    </button>
                );
            })}
            <button onClick={() => setFilters(EMPTY_FILTERS)}
                style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: rose, background: `${rose}10`, border: `1px solid ${rose}25`, cursor: 'pointer' }}>
                Clear all
            </button>
        </div>
    );
}

/* ══════════════════════════════════════
   1. KPI CARDS — clickable to filter by status
══════════════════════════════════════ */
function KpiCards({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const base     = LEAVE_REQUESTS; 
    const total    = base.length;
    const approved = base.filter(r => r.status === 'Approved').length;
    const onLeave  = base.filter(r => r.status === 'Approved' && r.start <= TODAY && r.end >= TODAY).length;
    const pending  = base.filter(r => r.status === 'Pending').length;

    const kpis = [
        { label: 'Total Leave Requests', value: total,    accent: blue,    icon: '📋', sub: 'all time',           filterStatus: '' },
        { label: 'Approved Leaves',       value: approved, accent: emerald, icon: '✅', sub: `${((approved/total)*100).toFixed(1)}% approval rate`, filterStatus: 'Approved' },
        { label: 'Currently On Leave',    value: onLeave,  accent: violet,  icon: '🏖', sub: 'as of today',        filterStatus: '' },
        { label: 'Pending Approval',      value: pending,  accent: amber,   icon: '⏳', sub: 'awaiting action',    filterStatus: 'Pending' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {kpis.map(k => {
                const isActive = k.filterStatus && filters.status === k.filterStatus;
                const clickable = !!k.filterStatus;
                return (
                    <div key={k.label}
                        onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.filterStatus ? '' : k.filterStatus })}
                        style={{
                            background: 'var(--card)',
                            borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${isActive ? k.accent : 'var(--border)'}`,
                            borderLeft: `4px solid ${k.accent}`,
                            padding: '18px 20px',
                            boxShadow: isActive ? `0 0 0 3px ${k.accent}20, var(--shadow-sm)` : 'var(--shadow-sm)',
                            display: 'flex', flexDirection: 'column', gap: 10,
                            cursor: clickable ? 'pointer' : 'default',
                            transition: 'all .15s',
                            transform: isActive ? 'translateY(-1px)' : 'none',
                        }}
                        onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = isActive ? 'translateY(-1px)' : 'none'; }}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${k.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{k.icon}</div>
                        <div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--foreground)', lineHeight: 1 }}>{k.value}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginTop: 4 }}>{k.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{k.sub}</div>
                            {clickable && <div style={{ fontSize: 10, color: k.accent, fontWeight: 700, marginTop: 4 }}>{isActive ? '✓ Filtering' : 'Click to filter'}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════
   2. LEAVE STATUS DISTRIBUTION — clickable pie segments
══════════════════════════════════════ */
function LeaveStatusDist({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hovSeg, setHovSeg] = useState<string | null>(null);

    const data = LEAVE_STATUS.map(s => ({
        name: s,
        value: requests.filter(r => r.status === s).length,
        color: STATUS_COLORS[s],
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
                                        opacity={
                                            filters.status && filters.status !== d.name ? 0.25 :
                                            hovSeg && hovSeg !== d.name ? 0.5 : 1
                                        }
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
                                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>
                                        {d.value} <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>({total ? ((d.value/total)*100).toFixed(1) : 0}%)</span>
                                    </span>
                                </div>
                                <div style={{ height: 6, background: 'var(--muted)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <div style={{ width: `${total ? (d.value/total)*100 : 0}%`, height: '100%', background: d.color, borderRadius: 'var(--radius-sm)', transition: 'width .4s' }} />
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
   3. LEAVE TYPES MOST USED — clickable bars
══════════════════════════════════════ */
function LeaveTypesChart({ requests, filters, setFilters }: { requests: LeaveReq[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hov, setHov] = useState<string | null>(null);

    const data = LEAVE_TYPES.map(t => ({
        name: t,
        count: requests.filter(r => r.type === t).length,
        color: TYPE_COLORS[t],
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
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                opacity: filters.type && !isActive ? 0.4 : 1, transition: 'opacity .15s' }}>
                            <div style={{ width: 20, fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'right' }}>{i + 1}</div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0,
                                outline: isActive ? `2px solid ${d.color}` : 'none', outlineOffset: 1 }} />
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
   4. LEAVE REQUEST OVERTIME 
══════════════════════════════════════ */
function LeaveOvertime({ requests }: { requests: LeaveReq[] }) {
    const [view, setView] = useState<'weekly'|'monthly'|'yearly'>('monthly');

    const weeklyData = useMemo(() => {
        const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
        return weeks.map((w, i) => ({
            label: w,
            count: requests.filter(r => r.year === 2025 && r.month <= 2 && r.week === (i % 5) + 1).length,
        }));
    }, [requests]);

    const monthlyData = useMemo(() => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months.map((m, i) => ({
            label: m,
            '2024': requests.filter(r => r.year === 2024 && r.month === i).length,
            '2025': requests.filter(r => r.year === 2025 && r.month === i).length,
        }));
    }, [requests]);

    const yearlyData = useMemo(() => [
        { label: '2022', count: 120 },
        { label: '2023', count: 145 },
        { label: '2024', count: requests.filter(r => r.year === 2024).length },
        { label: '2025', count: requests.filter(r => r.year === 2025).length },
    ], [requests]);

    const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        background: active ? `${color}12` : 'var(--card)',
        color: active ? color : 'var(--muted-foreground)',
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
    });

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <SH title="Leave Request Over Time" accent={blue} sub="Trend of requests across periods" />
                <div style={{ display: 'flex', gap: 4 }}>
                    {(['weekly','monthly','yearly'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)} style={btnStyle(view === v, blue)}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {view === 'monthly' ? (
                        <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TT} />
                            <Line type="monotone" dataKey="2024" stroke={slate} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="2025" stroke={blue}  strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
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

    const data = DEPTS.map((d, i) => ({
        dept: d,
        count: requests.filter(r => r.dept === d).length,
        color: DEPT_COLORS[i],
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
                                        fill={isActive ? DEPT_COLORS[DEPTS.indexOf(payload.value)] : 'var(--foreground)'}>
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
function LeaveBalanceReport() {
    const [search, setSearch] = useState('');
    const [page, setPage]     = useState(1);
    const [sortKey, setSortKey] = useState<'name'|'dept'|'total'|'used'|'remaining'>('used');
    const [sortDir, setSortDir] = useState<1|-1>(-1);
    const PER_PAGE = 10;

    const doSort = (k: typeof sortKey) => {
        if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1);
        else { setSortKey(k); setSortDir(-1); }
        setPage(1);
    };

    const filtered = useMemo(() => {
        let r = LEAVE_BALANCE.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
        r = [...r].sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            return typeof av === 'number' ? (av - (bv as number)) * sortDir : String(av).localeCompare(String(bv)) * sortDir;
        });
        return r;
    }, [search, sortKey, sortDir]);

    const pages   = Math.ceil(filtered.length / PER_PAGE);
    const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const TH = ({ k, label, align = 'left' }: { k: typeof sortKey; label: string; align?: string }) => (
        <th onClick={() => doSort(k)} style={{
            padding: '10px 12px', fontSize: 11, fontWeight: 700,
            color: sortKey === k ? 'var(--foreground)' : 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: '2px solid var(--border)', textAlign: align as any,
            whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
            background: sortKey === k ? `${blue}06` : undefined,
        }}>
            {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
        </th>
    );

    return (
        <Card>
            <SH title="Leave Balance Report" accent={cyan} sub="Per employee leave allocation and usage · click columns to sort" />
            <div style={{ marginBottom: 12 }}>
                <input
                    placeholder="🔍 Search employee…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{
                        width: '100%', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '7px 12px',
                        fontSize: 11, color: 'var(--foreground)',
                        background: 'var(--card)', outline: 'none', boxSizing: 'border-box',
                    }}
                />
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-sans)' }}>
                    <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                            <TH k="name"      label="Employee"    />
                            <TH k="dept"      label="Department"  />
                            <TH k="total"     label="Total Leave" align="center" />
                            <TH k="used"      label="Used"        align="center" />
                            <TH k="remaining" label="Remaining"   align="center" />
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', textAlign: 'center', whiteSpace: 'nowrap' }}>Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((e, i) => {
                            const pct = Math.round((e.used / e.total) * 100);
                            const color = pct > 80 ? rose : pct > 50 ? amber : emerald;
                            return (
                                <tr key={e.name}
                                    style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--muted)' }}
                                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--accent)')}
                                    onMouseLeave={ev => (ev.currentTarget.style.background = i % 2 === 0 ? 'var(--card)' : 'var(--muted)')}>
                                    <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--foreground)' }}>{e.name}</td>
                                    <td style={{ padding: '9px 12px', color: 'var(--muted-foreground)' }}>{e.dept}</td>
                                    <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--foreground)', textAlign: 'center' }}>{e.total}</td>
                                    <td style={{ padding: '9px 12px', fontWeight: 700, color: amber, textAlign: 'center' }}>{e.used}</td>
                                    <td style={{ padding: '9px 12px', fontWeight: 700, color: emerald, textAlign: 'center' }}>{e.remaining}</td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 700, color, width: 32, textAlign: 'right' }}>{pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                    {Array.from({ length: Math.min(5, pages) }, (_, idx) => {
                        const p = Math.max(1, Math.min(page - 2, pages - 4)) + idx;
                        return <button key={p} onClick={() => setPage(p)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: page === p ? 'var(--foreground)' : 'var(--card)', color: page === p ? 'var(--background)' : 'var(--foreground)', fontSize: 11, cursor: 'pointer', fontWeight: page === p ? 700 : 400 }}>{p}</button>;
                    })}
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                        style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: page === pages ? 'default' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>Next →</button>
                </div>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   8. LEAVE CALENDAR VIEW — click day to see employee list
══════════════════════════════════════ */
function LeaveCalendar({ requests }: { requests: LeaveReq[] }) {
    const [viewMonth, setViewMonth] = useState(new Date(2025, 2, 1));
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const year     = viewMonth.getFullYear();
    const month    = viewMonth.getMonth();
    const monthName = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const firstDay  = new Date(year, month, 1).getDay();
    const daysInMo  = new Date(year, month + 1, 0).getDate();

    const approvedLeaves = requests.filter(r => r.status === 'Approved');
    const getLeavesOnDay = (day: number) => {
        const date = new Date(year, month, day);
        return approvedLeaves.filter(r => r.start <= date && r.end >= date);
    };

    const prevMonth = () => { setViewMonth(new Date(year, month - 1, 1)); setSelectedDay(null); };
    const nextMonth = () => { setViewMonth(new Date(year, month + 1, 1)); setSelectedDay(null); };

    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const selectedLeaves = selectedDay ? getLeavesOnDay(selectedDay) : [];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <SH title="Leave Calendar View" accent={pink} sub="Employees on approved leave by date · click a day to see who's out" />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={prevMonth} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: 'pointer' }}>←</button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', minWidth: 120, textAlign: 'center' }}>{monthName}</span>
                    <button onClick={nextMonth} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: 'pointer' }}>→</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 260px' : '1fr', gap: 16 }}>
                <div>
                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                        {dayLabels.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                        ))}
                    </div>
                    {/* Calendar grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                        {cells.map((day, i) => {
                            if (!day) return <div key={`b-${i}`} style={{ minHeight: 52 }} />;
                            const leaves     = getLeavesOnDay(day);
                            const isToday    = year === 2025 && month === 2 && day === 11;
                            const hasOverlap = leaves.length > 1;
                            const isSelected = selectedDay === day;

                            return (
                                <div key={day}
                                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                                    style={{
                                        minHeight: 52, padding: '4px 5px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1px solid ${isSelected ? pink : isToday ? blue : hasOverlap ? `${rose}50` : 'var(--border)'}`,
                                        background: isSelected ? `${pink}10` : isToday ? `${blue}10` : hasOverlap ? `${rose}06` : leaves.length > 0 ? `${emerald}06` : 'var(--card)',
                                        cursor: leaves.length > 0 ? 'pointer' : 'default',
                                        transition: 'background .15s, border-color .15s',
                                        boxShadow: isSelected ? `0 0 0 2px ${pink}30` : 'none',
                                    }}
                                    onMouseEnter={e => { if (leaves.length > 0 && !isSelected) (e.currentTarget as HTMLDivElement).style.background = `${pink}08`; }}
                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isToday ? `${blue}10` : hasOverlap ? `${rose}06` : leaves.length > 0 ? `${emerald}06` : 'var(--card)'; }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: isToday ? 900 : 600, color: isToday ? blue : isSelected ? pink : 'var(--foreground)', marginBottom: 2 }}>{day}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {leaves.slice(0, 4).map((l, li) => (
                                            <div key={li} style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLORS[l.type] ?? slate, flexShrink: 0 }} />
                                        ))}
                                        {leaves.length > 4 && <span style={{ fontSize: 8, color: 'var(--muted-foreground)', fontWeight: 700 }}>+{leaves.length - 4}</span>}
                                    </div>
                                    {leaves.length > 0 && (
                                        <div style={{ fontSize: 8, color: leaves.length > 1 ? rose : emerald, fontWeight: 700, marginTop: 1 }}>
                                            {leaves.length} {leaves.length === 1 ? 'emp' : 'emps'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day detail panel */}
                {selectedDay && (
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--foreground)' }}>
                                    {new Date(year, month, selectedDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{selectedLeaves.length} on leave</div>
                            </div>
                            <button onClick={() => setSelectedDay(null)} style={{ border: 'none', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', width: 24, height: 24, cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)' }}>✕</button>
                        </div>
                        {selectedLeaves.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'center', padding: '20px 0' }}>No approved leaves</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedLeaves.map((l, i) => (
                                    <div key={i} style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--muted)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--foreground)' }}>{l.employee}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{l.dept}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[l.type] ?? slate, background: `${TYPE_COLORS[l.type] ?? slate}14`, padding: '1px 6px', borderRadius: 99 }}>{l.type}</span>
                                            <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{l.days}d</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                    { label: 'Today', color: blue },
                    { label: '1 employee on leave', color: emerald },
                    { label: 'Overlapping (2+ employees)', color: rose },
                    { label: 'Selected', color: pink },
                    ...LEAVE_TYPES.map(t => ({ label: t, color: TYPE_COLORS[t] })),
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{l.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════
   9. HIGH LEAVE FREQUENCY EMPLOYEES — hover to expand
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

    const maxCount   = sorted[0]?.count ?? 1;
    const RANK_COLORS = [amber, rose, orange, violet, blue];

    return (
        <Card>
            <SH title="High Leave Frequency Employees" accent={rose} sub="Top 10 employees by number of leave requests · click to expand" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sorted.map((e, i) => {
                    const riskColor  = e.count >= 12 ? rose : e.count >= 8 ? amber : emerald;
                    const isExpanded = expanded === e.name;
                    return (
                        <div key={e.name}
                            onClick={() => setExpanded(isExpanded ? null : e.name)}
                            style={{
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${isExpanded ? riskColor : i < 3 ? `${riskColor}30` : 'var(--border)'}`,
                                background: isExpanded ? `${riskColor}08` : i < 3 ? `${riskColor}05` : 'var(--card)',
                                cursor: 'pointer', transition: 'all .15s', overflow: 'hidden',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                                {/* Rank */}
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: i < 3 ? RANK_COLORS[i] : 'var(--muted)', color: i < 3 ? 'var(--primary-foreground)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{e.rank}</div>
                                {/* Avatar */}
                                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: DEPT_COLORS[DEPTS.indexOf(e.dept) % DEPT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--primary-foreground)' }}>{e.name.charAt(0)}</div>
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

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div style={{ padding: '0 14px 12px 14px', borderTop: `1px solid ${riskColor}20` }}>
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
export default function LeaveOverview() {
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const filteredRequests = useFiltered(filters);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Overview" />

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)', background: 'var(--background)', minHeight: '100%' }}>

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
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: emerald, border: '1px solid rgba(16,185,129,0.25)' }}>● Live Data</span>
                </div>

                {/* Active filter chips */}
                <ActiveFilters filters={filters} setFilters={setFilters} />

                {/* Section 1: KPI Cards */}
                <KpiCards requests={filteredRequests} filters={filters} setFilters={setFilters} />

                {/* Section 2: Status + Types */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <LeaveStatusDist requests={filteredRequests} filters={filters} setFilters={setFilters} />
                    <LeaveTypesChart requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                {/* Section 3: Overtime + By Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <LeaveOvertime requests={filteredRequests} />
                    <LeaveByDept   requests={filteredRequests} filters={filters} setFilters={setFilters} />
                </div>

                {/* Section 4: Leave Calendar */}
                <LeaveCalendar requests={filteredRequests} />

                {/* Section 5: Balance Report */}
                <LeaveBalanceReport />

                {/* Section 6: High Frequency */}
                <HighFrequencyEmployees requests={filteredRequests} />

            </div>
        </AppLayout>
    );
}
