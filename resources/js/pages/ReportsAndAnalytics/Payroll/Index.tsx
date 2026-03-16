import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, ComposedChart, ResponsiveContainer, Line, LineChart,
} from 'recharts';
import { useState, useMemo } from 'react';
import { Banknote, Users, CalendarDays, Minus, CircleCheck, Download } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Reports and Analytics',
        href: route('reports_and_analytics.payroll-report.index'),
    },
];

/* ── colour tokens ── */
const blue    = '#3b82f6';
const emerald = '#10b981';
const amber   = '#f59e0b';
const red     = '#ef4444';
const violet  = '#8b5cf6';
const cyan    = '#06b6d4';
const rose    = '#f43f5e';
const indigo  = '#6366f1';
const slate   = '#64748b';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
interface PayrollRecord {
    id: string;
    name: string;
    department: string;
    type: 'Regular' | 'Casual' | 'Job Order';
    status: 'Processed' | 'Pending' | 'On Hold' | 'Released';
    basicPay: number;
    allowance: number;
    gsis: number;
    philhealth: number;
    pagibig: number;
    withholding: number;
    otherDeductions: number;
    period: string;
}

/* ══════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════ */
const DEPARTMENTS = ['Admin','Operations','Finance','HR','IT','Security','Engineering','Legal'];
const EMP_TYPES   = ['Regular','Casual','Job Order'] as const;
const PAY_STATUSES = ['Processed','Pending','On Hold','Released'] as const;

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const NAMES = [
    'Maria Santos','Juan dela Cruz','Ana Reyes','Pedro Garcia','Rosa Mendoza',
    'Carlos Bautista','Elena Cruz','Miguel Torres','Luz Villanueva','Ramon Aquino',
    'Maricel Flores','Antonio Ramos','Josephine Castillo','Eduardo Morales','Cristina Lim',
    'Roberto Chan','Marilou Tan','Fernando Uy','Gloria Sy','Rodrigo Go',
];

const BASE_BY_TYPE: Record<string, [number, number]> = {
    Regular:    [28000, 65000],
    Casual:     [16000, 27000],
    'Job Order':[12000, 18000],
};

const PAYROLL: PayrollRecord[] = Array.from({ length: 120 }, (_, i) => {
    const type      = rand(EMP_TYPES);
    const [lo, hi]  = BASE_BY_TYPE[type];
    const basic     = randInt(lo, hi);
    const allowance = randInt(1000, 5000);
    const gsis      = Math.round(basic * 0.09);
    const philhealth= Math.round(basic * 0.045);
    const pagibig   = Math.min(Math.round(basic * 0.02), 200);
    const withholding = type === 'Regular' ? Math.round(basic * 0.08) : 0;
    const otherDed  = randInt(0, 2000);
    return {
        id:             `EMP-${String(i + 1).padStart(4,'0')}`,
        name:           NAMES[i % 20] + (i >= 20 ? ` ${Math.floor(i/20)+1}` : ''),
        department:     rand(DEPARTMENTS),
        type,
        status:         Math.random() < 0.65 ? 'Processed' : Math.random() < 0.5 ? 'Pending' : Math.random() < 0.5 ? 'Released' : 'On Hold',
        basicPay:       basic,
        allowance,
        gsis,
        philhealth,
        pagibig,
        withholding,
        otherDeductions:otherDed,
        period:         'March 2026',
    };
});

const MONTHLY_TREND = [
    { month: 'Apr',  gross: 2850000, net: 2420000, deductions: 430000 },
    { month: 'May',  gross: 2910000, net: 2470000, deductions: 440000 },
    { month: 'Jun',  gross: 2880000, net: 2440000, deductions: 440000 },
    { month: 'Jul',  gross: 2960000, net: 2510000, deductions: 450000 },
    { month: 'Aug',  gross: 3020000, net: 2560000, deductions: 460000 },
    { month: 'Sep',  gross: 2990000, net: 2540000, deductions: 450000 },
    { month: 'Oct',  gross: 3050000, net: 2590000, deductions: 460000 },
    { month: 'Nov',  gross: 3100000, net: 2620000, deductions: 480000 },
    { month: 'Dec',  gross: 3350000, net: 2840000, deductions: 510000 },
    { month: 'Jan',  gross: 3010000, net: 2550000, deductions: 460000 },
    { month: 'Feb',  gross: 3080000, net: 2610000, deductions: 470000 },
    { month: 'Mar',  gross: 3120000, net: 2640000, deductions: 480000 },
];

const FORECAST = [
    { period: 'Apr 1–15',  forecast: 1580000, previous: 1540000 },
    { period: 'Apr 16–30', forecast: 1600000, previous: 1560000 },
    { period: 'May 1–15',  forecast: 1620000, previous: 1580000 },
    { period: 'May 16–31', forecast: 1640000, previous: 1600000 },
];

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fPeso = (v: number) =>
    '₱' + v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fK = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(0)}K`;
    return `₱${v}`;
};

const TS = {
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 11,
    padding: '6px 12px',
    background: 'var(--card)',
};

/* ══════════════════════════════════════════
   SHARED UI
══════════════════════════════════════════ */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.06)', padding: 20, ...style }}>
        {children}
    </div>
);

const SH = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
    </div>
);

const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${color}22` }}>
        {label}
    </span>
);

function statusBadge(s: string) {
    const map: Record<string, { color: string; bg: string }> = {
        Processed: { color: '#16a34a', bg: '#f0fdf4' },
        Released:  { color: '#3b82f6', bg: '#eff6ff' },
        Pending:   { color: '#d97706', bg: '#fffbeb' },
        'On Hold': { color: '#dc2626', bg: '#fef2f2' },
    };
    const m = map[s] ?? map['Pending'];
    return <Badge label={s} color={m.color} bg={m.bg} />;
}

/* ══════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════ */
function FilterBar({
    dept, setDept, empType, setEmpType, dateFrom, setDateFrom, dateTo, setDateTo,
}: {
    dept: string; setDept: (v: string) => void;
    empType: string; setEmpType: (v: string) => void;
    dateFrom: string; setDateFrom: (v: string) => void;
    dateTo: string; setDateTo: (v: string) => void;
}) {
    const sel: React.CSSProperties = {
        border: '1px solid var(--border)', borderRadius: 12, padding: '7px 12px',
        fontSize: 11, color: 'var(--foreground)', background: 'var(--card)', cursor: 'pointer', outline: 'none',
    };
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <select value={dept} onChange={e => setDept(e.target.value)} style={sel}>
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={empType} onChange={e => setEmpType(e.target.value)} style={sel}>
                <option value="All">All Types</option>
                {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 12, padding: '6px 12px', background: 'var(--card)' }}>
                <span style={{ fontSize: 11 }}>📅</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }} />
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }} />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {['🔄 Refresh', '🖨 Print'].map(l => (
                    <button key={l} style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 11, cursor: 'pointer', color: 'var(--foreground)' }}>{l}</button>
                ))}
                <button style={{ padding: '7px 14px', borderRadius: 12, border: 'none', background: 'var(--foreground)', color: 'var(--background)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>⬇ Export</button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   1. KPI STRIP
══════════════════════════════════════════ */
function KpiStrip({ records }: { records: PayrollRecord[] }) {
    const totalGross  = records.reduce((s, r) => s + r.basicPay + r.allowance, 0);
    const totalDed    = records.reduce((s, r) => s + r.gsis + r.philhealth + r.pagibig + r.withholding + r.otherDeductions, 0);
    const totalNet    = totalGross - totalDed;
    const empCount    = records.length;
    const nextPayDate = 'April 15, 2026';

    const kpis = [
        { label: 'Total Gross Payroll', value: fK(totalGross),  description: 'Current period total',            icon: <Banknote    className="size-4 m-1" /> },
        { label: 'No. of Employees',    value: String(empCount), description: 'Active this period',              icon: <Users       className="size-4 m-1" /> },
        { label: 'Next Payroll Date',   value: 'Apr 15',         description: nextPayDate,                       icon: <CalendarDays className="size-4 m-1" /> },
        { label: 'Total Deductions',    value: fK(totalDed),     description: 'SSS, PhilHealth, Pag-IBIG & Tax', icon: <Minus       className="size-4 m-1" /> },
        { label: 'Total Net Pay',       value: fK(totalNet),     description: 'Take-home this period',           icon: <CircleCheck className="size-4 m-1" /> },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map(k => (
                <StatCard
                    key={k.label}
                    title={k.label}
                    value={k.value}
                    description={k.description}
                    icon={k.icon}
                />
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════
   2. PAYROLL BY EMPLOYEE TYPE
══════════════════════════════════════════ */
function PayrollByType({ records }: { records: PayrollRecord[] }) {
    const TYPE_COLORS: Record<string, string> = { Regular: blue, Casual: violet, 'Job Order': cyan };

    const data = EMP_TYPES.map(t => {
        const grp   = records.filter(r => r.type === t);
        const gross = grp.reduce((s, r) => s + r.basicPay + r.allowance, 0);
        const ded   = grp.reduce((s, r) => s + r.gsis + r.philhealth + r.pagibig + r.withholding + r.otherDeductions, 0);
        return { type: t, gross, net: gross - ded, deductions: ded, count: grp.length, color: TYPE_COLORS[t] };
    });

    const totalGross = data.reduce((s, d) => s + d.gross, 0);

    return (
        <Card>
            <SH title="Payroll by Employment Type" sub="Gross · Net · Deductions" />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {data.map(d => (
                    <div key={d.type} style={{ flex: 1, background: `${d.color}10`, border: `1px solid ${d.color}30`, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: d.color, marginBottom: 6 }}>{d.type}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--foreground)' }}>{fK(d.gross)}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>Net: {fK(d.net)}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{d.count} employees</div>
                        <div style={{ marginTop: 8, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(d.gross / totalGross) * 100}%`, height: '100%', background: d.color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: d.color, fontWeight: 700, marginTop: 3 }}></div>
                    </div>
                ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.map(d => ({ name: d.type, Gross: d.gross, Net: d.net, Deductions: d.deductions }))} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={52} tickFormatter={v => fK(v)} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => fPeso(v)} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="Gross"      fill={blue}    radius={[4,4,0,0]} />
                    <Bar dataKey="Net"        fill={emerald} radius={[4,4,0,0]} />
                    <Bar dataKey="Deductions" fill={red}     radius={[4,4,0,0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══════════════════════════════════════════
   3. MONTHLY PAYROLL TREND
══════════════════════════════════════════ */
function MonthlyTrend() {
    return (
        <Card>
            <SH title="Monthly Payroll Trend" sub="Apr 2025 – Mar 2026" />
            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={MONTHLY_TREND}>
                    <defs>
                        <linearGradient id="grossG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={blue}  stopOpacity={0.15} />
                            <stop offset="100%" stopColor={blue}  stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={emerald} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={emerald} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={54} tickFormatter={v => fK(v)} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => fPeso(v)} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="gross"      fill="url(#grossG)" stroke={blue}    strokeWidth={2.5} dot={{ fill: blue,    r: 3, strokeWidth: 0 }} name="Gross Pay"   />
                    <Area type="monotone" dataKey="net"        fill="url(#netG)"   stroke={emerald} strokeWidth={2.5} dot={{ fill: emerald, r: 3, strokeWidth: 0 }} name="Net Pay"    />
                    <Bar  dataKey="deductions" fill={red} opacity={0.4} radius={[3,3,0,0]} name="Deductions" />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══════════════════════════════════════════
   4. UPCOMING PAYROLL FORECAST
══════════════════════════════════════════ */
function PayrollForecast() {
    return (
        <Card>
            <SH title="Upcoming Payroll Forecast" sub="Next 2 payroll periods vs previous" />
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={FORECAST} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={54} tickFormatter={v => fK(v)} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => fPeso(v)} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="forecast"  fill={violet} radius={[4,4,0,0]} name="Forecast"  />
                    <Bar dataKey="previous"  fill={slate}  radius={[4,4,0,0]} name="Previous"  opacity={0.5} />
                </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
                {FORECAST.map(f => (
                    <div key={f.period} style={{ background: 'var(--muted)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 }}>{f.period}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: violet }}>{fK(f.forecast)}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                            {f.forecast > f.previous
                                ? <span style={{ color: red }}>↑ {fK(f.forecast - f.previous)}</span>
                                : <span style={{ color: emerald }}>↓ {fK(f.previous - f.forecast)}</span>
                            } vs prev
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   5. GOVERNMENT REMITTANCES
══════════════════════════════════════════ */
function GovtRemittances({ records }: { records: PayrollRecord[] }) {
    const gsis        = records.reduce((s, r) => s + r.gsis, 0);
    const philhealth  = records.reduce((s, r) => s + r.philhealth, 0);
    const pagibig     = records.reduce((s, r) => s + r.pagibig, 0);
    const withholding = records.reduce((s, r) => s + r.withholding, 0);
    const total       = gsis + philhealth + pagibig + withholding;

    const items = [
        { label: 'GSIS',             value: gsis,        color: blue,    bg: '#eff6ff',  pct: (gsis/total)*100,        icon: '🏛' },
        { label: 'PhilHealth',       value: philhealth,  color: emerald, bg: '#f0fdf4',  pct: (philhealth/total)*100,  icon: '💊' },
        { label: 'Pag-IBIG',         value: pagibig,     color: amber,   bg: '#fffbeb',  pct: (pagibig/total)*100,     icon: '🏠' },
        { label: 'Withholding Tax',  value: withholding, color: red,     bg: '#fef2f2',  pct: (withholding/total)*100, icon: '📋' },
    ];

    const chartData = items.map(i => ({ name: i.label, Amount: i.value }));

    return (
        <Card>
            <SH title="Government Remittances" sub="GSIS · PhilHealth · Pag-IBIG · Withholding Tax" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {items.map(it => (
                    <div key={it.label} style={{ background: it.bg, border: `1px solid ${it.color}22`, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{it.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: it.color }}>{fK(it.value)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{it.label}</div>
                        <div style={{ marginTop: 8, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${it.pct}%`, height: '100%', background: it.color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: it.color, fontWeight: 700, marginTop: 3 }}></div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--muted)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Total Remittances</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--foreground)' }}>{fPeso(total)}</span>
            </div>
            <ResponsiveContainer width="100%" height={160} style={{ marginTop: 14 }}>
                <BarChart data={chartData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => fK(v)} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => fPeso(v)} />
                    <Bar dataKey="Amount" radius={[4,4,0,0]}>
                        {chartData.map((_, idx) => (
                            <rect key={idx} fill={items[idx].color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══════════════════════════════════════════
   6. DEPARTMENT PAYROLL DISTRIBUTION
══════════════════════════════════════════ */
// function DeptPayrollDist({ records }: { records: PayrollRecord[] }) {
//     const DEPT_COLORS = [blue, emerald, amber, violet, cyan, rose, indigo, slate];

//     const data = DEPARTMENTS.map((d, i) => {
//         const grp   = records.filter(r => r.department === d);
//         const gross = grp.reduce((s, r) => s + r.basicPay + r.allowance, 0);
//         const ded   = grp.reduce((s, r) => s + r.gsis + r.philhealth + r.pagibig + r.withholding + r.otherDeductions, 0);
//         return { dept: d, gross, net: gross - ded, count: grp.length, color: DEPT_COLORS[i] };
//     }).sort((a, b) => b.gross - a.gross);

//     const maxGross = data[0].gross;

//     return (
//         <Card>
//             <SH title="Department Payroll Distribution" sub="Gross pay per department" />
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                 {data.map(d => (
//                     <div key={d.dept}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                                 <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
//                                 <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{d.dept}</span>
//                                 <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{d.count} emp</span>
//                             </div>
//                             <div style={{ display: 'flex', gap: 16 }}>
//                                 <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{fK(d.gross)}</span>
//                                 <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Net: {fK(d.net)}</span>
//                             </div>
//                         </div>
//                         <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
//                             <div style={{ width: `${(d.gross / maxGross) * 100}%`, height: '100%', background: d.color, borderRadius: 6, transition: 'width .4s' }} />
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </Card>
//     );
// }



/* ══════════════════════════════════════════
   7. PAYROLL STATUS REPORT + TABLE
══════════════════════════════════════════ */
const PAYROLL_COLUMNS: DataTableColumnDef<PayrollRecord>[] = [
    {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Emp ID" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold" style={{ color: blue }}>{row.getValue('id')}</span>
        ),
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-semibold">{row.getValue('name')}</span>,
    },
    {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('department')}</span>,
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
            const t = row.getValue('type') as string;
            return <span className="text-xs font-bold" style={{ color: TYPE_COLORS[t] ?? slate }}>{t}</span>;
        },
        filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
    },
    {
        accessorKey: 'basicPay',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Basic Pay" />,
        cell: ({ row }) => <span className="font-mono text-xs">{fPeso(row.getValue('basicPay'))}</span>,
    },
    {
        accessorKey: 'allowance',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Allowance" />,
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{fPeso(row.getValue('allowance'))}</span>,
    },
    {
        accessorKey: 'gsis',
        header: ({ column }) => <DataTableColumnHeader column={column} title="GSIS" />,
        cell: ({ row }) => <span className="font-mono text-xs" style={{ color: red }}>{fPeso(row.getValue('gsis'))}</span>,
    },
    {
        accessorKey: 'philhealth',
        header: ({ column }) => <DataTableColumnHeader column={column} title="PhilHealth" />,
        cell: ({ row }) => <span className="font-mono text-xs" style={{ color: red }}>{fPeso(row.getValue('philhealth'))}</span>,
    },
    {
        accessorKey: 'pagibig',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pag-IBIG" />,
        cell: ({ row }) => <span className="font-mono text-xs" style={{ color: red }}>{fPeso(row.getValue('pagibig'))}</span>,
    },
    {
        accessorKey: 'withholding',
        header: ({ column }) => <DataTableColumnHeader column={column} title="W/Tax" />,
        cell: ({ row }) => <span className="font-mono text-xs" style={{ color: red }}>{fPeso(row.getValue('withholding'))}</span>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => statusBadge(row.getValue('status')),
        filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
    },
];

function PayrollStatusReport({ records }: { records: PayrollRecord[] }) {
    const total = records.length;

    const exportCSV = () => {
        const cols: (keyof PayrollRecord)[] = ['id','name','department','type','status','basicPay','allowance','gsis','philhealth','pagibig','withholding','otherDeductions'];
        const rows = [cols.join(','), ...records.map(r => cols.map(c => `"${r[c]}"`).join(','))];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'payroll-status.csv';
        a.click();
    };

    const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
        Processed: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        Released:  { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
        Pending:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        'On Hold': { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    };

    return (
        <Card>
            <SH title="Payroll Status Report" sub={`${total} total records`} />

            {/* Status summary strip — kept exactly as before */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {PAY_STATUSES.map(s => {
                    const cfg   = STATUS_CFG[s];
                    const count = records.filter(r => r.status === s).length;
                    const gross = records.filter(r => r.status === s).reduce((sum, r) => sum + r.basicPay + r.allowance, 0);
                    return (
                        <div key={s} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{s}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>{fK(gross)}</div>
                            <div style={{ marginTop: 6, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: cfg.color, borderRadius: 2 }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Shared DataTable */}
            <DataTable
                columns={PAYROLL_COLUMNS}
                data={records}
                getRowId={(row) => row.id}
                searchColumnId="name"
                searchPlaceholder="Search employee, ID…"
                striped
                addButton={{ label: 'Export CSV', onClick: exportCSV }}
                filters={[
                    {
                        columnId: 'department',
                        title: 'Department',
                        options: DEPARTMENTS.map(d => ({ label: d, value: d })),
                    },
                    {
                        columnId: 'type',
                        title: 'Type',
                        options: EMP_TYPES.map(t => ({ label: t, value: t })),
                    },
                    {
                        columnId: 'status',
                        title: 'Status',
                        options: PAY_STATUSES.map(s => ({ label: s, value: s })),
                    },
                ]}
                footerRow={(rows) => {
                    const recs = rows.map(r => r.original);
                    return [
                        <td key="lbl"  colSpan={4} className="px-4 py-2 text-sm font-semibold text-foreground">
                            Totals ({rows.length} employees)
                        </td>,
                        <td key="basic" className="px-4 py-2 font-mono text-xs font-bold">{fPeso(recs.reduce((s,r) => s+r.basicPay,    0))}</td>,
                        <td key="allow" className="px-4 py-2 font-mono text-xs font-bold text-muted-foreground">{fPeso(recs.reduce((s,r) => s+r.allowance,   0))}</td>,
                        <td key="gsis"  className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.gsis,        0))}</td>,
                        <td key="ph"    className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.philhealth,   0))}</td>,
                        <td key="pag"   className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.pagibig,      0))}</td>,
                        <td key="wtax"  className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.withholding,  0))}</td>,
                        <td key="st" />,
                    ];
                }}
            />
        </Card>
    );
}

const TYPE_COLORS: Record<string, string> = { Regular: blue, Casual: violet, 'Job Order': cyan };

/* ══════════════════════════════════════════
   PAGE EXPORT
══════════════════════════════════════════ */
export default function Index() {
    const [dept,     setDept]     = useState('All');
    const [empType,  setEmpType]  = useState('All');
    const [dateFrom, setDateFrom] = useState('2026-03-01');
    const [dateTo,   setDateTo]   = useState('2026-03-31');
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const filtered = useMemo(() => {
        let r = PAYROLL;
        if (dept    !== 'All') r = r.filter(e => e.department === dept);
        if (empType !== 'All') r = r.filter(e => e.type       === empType);
        return r;
    }, [dept, empType]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Summary" />

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                            Payroll Overview
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, marginBottom: 0 }}>
                            Payroll Analytics · MKWD — as of {date}
                        </p>
                    </div>
                </div>

                <FilterBar
                    dept={dept}         setDept={setDept}
                    empType={empType}   setEmpType={setEmpType}
                    dateFrom={dateFrom} setDateFrom={setDateFrom}
                    dateTo={dateTo}     setDateTo={setDateTo}
                />

                <KpiStrip records={filtered} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <MonthlyTrend />
                    <PayrollForecast />
                </div>

                <PayrollByType records={filtered} />
                <GovtRemittances records={filtered} />
                {/* <DeptPayrollDist records={filtered} /> */}
                <PayrollStatusReport records={filtered} />

            </div>
        </AppLayout>
    );
}