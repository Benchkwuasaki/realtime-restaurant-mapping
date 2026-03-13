import { Head, router } from "@inertiajs/react"
import { useState, useMemo } from "react"
import { route } from "ziggy-js"
import {
    UserCheck, Coffee, UserX, AlertTriangle, Users,
    TrendingUp, TrendingDown, Minus,
    RefreshCw, Download, CalendarDays, Building2, Clock,
    BarChart3, ListFilter,
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, ComposedChart, ReferenceLine, ResponsiveContainer, Line,
} from "recharts"

import AppLayout from "@/layouts/app-layout"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { BreadcrumbItem } from "@/types"

import {
    type DepartmentStat, type DailyStat, type WeeklyStat,
    type MonthlyTrend, type Summary,
    computeDeptTotals, ratingOptions,
} from "./data/data"
import { getDeptColumns, buildDeptFooterRow } from "./components/columns"

// Breadcrumbs

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Reports & Analytics", href: route("reports_and_analytics.attendance-report.index") },
]

// Props

interface Props {
    summary: Summary
    daily_breakdown: DailyStat[]
    weekly_breakdown: WeeklyStat[]
    monthly_trend: MonthlyTrend[]
    department_breakdown: DepartmentStat[]
    departments: string[]
    filters: {
        department: string
        date_from: string
        date_to: string
    }
}

// Chart tooltip style

const TOOLTIP_STYLE: React.CSSProperties = {
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    fontSize: 11,
    padding: "6px 12px",
    background: "var(--color-card)",
    color: "var(--color-foreground)",
    boxShadow: "var(--shadow-md)",
}

// Chart colours — all resolved from app.css vars

const C = {
    present: "var(--color-chart-2)",   // teal-green
    late:    "var(--color-chart-4)",   // amber-orange
    absent:  "var(--color-destructive)",
    halfDay: "var(--color-chart-1)",   // blue
    rate:    "var(--color-primary)",
    trend:   "var(--color-chart-5)",
} as const

// Semantic icon / dot colours via inline CSS vars

const COLOR = {
    present: { color: "var(--color-chart-2)" },
    halfDay: { color: "var(--color-chart-1)" },
    late:    { color: "var(--color-chart-4)" },
    absent:  { color: "var(--color-destructive)" },
} as const

const BG_COLOR = {
    present: { backgroundColor: "var(--color-chart-2)" },
    halfDay: { backgroundColor: "var(--color-chart-1)" },
    late:    { backgroundColor: "var(--color-chart-4)" },
    absent:  { backgroundColor: "var(--color-destructive)" },
} as const

// Delta chip

function DeltaChip({ delta, direction }: { delta: number; direction: "up" | "down" | "same" }) {
    if (direction === "same") return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
            <Minus className="w-3 h-3" /> No change
        </span>
    )
    const isUp = direction === "up"
    return (
        <span
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold"
            style={{ color: isUp ? "var(--color-chart-2)" : "var(--color-destructive)" }}
        >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}% vs yesterday
        </span>
    )
}

// Filter Bar

function FilterBar({ departments, filters, onApply }: {
    departments: string[]
    filters: Props["filters"]
    onApply: (f: Props["filters"]) => void
}) {
    const [local, setLocal] = useState(filters)
    function set<K extends keyof Props["filters"]>(k: K, v: string) {
        setLocal(f => ({ ...f, [k]: v }))
    }
    const isDirty = local.department !== "All Departments" || !!local.date_from || !!local.date_to
    function reset() {
        const cleared = { department: "All Departments", date_from: "", date_to: "" }
        setLocal(cleared); onApply(cleared)
    }
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select value={local.department} onValueChange={v => {
                set("department", v)
                onApply({ ...local, department: v })
            }}>
                <SelectTrigger className="h-8 w-44 text-xs overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate block min-w-0">
                            <SelectValue placeholder="All Departments" />
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All Departments" className="text-xs">All Departments</SelectItem>
                    {departments.map(d => (
                        <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 h-8 rounded-md border border-input bg-background px-3 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input type="date" value={local.date_from} onChange={e => set("date_from", e.target.value)}
                    className="h-auto border-none shadow-none p-0 text-xs w-28 focus-visible:ring-0" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" value={local.date_to} onChange={e => set("date_to", e.target.value)}
                    className="h-auto border-none shadow-none p-0 text-xs w-28 focus-visible:ring-0" />
            </div>

            <Button size="sm" className="h-8 text-xs" onClick={() => onApply(local)}>
                <ListFilter className="w-3.5 h-3.5 mr-1.5" /> Apply
            </Button>
            {isDirty && (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={reset}>Reset</Button>
            )}
            <div className="ml-auto flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => router.get(
                        route("reports_and_analytics.attendance-report.index"),
                        {
                            department: local.department !== "All Departments" ? local.department : undefined,
                            date_from: local.date_from || undefined,
                            date_to: local.date_to || undefined,
                        },
                        { preserveScroll: true }
                    )}
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                        const params = new URLSearchParams({
                            ...(local.department !== "All Departments" && { department: local.department }),
                            ...(local.date_from && { date_from: local.date_from }),
                            ...(local.date_to && { date_to: local.date_to }),
                            export: "csv",
                        })
                        window.location.href = route("reports_and_analytics.attendance-report.index") + "?" + params.toString()
                    }}
                >
                    <Download className="w-3.5 h-3.5" /> Export
                </Button>
            </div>
        </div>
    )
}

// Charts

function DailyBreakdownChart({ data }: { data: DailyStat[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Daily Attendance Breakdown</CardTitle>
                <CardDescription className="text-xs">Present · Late · Half-day · Absent per day</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={data} barGap={3} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Bar dataKey="present"  name="Present"  fill={C.present}  radius={[4, 4, 0, 0]} />
                        <Bar dataKey="late"     name="Late"     fill={C.late}     radius={[4, 4, 0, 0]} />
                        <Bar dataKey="half_day" name="Half Day" fill={C.halfDay}  radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent"   name="Absent"   fill={C.absent}   radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function WeeklyRateChart({ data }: { data: WeeklyStat[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Weekly Attendance Rate</CardTitle>
                <CardDescription className="text-xs">Week-over-week attendance rate with headcount breakdown</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={210}>
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="c" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={34} />
                        <YAxis yAxisId="r" orientation="right" domain={[75, 100]} unit="%" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={38} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Bar yAxisId="c" dataKey="present" name="Present" fill={C.present} radius={[3, 3, 0, 0]} opacity={0.45} />
                        <Bar yAxisId="c" dataKey="absent"  name="Absent"  fill={C.absent}  radius={[3, 3, 0, 0]} opacity={0.45} />
                        <Area yAxisId="r" type="monotone" dataKey="rate" name="Rate %"
                            fill="url(#rateGrad)" stroke="var(--color-primary)" strokeWidth={2.5}
                            dot={{ fill: "var(--color-primary)", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <ReferenceLine yAxisId="r" y={90} stroke="var(--color-border)" strokeDasharray="4 2" />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function MonthlyTrendChart({ data }: { data: MonthlyTrend[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">12-Month Attendance Trend</CardTitle>
                <CardDescription className="text-xs">Actual rate vs moving average - 90% target line</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[75, 100]} unit="%" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={38} />
                        <Tooltip contentStyle={TOOLTIP_STYLE}
                            formatter={(v: unknown, n: unknown) => [
                                typeof v === "number" ? `${v}%` : String(v),
                                n === "rate" ? "Actual Rate" : "Moving Trend",
                            ]} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                            formatter={(v: string) => v === "rate" ? "Actual Rate" : "Moving Trend"} />
                        <ReferenceLine y={90} stroke="var(--color-border)" strokeDasharray="4 2"
                            label={{ value: "90% target", position: "insideTopRight", fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                        <Area type="monotone" dataKey="rate" name="rate"
                            fill="url(#yearGrad)" stroke="var(--color-primary)" strokeWidth={2.5}
                            dot={{ fill: "var(--color-primary)", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="trend" name="trend"
                            stroke={C.trend} strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

// Page

export default function AttendanceReportIndex({
    summary,
    daily_breakdown,
    weekly_breakdown,
    monthly_trend,
    department_breakdown,
    departments,
    filters: propFilters,
}: Props) {
    const [filters, setFilters] = useState(propFilters ?? { department: "All Departments", date_from: "", date_to: "" })
    const depts = department_breakdown ?? []
    const s: Summary = summary ?? {
        total_employees: 0,
        present_today: 0,
        late_today: 0,
        absent_today: 0,
        half_day_today: 0,
        attendance_rate: 0,
        rate_delta: 0,
        rate_delta_direction: "same",
    }
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

    function applyFilters(f: Props["filters"]) {
        setFilters(f)
        router.get(
            route("reports_and_analytics.attendance-report.index"),
            {
                department: f.department !== "All Departments" ? f.department : undefined,
                date_from: f.date_from || undefined,
                date_to: f.date_to || undefined,
            },
            { preserveScroll: true, preserveState: true },
        )
    }

    const deptTotals = useMemo(() => computeDeptTotals(depts), [depts])
    const deptColumns = useMemo(() => getDeptColumns(), [])

    const rateAccentStyle: React.CSSProperties =
        s.attendance_rate >= 90 ? { borderLeftColor: "var(--color-chart-3)" }
            : s.attendance_rate >= 85 ? { borderLeftColor: "var(--color-chart-4)" }
                : { borderLeftColor: "var(--color-destructive)" }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Reports & Analytics" />
            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Attendance Reports & Analytics</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Attendance overview as of <span className="font-semibold text-foreground">{today}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Live data
                        </span>
                        <DeltaChip delta={s.rate_delta} direction={s.rate_delta_direction} />
                    </div>
                </div>

                <FilterBar departments={departments ?? []} filters={filters} onApply={applyFilters} />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard title="Total Employees" value={s.total_employees} description="Active headcount"
                        icon={<Users className="w-4 h-4 m-2 " />} />
                    <StatCard title="Present Today" value={s.present_today} description="Clocked in or active"
                        icon={<UserCheck className="w-4 h-4 m-2" style={COLOR.present} />} />
                    <StatCard title="Half Day" value={s.half_day_today} description="Left before time out"
                        icon={<Coffee className="w-4 h-4 m-2" style={COLOR.halfDay} />} />
                    <StatCard title="Late Today" value={s.late_today} description="Arrived after schedule"
                        icon={<AlertTriangle className="w-4 h-4 m-2" style={COLOR.late} />} />
                    <StatCard title="Absent Today" value={s.absent_today} description="No attendance recorded"
                        icon={<UserX className="w-4 h-4 m-2" style={COLOR.absent} />} />
                </div>

                <Card className="border-l-4" style={rateAccentStyle}>
                    <CardContent className="py-3 px-5 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Today's Attendance Rate</p>
                                <p className="text-2xl font-bold tabular-nums tracking-tight">{s.attendance_rate.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                            {[
                                { bgStyle: BG_COLOR.present, label: "Present",  val: s.present_today },
                                { bgStyle: BG_COLOR.halfDay, label: "Half Day", val: s.half_day_today },
                                { bgStyle: BG_COLOR.late,    label: "Late",     val: s.late_today },
                                { bgStyle: BG_COLOR.absent,  label: "Absent",   val: s.absent_today },
                            ].map(({ bgStyle, label, val }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={bgStyle} />
                                    {label} <span className="font-semibold text-foreground">{val}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <DailyBreakdownChart data={daily_breakdown} />
                    <WeeklyRateChart data={weekly_breakdown} />
                </div>

                <MonthlyTrendChart data={monthly_trend} />

                <div className="flex flex-col gap-2">
                    <div>
                        <h2 className="text-base font-semibold tracking-tight">Department Breakdown</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Attendance by department · {depts.length} department{depts.length !== 1 ? "s" : ""} ·{" "}
                            <span className="font-semibold text-foreground">{deptTotals.total}</span> total employees
                        </p>
                    </div>
                    <DataTable
                        columns={deptColumns}
                        data={depts}
                        getRowId={row => row.department}
                        searchColumnId="department"
                        searchPlaceholder="Search department..."
                        filters={[{ columnId: "rate_category", title: "Rating", options: ratingOptions }]}
                        footerRow={buildDeptFooterRow}
                    />
                </div>

            </div>
        </AppLayout>
    )
}