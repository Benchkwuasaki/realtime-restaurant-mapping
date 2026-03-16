import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import {
    UserCheck,
    Clock,
    Users,
    CalendarClock,
    Banknote,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { StatCard } from '@/components/shared/stat-card';
import { useEchoPublic } from '@laravel/echo-react';

/* ── CLOCK ───────────────────────────────────────────────────────────────── */
function useClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return t;
}

/* ── TOOLTIP STYLE (uses CSS vars) ──────────────────────────────────────── */
const TT: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card)',
    color: 'var(--color-card-foreground)',
    fontSize: '11px',
    padding: '6px 12px',
    boxShadow: 'var(--shadow-md)',
};

/* ── CHART COLORS ────────────────────────────────────────────────────────── */
const COLORS = {
    present: '#34d399',
    late: '#fbbf24',
    absent: '#fb7185',
    halfDay: '#818cf8',
    indigo: '#818cf8',
    cyan: '#22d3ee',
    orange: '#fb923c',
    pink: '#f472b6',
};

const CLASSIFICATION_COLORS: Record<string, string> = {
    Regular: COLORS.indigo,
    Casual: COLORS.cyan,
    'Job Order': COLORS.orange,
};
const FALLBACK_COLORS = [
    COLORS.present,
    COLORS.pink,
    COLORS.late,
    COLORS.absent,
];

/* ── TYPES ───────────────────────────────────────────────────────────────── */
type ClassificationCount = { classification: string; total: number };
type LeaveTypeCount = { label: string; value: number; fill: string };
type TopLeaveTaker = {
    name: string;
    days: number;
    type: string;
    color: string;
    avatar_url?: string | null;
};
type LeaveTrendPoint = { m: string; v: number };
type TopLateEntry = {
    name: string;
    dept: string;
    min: number;
    avatar_url?: string | null;
};

/* ── ATTENDANCE DONUT ────────────────────────────────────────────────────── */
function AttendanceDonut({
    present,
    late,
    absent,
    halfDay,
    total,
}: {
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    total: number;
}) {
    const data = [
        { name: 'Present', value: present, fill: COLORS.present },
        { name: 'Late', value: late, fill: COLORS.late },
        { name: 'Half Day', value: halfDay, fill: COLORS.halfDay },
        { name: 'Absent', value: absent, fill: COLORS.absent },
    ];
    const rate =
        total > 0 ? Math.round(((present + late + halfDay) / total) * 100) : 0;
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={72}
                            paddingAngle={3}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {data.map((d, i) => (
                                <Cell key={i} fill={d.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl leading-none font-black text-foreground">
                        {rate}%
                    </span>
                    <span className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">
                        present
                    </span>
                </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2">
                {data.map((d) => (
                    <div
                        key={d.name}
                        className="flex flex-col items-center gap-1 rounded-xl p-2"
                        style={{ background: `${d.fill}18` }}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ background: d.fill }}
                        />
                        <span className="text-sm font-black text-foreground">
                            {d.value}
                        </span>
                        <span className="text-[9px] tracking-wide text-muted-foreground uppercase">
                            {d.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── LATE LIST ───────────────────────────────────────────────────────────── */

function fmtLate(min: number) {
    if (min < 60) return `+${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `+${h}h ${m}m` : `+${h}h`;
}

function LateList({ entries }: { entries: TopLateEntry[] }) {
    if (!entries.length)
        return (
            <p className="py-8 text-center text-xs text-muted-foreground">
                No late arrivals today
            </p>
        );
    const lateColors = [
        COLORS.absent,
        COLORS.indigo,
        COLORS.pink,
        COLORS.cyan,
        COLORS.orange,
    ];
    const max = entries[0]?.min ?? 1;
    return (
        <div className="flex flex-col gap-3">
            {entries.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3">
                    <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                        style={{
                            background: lateColors[i % lateColors.length],
                        }}
                    >
                        {e.avatar_url ? (
                            <img
                                src={e.avatar_url}
                                alt={e.name}
                                className="h-full w-full rounded-lg object-cover"
                            />
                        ) : (
                            e.name.charAt(0)
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="truncate text-xs font-semibold text-foreground">
                                {e.name}
                            </span>
                            <span
                                className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{
                                    background: `${COLORS.late}22`,
                                    color: COLORS.late,
                                }}
                            >
                                {fmtLate(e.min)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(e.min / max) * 100}%`,
                                        background:
                                            lateColors[i % lateColors.length],
                                    }}
                                />
                            </div>
                            {/* Only show dept if it's not a dash/empty */}
                            {e.dept &&
                                e.dept !== '—' &&
                                e.dept.trim() !== '' && (
                                    <span className="w-16 shrink-0 truncate text-right text-[9px] text-muted-foreground">
                                        {e.dept}
                                    </span>
                                )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── WORKFORCE BARS ──────────────────────────────────────────────────────── */
function WorkforceBars({ counts }: { counts: ClassificationCount[] }) {
    const grandTotal = counts.reduce((s, c) => s + c.total, 0);
    return (
        <div className="flex flex-col gap-5">
            {counts.map((c, i) => {
                const color =
                    CLASSIFICATION_COLORS[c.classification] ??
                    FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const pct =
                    grandTotal > 0
                        ? Math.round((c.total / grandTotal) * 100)
                        : 0;
                return (
                    <div key={c.classification}>
                        <div className="mb-2 flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-foreground">
                                {c.classification}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg leading-none font-black text-foreground">
                                    {c.total}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {pct}%
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: color }}
                            />
                        </div>
                    </div>
                );
            })}
            <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                    Total headcount
                </span>
                <span className="text-base font-black text-foreground">
                    {grandTotal}
                </span>
            </div>
        </div>
    );
}

/* ── LEAVE TYPE CHART ────────────────────────────────────────────────────── */
function LeaveTypeChart({ data }: { data: LeaveTypeCount[] }) {
    if (!data.length)
        return (
            <p className="py-8 text-center text-xs text-muted-foreground">
                No data available
            </p>
        );
    return (
        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 2, right: 0, left: -30, bottom: 0 }}
                    barSize={24}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{
                            fontSize: 9,
                            fill: 'var(--color-muted-foreground)',
                        }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{
                            fontSize: 9,
                            fill: 'var(--color-muted-foreground)',
                        }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        formatter={(v) => [`${v} applications`]}
                        contentStyle={TT}
                        cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((e) => (
                            <Cell key={e.label} fill={e.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── TOP 5 LEAVE TYPES ───────────────────────────────────────────────────── */
function Top5LeaveTypes({ data }: { data: LeaveTypeCount[] }) {
    const top5 = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
    if (!top5.length)
        return (
            <p className="py-8 text-center text-xs text-muted-foreground">
                No data available
            </p>
        );
    const max = top5[0]?.value ?? 1;
    return (
        <div className="flex flex-col gap-3">
            {top5.map((e, i) => (
                <div key={e.label} className="flex items-center gap-3">
                    <span className="w-3 shrink-0 text-[10px] font-black text-muted-foreground">
                        {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="truncate text-xs font-semibold text-foreground">
                                {e.label}
                            </span>
                            <span
                                className="ml-2 shrink-0 text-xs font-black"
                                style={{ color: e.fill }}
                            >
                                {e.value}
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(e.value / max) * 100}%`,
                                    background: e.fill,
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── TOP LEAVE TAKERS ────────────────────────────────────────────────────── */
function TopLeaveTakers({ takers }: { takers: TopLeaveTaker[] }) {
    if (!takers.length)
        return (
            <p className="py-8 text-center text-xs text-muted-foreground">
                No data available
            </p>
        );
    const max = takers[0].days;
    return (
        <div className="flex flex-col gap-3">
            {takers.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3">
                    <span className="w-3 shrink-0 text-[10px] font-black text-muted-foreground">
                        {i + 1}
                    </span>
                    <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-white"
                        style={{ background: e.color }}
                    >
                        {e.avatar_url ? (
                            <img
                                src={e.avatar_url}
                                alt={e.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            e.name.charAt(0)
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="truncate text-xs font-semibold text-foreground">
                                {e.name}
                            </span>
                            <div className="ml-2 flex shrink-0 items-center gap-1.5">
                                <span
                                    className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                                    style={{
                                        background: `${e.color}18`,
                                        color: e.color,
                                    }}
                                >
                                    {e.type}
                                </span>
                                <span
                                    className="text-xs font-black"
                                    style={{ color: e.color }}
                                >
                                    {e.days}d
                                </span>
                            </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${(e.days / max) * 100}%`,
                                    background: e.color,
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── TREND AREA ──────────────────────────────────────────────────────────── */

const MONTH_ABBR: Record<string, string> = {
    January: 'Jan',
    February: 'Feb',
    March: 'Mar',
    April: 'Apr',
    May: 'May',
    June: 'Jun',
    July: 'Jul',
    August: 'Aug',
    September: 'Sep',
    October: 'Oct',
    November: 'Nov',
    December: 'Dec',
};

function abbreviateMonth(m: string): string {
    // Already short (e.g. "Jan")
    if (m.length <= 3) return m;

    // Full name (e.g. "January")
    if (MONTH_ABBR[m]) return MONTH_ABBR[m];

    // ISO format: "2025-01" or "2025-01-01"
    const parts = m.split('-');
    if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const names = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        return names[monthIndex] ?? m;
    }

    return m.slice(0, 3);
}

function LeaveTrend({ data }: { data: LeaveTrendPoint[] }) {
    const abbreviated = data.map((d) => ({ ...d, m: abbreviateMonth(d.m) }));
    return (
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={abbreviated}
                    margin={{ top: 4, right: 0, left: -30, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor={COLORS.indigo}
                                stopOpacity={0.25}
                            />
                            <stop
                                offset="95%"
                                stopColor={COLORS.indigo}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="m"
                        tick={{
                            fontSize: 9,
                            fill: 'var(--color-muted-foreground)',
                        }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{
                            fontSize: 9,
                            fill: 'var(--color-muted-foreground)',
                        }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        formatter={(v) => [`${v} on leave`]}
                        contentStyle={TT}
                    />
                    <Area
                        type="monotone"
                        dataKey="v"
                        stroke={COLORS.indigo}
                        strokeWidth={2.5}
                        fill="url(#lg)"
                        dot={false}
                        activeDot={{
                            r: 4,
                            fill: COLORS.indigo,
                            strokeWidth: 0,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── SECTION HEADING ─────────────────────────────────────────────────────── */
function SH({
    icon: Icon,
    color,
    title,
    sub,
}: {
    icon: any;
    color: string;
    title: string;
    sub?: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div
                className="shrink-0 rounded-xl p-2"
                style={{ background: `${color}18` }}
            >
                <Icon className="size-4" style={{ color }} />
            </div>
            <div>
                <p className="text-sm leading-tight font-bold text-foreground">
                    {title}
                </p>
                {sub && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ── CARD ────────────────────────────────────────────────────────────────── */
function DashCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-lg border border-border bg-card p-5 shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */
export default function Page() {
    const time = useClock();
    const timeStr = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const dateStr = time.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const {
        employeeClassificationCounts,
        onLeaveCount,
        pendingLeaveCount,
        leaveTypeCounts,
        topLeaveTakers,
        urgentLeaveApplicationCount,
        approvedTodayCount,
        avgWaitDays,
        leaveTrend,
        presentToday,
        onTimeToday,
        lateToday,
        absentToday,
        halfDayToday,
        topLateToday,
        authUserName,
    } = usePage<{
        employeeClassificationCounts: ClassificationCount[];
        onLeaveCount: number;
        pendingLeaveCount: number;
        leaveTypeCounts: LeaveTypeCount[];
        topLeaveTakers: TopLeaveTaker[];
        urgentLeaveApplicationCount: number;
        approvedTodayCount: number;
        avgWaitDays: number;
        leaveTrend: LeaveTrendPoint[];
        presentToday: number;
        onTimeToday: number;
        lateToday: number;
        absentToday: number;
        halfDayToday: number;
        topLateToday: TopLateEntry[];
        authUserName?: string;
    }>().props;

    const totalEmployees = (employeeClassificationCounts ?? []).reduce(
        (s, c) => s + c.total,
        0,
    );

    // ── Realtime attendance state ─────────────────────────────────────────
    const [realtimePresent, setRealtimePresent] = useState(presentToday ?? 0);
    const [realtimeOnTime, setRealtimeOnTime] = useState(onTimeToday ?? 0);
    const [realtimeLate, setRealtimeLate] = useState(lateToday ?? 0);
    const [realtimeTopLate, setRealtimeTopLate] = useState<TopLateEntry[]>(
        topLateToday ?? [],
    );

    useEchoPublic('attendance-records', '.record.updated', (e: any) => {
        const todayStr = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Manila',
        });
        if (e.date !== todayStr) return;

        if (e.status === 'PRESENT' && (e.late_minutes ?? 0) > 0) {
            const name = [
                e.employee?.basic_info?.first_name,
                e.employee?.basic_info?.last_name,
            ]
                .filter(Boolean)
                .join(' ');

            setRealtimeTopLate((prev) =>
                [
                    ...prev.filter((x) => x.name !== name),
                    {
                        name,
                        dept: e.employee?.department ?? '',
                        min: e.late_minutes,
                    },
                ]
                    .sort((a, b) => b.min - a.min)
                    .slice(0, 5),
            );
        }

        if (!e.is_new_record) return;

        if (e.status === 'PRESENT') {
            setRealtimePresent((prev) => prev + 1);
            if ((e.late_minutes ?? 0) > 0) {
                setRealtimeLate((prev) => prev + 1);
            } else {
                setRealtimeOnTime((prev) => prev + 1);
            }
        }
    });

    const pendingKPI = [
        {
            label: 'Urgent',
            value: urgentLeaveApplicationCount ?? 0,
            sub: '>3 days',
            color: COLORS.absent,
            icon: AlertTriangle,
        },
        {
            label: 'Approved',
            value: approvedTodayCount ?? 0,
            sub: 'today',
            color: COLORS.present,
            icon: CheckCircle2,
        },
        {
            label: 'Avg Wait',
            value: `${avgWaitDays ?? 0}d`,
            sub: 'to approval',
            color: COLORS.late,
            icon: Clock,
        },
    ];

    const trend = leaveTrend ?? [];
    const peakMonth = trend.reduce((a, b) => (b.v > a.v ? b : a), {
        m: '—',
        v: 0,
    });
    const lowestMonth = trend.reduce((a, b) => (b.v < a.v ? b : a), {
        m: '—',
        v: Infinity,
    });
    const avgMonthly = trend.length
        ? Math.round(trend.reduce((s, b) => s + b.v, 0) / trend.length)
        : 0;

    // Greeting based on time of day
    const hour = time.getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
              ? 'Good afternoon'
              : 'Good evening';
    const displayName = authUserName ?? 'Admin';

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex min-h-screen flex-col gap-4 bg-background p-5">
                {/* ── HEADER ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between py-1">
                    <div>
                        <div className="mb-0.5 flex items-center gap-2">
                            <div className="h-5 w-1.5 rounded-full bg-primary" />
                            <h1 className="text-xl font-black tracking-tight text-foreground">
                                Dashboard
                            </h1>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 pl-3.5">
                            <span className="text-xs text-muted-foreground">
                                {greeting},
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {displayName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                — Welcome back
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            <span className="text-xs font-medium text-muted-foreground">
                                Live
                            </span>
                            <span className="font-mono text-sm font-black text-foreground tabular-nums">
                                {timeStr}
                            </span>
                        </div>
                        <span className="text-right text-[10px] text-muted-foreground">
                            {dateStr}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        title="Total Employees"
                        value={totalEmployees}
                        description="Active headcount"
                        icon={<Users className="m-2 h-4 w-4 text-primary" />}
                    />
                    <StatCard
                        title="Present Today"
                        value={realtimePresent}
                        description="Clocked in or active"
                        icon={
                            <UserCheck className="m-2 h-4 w-4 text-primary" />
                        }
                    />
                    <StatCard
                        title="On Leave"
                        value={onLeaveCount ?? 0}
                        description="Approved leave today"
                        icon={
                            <CalendarClock className="m-2 h-4 w-4 text-primary" />
                        }
                    />
                    <StatCard
                        title="Pending Leave"
                        value={pendingLeaveCount ?? 0}
                        description="Awaiting approval"
                        icon={<Clock className="m-2 h-4 w-4 text-primary" />}
                    />
                    <StatCard
                        title="Payroll"
                        value="Mar 15"
                        description="Next payroll date"
                        icon={<Banknote className="m-2 h-4 w-4 text-primary" />}
                    />
                </div>

                {/* ── ROW 2 ────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    <DashCard>
                        <SH
                            icon={UserCheck}
                            color={COLORS.present}
                            title="Attendance Today"
                            sub="Live headcount"
                        />
                        <AttendanceDonut
                            present={realtimeOnTime}
                            late={realtimeLate}
                            absent={absentToday ?? 0}
                            halfDay={halfDayToday ?? 0}
                            total={totalEmployees}
                        />
                    </DashCard>

                    <DashCard>
                        <SH
                            icon={Clock}
                            color={COLORS.late}
                            title="Top 5 Late"
                            sub="By minutes late today"
                        />
                        <LateList entries={realtimeTopLate} />
                    </DashCard>

                    <DashCard>
                        <SH
                            icon={Users}
                            color={COLORS.indigo}
                            title="Workforce"
                            sub="By employment type"
                        />
                        <WorkforceBars
                            counts={employeeClassificationCounts ?? []}
                        />
                    </DashCard>
                </div>

                {/* ── ROW 3: LEAVE OVERVIEW ────────────────────────────── */}
                <DashCard>
                    <SH
                        icon={CalendarClock}
                        color={COLORS.late}
                        title="Leave Overview"
                    />
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                Top 5 Most Used Leave Types
                            </p>
                            <LeaveTypeChart
                                data={[...(leaveTypeCounts ?? [])]
                                    .sort((a, b) => b.value - a.value)
                                    .slice(0, 5)}
                            />
                        </div>
                        <div>
                            <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                Highest Leave Utilization
                            </p>
                            <TopLeaveTakers takers={topLeaveTakers ?? []} />
                        </div>
                    </div>
                </DashCard>

                {/* ── ROW 4: PENDING + TREND ───────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <DashCard>
                        <SH
                            icon={Clock}
                            color={COLORS.absent}
                            title="Leave Pending Requests"
                        />
                        <div className="mb-5 flex items-stretch gap-4">
                            <div
                                className="flex flex-1 flex-col items-center justify-center rounded-lg p-5"
                                style={{
                                    background: `${COLORS.absent}10`,
                                    border: `1.5px solid ${COLORS.absent}28`,
                                }}
                            >
                                <p
                                    className="text-6xl leading-none font-black"
                                    style={{ color: COLORS.absent }}
                                >
                                    {pendingLeaveCount}
                                </p>
                                <p className="mt-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    total pending
                                </p>
                            </div>
                            <div className="grid flex-1 grid-cols-1 gap-2">
                                {pendingKPI.map((k) => {
                                    const Icon = k.icon;
                                    return (
                                        <div
                                            key={k.label}
                                            className="flex items-center gap-3 rounded-xl p-3"
                                            style={{
                                                background: `${k.color}0a`,
                                                border: `1px solid ${k.color}28`,
                                            }}
                                        >
                                            <Icon
                                                className="size-3.5 shrink-0"
                                                style={{ color: k.color }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs leading-none font-black text-foreground">
                                                    {k.value}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                    {k.label} · {k.sub}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DashCard>

                    <DashCard>
                        <SH
                            icon={TrendingUp}
                            color={COLORS.indigo}
                            title="Monthly Leave Trend"
                            sub="Employees on leave per month"
                        />
                        <LeaveTrend data={trend} />
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                            {[
                                {
                                    label: 'Peak',
                                    value: abbreviateMonth(peakMonth.m),
                                    note: `${peakMonth.v} staff`,
                                },
                                {
                                    label: 'Lowest',
                                    value:
                                        lowestMonth.m === '—'
                                            ? '—'
                                            : abbreviateMonth(lowestMonth.m),
                                    note:
                                        lowestMonth.v === Infinity
                                            ? '—'
                                            : `${lowestMonth.v} staff`,
                                },
                                {
                                    label: 'Average',
                                    value: avgMonthly,
                                    note: '/ month',
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-xl bg-muted/30 p-2 text-center"
                                >
                                    <p className="text-base font-black text-foreground">
                                        {s.value}
                                    </p>
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        {s.label}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/60">
                                        {s.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DashCard>
                </div>
            </div>
        </AppLayout>
    );
}
