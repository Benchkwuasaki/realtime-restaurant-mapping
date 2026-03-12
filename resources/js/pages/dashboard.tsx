import {
    BarChart, Bar, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie,
} from "recharts";
import {
    UserCheck, Clock, UserX, Users,
    CalendarClock, Banknote, TrendingUp, Wifi,
    AlertTriangle, CheckCircle2,
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Head, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

/* ── CLOCK ───────────────────────────────────────────────────────────────── */
function useClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
    return t;
}

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */
const TOTAL = 400;
const PRESENT = 200, LATE = 100, ABSENT = 100;



const leaveTrend = [
    { m: "J",  v: 12 }, { m: "F",  v: 19 }, { m: "M",  v: 21 },
    { m: "A",  v: 19 }, { m: "My", v: 20 }, { m: "Jn", v: 20 },
    { m: "Jl", v: 20 }, { m: "Au", v: 10 }, { m: "S",  v: 20 },
    { m: "O",  v: 20 }, { m: "N",  v: 20 }, { m: "D",  v: 20 },
];

const topLate = [
    { name: "Earl F. Amoy",   dept: "Operations", min: 47 },
    { name: "Liam Papasin",   dept: "IT",         min: 38 },
    { name: "Glizzy Go",      dept: "Finance",    min: 31 },
    { name: "Ramon Castillo", dept: "Security",   min: 25 },
    { name: "M. Buligan",     dept: "Admin",      min: 19 },
];






const TT = {
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "var(--card)",
    color: "var(--card-foreground)",
    fontSize: "11px",
    padding: "6px 12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};

// Colour palette for workforce bars.
// Falls back gracefully for any classification not explicitly mapped.
const CLASSIFICATION_COLORS: Record<string, string> = {
    "Regular":   "#818cf8",
    "Casual":    "#22d3ee",
    "Job Order": "#fb923c",
};
const FALLBACK_COLORS = ["#34d399", "#f472b6", "#fbbf24", "#fb7185"];

/* ── TYPES ───────────────────────────────────────────────────────────────── */
type ClassificationCount = { classification: string; total: number };

/* ── DONUT (attendance) ──────────────────────────────────────────────────── */
function AttendanceDonut() {
    const data = [
        { name: "Present", value: PRESENT, fill: "#34d399" },
        { name: "Late",    value: LATE,    fill: "#fbbf24" },
        { name: "Absent",  value: ABSENT,  fill: "#fb7185" },
    ];
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                        <Pie data={data} dataKey="value" cx="50%" cy="50%"
                            innerRadius={52} outerRadius={72}
                            paddingAngle={3} startAngle={90} endAngle={-270}
                            stroke="none">
                            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-foreground leading-none">
                        {Math.round((PRESENT / TOTAL) * 100)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">present</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
                {data.map(d => (
                    <div key={d.name} className="flex flex-col items-center gap-1 p-2 rounded-xl"
                        style={{ background: `${d.fill}10` }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-sm font-black text-foreground">{d.value}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{d.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── LATE LIST ───────────────────────────────────────────────────────────── */
function LateList() {
    const max = topLate[0].min;
    const colors = ["#fbbf24", "#818cf8", "#f472b6", "#22d3ee", "#fb923c"];
    return (
        <div className="flex flex-col gap-3">
            {topLate.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ background: colors[i] }}>
                        {e.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-foreground truncate">{e.name}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2"
                                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                                +{e.min}m
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${(e.min / max) * 100}%`, background: colors[i] }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0 w-16 text-right">{e.dept}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── KPI ROW ─────────────────────────────────────────────────────────────── */
function KpiRow({ totalEmployees, onLeaveCount, pendingLeaveCount }: {
    totalEmployees: number;
    onLeaveCount: number;
    pendingLeaveCount: number;
}) {
    const kpis = [
        { label: "Total",         value: totalEmployees,   icon: Users,         color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
        { label: "Present",       value: "200",            icon: UserCheck,     color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
        { label: "On Leave",      value: onLeaveCount,     icon: CalendarClock, color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
        { label: "Pending Leave", value: pendingLeaveCount, icon: Clock,        color: "#fb7185", bg: "rgba(251,113,133,0.1)" },
        { label: "Payroll",       value: "Mar 15",         icon: Banknote,      color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
    ];
    return (
        <div className="grid grid-cols-5 gap-3">
            {kpis.map(k => {
                const Icon = k.icon;
                return (
                    <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 shadow-sm">
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
                            style={{ background: k.color }} />
                        <div className="p-2 rounded-xl w-fit" style={{ background: k.bg }}>
                            <Icon className="size-4" style={{ color: k.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground leading-none">{k.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 font-medium">{k.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── WORKFORCE BARS ──────────────────────────────────────────────────────── */
function WorkforceBars({ counts }: { counts: ClassificationCount[] }) {
    const grandTotal = counts.reduce((sum, c) => sum + c.total, 0);

    return (
        <div className="flex flex-col gap-5">
            {counts.map((c, i) => {
                const color = CLASSIFICATION_COLORS[c.classification] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
                return (
                    <div key={c.classification}>
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-xs font-semibold text-foreground">{c.classification}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-foreground leading-none">{c.total}</span>
                                <span className="text-[10px] text-muted-foreground">{pct}%</span>
                            </div>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: color }} />
                        </div>
                    </div>
                );
            })}
            <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Total headcount</span>
                <span className="text-base font-black text-foreground">{grandTotal}</span>
            </div>
        </div>
    );
}

/* ── LEAVE TYPE CHART ────────────────────────────────────────────────────── */
function LeaveTypeChart({ data }: { data: LeaveTypeCount[] }) {
    if (!data.length) return <p className="text-xs text-muted-foreground text-center py-8">No data available</p>;
    return (
        <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="120%">
                <BarChart data={data} margin={{ top: 2, right: 0, left: -30, bottom: 0 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v} applications`]} contentStyle={TT} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map(e => <Cell key={e.label} fill={e.fill} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── TOP LEAVE TAKERS ────────────────────────────────────────────────────── */
function TopLeaveTakers({ takers }: { takers: TopLeaveTaker[] }) {
    if (!takers.length) return <p className="text-xs text-muted-foreground text-center py-8">No data available</p>;
    const max = takers[0].days;
    return (
        <div className="flex flex-col gap-3">
            {takers.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-muted-foreground w-3 shrink-0">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: e.color }}>
                        {e.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-foreground truncate">{e.name}</span>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                                    style={{ background: `${e.color}15`, color: e.color }}>{e.type}</span>
                                <span className="text-xs font-black" style={{ color: e.color }}>{e.days}d</span>
                            </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${(e.days / max) * 100}%`, background: e.color }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── TREND AREA ──────────────────────────────────────────────────────────── */
function LeaveTrend() {
    return (
        <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leaveTrend} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v} on leave`]} contentStyle={TT} />
                    <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={2.5}
                        fill="url(#lg)" dot={false} activeDot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── SECTION HEADING ─────────────────────────────────────────────────────── */
function SH({ icon: Icon, color, title, sub }: { icon: any; color: string; title: string; sub?: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl shrink-0" style={{ background: `${color}12` }}>
                <Icon className="size-4" style={{ color }} />
            </div>
            <div>
                <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
                {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ── CARD ────────────────────────────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */
export default function Page() {
    const time = useClock();
    const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const {
        employeeClassificationCounts,
        onLeaveCount,
        pendingLeaveCount,
        leaveTypeCounts,
        topLeaveTakers,
        urgentLeaveApplicationCount,
        approvedAsOfTodayApplications,
        avgWaitDays,
    } = usePage<{
        employeeClassificationCounts: ClassificationCount[];
        onLeaveCount: number;
        pendingLeaveCount: number;
        leaveTypeCounts: LeaveTypeCount[];
        topLeaveTakers: TopLeaveTaker[];
        urgentLeaveApplicationCount: number;
        approvedAsOfTodayApplications: number;
        avgWaitDays: number;
    }>().props;

    const pendingKPI = [
        { label: "Urgent",   value: urgentLeaveApplicationCount ?? 0, sub: ">3 days",     color: "#fb7185", icon: AlertTriangle },
        { label: "Approved", value: approvedAsOfTodayApplications ?? 0,          sub: "today",       color: "#34d399", icon: CheckCircle2  },
        { label: "Avg Wait", value: `${avgWaitDays ?? 0}d`,           sub: "to approval", color: "#fbbf24", icon: Clock         },
    ];

    const totalEmployees = (employeeClassificationCounts ?? []).reduce((sum, c) => sum + c.total, 0);

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="font-sans flex flex-col gap-4 p-5 bg-background min-h-screen">

                {/* ── HEADER ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between py-1">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="w-1.5 h-5 rounded-full bg-indigo-400" />
                            <h1 className="text-xl font-black text-foreground tracking-tight">Dashboard</h1>
                        </div>
                        <p className="text-xs text-muted-foreground pl-3.5">{dateStr}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] text-muted-foreground font-medium">Live</span>
                        <span className="text-xs font-mono font-black text-foreground tabular-nums">{timeStr}</span>
                    </div>
                </div>

                {/* ── KPI ROW ─────────────────────────────────────────── */}
                <KpiRow totalEmployees={totalEmployees} onLeaveCount={onLeaveCount ?? 0} pendingLeaveCount={pendingLeaveCount ?? 0} />

                {/* ── ROW 2 ───────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">

                    <Card>
                        <SH icon={UserCheck} color="#34d399" title="Attendance Today" sub="Live headcount" />
                        <AttendanceDonut />
                    </Card>

                    <Card>
                        <SH icon={Clock} color="#fbbf24" title="Top 5 Late" sub="By minutes late today" />
                        <LateList />
                    </Card>

                    {/* Workforce — live data from controller */}
                    <Card>
                        <SH icon={Users} color="#818cf8" title="Workforce" sub="By employment type" />
                        <WorkforceBars counts={employeeClassificationCounts ?? []} />
                    </Card>
                </div>

                {/* ── ROW 3: LEAVE ────────────────────────────────────── */}
                <Card>
                    <SH icon={CalendarClock} color="#fbbf24" title="Leave Overview" />
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">By type</p>
                            <LeaveTypeChart data={leaveTypeCounts ?? []} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Top takers</p>
                            <TopLeaveTakers takers={topLeaveTakers ?? []} />
                        </div>
                    </div>
                </Card>

                {/* ── ROW 4: PENDING + TREND ──────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">

                    <Card>
                        <SH icon={Clock} color="#fb7185" title="Pending Requests" />
                        <div className="flex items-stretch gap-4 mb-5">
                            <div className="flex flex-col items-center justify-center p-5 rounded-2xl flex-1"
                                style={{ background: "rgba(251,113,133,0.07)", border: "1.5px solid rgba(251,113,133,0.18)" }}>
                                <p className="text-6xl font-black leading-none" style={{ color: "#fb7185" }}>{pendingLeaveCount}</p>
                                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-semibold">total pending</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 flex-1">
                                {pendingKPI.map(k => {
                                    const Icon = k.icon;
                                    return (
                                        <div key={k.label} className="flex items-center gap-3 p-3 rounded-xl"
                                            style={{ background: `${k.color}08`, border: `1px solid ${k.color}20` }}>
                                            <Icon className="size-3.5 shrink-0" style={{ color: k.color }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-foreground leading-none">{k.value}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{k.label} · {k.sub}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <SH icon={TrendingUp} color="#818cf8" title="Monthly Leave Trend" sub="Employees on leave per month" />
                        <LeaveTrend />
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                            {[
                                { label: "Peak",    value: "Mar", note: "21 staff" },
                                { label: "Lowest",  value: "Aug", note: "10 staff" },
                                { label: "Average", value: "18",  note: "/ month" },
                            ].map(s => (
                                <div key={s.label} className="text-center p-2 rounded-xl bg-muted/30">
                                    <p className="text-base font-black text-foreground">{s.value}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                                    <p className="text-[9px] text-muted-foreground/60">{s.note}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

            </div>
        </AppLayout>
    );
}