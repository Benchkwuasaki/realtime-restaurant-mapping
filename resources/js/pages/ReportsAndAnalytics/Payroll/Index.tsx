import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState, useMemo, useEffect } from 'react';

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
const violet  = '#8b5cf6';
const cyan    = '#06b6d4';
const rose    = '#f43f5e';
const indigo  = '#6366f1';
const slate   = '#64748b';

/* TYPES */
interface Employee {
    id: string;
    name: string;
    department: string;
    position: string;
    type: string;
    status: string;
    dateHired: string;
    salaryGrade: string;
    age: number;
    gender: string;
    education: string;
    barangay: string;
    municipality: string;
}

/* MOCK DATA */
const DEPARTMENTS = ['Admin','Operations','Finance','HR','IT','Security','Engineering','Legal'];
const POSITIONS   = ['Manager','Supervisor','Officer','Specialist','Analyst','Technician','Clerk','Director'];
const EMP_TYPES   = ['Regular','Casual','Job Order'];
const STATUSES    = ['Active','On Leave','Suspended','Inactive'];
const GENDERS     = ['Male','Female'];
const EDUC_LEVELS = ["High School","Vocational","Bachelor's","Master's","Doctorate"];
const DEPT_COLORS = [blue, emerald, amber, violet, cyan, rose, indigo, slate];
const TYPE_COLORS: Record<string, string> = { Regular: blue, Casual: violet, 'Job Order': cyan };
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Active:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '●' },
    'On Leave': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '◐' },
    Suspended:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '⊗' },
    Inactive:   { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', icon: '○' },
};

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

const EMPLOYEES: Employee[] = Array.from({ length: 120 }, (_, i) => {
    const hired = new Date(2015 + randInt(0, 9), randInt(0, 11), randInt(1, 28));
    const names = [
        'Maria Santos','Juan dela Cruz','Ana Reyes','Pedro Garcia','Rosa Mendoza',
        'Carlos Bautista','Elena Cruz','Miguel Torres','Luz Villanueva','Ramon Aquino',
        'Maricel Flores','Antonio Ramos','Josephine Castillo','Eduardo Morales','Cristina Lim',
        'Roberto Chan','Marilou Tan','Fernando Uy','Gloria Sy','Rodrigo Go',
    ];
    return {
        id:           `EMP-${String(i + 1).padStart(4, '0')}`,
        name:         names[i % 20] + (i >= 20 ? ` ${Math.floor(i / 20) + 1}` : ''),
        department:   rand(DEPARTMENTS),
        position:     rand(POSITIONS),
        type:         rand(EMP_TYPES),
        status:       Math.random() < 0.72 ? 'Active' : Math.random() < 0.6 ? 'On Leave' : Math.random() < 0.5 ? 'Suspended' : 'Inactive',
        dateHired:    hired.toISOString().split('T')[0],
        salaryGrade:  `SG-${randInt(1, 24)}`,
        age:          randInt(22, 58),
        gender:       rand(GENDERS),
        education:    rand(EDUC_LEVELS),
        barangay:     rand(['Poblacion','Sudapin','Ilian','Manongol','Marbel','Buena Vida','Katipunan','Magsaysay']),
        municipality: rand(['Kidapawan','Makilala','Magpet','Matalam']),
    };
});

/* ── FILTER STATE ── */
interface Filters { dept: string; type: string; status: string; }
const EMPTY: Filters = { dept: '', type: '', status: '' };

/* ── SHARED UI (unchanged visuals) ── */
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
    const m = STATUS_CFG[s] ?? STATUS_CFG['Inactive'];
    return <Badge label={s} color={m.color} bg={m.bg} />;
}

function typeBadge(t: string) {
    const color = TYPE_COLORS[t] ?? slate;
    const bgMap: Record<string, string> = { Regular: '#eff6ff', Casual: '#f5f3ff', 'Job Order': '#ecfeff' };
    return <Badge label={t} color={color} bg={bgMap[t] ?? '#f1f5f9'} />;
}

/* ── ACTIVE FILTER CHIPS ── */
function ActiveFilters({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
    const chips = [
        filters.status && { key: 'status', label: filters.status, color: STATUS_CFG[filters.status]?.color ?? slate },
        filters.type   && { key: 'type',   label: filters.type,   color: TYPE_COLORS[filters.type] ?? slate },
        filters.dept   && { key: 'dept',   label: filters.dept,   color: DEPT_COLORS[DEPARTMENTS.indexOf(filters.dept)] ?? slate },
    ].filter(Boolean) as { key: keyof Filters; label: string; color: string }[];

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
            <button onClick={() => setFilters(EMPTY)}
                style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: rose, background: `${rose}10`, border: `1px solid ${rose}25`, cursor: 'pointer' }}>
                Clear all
            </button>
        </div>
    );
}

/* ── EMPLOYEE DETAIL DRAWER ── */
function EmployeeDrawer({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    if (!employee) return null;
    const cfg   = STATUS_CFG[employee.status] ?? STATUS_CFG['Inactive'];
    const deptColor = DEPT_COLORS[DEPARTMENTS.indexOf(employee.department) % DEPT_COLORS.length];

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 998, backdropFilter: 'blur(2px)' }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
                background: 'var(--card)', borderLeft: '1px solid var(--border)',
                boxShadow: '-4px 0 24px rgba(0,0,0,.12)', zIndex: 999,
                display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
                animation: 'drawerIn .22s ease',
            }}>
                <style>{`@keyframes drawerIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

                {/* Header */}
                <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: deptColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'var(--primary-foreground)', flexShrink: 0 }}>
                        {employee.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--foreground)' }}>{employee.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{employee.position} · {employee.department}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                            {statusBadge(employee.status)}
                            {typeBadge(employee.type)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'var(--muted)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: 'var(--muted-foreground)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {/* Details */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
                    {[
                        { label: 'Employee ID',   value: employee.id,           mono: true },
                        { label: 'Salary Grade',  value: employee.salaryGrade   },
                        { label: 'Date Hired',    value: employee.dateHired     },
                        { label: 'Age',           value: `${employee.age} yrs`  },
                        { label: 'Gender',        value: employee.gender        },
                        { label: 'Education',     value: employee.education     },
                        { label: 'Municipality',  value: employee.municipality  },
                        { label: 'Barangay',      value: employee.barangay      },
                    ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>{r.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', fontFamily: r.mono ? 'var(--font-mono)' : undefined }}>{r.value}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: 9, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                    <button style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', background: 'var(--foreground)', color: 'var(--background)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit Profile</button>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════
   1. KPI STRIP — clickable status filter
══════════════════════════════════════════ */
function KpiStrip({ employees, filters, setFilters }: { employees: Employee[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const total    = EMPLOYEES.length;
    const active   = EMPLOYEES.filter(e => e.status === 'Active').length;
    const inactive = EMPLOYEES.filter(e => e.status === 'Inactive').length;
    const onLeave  = EMPLOYEES.filter(e => e.status === 'On Leave').length;

    const kpis = [
        { label: 'Total Employees', value: total,    accent: blue,    bg: '#eff6ff', icon: '👥', statusFilter: '' },
        { label: 'Active',          value: active,   accent: emerald, bg: '#f0fdf4', icon: '✅', statusFilter: 'Active' },
        { label: 'Inactive',        value: inactive, accent: slate,   bg: '#f1f5f9', icon: '⏸', statusFilter: 'Inactive' },
        { label: 'On Leave',        value: onLeave,  accent: amber,   bg: '#fffbeb', icon: '🏖', statusFilter: 'On Leave' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {kpis.map(k => {
                const isActive = k.statusFilter && filters.status === k.statusFilter;
                const clickable = !!k.statusFilter;
                return (
                    <div key={k.label}
                        onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.statusFilter ? '' : k.statusFilter })}
                        style={{
                            background: 'var(--card)', borderRadius: 16,
                            border: `1px solid ${isActive ? k.accent : 'var(--border)'}`,
                            borderLeft: `4px solid ${k.accent}`, padding: 16,
                            boxShadow: isActive ? `0 0 0 3px ${k.accent}22, 0 1px 4px rgba(0,0,0,.06)` : '0 1px 4px rgba(0,0,0,.06)',
                            cursor: clickable ? 'pointer' : 'default',
                            transition: 'all .15s',
                            transform: isActive ? 'translateY(-1px)' : 'none',
                        }}
                        onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { if (clickable) (e.currentTarget as HTMLDivElement).style.transform = isActive ? 'translateY(-1px)' : 'none'; }}
                    >
                        <div style={{ background: k.bg, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 16 }}>
                            {k.icon}
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--foreground)', lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{k.label}</div>
                        {clickable && (
                            <div style={{ fontSize: 10, color: k.accent, fontWeight: 700, marginTop: 3 }}>
                                {isActive ? '✓ Filtering' : 'Click to filter'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════
   2. DEMOGRAPHICS — unchanged layout, reacts to filters
══════════════════════════════════════════ */
function Demographics({ employees }: { employees: Employee[] }) {
    const ageBuckets = [
        { label: '20–29', min: 20, max: 29 },
        { label: '30–39', min: 30, max: 39 },
        { label: '40–49', min: 40, max: 49 },
        { label: '50+',   min: 50, max: 99 },
    ].map(b => ({ ...b, count: employees.filter(e => e.age >= b.min && e.age <= b.max).length }));

    const genderCounts = GENDERS.map(g => ({ label: g, count: employees.filter(e => e.gender === g).length }));
    const educCounts   = EDUC_LEVELS.map(l => ({ label: l, count: employees.filter(e => e.education === l).length }));
    const maxEduc = Math.max(...educCounts.map(e => e.count), 1);
    const maxAge  = Math.max(...ageBuckets.map(e => e.count), 1);
    const total   = employees.length;
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
                            <div style={{ height: 18, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${(b.count / maxAge) * 100}%`, height: '100%', background: [blue, indigo, violet, rose][i], borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 6, transition: 'width .4s ease' }} />
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
                                <span style={{ fontSize: 12, fontWeight: 700, color: GENDER_COLORS[g.label] }}>{g.count} ({total ? ((g.count / total) * 100).toFixed(1) : 0}%)</span>
                            </div>
                            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
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
                            <div key={e.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--foreground)' }}>{e.count}</span>
                                <div style={{ width: '100%', background: [emerald, cyan, blue, violet, amber][i], borderRadius: '4px 4px 0 0', height: `${(e.count / maxEduc) * 112}px`, transition: 'height .4s ease' }} />
                                <span style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   3. TYPE DISTRIBUTION — clickable
══════════════════════════════════════════ */
function TypeDistribution({ employees, filters, setFilters }: { employees: Employee[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hov, setHov] = useState<string | null>(null);
    const counts = EMP_TYPES.map(t => ({ label: t, count: employees.filter(e => e.type === t).length, color: TYPE_COLORS[t] }));
    const total  = employees.length;

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
            <div style={{ display: 'flex', height: 14, borderRadius: 8, overflow: 'hidden', gap: 1 }}>
                {counts.map(c => (
                    <div key={c.label}
                        onClick={() => toggle(c.label)}
                        style={{ width: `${total ? (c.count / total) * 100 : 0}%`, background: c.color, transition: 'width .4s, opacity .15s', cursor: 'pointer', opacity: filters.type && filters.type !== c.label ? 0.3 : 1 }}
                        title={`${c.label}: ${c.count}`} />
                ))}
            </div>
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
   4. DEPARTMENT DISTRIBUTION — clickable bars
══════════════════════════════════════════ */
function DeptDistribution({ employees, filters, setFilters }: { employees: Employee[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const [hov, setHov] = useState<string | null>(null);

    const counts = DEPARTMENTS.map((d, i) => ({
        label: d,
        count: employees.filter(e => e.department === d).length,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
    })).sort((a, b) => b.count - a.count);
    const max = Math.max(...counts.map(c => c.count), 1);

    const toggle = (label: string) => setFilters({ ...filters, dept: filters.dept === label ? '' : label });

    return (
        <Card>
            <SH title="Department Distribution" sub="Click a department to filter" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {counts.map(d => {
                    const isActive = filters.dept === d.label;
                    return (
                        <div key={d.label}
                            onClick={() => toggle(d.label)}
                            onMouseEnter={() => setHov(d.label)}
                            onMouseLeave={() => setHov(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                opacity: filters.dept && !isActive ? 0.4 : 1, transition: 'opacity .15s' }}>
                            <div style={{ width: 90, fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? d.color : 'var(--foreground)', whiteSpace: 'nowrap', transition: 'color .15s' }}>{d.label}</div>
                            <div style={{ flex: 1, height: 22, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(d.count / max) * 100}%`, height: '100%',
                                    background: d.color, borderRadius: 6,
                                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                                    transition: 'width .4s',
                                    opacity: hov && hov !== d.label && !isActive ? 0.6 : 1,
                                    outline: isActive ? `2px solid ${d.color}` : 'none',
                                    outlineOffset: 1,
                                }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.count}</span>
                                </div>
                            </div>
                            <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: d.color, textAlign: 'right' }}>{d.count}</div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   5. STATUS REPORT — clickable cards
══════════════════════════════════════════ */
function StatusReport({ employees, filters, setFilters }: { employees: Employee[]; filters: Filters; setFilters: (f: Filters) => void }) {
    const total = EMPLOYEES.length; // always show vs full total

    return (
        <Card>
            <SH title="Employee Status Report" sub="Click a status to filter" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {STATUSES.map(s => {
                    const cfg      = STATUS_CFG[s];
                    const count    = EMPLOYEES.filter(e => e.status === s).length;
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
   6. MASTERLIST TABLE — receives filters, row click opens drawer
══════════════════════════════════════════ */
function MasterlistTable({ employees, onSelect }: { employees: Employee[]; onSelect: (e: Employee) => void }) {
    const [search,  setSearch]  = useState('');
    const [page,    setPage]    = useState(1);
    const [sortKey, setSortKey] = useState<keyof Employee>('id');
    const [sortDir, setSortDir] = useState<1 | -1>(1);
    const PER_PAGE = 15;

    // reset page when employees (from global filter) change
    useEffect(() => { setPage(1); }, [employees]);

    const filtered = useMemo(() => {
        let r = employees;
        if (search) r = r.filter(e => [e.id, e.name, e.department, e.position].join(' ').toLowerCase().includes(search.toLowerCase()));
        return [...r].sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            return typeof av === 'number' ? (av - (bv as number)) * sortDir : String(av).localeCompare(String(bv)) * sortDir;
        });
    }, [employees, search, sortKey, sortDir]);

    const pages   = Math.ceil(filtered.length / PER_PAGE);
    const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const sort = (k: keyof Employee) => {
        if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1);
        else { setSortKey(k); setSortDir(1); }
        setPage(1);
    };

    const exportCSV = () => {
        const cols: (keyof Employee)[] = ['id','name','department','position','type','status','dateHired','salaryGrade'];
        const rows = [cols.join(','), ...filtered.map(e => cols.map(c => `"${e[c]}"`).join(','))];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
        a.download = 'employee-masterlist.csv';
        a.click();
    };

    const selStyle: React.CSSProperties = {
        border: '1px solid var(--border)', borderRadius: 10, padding: '7px 10px',
        fontSize: 11, color: 'var(--foreground)', background: 'var(--card)', cursor: 'pointer', outline: 'none',
    };

    const TH = ({ k, label, w }: { k: keyof Employee; label: string; w?: number }) => (
        <th onClick={() => sort(k)}
            style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '2px solid var(--border)', textAlign: 'left', width: w, background: sortKey === k ? `${blue}06` : undefined }}>
            {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.25 }}>↕</span>}
        </th>
    );

    return (
        <Card>
            <SH title="Employee Masterlist" sub={`${filtered.length} of ${EMPLOYEES.length} employees · click a row for details`} />

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    placeholder="🔍 Search name, ID, department…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: 200, border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px', fontSize: 11, color: 'var(--foreground)', background: 'var(--card)', outline: 'none' }}
                />
                <button onClick={exportCSV} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'var(--foreground)', color: 'var(--background)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ⬇ Export CSV
                </button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ background: 'var(--muted)' }}>
                        <tr>
                            <TH k="id"          label="Emp ID"       w={90}  />
                            <TH k="name"        label="Name"         w={160} />
                            <TH k="department"  label="Department"   w={110} />
                            <TH k="position"    label="Position"     w={110} />
                            <TH k="type"        label="Type"         w={100} />
                            <TH k="status"      label="Status"       w={100} />
                            <TH k="dateHired"   label="Date Hired"   w={100} />
                            <TH k="salaryGrade" label="Salary Grade" w={100} />
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((e, i) => (
                            // <tr key={e.id}
                            //     onClick={() => onSelect(e)}
                            //     style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--muted)', cursor: 'pointer', transition: 'background .1s' }}
                            //     onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--accent)')}
                            //     onMouseLeave={ev => (ev.currentTarget.style.background = i % 2 === 0 ? 'var(--card)' : 'var(--muted)')}>
                            <tr>
                                <td style={{ padding: '9px 12px', fontWeight: 700, color: blue, fontFamily: 'monospace', fontSize: 11 }}>{e.id}</td>
                                <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--foreground)' }}>{e.name}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--foreground)' }}>{e.department}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--muted-foreground)' }}>{e.position}</td>
                                <td style={{ padding: '9px 12px' }}>{typeBadge(e.type)}</td>
                                <td style={{ padding: '9px 12px' }}>{statusBadge(e.status)}</td>
                                <td style={{ padding: '9px 12px', color: 'var(--muted-foreground)', fontSize: 11 }}>{e.dateHired}</td>
                                <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--foreground)' }}>{e.salaryGrade}</td>
                            </tr>
                        ))}
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>No employees match the current filters</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                        ← Prev
                    </button>
                    {Array.from({ length: Math.min(5, pages) }, (_, idx) => {
                        const p = Math.max(1, Math.min(page - 2, pages - 4)) + idx;
                        return (
                            <button key={p} onClick={() => setPage(p)}
                                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: page === p ? 'var(--foreground)' : 'var(--card)', color: page === p ? 'var(--background)' : 'var(--foreground)', fontSize: 11, cursor: 'pointer', fontWeight: page === p ? 700 : 400 }}>
                                {p}
                            </button>
                        );
                    })}
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 11, cursor: page === pages ? 'default' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>
                        Next →
                    </button>
                </div>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   PAGE EXPORT
══════════════════════════════════════════ */
export default function Index() {
    const [filters,  setFilters]  = useState<Filters>(EMPTY);
    const [selected, setSelected] = useState<Employee | null>(null);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const filtered = useMemo(() => {
        let r = EMPLOYEES;
        if (filters.status) r = r.filter(e => e.status === filters.status);
        if (filters.type)   r = r.filter(e => e.type   === filters.type);
        if (filters.dept)   r = r.filter(e => e.department === filters.dept);
        return r;
    }, [filters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Overview" />

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                            Payroll Reports & Analytics
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, marginBottom: 0 }}>
                            Workforce Analytics · MKWD — as of {date}
                        </p>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>● Live</span>
                </div>

                {/* Active filter chips */}
                <ActiveFilters filters={filters} setFilters={setFilters} />

                <KpiStrip      employees={filtered} filters={filters} setFilters={setFilters} />
                <Demographics  employees={filtered} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <TypeDistribution employees={filtered} filters={filters} setFilters={setFilters} />
                    <StatusReport     employees={filtered} filters={filters} setFilters={setFilters} />
                </div>

                <DeptDistribution employees={filtered} filters={filters} setFilters={setFilters} />
                <MasterlistTable  employees={filtered} onSelect={setSelected} />

            </div>

            <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} />
        </AppLayout>
    );
}
