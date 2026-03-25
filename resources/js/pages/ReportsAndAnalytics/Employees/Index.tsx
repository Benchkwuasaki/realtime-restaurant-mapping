import { Head } from '@inertiajs/react';
import { usePage, router } from '@inertiajs/react';
import { Users, UserCheck, UserMinus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { route } from 'ziggy-js';
import Logo from '@/assets/images/logo.svg';
import PhSeal from '@/assets/images/Seal_of_the_Philippines.png';
import CscLogo from '@/assets/images/CSC_logo.jpg';
import { DataTable } from '@/components/shared/data-table/data-table';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { employeeMasterlistColumns, buildEmployeeTableFilters } from './components/employee-masterlist-columns';
import {
    EMP_TYPES, STATUSES, SEX, EDUC_LEVELS,
    DEPT_COLOR_POOL, TYPE_COLORS, STATUS_CFG,
    blue, emerald, amber, violet, cyan, rose, indigo, slate,
    type Employee, type EmployeeReportProps, type EmployeeFilters, EMPTY_FILTERS,
} from './data/employee-report';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees Reports and Analytics',
        href: route('reports_and_analytics.employee-report.index'),
    },
];

/* ── Dept colour ─────────────────────────────────────────────────────────── */
function deptColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_COLOR_POOL[Math.abs(hash) % DEPT_COLOR_POOL.length];
}

/* ── Shared wrappers ─────────────────────────────────────────────────────── */
const Card = ({ children, style = {}, className = '' }: {
    children: React.ReactNode; style?: React.CSSProperties; className?: string
}) => (
    <div className={className} style={{
        background: 'var(--card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        padding: 20,
        ...style,
    }}>
        {children}
    </div>
);

const SH = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: sub ? 3 : 0 }}>
            <div style={{
                width: 3, height: 14, borderRadius: 2,
                background: 'var(--primary)', flexShrink: 0,
            }} />
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
                {title}
            </div>
        </div>
        {sub && (
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2, paddingLeft: 10 }}>
                {sub}
            </div>
        )}
    </div>
);

/* ── Badge helpers ───────────────────────────────────────────────────────── */
const STATUS_VARIANT: Record<string, 'green' | 'secondary'> = { Active: 'green', Inactive: 'secondary' };
const TYPE_VARIANT: Record<string, 'outline' | 'default' | 'secondary'> = { Regular: 'default', Casual: 'secondary', 'Job Order': 'outline' };

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>{status}</Badge>;
}
function TypeBadge({ type }: { type: string }) {
    return <Badge variant={TYPE_VARIANT[type] ?? 'secondary'}>{type}</Badge>;
}

/* ── CSC date format: "01 July 2025" ────────────────────────────────────── */
function formatCscDate(iso: string | null): string {
    if (!iso || iso === '—') return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── CSC name format: "LAST, First Middle Ext" ──────────────────────────── */
function formatCscName(fullName: string): string {
    if (!fullName || fullName === '—') return '—';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].toUpperCase();
    const EXTS = ['JR', 'SR', 'II', 'III', 'IV', 'V'];
    let ext = '';
    if (EXTS.includes(parts[parts.length - 1].toUpperCase())) {
        ext = ` ${parts.pop()}`;
    }
    const last = parts.pop()!;
    const first = parts.join(' ');
    return `${last.toUpperCase()}, ${first}${ext}`.trim();
}

/* ══════════════════════════════════════════
   ACTIVE FILTER CHIPS  (improved)
══════════════════════════════════════════ */
const FILTER_LABELS: Partial<Record<keyof EmployeeFilters, string>> = {
    status: 'Status', type: 'Type', dept: 'Dept',
    sex: 'Sex', ageGroup: 'Age', education: 'Education',
};

function ActiveFilters({ filters, setFilters }: {
    filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void;
}) {
    const chips = [
        filters.status && { key: 'status' as const, label: filters.status, color: STATUS_CFG[filters.status]?.color ?? slate },
        filters.type && { key: 'type' as const, label: filters.type, color: TYPE_COLORS[filters.type] ?? slate },
        filters.dept && { key: 'dept' as const, label: filters.dept, color: deptColor(filters.dept) },
        filters.sex && { key: 'sex' as const, label: filters.sex, color: rose },
        filters.ageGroup && { key: 'ageGroup' as const, label: filters.ageGroup, color: indigo },
        filters.education && { key: 'education' as const, label: filters.education, color: emerald },
    ].filter(Boolean) as { key: keyof EmployeeFilters; label: string; color: string }[];

    if (!chips.length) return null;

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: '',
            borderRadius: 10,
            border: '',
        }}>
            {/* label */}
            <span style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginRight: 2,
            }}>
                Active filters
            </span>

            {/* divider dot */}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />

            {chips.map(c => (
                <button
                    key={c.key}
                    onClick={() => setFilters({ ...filters, [c.key]: '' })}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px 3px 7px',
                        borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        color: c.color,
                        background: `color-mix(in oklch, ${c.color} 12%, var(--card))`,
                        border: `1px solid color-mix(in oklch, ${c.color} 28%, transparent)`,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s, transform 0.1s',
                        lineHeight: 1.4,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    {/* color dot */}
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: c.color, flexShrink: 0,
                        opacity: 0.85,
                    }} />

                    {/* prefix label */}
                    <span style={{ opacity: 0.55, fontWeight: 600, fontSize: 10 }}>
                        {FILTER_LABELS[c.key]}:
                    </span>

                    {/* value */}
                    {c.label}

                    {/* dismiss × */}
                    <span style={{
                        marginLeft: 1, opacity: 0.45, fontSize: 10,
                        fontWeight: 500, lineHeight: 1,
                    }}>✕</span>
                </button>
            ))}

            {/* Clear all */}
            <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                style={{
                    marginLeft: 2,
                    fontSize: 10, fontWeight: 700,
                    color: 'var(--destructive)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4,
                    opacity: 0.8,
                    transition: 'opacity 0.15s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
            >
                Clear all
            </button>
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
            <SheetContent side="right" className="flex flex-col w-full sm:max-w-[340px] p-0 gap-0">
                {!employee ? null : (
                    <>
                        <SheetHeader className="flex-row items-start gap-3 p-5 border-b">
                            <Avatar size="sm">
                                <AvatarImage src={employee.avatarUrl ?? undefined} alt={employee.name} />
                                <AvatarFallback className="text-white text-xs font-black" style={{ background: color }}>
                                    {employee.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-sm font-extrabold leading-tight truncate">{employee.name}</SheetTitle>
                                <SheetDescription className="text-xs mt-0.5">{employee.position} · {employee.department}</SheetDescription>
                                <div className="flex gap-1.5 mt-2">
                                    <StatusBadge status={employee.status} />
                                    <TypeBadge type={employee.type} />
                                </div>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto px-5 py-3">
                            {([
                                { label: 'Work ID', value: employee.workId, mono: true },
                                { label: 'Email', value: employee.email },
                                { label: 'Salary Grade', value: employee.salaryGrade },
                                { label: 'Division', value: employee.division },
                                { label: 'Date Hired', value: employee.dateHired },
                                { label: 'Age', value: `${employee.age} yrs` },
                                { label: 'Sex', value: employee.sex },
                                { label: 'Education', value: employee.education },
                                { label: 'City', value: employee.city },
                                { label: 'State', value: employee.state },
                            ] as { label: string; value: string; mono?: boolean }[]).map((r, i, arr) => (
                                <div key={r.label}>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-semibold text-muted-foreground">{r.label}</span>
                                        <span className={`text-xs font-bold text-foreground ${r.mono ? 'font-mono' : ''}`}>{r.value || '—'}</span>
                                    </div>
                                    {i < arr.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
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
   1. KPI STRIP — 3 col on all sizes
══════════════════════════════════════════ */
function KpiStrip({ totalEmployees, activeEmployees, inactiveEmployees, filters, setFilters }: {
    totalEmployees: number; activeEmployees: number; inactiveEmployees: number;
    filters: EmployeeFilters; setFilters: (f: EmployeeFilters) => void;
}) {
    const kpis = [
        {
            label: 'Total Employees',
            value: totalEmployees,
            description: 'All employees',
            icon: <Users className="size-4 p-0.5 text-primary" />,
            statusFilter: '',
            tooltip: 'Total headcount across all departments and employment types',
        },
        {
            label: 'Active',
            value: activeEmployees,
            description: 'Currently active',
            icon: <UserCheck className="size-4 p-0.5 text-primary" />,
            statusFilter: 'Active',
            tooltip: 'Click to filter by active employees only',
        },
        {
            label: 'Inactive',
            value: inactiveEmployees,
            description: 'Currently inactive',
            icon: <UserMinus className="size-4 p-0.5 text-primary" />,
            statusFilter: 'Inactive',
            tooltip: 'Click to filter by inactive employees only',
        },
    ];
    return (
        <div className="grid lg:grid-cols-3 lg:gap-2 lg:max-w-300 gap-3 grid-cols-1 ">
            {kpis.map(k => {
                const isActive = !!k.statusFilter && filters.status === k.statusFilter;
                const clickable = !!k.statusFilter;
                return (
                    <TooltipProvider key={k.label} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => clickable && setFilters({ ...filters, status: filters.status === k.statusFilter ? '' : k.statusFilter })}
                                    className={`transition-all ${clickable ? 'cursor-pointer' : ''} ${isActive ? '-translate-y-0.5' : ''}`}
                                >
                                    <StatCard
                                        title={k.label}
                                        value={k.value}
                                        description={isActive ? `✓ Filtering` : k.description}
                                        icon={k.icon}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {k.tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
}

/* ── Shared vertical bars ────────────────────────────────────────────────── */
function VerticalBars({ items, max, barHeight = 120, onBarClick, activeLabel }: {
    items: { label: string; count: number; color: string }[];
    max: number;
    barHeight?: number;
    onBarClick?: (label: string) => void;
    activeLabel?: string;
}) {
    const step = max <= 20 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : 25;
    const gridMax = Math.ceil(Math.max(max, step) / step) * step;
    const gridLines = Array.from({ length: gridMax / step + 1 }, (_, i) => i * step);
    const LABEL_H = 24;

    return (
        <div style={{ display: 'flex', gap: 6 }}>
            {/* Y-axis labels */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: barHeight, marginBottom: LABEL_H, flexShrink: 0 }}>
                {gridLines.map(v => (
                    <span key={v} style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 500, lineHeight: 1, textAlign: 'right', minWidth: 16 }}>{v}</span>
                ))}
            </div>

            {/* Chart area */}
            <div style={{ flex: 1, position: 'relative' }}>
                {/* Gridlines */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barHeight, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                    {gridLines.map(v => (
                        <div key={v} style={{ width: '100%', borderTop: `1px ${v === 0 ? 'solid' : 'dashed'} var(--border)`, opacity: v === 0 ? 0.7 : 0.35 }} />
                    ))}
                </div>

                {/* Bars row */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, height: barHeight }}>
                    {items.map(item => {
                        const h = Math.max(2, (item.count / gridMax) * barHeight);
                        const isActive = activeLabel === item.label;
                        const isDimmed = !!activeLabel && !isActive;
                        return (
                            <TooltipProvider key={item.label}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onBarClick?.(item.label)}
                                            style={{
                                                flex: 1,
                                                height: h,
                                                background: item.color,
                                                borderRadius: '4px 4px 0 0',
                                                flexShrink: 0,
                                                transition: 'height .4s, opacity .2s',
                                                cursor: onBarClick ? 'pointer' : 'default',
                                                opacity: isDimmed ? 0.35 : 1,
                                                outline: isActive ? `2px solid ${item.color}` : 'none',
                                                outlineOffset: 2,
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>{item.label}: {item.count}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>

                {/* X-axis labels */}
                <div style={{ display: 'flex', gap: 6, height: LABEL_H, alignItems: 'flex-start', paddingTop: 4 }}>
                    {items.map(item => (
                        <span key={item.label} style={{ flex: 1, fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   2. DEMOGRAPHICS
══════════════════════════════════════════ */
function Demographics({ employees, filters, setFilters }: {
    employees: Employee[];
    filters: EmployeeFilters;
    setFilters: (f: EmployeeFilters) => void;
}) {
    const ageBuckets = [
        { label: '20–29', min: 20, max: 29 },
        { label: '30–39', min: 30, max: 39 },
        { label: '40–49', min: 40, max: 49 },
        { label: '50+', min: 50, max: 99 },
    ].map(b => ({ ...b, count: employees.filter(e => e.age >= b.min && e.age <= b.max).length }));

    const sexCounts = SEX.map(g => ({ label: g, count: employees.filter(e => e.sex === g).length }));
    const educCounts = EDUC_LEVELS.map(l => ({ label: l, count: employees.filter(e => e.education === l).length })).filter(e => e.count > 0);

    const maxAge = Math.max(...ageBuckets.map(b => b.count), 1);
    const maxSex = Math.max(...sexCounts.map(s => s.count), 1);
    const maxEduc = Math.max(...educCounts.map(e => e.count), 1);

    const AGE_COLORS = [blue, indigo, violet, rose];
    const SEX_COLORS: Record<string, string> = { Male: blue, Female: rose };
    const EDUC_COLORS = [emerald, cyan, blue, violet, amber, rose];

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', boxSizing: 'border-box' }}>
            <SH title="Employee Demographics" />
            <div>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Age Groups</div>
                <VerticalBars
                    items={ageBuckets.map((b, i) => ({ label: b.label, count: b.count, color: AGE_COLORS[i] }))}
                    max={maxAge}
                    activeLabel={filters.ageGroup}
                    onBarClick={(label) => setFilters({ ...filters, ageGroup: filters.ageGroup === label ? '' : label })}
                />
            </div>
            <div>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sex</div>
                <VerticalBars
                    items={sexCounts.map(g => ({ label: g.label, count: g.count, color: SEX_COLORS[g.label] ?? blue }))}
                    max={maxSex}
                    activeLabel={filters.sex}
                    onBarClick={(label) => setFilters({ ...filters, sex: filters.sex === label ? '' : label })}
                />
            </div>
            <div>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Education Level</div>
                {educCounts.length === 0
                    ? <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No education data</span></div>
                    : <VerticalBars
                        items={educCounts.map((e, i) => ({ label: e.label, count: e.count, color: EDUC_COLORS[i % 6] }))}
                        max={maxEduc}
                        activeLabel={filters.education}
                        onBarClick={(label) => setFilters({ ...filters, education: filters.education === label ? '' : label })}
                    />
                }
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   3. TYPE DISTRIBUTION
══════════════════════════════════════════ */
function TypeDistribution({ employees, filters, setFilters }: {
    employees: Employee[];
    filters: EmployeeFilters;
    setFilters: (f: EmployeeFilters) => void;
}) {
    const counts = EMP_TYPES.map(t => ({ label: t, count: employees.filter(e => e.type === t).length, color: TYPE_COLORS[t] }));
    const BAR_H = 160;
    const rawMax = Math.max(...counts.map(c => c.count), 1);
    const step = rawMax <= 20 ? 5 : rawMax <= 50 ? 10 : rawMax <= 100 ? 20 : 25;
    const gridMax = Math.ceil(rawMax / step) * step;
    const gridLines = Array.from({ length: gridMax / step + 1 }, (_, i) => i * step);

    return (
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SH title="Employment Type Distribution" />
            <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
                {/* Y-axis */}
                <div style={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: BAR_H, marginBottom: 24, flexShrink: 0 }}>
                    {gridLines.map(v => (
                        <span key={v} style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 500, lineHeight: 1, textAlign: 'right', minWidth: 20 }}>{v}</span>
                    ))}
                </div>
                {/* Chart area */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {/* Gridlines */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: BAR_H, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                        {gridLines.map(v => (
                            <div key={v} style={{ width: '100%', borderTop: `1px ${v === 0 ? 'solid' : 'dashed'} var(--border)`, opacity: v === 0 ? 0.7 : 0.35 }} />
                        ))}
                    </div>
                    {/* Bars */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, height: BAR_H }}>
                        {counts.map(c => {
                            const h = Math.max(2, (c.count / gridMax) * BAR_H);
                            const isActive = filters.type === c.label;
                            const isDimmed = !!filters.type && !isActive;
                            return (
                                <TooltipProvider key={c.label}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => setFilters({ ...filters, type: filters.type === c.label ? '' : c.label })}
                                                style={{
                                                    flex: 1,
                                                    height: h,
                                                    background: c.color,
                                                    borderRadius: '4px 4px 0 0',
                                                    flexShrink: 0,
                                                    transition: 'height .4s, opacity .2s',
                                                    cursor: 'pointer',
                                                    opacity: isDimmed ? 0.35 : 1,
                                                    outline: isActive ? `2px solid ${c.color}` : 'none',
                                                    outlineOffset: 2,
                                                }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>{c.label}: {c.count}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                    {/* X labels */}
                    <div style={{ display: 'flex', gap: 8, height: 24, alignItems: 'flex-start', paddingTop: 4 }}>
                        {counts.map(c => (
                            <span key={c.label} style={{ flex: 1, fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   4. DEPARTMENT DISTRIBUTION
══════════════════════════════════════════ */
function DeptDistribution({ employees, filters, setFilters, departmentAcronyms }: {
    employees: Employee[];
    filters: EmployeeFilters;
    setFilters: (f: EmployeeFilters) => void;
    departmentAcronyms: Record<string, string>;
}) {
    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const e of employees) map[e.department] = (map[e.department] ?? 0) + 1;
        return Object.entries(map)
            .map(([label, count]) => ({ label, count, color: deptColor(label) }))
            .sort((a, b) => b.count - a.count);
    }, [employees]);

    const BAR_H = 160;
    const rawMax = Math.max(...counts.map(c => c.count), 1);
    const step = rawMax <= 20 ? 5 : rawMax <= 50 ? 10 : rawMax <= 100 ? 20 : 25;
    const gridMax = Math.ceil(rawMax / step) * step;
    const gridLines = Array.from({ length: gridMax / step + 1 }, (_, i) => i * step);

    return (
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SH title="Department Distribution" />
            <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
                {/* Y-axis */}
                <div style={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: BAR_H, marginBottom: 24, flexShrink: 0 }}>
                    {gridLines.map(v => (
                        <span key={v} style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 500, lineHeight: 1, textAlign: 'right', minWidth: 20 }}>{v}</span>
                    ))}
                </div>
                {/* Chart area */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {/* Gridlines */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: BAR_H, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                        {gridLines.map(v => (
                            <div key={v} style={{ width: '100%', borderTop: `1px ${v === 0 ? 'solid' : 'dashed'} var(--border)`, opacity: v === 0 ? 0.7 : 0.35 }} />
                        ))}
                    </div>
                    {/* Bars */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_H }}>
                        {counts.map(d => {
                            const h = Math.max(2, (d.count / gridMax) * BAR_H);
                            const isActive = filters.dept === d.label;
                            const isDimmed = !!filters.dept && !isActive;
                            return (
                                <TooltipProvider key={d.label}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => setFilters({ ...filters, dept: filters.dept === d.label ? '' : d.label })}
                                                style={{
                                                    flex: 1,
                                                    height: h,
                                                    background: d.color,
                                                    borderRadius: '4px 4px 0 0',
                                                    flexShrink: 0,
                                                    transition: 'height .4s, opacity .2s',
                                                    cursor: 'pointer',
                                                    opacity: isDimmed ? 0.35 : 1,
                                                    outline: isActive ? `2px solid ${d.color}` : 'none',
                                                    outlineOffset: 2,
                                                }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>{d.label}: {d.count}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                    {/* X labels */}
                    <div style={{ display: 'flex', gap: 6, height: 24, alignItems: 'flex-start', paddingTop: 4 }}>
                        {counts.map(d => (
                            <span key={d.label}
                                style={{
                                    flex: 1, fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600,
                                    textAlign: 'center', lineHeight: 1.2, overflow: 'hidden',
                                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                {departmentAcronyms[d.label] ?? d.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}

/* ══════════════════════════════════════════
   6. MASTERLIST TABLE
══════════════════════════════════════════ */

/** Convert an <img> src (imported asset URL) to a base64 data-URL for jsPDF */
function srcToBase64(src: string): Promise<string | null> {
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d')!.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

/**
 * Read a CSS custom property from the document root and return it as an
 * [r, g, b] tuple (0-255) that jsPDF accepts.
 */
function cssVar(name: string, fallback: [number, number, number]): [number, number, number] {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;
    if (raw.startsWith('#')) {
        const hex = raw.slice(1);
        if (hex.length === 3) return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
        if (hex.length >= 6) return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = raw;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
    } catch { return fallback; }
}

function MasterlistTable({ employees, departments, onSelect }: {
    employees: Employee[];
    departments: string[];
    onSelect: (e: Employee) => void;
}) {
    const tableFilters = useMemo(() => buildEmployeeTableFilters(departments), [departments]);

    /* ── Export 1: Internal Employee Masterlist ─────────────────────────────── */
    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const primary = cssVar('--primary', [59, 130, 246]);
        const primaryFg = cssVar('--primary-foreground', [255, 255, 255]);
        const primaryMuted =
            cssVar('--primary-muted', [0, 0, 0]).join() !== [0, 0, 0].join() ? cssVar('--primary-muted', [0, 0, 0]) :
                cssVar('--accent', [248, 250, 252]);
        const foreground = cssVar('--foreground', [30, 41, 59]);
        const mutedFg = cssVar('--muted-foreground', [100, 116, 139]);
        const border = cssVar('--border', [226, 232, 240]);

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'legal' });
        const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        const PADDING = 40;
        const LOGO_SIZE = 40;
        const logoBase64 = await srcToBase64(Logo);

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', PADDING, 16, LOGO_SIZE, LOGO_SIZE);
        }

        const textX = logoBase64 ? PADDING + LOGO_SIZE + 10 : PADDING;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...foreground);
        doc.text('Metro Kidapawan', textX, 30);

        doc.setFontSize(13);
        doc.text('Water District', textX, 46);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...mutedFg);
        doc.text(`Employee Masterlist  ·  as of ${date}`, textX, 60);

        const ruleY = 72;
        doc.setDrawColor(...border);
        doc.setLineWidth(0.5);
        doc.line(PADDING, ruleY, pageW - PADDING, ruleY);

        const ROWS_PER_PAGE = 20;
        const FOOTER_H = 24;
        const HEAD_ROW_H = 20;
        const bodyPool = pageH - (ruleY + 10) - FOOTER_H - HEAD_ROW_H;
        const rowHeight = Math.floor(bodyPool / ROWS_PER_PAGE);
        const fontSize = +(rowHeight * 0.45).toFixed(1);

        autoTable(doc, {
            startY: ruleY + 10,
            rowPageBreak: 'avoid',
            head: [['Work ID', 'Name', 'Department', 'Position', 'Type', 'Status', 'Date Hired', 'Salary Grade']],
            body: employees.map(e => [
                e.workId, e.name, e.department, e.position,
                e.type, e.status, e.dateHired, e.salaryGrade,
            ]),
            headStyles: {
                fillColor: primary,
                textColor: primaryFg,
                fontStyle: 'bold',
                fontSize,
                cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
                minCellHeight: HEAD_ROW_H,
            },
            bodyStyles: {
                fontSize,
                minCellHeight: rowHeight,
                cellPadding: { top: 0, bottom: 0, left: 4, right: 4 },
                valign: 'middle',
                fillColor: [255, 255, 255],
            },
            columnStyles: {
                0: { cellWidth: 80, fontStyle: 'bold', textColor: primary },
                1: { cellWidth: 180, fontStyle: 'bold' },
                2: { cellWidth: 150 },
                3: { cellWidth: 160 },
                4: { cellWidth: 90 },
                5: { cellWidth: 78 },
                6: { cellWidth: 100 },
                7: { cellWidth: 90 },
            },
            margin: { left: PADDING, right: PADDING, bottom: FOOTER_H },
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...mutedFg);
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageW / 2,
                pageH - 16,
                { align: 'center' },
            );
        }

        doc.save('employee-masterlist.pdf');
    };

    /* ── Export 2: CSC CS Form 34-E Plantilla — window.print() ────────────── */
    const exportPlantillaPDF = () => {
        const plantillaEmployees = employees.filter(
            e => e.type === 'Casual' || e.type === 'Job Order'
        );

        if (plantillaEmployees.length === 0) {
            alert('No Casual or Job Order employees found to export.');
            return;
        }

        const today = new Date();
        const dateStr = today.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

        const rows = plantillaEmployees.map((e, i) => `
            <tr>
                <td style="text-align:center">${i + 1}</td>
                <td style="text-align:left;font-weight:600">${formatCscName(e.name)}</td>
                <td style="text-align:left">${e.position}</td>
                <td style="text-align:center">${e.salaryGradeNum ?? '—'}</td>
                <td style="text-align:center">${e.stepNum ?? '—'}</td>
                <td style="text-align:right">${e.monthlySalary}</td>
                <td style="text-align:right">${e.dailyRate}</td>
                <td style="text-align:center">${formatCscDate(e.dateHired)}</td>
                <td style="text-align:center">${formatCscDate(e.appointmentEnd)}</td>
                <td style="text-align:center">${e.status}</td>
            </tr>
        `).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>CS Form 34-E — Plantilla of Casual/Job Order Appointments</title>
<style>
  @page { size: legal landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 8pt;
    color: #1e293b;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header ── */
  .seal-row {
    text-align: center;
    margin-bottom: 4px;
  }
  .seal-row img {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }
  .logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #94a3b8;
    margin-bottom: 6px;
    gap: 10px;
  }
  .logo-row .side img {
    width: 50px;
    height: 50px;
    object-fit: contain;
    display: block;
    flex-shrink: 0;
  }
  .logo-row .centre {
    text-align: center;
  }
  .centre .republic   { font-size: 7pt;   color: #64748b; }
  .centre .agency     { font-size: 13pt;  font-weight: 700; color: #1e293b; line-height: 1.3; }
  .centre .office     { font-size: 8.5pt; color: #1e293b; }
  .centre .form-title { font-size: 9pt;   font-weight: 700; color: #2563eb; margin-top: 2px; }
  .centre .form-ref   { font-size: 7pt;   color: #64748b; }

  .as-of { font-size: 7pt; color: #64748b; text-align: right; margin-bottom: 4px; }

  /* ── Table ── */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 7.5pt;
  }
  thead tr th {
    background: #2563eb;
    color: #fff;
    font-weight: 700;
    font-size: 7pt;
    padding: 5px 4px;
    border: 1px solid #1d4ed8;
    vertical-align: middle;
  }
  tbody tr td {
    padding: 3px 4px;
    border: 1px solid #e2e8f0;
    vertical-align: middle;
  }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tfoot tr td {
    font-style: italic;
    font-size: 7pt;
    color: #64748b;
    padding: 4px;
    border: none;
  }

  /* Column widths — must total 100% */
  col.c-no     { width:  3%; }
  col.c-name   { width: 20%; }
  col.c-pos    { width: 19%; }
  col.c-sg     { width:  3%; }
  col.c-step   { width:  3%; }
  col.c-salary { width: 10%; }
  col.c-daily  { width:  9%; }
  col.c-from   { width: 11%; }
  col.c-to     { width: 11%; }
  col.c-status { width:  7%; }

  /* ── Certification block ── */
  .cert {
    margin-top: 10px;
    border-top: 1px solid #cbd5e1;
    padding-top: 6px;
    font-size: 7pt;
  }
  .cert-label { font-weight: 700; font-size: 7.5pt; margin-bottom: 3px; }
  .cert-text  { color: #64748b; margin-bottom: 10px; }
  .sig-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin-top: 4px;
  }
  .sig-col    { text-align: center; }
  .sig-line   { border-bottom: 1px solid #94a3b8; margin: 0 16px 3px; height: 20px; }
  .sig-name   { font-weight: 700; font-size: 7pt; }
  .sig-title  { font-size: 6.5pt; color: #64748b; }
  .date-line  { text-align: right; font-size: 7pt; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>

  <!-- ROW 1: PH Seal centred alone -->
  <div class="seal-row">
    <img src="${PhSeal}" alt="Philippine Seal"/>
  </div>

  <!-- ROW 2: Company logo | Agency text | CSC logo -->
  <div class="logo-row">
    <div class="side"><img src="${Logo}" alt="MKWD Logo"/></div>
    <div class="centre">
      <div class="republic">Republic of the Philippines</div>
      <div class="agency">Metro Kidapawan Water District</div>
      <div class="office">Human Resources Management Office</div>
      <div class="form-title">PLANTILLA OF CASUAL/JOB ORDER APPOINTMENTS</div>
      <div class="form-ref">CS Form No. 34-E (Revised 2025)</div>
    </div>
    <div class="side"><img src="${CscLogo}" alt="CSC Logo"/></div>
  </div>

  <div class="as-of">as of ${dateStr}</div>

  <!-- TABLE -->
  <table>
    <colgroup>
      <col class="c-no"/><col class="c-name"/><col class="c-pos"/>
      <col class="c-sg"/><col class="c-step"/>
      <col class="c-salary"/><col class="c-daily"/>
      <col class="c-from"/><col class="c-to"/>
      <col class="c-status"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center">No.</th>
        <th style="text-align:left">Name (Last, First Middle)</th>
        <th style="text-align:left">Position Title</th>
        <th style="text-align:center">SG</th>
        <th style="text-align:center">Step</th>
        <th style="text-align:right">Monthly Salary (&#8369;)</th>
        <th style="text-align:right">Daily Rate (&#8369;)</th>
        <th style="text-align:center">Period From</th>
        <th style="text-align:center">Period To</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="10">&mdash; NOTHING FOLLOWS &mdash;</td></tr>
    </tfoot>
  </table>

  <!-- CERTIFICATION -->
  <div class="cert">
    <div class="cert-label">CERTIFIED CORRECT:</div>
    <div class="cert-text">I certify that the foregoing is a true and correct list of casual/job order employees of this office for the period indicated.</div>
    <div class="sig-row">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Prepared by</div>
        <div class="sig-title">HR Officer</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Reviewed by</div>
        <div class="sig-title">Division Chief</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Approved by</div>
        <div class="sig-title">General Manager</div>
      </div>
    </div>
    <div class="date-line">Date Signed: ___________________________</div>
  </div>

</body>
</html>`;

        // Use a hidden iframe — prints without opening a new tab
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!iframeDoc) { document.body.removeChild(iframe); return; }

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Wait for images to load, print, then remove the iframe
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 500);
        };
    };

    return (
        <Card>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <SH title="Employee Masterlist" sub={`${employees.length} employees shown · click a row for details`} />
                <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                    <Button variant="outline" size="sm" onClick={exportPDF}>
                        ⬇ Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPlantillaPDF}>
                        ⬇ CS Form 34 Plantilla
                    </Button>
                </div>
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
        departmentAcronyms = {}
    } = usePage<EmployeeReportProps>().props;

    const [filters, setFilters] = useState<EmployeeFilters>(EMPTY_FILTERS);
    const [selected, setSelected] = useState<Employee | null>(null);
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const filtered = useMemo(() => {
        let r = employees;
        if (filters.status) r = r.filter(e => e.status === filters.status);
        if (filters.type) r = r.filter(e => e.type === filters.type);
        if (filters.dept) r = r.filter(e => e.department === filters.dept);
        if (filters.sex) r = r.filter(e => e.sex === filters.sex);
        if (filters.education) r = r.filter(e => e.education === filters.education);
        if (filters.ageGroup) {
            const AGE_RANGES: Record<string, [number, number]> = {
                '20–29': [20, 29], '30–39': [30, 39], '40–49': [40, 49], '50+': [50, 99],
            };
            const range = AGE_RANGES[filters.ageGroup];
            if (range) r = r.filter(e => e.age >= range[0] && e.age <= range[1]);
        }
        return r;
    }, [employees, filters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Overview" />

            <div className="flex flex-col gap-4 overflow-y-auto p-3 sm:p-6" style={{ fontFamily: 'var(--font-sans)' }}>

                {/* Page header */}
                <div>
                    <h1 className="text-lg font-black tracking-tight sm:text-lg" style={{ color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
                        Employee Overview
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4, marginBottom: 0 }}>
                        Workforce Analytics · MKWD — as of {date}
                    </p>
                </div>

                <ActiveFilters filters={filters} setFilters={setFilters} />

                <KpiStrip
                    totalEmployees={totalEmployees}
                    activeEmployees={activeEmployees}
                    inactiveEmployees={inactiveEmployees}
                    filters={filters}
                    setFilters={setFilters}
                />

                {/* Charts — left: Demographics tall | right: Type + Dept stacked */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                    <Demographics employees={filtered} allEmployees={employees} filters={filters} setFilters={setFilters} />
                    <div className="flex flex-col gap-4" style={{ minHeight: 0 }}>
                        <TypeDistribution employees={filtered} allEmployees={employees} filters={filters} setFilters={setFilters} />
                        <DeptDistribution employees={filtered} allEmployees={employees} filters={filters} setFilters={setFilters} departmentAcronyms={departmentAcronyms} />
                    </div>
                </div>

                <MasterlistTable employees={filtered} departments={departments} onSelect={setSelected} />

            </div>

            <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} />
        </AppLayout>
    );
}
