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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Government Reports and Analytics',
        href: route('reports_and_analytics.government-report.index'),
    },

];

/* ── colour tokens ── */
const blue   = '#3b82f6';
const green  = '#10b981';
const violet = '#8b5cf6';
const amber  = '#f59e0b';
const indigo = '#6366f1';

/* ── shared UI ── */
const TS = { borderRadius: 8, border: '1px solid var(--border)', fontSize: 11, padding: '6px 12px', background: 'var(--card)' };

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: 20, ...style }}>
        {children}
    </div>
);

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

/* ── summary data ── */
const summaryKpis = [
    { label: 'Total GSIS Contributions',       value: '₱842,400',   accent: blue,   bg: '#eff6ff' },
    { label: 'Total PhilHealth Contributions', value: '₱124,800',   accent: green,  bg: '#f0fdf4' },
    { label: 'Total Pag-IBIG Contributions',   value: '₱80,000',    accent: violet, bg: '#f5f3ff' },
    { label: 'Total Withholding Tax',          value: '₱215,600',   accent: amber,  bg: '#fffbeb' },
    { label: 'Total Government Remittance',    value: '₱1,262,800', accent: indigo, bg: '#eef2ff' },
];

/* ── table data ── */
const gsisData = [
    { name: 'Juan dela Cruz',  gsis: '01-234567-8', employee: 4200,  employer: 6300,  total: 10500, period: 'Mar 2026' },
    { name: 'Maria Santos',    gsis: '01-345678-9', employee: 3800,  employer: 5700,  total: 9500,  period: 'Mar 2026' },
    { name: 'Jose Reyes',      gsis: '01-456789-0', employee: 5000,  employer: 7500,  total: 12500, period: 'Mar 2026' },
    { name: 'Ana Garcia',      gsis: '01-567890-1', employee: 3200,  employer: 4800,  total: 8000,  period: 'Mar 2026' },
    { name: 'Pedro Bautista',  gsis: '01-678901-2', employee: 4600,  employer: 6900,  total: 11500, period: 'Mar 2026' },
    { name: 'Rosa Mendoza',    gsis: '01-789012-3', employee: 3500,  employer: 5250,  total: 8750,  period: 'Mar 2026' },
];

const philhealthData = [
    { name: 'Juan dela Cruz',  ph: '12-345678901-2', salary: 42000, employee: 525, employer: 525, total: 1050 },
    { name: 'Maria Santos',    ph: '12-456789012-3', salary: 38000, employee: 475, employer: 475, total: 950  },
    { name: 'Jose Reyes',      ph: '12-567890123-4', salary: 50000, employee: 625, employer: 625, total: 1250 },
    { name: 'Ana Garcia',      ph: '12-678901234-5', salary: 32000, employee: 400, employer: 400, total: 800  },
    { name: 'Pedro Bautista',  ph: '12-789012345-6', salary: 46000, employee: 575, employer: 575, total: 1150 },
    { name: 'Rosa Mendoza',    ph: '12-890123456-7', salary: 35000, employee: 437, employer: 437, total: 875  },
];

const pagibigData = [
    { name: 'Juan dela Cruz',  pagibig: '1234-5678-9012', salary: 42000, employee: 200, employer: 200, total: 400 },
    { name: 'Maria Santos',    pagibig: '2345-6789-0123', salary: 38000, employee: 200, employer: 200, total: 400 },
    { name: 'Jose Reyes',      pagibig: '3456-7890-1234', salary: 50000, employee: 200, employer: 200, total: 400 },
    { name: 'Ana Garcia',      pagibig: '4567-8901-2345', salary: 32000, employee: 200, employer: 200, total: 400 },
    { name: 'Pedro Bautista',  pagibig: '5678-9012-3456', salary: 46000, employee: 200, employer: 200, total: 400 },
    { name: 'Rosa Mendoza',    pagibig: '6789-0123-4567', salary: 35000, employee: 200, employer: 200, total: 400 },
];

const birData = [
    { name: 'Juan dela Cruz',  tin: '123-456-789-000', taxable: 38200, tax: 3820, period: 'Mar 2026' },
    { name: 'Maria Santos',    tin: '234-567-890-000', taxable: 34500, tax: 2760, period: 'Mar 2026' },
    { name: 'Jose Reyes',      tin: '345-678-901-000', taxable: 45500, tax: 6825, period: 'Mar 2026' },
    { name: 'Ana Garcia',      tin: '456-789-012-000', taxable: 29000, tax: 1450, period: 'Mar 2026' },
    { name: 'Pedro Bautista',  tin: '567-890-123-000', taxable: 41800, tax: 5225, period: 'Mar 2026' },
    { name: 'Rosa Mendoza',    tin: '678-901-234-000', taxable: 31800, tax: 2385, period: 'Mar 2026' },
];

const remittanceData = [
    { type: 'GSIS',       period: 'Mar 2026', amount: 842400,  due: 'Apr 10, 2026', status: 'Pending' },
    { type: 'PhilHealth', period: 'Mar 2026', amount: 124800,  due: 'Apr 15, 2026', status: 'Pending' },
    { type: 'Pag-IBIG',   period: 'Mar 2026', amount: 80000,   due: 'Apr 15, 2026', status: 'Pending' },
    { type: 'BIR',        period: 'Mar 2026', amount: 215600,  due: 'Apr 10, 2026', status: 'Pending' },
    { type: 'GSIS',       period: 'Feb 2026', amount: 836000,  due: 'Mar 10, 2026', status: 'Paid'    },
    { type: 'PhilHealth', period: 'Feb 2026', amount: 122400,  due: 'Mar 15, 2026', status: 'Paid'    },
    { type: 'Pag-IBIG',   period: 'Feb 2026', amount: 80000,   due: 'Mar 15, 2026', status: 'Paid'    },
    { type: 'BIR',        period: 'Feb 2026', amount: 210200,  due: 'Mar 10, 2026', status: 'Paid'    },
];

const trendData = [
    { month: 'Oct', GSIS: 810000, PhilHealth: 118000, PagIBIG: 80000, BIR: 198000 },
    { month: 'Nov', GSIS: 820000, PhilHealth: 119500, PagIBIG: 80000, BIR: 202000 },
    { month: 'Dec', GSIS: 815000, PhilHealth: 120000, PagIBIG: 80000, BIR: 205000 },
    { month: 'Jan', GSIS: 825000, PhilHealth: 121000, PagIBIG: 80000, BIR: 208000 },
    { month: 'Feb', GSIS: 836000, PhilHealth: 122400, PagIBIG: 80000, BIR: 210200 },
    { month: 'Mar', GSIS: 842400, PhilHealth: 124800, PagIBIG: 80000, BIR: 215600 },
];

const fmt  = (v: number) => `₱${v.toLocaleString()}`;
const fmtK = (v: number) => `₱${(v / 1000).toFixed(0)}K`;

function filterRows(rows: any[], query: string) {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
}

/* ══ Summary KPI Strip ══ */
const KPI_ICONS = [
    <Building2  className="size-4 m-1" />,
    <HeartPulse className="size-4 m-1" />,
    <Home       className="size-4 m-1" />,
    <Receipt    className="size-4 m-1" />,
    <Landmark   className="size-4 m-1" />,
];

function SummaryStrip() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summaryKpis.map((k, i) => (
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
            color:      isPaid ? '#16a34a' : '#b45309',
            border:     `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`,
        }}>
            {isPaid ? '✓ Paid' : '⏳ Pending'}
        </span>
    );
};

/* ══ Monthly Trend Chart ══ */
function MonthlyTrendChart() {
    return (
        <Card>
            <SH title="Monthly Government Remittance Trend" sub="Oct 2025 – Mar 2026 · All contribution types" />
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData}>
                    <defs>
                        {[
                            { id: 'gG', color: blue   },
                            { id: 'pG', color: green  },
                            { id: 'iG', color: violet },
                            { id: 'bG', color: amber  },
                        ].map(({ id, color }) => (
                            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip contentStyle={TS} formatter={(v: any, n: string) => [fmt(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="GSIS"       stroke={blue}   fill="url(#gG)" strokeWidth={2} dot={{ r: 3, fill: blue,   strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="PhilHealth" stroke={green}  fill="url(#pG)" strokeWidth={2} dot={{ r: 3, fill: green,  strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="PagIBIG"    stroke={violet} fill="url(#iG)" strokeWidth={2} dot={{ r: 3, fill: violet, strokeWidth: 0 }} name="Pag-IBIG" />
                    <Area type="monotone" dataKey="BIR"        stroke={amber}  fill="url(#bG)" strokeWidth={2} dot={{ r: 3, fill: amber,  strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}

/* ══ PAGE ══ */
export default function GovernmentContributions() {
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const [gsisSearch,       setGsisSearch]       = useState('');
    const [philhealthSearch, setPhilhealthSearch] = useState('');
    const [pagibigSearch,    setPagibigSearch]    = useState('');
    const [birSearch,        setBirSearch]        = useState('');
    const [remitSearch,      setRemitSearch]      = useState('');

    const filteredGsis       = useMemo(() => filterRows(gsisData,       gsisSearch),       [gsisSearch]);
    const filteredPhilhealth = useMemo(() => filterRows(philhealthData, philhealthSearch), [philhealthSearch]);
    const filteredPagibig    = useMemo(() => filterRows(pagibigData,    pagibigSearch),    [pagibigSearch]);
    const filteredBir        = useMemo(() => filterRows(birData,        birSearch),        [birSearch]);
    const filteredRemit      = useMemo(() => filterRows(remittanceData, remitSearch),      [remitSearch]);

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

                <SummaryStrip />

                {/* GSIS */}
                <Card>
                    <SH title="GSIS Contribution Report" sub="Government Service Insurance System · Mar 2026" />
                    <SearchInput value={gsisSearch} onChange={setGsisSearch} placeholder="Search by name, GSIS number, period…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredGsis}
                        columns={[
                            { key: 'name',     label: 'Employee Name' },
                            { key: 'gsis',     label: 'GSIS Number' },
                            { key: 'employee', label: 'Employee Contribution', render: v => <span style={{ color: '#2563eb', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Contribution', render: v => <span style={{ color: '#7c3aed', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total',    label: 'Total Contribution',    render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                            { key: 'period',   label: 'Payroll Period' },
                        ]}
                    />
                </Card>

                {/* PhilHealth */}
                <Card>
                    <SH title="PhilHealth Contribution Report" sub="Philippine Health Insurance Corporation · Mar 2026" />
                    <SearchInput value={philhealthSearch} onChange={setPhilhealthSearch} placeholder="Search by name, PhilHealth number…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredPhilhealth}
                        columns={[
                            { key: 'name',     label: 'Employee Name' },
                            { key: 'ph',       label: 'PhilHealth Number' },
                            { key: 'salary',   label: 'Monthly Salary',    render: v => fmt(v) },
                            { key: 'employee', label: 'Employee Share',    render: v => <span style={{ color: '#2563eb', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Share',    render: v => <span style={{ color: '#059669', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total',    label: 'Total Contribution',render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                        ]}
                    />
                </Card>

                {/* Pag-IBIG */}
                <Card>
                    <SH title="Pag-IBIG Contribution Report" sub="Home Development Mutual Fund · Mar 2026" />
                    <SearchInput value={pagibigSearch} onChange={setPagibigSearch} placeholder="Search by name, Pag-IBIG number…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredPagibig}
                        columns={[
                            { key: 'name',     label: 'Employee Name' },
                            { key: 'pagibig',  label: 'Pag-IBIG Number' },
                            { key: 'salary',   label: 'Monthly Salary',       render: v => fmt(v) },
                            { key: 'employee', label: 'Employee Contribution', render: v => <span style={{ color: '#2563eb', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'employer', label: 'Employer Contribution', render: v => <span style={{ color: '#7c3aed', fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'total',    label: 'Total Contribution',    render: v => <span style={{ fontWeight: 700 }}>{fmt(v)}</span> },
                        ]}
                    />
                </Card>

                {/* BIR */}
                <Card>
                    <SH title="BIR Withholding Tax Report" sub="Bureau of Internal Revenue · Mar 2026" />
                    <SearchInput value={birSearch} onChange={setBirSearch} placeholder="Search by name, TIN, period…" />
                    <SortableTable
                        sortKey="name"
                        rows={filteredBir}
                        columns={[
                            { key: 'name',    label: 'Employee Name' },
                            { key: 'tin',     label: 'TIN Number' },
                            { key: 'taxable', label: 'Taxable Income',  render: v => fmt(v) },
                            { key: 'tax',     label: 'Withholding Tax', render: v => <span style={{ color: '#b45309', fontWeight: 700 }}>{fmt(v)}</span> },
                            { key: 'period',  label: 'Payroll Period' },
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
                            { key: 'type',   label: 'Contribution Type', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
                            { key: 'period', label: 'Payroll Period' },
                            { key: 'amount', label: 'Amount',            render: v => <span style={{ fontWeight: 600 }}>{fmt(v)}</span> },
                            { key: 'due',    label: 'Due Date' },
                            { key: 'status', label: 'Payment Status',    render: v => <StatusBadge status={v} /> },
                        ]}
                    />
                </Card>

                <MonthlyTrendChart />

            </div>
        </AppLayout>
    );
}