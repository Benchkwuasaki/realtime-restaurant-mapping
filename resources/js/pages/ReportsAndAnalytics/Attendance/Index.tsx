import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, ComposedChart, ReferenceLine,
    ResponsiveContainer, Line,
} from 'recharts';
import { useState, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance Reports and Analytics',
        href: route('reports_and_analytics.attendance-report.index'),
    },
];

/* ── colour tokens ── */
const emerald = '#10b981', amber = '#f59e0b', red = '#ef4444',
      indigo = '#6366f1', cyan = '#06b6d4', rose = '#f43f5e';

/* ── data ── */
const DEPTS   = ['All Departments', 'Admin', 'Operations', 'Finance', 'HR', 'IT', 'Security'];

const weekly = [
    { day: 'Mon', Present: 185, Late: 22, Absent: 18 },
    { day: 'Tue', Present: 198, Late: 14, Absent: 13 },
    { day: 'Wed', Present: 179, Late: 31, Absent: 15 },
    { day: 'Thu', Present: 202, Late: 17, Absent: 6  },
    { day: 'Fri', Present: 174, Late: 28, Absent: 23 },
    { day: 'Sat', Present: 88,  Late: 12, Absent: 5  },
    { day: 'Sun', Present: 40,  Late: 5,  Absent: 2  },
];

const monthly = [
    { week: 'Wk 1', Present: 925, Absent: 65,  Late: 38, Rate: 88.0 },
    { week: 'Wk 2', Present: 960, Absent: 45,  Late: 29, Rate: 91.4 },
    { week: 'Wk 3', Present: 870, Absent: 100, Late: 45, Rate: 82.9 },
    { week: 'Wk 4', Present: 980, Absent: 35,  Late: 22, Rate: 93.3 },
];

const yearly = [
    { m: 'Apr', Rate: 84, Trend: 83   },
    { m: 'May', Rate: 87, Trend: 85   },
    { m: 'Jun', Rate: 82, Trend: 86   },
    { m: 'Jul', Rate: 89, Trend: 87   },
    { m: 'Aug', Rate: 91, Trend: 88   },
    { m: 'Sep', Rate: 88, Trend: 89   },
    { m: 'Oct', Rate: 90, Trend: 89.5 },
    { m: 'Nov', Rate: 86, Trend: 90   },
    { m: 'Dec', Rate: 85, Trend: 90.5 },
    { m: 'Jan', Rate: 92, Trend: 91   },
    { m: 'Feb', Rate: 93, Trend: 91.5 },
    { m: 'Mar', Rate: 91, Trend: 92   },
];

const depts = [
    { dept: 'Admin',      total: 55,  present: 51, late: 3, absent: 1, rate: 92.7, payroll: 312000 },
    { dept: 'Operations', total: 140, present: 126,late: 9, absent: 5, rate: 90.0, payroll: 680000 },
    { dept: 'Finance',    total: 48,  present: 43, late: 4, absent: 1, rate: 89.6, payroll: 298000 },
    { dept: 'HR',         total: 32,  present: 30, late: 2, absent: 0, rate: 93.8, payroll: 201000 },
    { dept: 'IT',         total: 60,  present: 52, late: 6, absent: 2, rate: 86.7, payroll: 395000 },
    { dept: 'Security',   total: 65,  present: 58, late: 4, absent: 3, rate: 89.2, payroll: 292000 },
];

const kpis = [
    { label: 'Total Employees', value: '400', accent: '#3b82f6', bg: '#eff6ff' },
    { label: 'Present Today',   value: '357', accent: '#10b981', bg: '#f0fdf4' },
    { label: 'Late Today',      value: '28',  accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Absent Today',    value: '15',  accent: '#ef4444', bg: '#fef2f2' },
];

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


/* ── KPI strip ── */
function KpiStrip() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {kpis.map(k => (
                <div key={k.label} style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${k.accent}`, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: k.bg, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>📊</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, color: k.up ? '#16a34a' : '#dc2626' }}>
                        {k.up ? '↑' : '↓'} {k.delta}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── filter bar ── */
function FilterBar({ dept, setDept, dateFrom, setDateFrom, dateTo, setDateTo }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <select value={dept} onChange={e => setDept(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '7px 12px', fontSize: 11, color: 'var(--foreground)', background: 'var(--card)', cursor: 'pointer', outline: 'none' }}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
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

/* ── charts ── */
function WeeklyBar() {
    return (
        <Card>
            <SH title="Daily Attendance Breakdown" sub="Present · Late · Absent per day" />
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekly} barGap={3} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TS} cursor={{ fill: 'var(--muted)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="Present" fill={emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Late"    fill={amber}   radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent"  fill={red}     radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

function MonthlyLine() {
    return (
        <Card>
            <SH title="Monthly Attendance Rate" sub="Week-over-week this month" />
            <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={monthly}>
                    <defs>
                        <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={indigo} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={indigo} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="c" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={34} />
                    <YAxis yAxisId="r" orientation="right" domain={[78, 98]} unit="%" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={34} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar yAxisId="c" dataKey="Present" fill={emerald} radius={[3, 3, 0, 0]} opacity={0.35} name="Present" />
                    <Bar yAxisId="c" dataKey="Absent"  fill={red}     radius={[3, 3, 0, 0]} opacity={0.35} name="Absent" />
                    <Area yAxisId="r" type="monotone" dataKey="Rate" fill="url(#rG)" stroke={indigo} strokeWidth={2.5} dot={{ fill: indigo, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} name="Rate %" />
                    <ReferenceLine yAxisId="r" y={90} stroke="var(--border)" strokeDasharray="4 2" />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

function YearlyTrend() {
    return (
        <Card>
            <SH title="1-Year Attendance Rate + Trend" sub="Apr 2024 – Mar 2025" />
            <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={yearly}>
                    <defs>
                        <linearGradient id="yG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={cyan} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={cyan} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[79, 96]} unit="%" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={34} />
                    <Tooltip contentStyle={TS} formatter={(v: any, n: string) => [`${v}%`, n === 'Rate' ? 'Actual' : 'Trend']} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => v === 'Rate' ? 'Actual Rate' : 'Moving Trend'} />
                    <ReferenceLine y={90} stroke="var(--border)" strokeDasharray="4 2" label={{ value: '90% target', position: 'insideTopRight', fontSize: 9, fill: 'var(--muted-foreground)' }} />
                    <Area type="monotone" dataKey="Rate" fill="url(#yG)" stroke={cyan} strokeWidth={2.5} dot={{ fill: cyan, r: 3.5, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Trend" stroke={rose} strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

function DeptTable() {
    const [sort, setSort] = useState({ key: 'rate', dir: -1 });
    const sorted = useMemo(() => [...depts].sort((a: any, b: any) => (a[sort.key] - b[sort.key]) * sort.dir), [sort]);
    const fK = (v: number) => `₱${(v / 1000).toFixed(0)}K`;
    const rateColor = (r: number) => r >= 92 ? '#16a34a' : r >= 88 ? '#d97706' : '#dc2626';
    const rateBg    = (r: number) => r >= 92 ? emerald : r >= 88 ? amber : red;

    const TH = ({ k, label }: { k: string; label: string }) => (
        <th onClick={() => setSort(s => ({ key: k, dir: s.key === k ? -s.dir : -1 }))}
            style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid var(--border)' }}>
            {label} {sort.key === k ? (sort.dir === -1 ? '↓' : '↑') : ''}
        </th>
    );

    return (
        <Card>
            <SH title="Department Breakdown" sub="Click column headers to sort" />
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                            <TH k="dept"    label="Department" />
                            <TH k="total"   label="Total" />
                            <TH k="present" label="Present" />
                            <TH k="late"    label="Late" />
                            <TH k="absent"  label="Absent" />
                            <TH k="rate"    label="Rate %" />
                            <TH k="payroll" label="Payroll" />
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((r: any, i: number) => (
                            <tr key={r.dept}
                                style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--muted/30)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--card)' : 'var(--muted/30)')}>
                                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{r.dept}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--foreground)' }}>{r.total}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#16a34a' }}>{r.present}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#d97706' }}>{r.late}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{r.absent}</td>
                                <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 72, height: 6, background: 'var(--muted)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${r.rate}%`, height: '100%', borderRadius: 4, background: rateBg(r.rate) }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(r.rate) }}>{r.rate}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--foreground)' }}>{fK(r.payroll)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: 'var(--muted)', borderTop: '2px solid var(--border)' }}>
                            {[
                                'TOTAL',
                                depts.reduce((s, r) => s + r.total,   0),
                                <span style={{ color: '#16a34a', fontWeight: 700 }}>{depts.reduce((s, r) => s + r.present, 0)}</span>,
                                <span style={{ color: '#d97706', fontWeight: 700 }}>{depts.reduce((s, r) => s + r.late,    0)}</span>,
                                <span style={{ color: '#dc2626', fontWeight: 700 }}>{depts.reduce((s, r) => s + r.absent,  0)}</span>,
                                '91.2%',
                                fK(depts.reduce((s, r) => s + r.payroll, 0)),
                            ].map((v, i) => (
                                <td key={i} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{v}</td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════════════
   PAGE EXPORT  –  wrapped in AppLayout
══════════════════════════════════════════════════ */
export default function Index() {
    const [period,   setPeriod]   = useState('This Week');
    const [dept,     setDept]     = useState('All Departments');
    const [dateFrom, setDateFrom] = useState('2026-03-01');
    const [dateTo,   setDateTo]   = useState('2026-03-10');
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports and Analytics" />

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                            Attendance Reports & Analytics
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, margin: 0 }}>
                            Attendance · Payroll · Headcount · Performance — as of {date}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>● Live</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Last updated: just now</span>
                    </div>
                </div>

                <FilterBar
                period={period} setPeriod={setPeriod}
                dept={dept} setDept={setDept}
                dateFrom={dateFrom} setDateFrom={setDateFrom}
                dateTo={dateTo} setDateTo={setDateTo}
                />
                <KpiStrip />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <WeeklyBar /><MonthlyLine />
                </div>

                <YearlyTrend />

                <DeptTable />

            </div>
        </AppLayout>
    );
}
