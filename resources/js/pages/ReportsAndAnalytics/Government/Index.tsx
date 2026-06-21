import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import { Building2, HeartPulse, Home, Receipt, Landmark } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    summary: {
        total_gsis: number;
        total_philhealth: number;
        total_pagibig: number;
        total_tax: number;
        total_remittance: number;
    };
    gsisData: any[];
    philhealthData: any[];
    pagibigData: any[];
    birData: any[];
    remittanceData: any[];
    trendData: any[];
    period: string;
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Government Reports and Analytics',
        href: route('reports_and_analytics.government-report.index'),
    },
];

/* ── colour tokens ── */
const blue = '#3b82f6';
const green = '#10b981';
const violet = '#8b5cf6';
const amber = '#f59e0b';
const indigo = '#6366f1';

/* ── shared UI ── */
const TS = { borderRadius: 8, border: '1px solid var(--border)', fontSize: 11, padding: '6px 12px', background: 'var(--card)' };

const SH = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--foreground)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
    </div>
);

const SearchInput = ({ value, onChange, placeholder = 'Search...' }: {
    value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
    <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-foreground)' }}></span>
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--foreground)',
                fontSize: 12, width: 260, outline: 'none',
            }}
        />
        {value && (
            <button onClick={() => onChange('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)' }}>✕</button>
        )}
    </div>
);

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const fmt = (v: number) => `₱${v.toLocaleString()}`;
const fmtK = (v: number) => `₱${(v / 1000).toFixed(0)}K`;

function filterRows(rows: any[], query: string) {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
}

/* ══ Summary KPI Strip ══ */
const KPI_ICONS = [
    <Building2 className="size-4 m-1" />,
    <HeartPulse className="size-4 m-1" />,
    <Home className="size-4 m-1" />,
    <Receipt className="size-4 m-1" />,
    <Landmark className="size-4 m-1" />,
];

function SummaryStrip({ summary }: { summary: Props['summary'] }) {
    const kpis = [
        { label: 'Total GSIS Contributions', value: fmt(summary.total_gsis), accent: blue, bg: '#eff6ff' },
        { label: 'Total PhilHealth Contributions', value: fmt(summary.total_philhealth), accent: green, bg: '#f0fdf4' },
        { label: 'Total Pag-IBIG Contributions', value: fmt(summary.total_pagibig), accent: violet, bg: '#f5f3ff' },
        { label: 'Total Withholding Tax', value: fmt(summary.total_tax), accent: amber, bg: '#fffbeb' },
        { label: 'Total Government Remittance', value: fmt(summary.total_remittance), accent: indigo, bg: '#eef2ff' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k, i) => (
                <StatCard
                    key={k.label}
                    title={k.label}
                    value={k.value}
                    icon={KPI_ICONS[i]}
                />
            ))}
        </div>
    );
}

/* ══ Reusable sortable table ══ */
function SortableTable({ columns, rows, sortKey: defaultKey }: {
    columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[];
    rows: any[];
    sortKey: string;
}) {
    const [sort, setSort] = useState({ key: defaultKey, dir: 1 });
    const sorted = useMemo(() => [...rows].sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key];
        if (typeof av === 'number') return (av - bv) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
    }), [rows, sort]);

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--muted)' }}>
                    <tr>
                        {columns.map(c => (
                            <th key={c.key}
                                onClick={() => setSort(s => ({ key: c.key, dir: s.key === c.key ? -s.dir : 1 }))}
                                style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid var(--border)' }}>
                                {c.label} {sort.key === c.key ? (sort.dir === 1 ? '↑' : '↓') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>
                                No results found.
                            </td>
                        </tr>
                    ) : sorted.map((row, i) => (
                        <tr key={i}
                            style={{ background: i % 2 === 0 ? 'var(--card)' : 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--card)' : 'transparent')}>
                            {columns.map(c => (
                                <td key={c.key} style={{ padding: '10px 14px', fontSize: 13, color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
                                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ══ Status badge ══ */
const StatusBadge = ({ status }: { status: string }) => {
    const isPaid = status === 'Paid';
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: isPaid ? '#f0fdf4' : '#fffbeb',
            color: isPaid ? '#16a34a' : '#b45309',
            border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`,
        }}>
            {isPaid ? '✓ Paid' : '⏳ Pending'}
        </span>
    );
};

/* ══ Monthly Trend Chart ══ */
function MonthlyTrendChart({ data }: { data: any[] }) {
    return (
        <Card>
            <SH title="Monthly Government Remittance Trend" sub="Last 12 periods · All contribution types" />
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data}>
                    <defs>
                        {[
                            { id: 'gG', color: blue },
                            { id: 'pG', color: green },
                            { id: 'iG', color: violet },
                            { id: 'bG', color: amber },
                        ].map(({ id, color }) => (
                            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip contentStyle={TS} formatter={(v: any, n: string) => [fmt(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="GSIS" stroke={blue} fill="url(#gG)" strokeWidth={2} dot={{ r: 3, fill: blue, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="PhilHealth" stroke={green} fill="url(#pG)" strokeWidth={2} dot={{ r: 3, fill: green, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="PagIBIG" stroke={violet} fill="url(#iG)" strokeWidth={2} dot={{ r: 3, fill: violet, strokeWidth: 0 }} name="Pag-IBIG" />
                    <Area type="monotone" dataKey="BIR" stroke={amber} fill="url(#bG)" strokeWidth={2} dot={{ r: 3, fill: amber, strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══ PAGE ══ */
export default function GovernmentContributions({
    summary,
    gsisData,
    philhealthData,
    pagibigData,
    birData,
    remittanceData,
    trendData,
    period,
}: Props) {
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const [gsisSearch, setGsisSearch] = useState('');
    const [philhealthSearch, setPhilhealthSearch] = useState('');
    const [pagibigSearch, setPagibigSearch] = useState('');
    const [birSearch, setBirSearch] = useState('');
    const [remitSearch, setRemitSearch] = useState('');

    const filteredGsis = useMemo(() => filterRows(gsisData, gsisSearch), [gsisData, gsisSearch]);
    const filteredPhilhealth = useMemo(() => filterRows(philhealthData, philhealthSearch), [philhealthData, philhealthSearch]);
    const filteredPagibig = useMemo(() => filterRows(pagibigData, pagibigSearch), [pagibigData, pagibigSearch]);
    const filteredBir = useMemo(() => filterRows(birData, birSearch), [birData, birSearch]);
    const filteredRemit = useMemo(() => filterRows(remittanceData, remitSearch), [remittanceData, remitSearch]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Contributions" />

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                            Government Contributions
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, margin: 0 }}>
                            GSIS · PhilHealth · Pag-IBIG · BIR Withholding Tax — as of {date}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['🖨 Print', '⬇ Export'].map((l, i) => (
                            <button key={l} style={{ padding: '7px 14px', borderRadius: 12, border: i === 0 ? '1px solid var(--border)' : 'none', background: i === 0 ? 'var(--card)' : 'var(--foreground)', color: i === 0 ? 'var(--foreground)' : 'var(--background)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
                        ))}
                    </div>
                </div>

                <SummaryStrip summary={summary} />

                {/* GSIS */}
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <img src="/images/gsis.png" alt="GSIS" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        <SH title="GSIS Contribution Report" sub={`Government Service Insurance System · ${period}`} />
                    </div>
                    <SearchInput value={gsisSearch} onChange={setGsisSearch} placeholder="Search by name, GSIS number, period…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredGsis}
                        columns={[
                            { key: 'name', label: 'Employee Name' },
                            { key: 'gsis', label: 'GSIS Number' },
                            { key: 'employee', label: 'Employee Contribution', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Contribution', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total', label: 'Total Contribution', render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                            { key: 'period', label: 'Payroll Period' },
                        ]}
                    />
                </Card>

                {/* PhilHealth */}
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <img src="/images/philhealth.png" alt="PhilHealth" style={{ width: 48, height: 48, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        <SH title="PhilHealth Contribution Report" sub={`Philippine Health Insurance Corporation · ${period}`} />
                    </div>
                    <SearchInput value={philhealthSearch} onChange={setPhilhealthSearch} placeholder="Search by name, PhilHealth number…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredPhilhealth}
                        columns={[
                            { key: 'name', label: 'Employee Name' },
                            { key: 'ph', label: 'PhilHealth Number' },
                            { key: 'salary', label: 'Monthly Salary', render: v => fmt(v) },
                            { key: 'employee', label: 'Employee Share', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Share', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total', label: 'Total Contribution', render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                        ]}
                    />
                </Card>

                {/* Pag-IBIG */}
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <img src="/images/pagibig.png" alt="Pag-IBIG" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        <SH title="Pag-IBIG Contribution Report" sub={`Home Development Mutual Fund · ${period}`} />
                    </div>
                    <SearchInput value={pagibigSearch} onChange={setPagibigSearch} placeholder="Search by name, Pag-IBIG number…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredPagibig}
                        columns={[
                            { key: 'name', label: 'Employee Name' },
                            { key: 'pagibig', label: 'Pag-IBIG Number' },
                            { key: 'salary', label: 'Monthly Salary', render: v => fmt(v) },
                            { key: 'employee', label: 'Employee Contribution', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Contribution', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total', label: 'Total Contribution', render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                        ]}
                    />
                </Card>

                {/* BIR */}
                <Card>
                    <SH title="BIR Withholding Tax Report" sub={`Bureau of Internal Revenue · ${period}`} />
                    <SearchInput value={birSearch} onChange={setBirSearch} placeholder="Search by name, TIN, period…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredBir}
                        columns={[
                            { key: 'name', label: 'Employee Name' },
                            { key: 'tin', label: 'TIN Number' },
                            { key: 'taxable', label: 'Taxable Income', render: v => fmt(v) },
                            { key: 'tax', label: 'Withholding Tax', render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                            { key: 'period', label: 'Payroll Period' },
                        ]}
                    />
                </Card>

                {/* Remittance Status */}
                <Card>
                    <SH title="Government Remittance Status" sub="Payment tracking by contribution type and period" />
                    <SearchInput value={remitSearch} onChange={setRemitSearch} placeholder="Search by type, period, status…" />
                    <SortableTable
                        sortKey="type"
                        rows={filteredRemit}
                        columns={[
                            { key: 'type', label: 'Contribution Type', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
                            { key: 'period', label: 'Payroll Period' },
                            { key: 'amount', label: 'Amount', render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'due', label: 'Due Date' },
                            { key: 'status', label: 'Payment Status', render: v => <StatusBadge status={v} /> },
                        ]}
                    />
                </Card>

                <MonthlyTrendChart data={trendData} />

            </div>
        </AppLayout>
    );
}