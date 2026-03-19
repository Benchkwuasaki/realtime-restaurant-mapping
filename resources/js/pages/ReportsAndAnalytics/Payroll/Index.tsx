import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, ComposedChart, ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import { Banknote, Users, CalendarDays, Minus, CircleCheck, Building2, HeartPulse, Home, ReceiptText, Calendar, RefreshCw } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';

/* ══════════════════════════════════════════
   BREADCRUMBS
══════════════════════════════════════════ */
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Reports and Analytics',
        href: route('reports_and_analytics.payroll-report.index'),
    },
];

/* ══════════════════════════════════════════
   COLOUR TOKENS
══════════════════════════════════════════ */
const blue    = '#3b82f6';
const emerald = '#10b981';
const amber   = '#f59e0b';
const red     = '#ef4444';
const violet  = '#8b5cf6';
const cyan    = '#06b6d4';
const slate   = '#64748b';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
interface PayrollRecord {
    id: string;
    name: string;
    department: string;
    type: string;
    status: string;
    basicPay: number;
    allowance: number;
    grossPay: number;
    gsis: number;
    philhealth: number;
    pagibig: number;
    withholding: number;
    otherDeductions: number;
    netPay: number;
    period: string;
}

interface MonthlyTrendItem {
    month: string;
    gross: number;
    net: number;
    deductions: number;
}

interface ForecastItem {
    period: string;
    forecast: number;
    previous: number;
    change: number;
}

interface Props {
    payrollRecords:      PayrollRecord[];
    totalGross:          number;
    totalDeductions:     number;
    totalNet:            number;
    employeeCount:       number;
    nextPayrollDate:     string;
    nextPayrollDateFull: string;
    monthlyTrend:        MonthlyTrendItem[];
    forecast:            ForecastItem[];
    departments:         string[];
    filters: {
        date_from: string;
        date_to:   string;
    };
}

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const EMP_TYPES    = ['Regular', 'Casual', 'Job Order'] as const;
const PAY_STATUSES = ['Draft', 'Posted', 'Locked'] as const;

const TYPE_COLORS: Record<string, string> = {
    Regular:     blue,
    Casual:      violet,
    'Job Order': cyan,
};

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
    Draft:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    Posted: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    Locked: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fPeso = (v: number) =>
    '₱' + (v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
   SHARED UI COMPONENTS
══════════════════════════════════════════ */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: 'var(--card)', borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        padding: 20, ...style,
    }}>
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
    <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: 99,
        fontSize: 11, fontWeight: 600,
        color, background: bg,
        border: `1px solid ${color}22`,
    }}>
        {label}
    </span>
);

function statusBadge(s: string) {
    const m = STATUS_CFG[s] ?? STATUS_CFG['Draft'];
    return <Badge label={s} color={m.color} bg={m.bg} />;
}

/* ══════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════ */
function FilterBar({
    dept, setDept, empType, setEmpType,
    dateFrom, setDateFrom, dateTo, setDateTo,
    departments, onRefresh,
}: {
    dept: string;        setDept: (v: string) => void;
    empType: string;     setEmpType: (v: string) => void;
    dateFrom: string;    setDateFrom: (v: string) => void;
    dateTo: string;      setDateTo: (v: string) => void;
    departments: string[];
    onRefresh: () => void;
}) {
    const sel: React.CSSProperties = {
        border: '1px solid var(--border)', borderRadius: 12,
        padding: '7px 12px', fontSize: 11,
        color: 'var(--foreground)', background: 'var(--card)',
        cursor: 'pointer', outline: 'none',
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {/* Department filter */}
            <select value={dept} onChange={e => setDept(e.target.value)} style={sel}>
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Employment type filter */}
            <select value={empType} onChange={e => setEmpType(e.target.value)} style={sel}>
                <option value="All">All Types</option>
                {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Date range — triggers server reload on Refresh */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '6px 12px', background: 'var(--card)',
            }}>
                <Calendar size={13} className="text-muted-foreground" />
                <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>–</span>
                <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: 11, color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
                />
            </div>

            {/* Action buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                    onClick={onRefresh}
                    style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 11, cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                    <RefreshCw size={12} /> Refresh
                </button>
                <button
                    onClick={() => window.print()}
                    style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 11, cursor: 'pointer', color: 'var(--foreground)' }}
                >
                    🖨 Print
                </button>
                <button style={{ padding: '7px 14px', borderRadius: 12, border: 'none', background: 'var(--foreground)', color: 'var(--background)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ⬇ Export
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   1. KPI STRIP
══════════════════════════════════════════ */
function KpiStrip({
    totalGross, totalDeductions, totalNet,
    employeeCount, nextPayrollDate, nextPayrollDateFull,
}: {
    totalGross: number; totalDeductions: number; totalNet: number;
    employeeCount: number; nextPayrollDate: string; nextPayrollDateFull: string;
}) {
    const kpis = [
        { label: 'Total Gross Payroll', value: fK(totalGross),       description: 'Current period total',             icon: <Banknote     className="size-4 m-1" /> },
        { label: 'No. of Employees',    value: String(employeeCount), description: 'Active this period',               icon: <Users        className="size-4 m-1" /> },
        { label: 'Next Payroll Date',   value: nextPayrollDate,       description: nextPayrollDateFull,                icon: <CalendarDays className="size-4 m-1" /> },
        { label: 'Total Deductions',    value: fK(totalDeductions),   description: 'GSIS, PhilHealth, Pag-IBIG & Tax', icon: <Minus        className="size-4 m-1" /> },
        { label: 'Total Net Pay',       value: fK(totalNet),          description: 'Take-home this period',            icon: <CircleCheck  className="size-4 m-1" /> },
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
   2. PAYROLL BY EMPLOYMENT TYPE
══════════════════════════════════════════ */
function PayrollByType({ records }: { records: PayrollRecord[] }) {
    const data = EMP_TYPES.map(t => {
        const grp  = records.filter(r => r.type === t);
        const gross = grp.reduce((s, r) => s + r.grossPay, 0);
        const ded   = grp.reduce((s, r) => s + r.gsis + r.philhealth + r.pagibig + r.withholding + r.otherDeductions, 0);
        return { type: t, gross, net: gross - ded, deductions: ded, count: grp.length, color: TYPE_COLORS[t] ?? slate };
    });

    const totalGross = data.reduce((s, d) => s + d.gross, 0) || 1;

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
function MonthlyTrend({ data }: { data: MonthlyTrendItem[] }) {
    const sub = data.length >= 2
        ? `${data[0].month} – ${data[data.length - 1].month}`
        : 'Monthly breakdown';

    return (
        <Card>
            <SH title="Monthly Payroll Trend" sub={sub} />
            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data}>
                    <defs>
                        <linearGradient id="grossG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={blue}   stopOpacity={0.15} />
                            <stop offset="100%" stopColor={blue}   stopOpacity={0} />
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
                    <Area type="monotone" dataKey="gross"      fill="url(#grossG)" stroke={blue}    strokeWidth={2.5} dot={{ fill: blue,    r: 3, strokeWidth: 0 }} name="Gross Pay"  />
                    <Area type="monotone" dataKey="net"        fill="url(#netG)"   stroke={emerald} strokeWidth={2.5} dot={{ fill: emerald, r: 3, strokeWidth: 0 }} name="Net Pay"   />
                    <Bar  dataKey="deductions" fill={red} opacity={0.4} radius={[3,3,0,0]} name="Deductions" />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══════════════════════════════════════════
   4. UPCOMING PAYROLL FORECAST
══════════════════════════════════════════ */
function PayrollForecast({ data }: { data: ForecastItem[] }) {
    return (
        <Card>
            <SH title="Upcoming Payroll Forecast" sub="Next periods vs previous" />
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={54} tickFormatter={v => fK(v)} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => fPeso(v)} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="forecast" fill={violet} radius={[4,4,0,0]} name="Forecast" />
                    <Bar dataKey="previous" fill={slate}  radius={[4,4,0,0]} name="Previous" opacity={0.5} />
                </BarChart>
            </ResponsiveContainer>
            {data.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.length, 4)}, 1fr)`, gap: 10, marginTop: 14 }}>
                    {data.map(f => (
                        <div key={f.period} style={{ background: 'var(--muted)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 }}>{f.period}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: violet }}>{fK(f.forecast)}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                                {f.change > 0
                                    ? <span style={{ color: red }}>↑ {fK(f.change)}</span>
                                    : <span style={{ color: emerald }}>↓ {fK(Math.abs(f.change))}</span>
                                } vs prev
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
    const total       = (gsis + philhealth + pagibig + withholding) || 1;

    const items = [
        { label: 'GSIS',            value: gsis,        color: blue,    bg: '#eff6ff', pct: (gsis/total)*100,        icon: <Building2   size={20} color={blue}    /> },
        { label: 'PhilHealth',      value: philhealth,  color: emerald, bg: '#f0fdf4', pct: (philhealth/total)*100,  icon: <HeartPulse  size={20} color={emerald} /> },
        { label: 'Pag-IBIG',        value: pagibig,     color: amber,   bg: '#fffbeb', pct: (pagibig/total)*100,     icon: <Home        size={20} color={amber}   /> },
        { label: 'Withholding Tax', value: withholding, color: red,     bg: '#fef2f2', pct: (withholding/total)*100, icon: <ReceiptText size={20} color={red}     /> },
    ];

    const chartData = items.map(i => ({ name: i.label, Amount: i.value }));

    return (
        <Card>
            <SH title="Government Remittances" sub="GSIS · PhilHealth · Pag-IBIG · Withholding Tax" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {items.map(it => (
                    <div key={it.label} style={{ background: it.bg, border: `1px solid ${it.color}22`, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ marginBottom: 6 }}>{it.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: it.color }}>{fK(it.value)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{it.label}</div>
                        <div style={{ marginTop: 8, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${it.pct}%`, height: '100%', background: it.color, borderRadius: 3 }} />
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--muted)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Total Remittances</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--foreground)' }}>{fPeso(total === 1 ? 0 : total)}</span>
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
   6. PAYROLL STATUS REPORT + TABLE
══════════════════════════════════════════ */
const PAYROLL_COLUMNS: DataTableColumnDef<PayrollRecord>[] = [
    {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Emp ID" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold" style={{ color: blue }}>
                {row.getValue('id')}
            </span>
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
        filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
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
        accessorKey: 'netPay',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Net Pay" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold" style={{ color: emerald }}>
                {fPeso(row.getValue('netPay'))}
            </span>
        ),
    },
];

function PayrollStatusReport({
    records, departments,
}: {
    records: PayrollRecord[];
    departments: string[];
}) {
    const total = records.length;

    const exportCSV = () => {
        const cols: (keyof PayrollRecord)[] = [
            'id','name','department','type','status',
            'basicPay','allowance','gsis','philhealth','pagibig','withholding','otherDeductions','netPay',
        ];
        const rows = [
            cols.join(','),
            ...records.map(r => cols.map(c => `"${r[c]}"`).join(',')),
        ];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'payroll-status.csv';
        a.click();
    };

    return (
        <Card>
            <SH title="Payroll Status Report" sub={`${total} total records`} />

            {/* Status summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {PAY_STATUSES.map(s => {
                    const cfg   = STATUS_CFG[s];
                    const count = records.filter(r => r.status === s).length;
                    const gross = records
                        .filter(r => r.status === s)
                        .reduce((sum, r) => sum + r.grossPay, 0);
                    return (
                        <div key={s} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{s}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>{fK(gross)}</div>
                            <div style={{ marginTop: 6, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, height: '100%', background: cfg.color, borderRadius: 2 }} />
                            </div>
                        </div>
                    );
                })}
            </div>

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
                        options: departments.map(d => ({ label: d, value: d })),
                    },
                    {
                        columnId: 'type',
                        title: 'Type',
                        options: EMP_TYPES.map(t => ({ label: t, value: t })),
                    },
                ]}
                footerRow={(rows) => {
                    const recs = rows.map(r => r.original);
                    return [
                        <td key="lbl"   colSpan={4} className="px-4 py-2 text-sm font-semibold text-foreground">
                            Totals ({rows.length} employees)
                        </td>,
                        <td key="basic" className="px-4 py-2 font-mono text-xs font-bold">{fPeso(recs.reduce((s,r) => s+r.basicPay,    0))}</td>,
                        <td key="allow" className="px-4 py-2 font-mono text-xs font-bold text-muted-foreground">{fPeso(recs.reduce((s,r) => s+r.allowance,   0))}</td>,
                        <td key="gsis"  className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.gsis,        0))}</td>,
                        <td key="ph"    className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.philhealth,   0))}</td>,
                        <td key="pag"   className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.pagibig,      0))}</td>,
                        <td key="wtax"  className="px-4 py-2 font-mono text-xs font-bold" style={{ color: red }}>{fPeso(recs.reduce((s,r) => s+r.withholding,  0))}</td>,
                        <td key="net"   className="px-4 py-2 font-mono text-xs font-bold" style={{ color: emerald }}>{fPeso(recs.reduce((s,r) => s+r.netPay,   0))}</td>,
                    ];
                }}
            />
        </Card>
    );
}

/* ══════════════════════════════════════════
   PAGE EXPORT
══════════════════════════════════════════ */
export default function Index({
    payrollRecords,
    totalGross,
    totalDeductions,
    totalNet,
    employeeCount,
    nextPayrollDate,
    nextPayrollDateFull,
    monthlyTrend,
    forecast,
    departments,
    filters,
}: Props) {
    // Client-side filter state (dept + type — instant, no server round-trip)
    const [dept,     setDept]     = useState('All');
    const [empType,  setEmpType]  = useState('All');

    // Date range state — only applied on Refresh (server reload)
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo,   setDateTo]   = useState(filters.date_to);

    const date = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });

    // Client-side filtering by dept + type
    const filtered = useMemo(() => {
        let r = payrollRecords;
        if (dept    !== 'All') r = r.filter(e => e.department === dept);
        if (empType !== 'All') r = r.filter(e => e.type       === empType);
        return r;
    }, [dept, empType, payrollRecords]);

    // Refresh button: reload page with new date range from server
    const handleRefresh = () => {
        router.get(
            route('reports_and_analytics.payroll-report.index'),
            { date_from: dateFrom, date_to: dateTo },
            { preserveState: false, replace: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Reports" />

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
                    departments={departments}
                    onRefresh={handleRefresh}
                />

                {/* KPI cards — server-computed totals, always accurate */}
                <KpiStrip
                    totalGross={totalGross}
                    totalDeductions={totalDeductions}
                    totalNet={totalNet}
                    employeeCount={employeeCount}
                    nextPayrollDate={nextPayrollDate}
                    nextPayrollDateFull={nextPayrollDateFull}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <MonthlyTrend data={monthlyTrend} />
                    <PayrollForecast data={forecast} />
                </div>

                <PayrollByType records={filtered} />
                <GovtRemittances records={filtered} />
                <PayrollStatusReport records={filtered} departments={departments} />

            </div>
        </AppLayout>    
    );
}