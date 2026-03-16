import { Head } from "@inertiajs/react"
import {
    CalendarDays,
    List,
    Users,
    CalendarCheck,
    CalendarClock,
    CalendarX2,
} from "lucide-react"
import { useRef, useState } from "react"

import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { getColumns } from "@/pages/Leave/LeaveCalendar/components/columns"
import { type LeaveApplication } from "@/pages/Leave/LeaveCalendar/data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    leaves: LeaveApplication[]
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Leave", href: "#" },
    { title: "Leave Calendar", href: "/leave/calendar" },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Leave status colours used in the calendar
const STATUS_DOT: Record<"starting" | "ending" | "ongoing", string> = {
    starting: "bg-primary",
    ending: "bg-destructive",
    ongoing: "bg-muted-foreground",
}

const STATUS_LABEL: Record<"starting" | "ending" | "ongoing", string> = {
    starting: "Starting",
    ending: "Ending",
    ongoing: "On Leave",
}

// ─── Dummy data (replace with Inertia props later) ────────────────────────────

const DUMMY_LEAVES: LeaveApplication[] = [
    { leave_application_id: 1, employee_name: "Dianne Russell", department_name: "Human Resources", leave_type_name: "Vacation Leave", start_date: "2026-03-10", end_date: "2026-03-14", days_requested: 5, status: "approved" },
    { leave_application_id: 2, employee_name: "Brooklyn Simmons", department_name: "Finance", leave_type_name: "Sick Leave", start_date: "2026-03-12", end_date: "2026-03-13", days_requested: 2, status: "approved" },
    { leave_application_id: 3, employee_name: "Wade Warren", department_name: "Engineering", leave_type_name: "Vacation Leave", start_date: "2026-03-18", end_date: "2026-03-20", days_requested: 3, status: "approved" },
    { leave_application_id: 4, employee_name: "Leslie Alexander", department_name: "Marketing", leave_type_name: "Sick Leave", start_date: "2026-03-18", end_date: "2026-03-19", days_requested: 2, status: "pending" },
    { leave_application_id: 5, employee_name: "Cameron Williams", department_name: "Engineering", leave_type_name: "Vacation Leave", start_date: "2026-03-05", end_date: "2026-03-07", days_requested: 3, status: "approved" },
    { leave_application_id: 6, employee_name: "Esther Howard", department_name: "Human Resources", leave_type_name: "Maternity Leave", start_date: "2026-03-01", end_date: "2026-03-31", days_requested: 23, status: "approved" },
    { leave_application_id: 7, employee_name: "Jenny Wilson", department_name: "Finance", leave_type_name: "Sick Leave", start_date: "2026-03-25", end_date: "2026-03-26", days_requested: 2, status: "rejected" },
    { leave_application_id: 8, employee_name: "Robert Fox", department_name: "Marketing", leave_type_name: "Vacation Leave", start_date: "2026-03-22", end_date: "2026-03-28", days_requested: 5, status: "approved" },
    { leave_application_id: 9, employee_name: "Albert Flores", department_name: "Engineering", leave_type_name: "Sick Leave", start_date: "2026-03-03", end_date: "2026-03-04", days_requested: 2, status: "cancelled" },
    { leave_application_id: 10, employee_name: "Arlene McCoy", department_name: "Finance", leave_type_name: "Vacation Leave", start_date: "2026-03-17", end_date: "2026-03-21", days_requested: 5, status: "pending" },
]

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}
function getFirstDay(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}
function toKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}
function parseKey(key: string) {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, m - 1, d)
}

type DayStatus = "starting" | "ending" | "ongoing"
type DayEntry = { name: string; status: DayStatus }
type DayMap = Record<string, DayEntry[]>

// Only map approved leaves onto the calendar
function buildDayMap(leaves: LeaveApplication[]): DayMap {
    const map: DayMap = {}

    const approved = leaves.filter((l) => l.status === "approved")

    for (const leave of approved) {
        const start = parseKey(leave.start_date)
        const end = parseKey(leave.end_date)
        const cursor = new Date(start)

        while (cursor <= end) {
            const key = toKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
            const isStart = cursor.getTime() === start.getTime()
            const isEnd = cursor.getTime() === end.getTime()

            const status: DayStatus =
                isStart && isEnd ? "starting"
                    : isStart ? "starting"
                        : isEnd ? "ending"
                            : "ongoing"

            if (!map[key]) map[key] = []
            map[key].push({ name: leave.employee_name, status })

            cursor.setDate(cursor.getDate() + 1)
        }
    }

    return map
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ leaves }: { leaves: LeaveApplication[] }) {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [tooltipAnchor, setTooltipAnchor] = useState<{ top: number; left: number; colIndex: number } | null>(null)
    const gridRef = useRef<HTMLDivElement>(null)

    const dayMap = buildDayMap(leaves)

    // Build grid
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDay(year, month)
    const daysInPrev = getDaysInMonth(year, month - 1)

    const cells: { day: number; current: boolean; key: string | null }[] = []
    for (let i = firstDay - 1; i >= 0; i--)
        cells.push({ day: daysInPrev - i, current: false, key: null })
    for (let d = 1; d <= daysInMonth; d++)
        cells.push({ day: d, current: true, key: toKey(year, month, d) })
    let next = 1
    while (cells.length % 7 !== 0)
        cells.push({ day: next++, current: false, key: null })

    const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
        cells.slice(i * 7, i * 7 + 7)
    )

    function prevMonth() {
        setSelectedKey(null)
        if (month === 0) { setMonth(11); setYear((y) => y - 1) }
        else setMonth((m) => m - 1)
    }
    function nextMonth() {
        setSelectedKey(null)
        if (month === 11) { setMonth(0); setYear((y) => y + 1) }
        else setMonth((m) => m + 1)
    }

    function handleCellClick(
        cell: { day: number; current: boolean; key: string | null },
        colIndex: number,
        e: React.MouseEvent<HTMLDivElement>
    ) {
        if (!cell.current || !cell.key) return
        if (selectedKey === cell.key) { setSelectedKey(null); return }
        setSelectedKey(cell.key)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const gridRect = gridRef.current!.getBoundingClientRect()
        setTooltipAnchor({
            top: rect.top - gridRect.top,
            left: rect.left - gridRect.left + rect.width / 2,
            colIndex,
        })
    }

    function isToday(cell: { day: number; current: boolean }) {
        return cell.current &&
            cell.day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
    }

    const selectedEntries = selectedKey ? (dayMap[selectedKey] ?? []) : []
    const selectedDate = selectedKey
        ? parseKey(selectedKey).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : null

    const grouped: Record<DayStatus, string[]> = { starting: [], ending: [], ongoing: [] }
    for (const e of selectedEntries) grouped[e.status].push(e.name)

    return (
        <div className="flex flex-col h-full border border-border rounded-xl bg-card">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <div className="flex items-center">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h2 className="text-lg lg:text-2xl font-semibold text-foreground">
                        {MONTHS[month]}{" "}
                        <span className="text-muted-foreground font-normal">{year}</span>
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>


                {/* Legend */}
                <div className="hidden sm:flex items-center gap-5 text-md text-muted-foreground">
                    {(Object.keys(STATUS_DOT) as DayStatus[]).map((s) => (
                        <span key={s} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                            {STATUS_LABEL[s]}
                        </span>
                    ))}
                </div>

                {/* Nav */}
                <div className="flex items-center gap-1">

                    <button
                        onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedKey(null) }}
                        className="px-2.5 py-1 text-lg font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Today
                    </button>

                </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 border-b border-border">
                {DAYS.map((d, i) => (
                    <div
                        key={d}
                        className={`py-2 text-center text-sm lg:text-xl font-bold tracking-widest text-muted-foreground
                            ${i < 6 ? "border-r border-border" : ""}`}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div
                ref={gridRef}
                className="relative flex-1 flex flex-col"
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedKey(null) }}
            >
                {weeks.map((week, wi) => (
                    <div
                        key={wi}
                        className={`grid grid-cols-7 flex-1 ${wi < weeks.length - 1 ? "border-b border-border" : ""}`}
                    >
                        {week.map((cell, ci) => {
                            const isSelected = cell.key === selectedKey
                            const todayCell = isToday(cell)
                            const entries = cell.key ? (dayMap[cell.key] ?? []) : []
                            const counts = {
                                starting: entries.filter((e) => e.status === "starting").length,
                                ending: entries.filter((e) => e.status === "ending").length,
                                ongoing: entries.filter((e) => e.status === "ongoing").length,
                            }

                            return (
                                <div
                                    key={ci}
                                    onClick={(e) => handleCellClick(cell, ci, e)}
                                    className={[
                                        "relative flex items-center justify-center transition-colors min-h-16",
                                        ci < 6 ? "border-r border-border" : "",
                                        !cell.current
                                            ? "bg-muted/30 cursor-default"
                                            : isSelected
                                                ? "bg-primary cursor-pointer"
                                                : "hover:bg-accent/40 cursor-pointer",
                                    ].join(" ")}
                                >
                                    {/* Day number — absolute center */}
                                    <div className={[
                                        "w-7 h-7 flex items-center justify-center rounded-full text-sm lg:text-xl font-medium leading-none",
                                        !cell.current
                                            ? "text-muted-foreground/40"
                                            : isSelected
                                                ? "text-primary-foreground"
                                                : todayCell
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground",
                                    ].join(" ")}>
                                        {cell.day}
                                    </div>

                                    {/* Status dots — top-right, flowing right to left */}
                                    {cell.current && entries.length > 0 && (
                                        <div className="absolute top-2 right-2 flex flex-row-reverse items-center gap-1 flex-wrap-reverse justify-start">
                                            {(["starting", "ending", "ongoing"] as DayStatus[]).map((s) =>
                                                counts[s] > 0 ? (
                                                    <span key={s} className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-primary-foreground/70" : STATUS_DOT[s]}`} />
                                                ) : null
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}

                {/* Tooltip — employees on selected date */}
                {selectedKey && tooltipAnchor && (
                    <div
                        className="absolute z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 w-56 pointer-events-none"
                        style={{
                            top: tooltipAnchor.top - 8,
                            left: tooltipAnchor.colIndex >= 5
                                ? tooltipAnchor.left - 224 + 16
                                : tooltipAnchor.left,
                            transform: tooltipAnchor.colIndex >= 5
                                ? "translateY(-100%)"
                                : "translate(-50%, -100%)",
                        }}
                    >
                        <p className="text-xs font-semibold text-foreground mb-2 pb-2 border-b border-border">
                            {selectedDate}
                        </p>

                        {selectedEntries.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No approved leaves on this day.</p>
                        ) : (
                            (["starting", "ending", "ongoing"] as DayStatus[]).map((status) =>
                                grouped[status].length > 0 ? (
                                    <div key={status} className="mb-2 last:mb-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                            {STATUS_LABEL[status]}
                                        </p>
                                        {grouped[status].map((name, i) => (
                                            <div key={i} className="flex items-center gap-2 py-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                                                <span className="text-xs text-foreground">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaveCalendarIndex({ leaves = DUMMY_LEAVES }: Props) {
    const today = new Date()

    // Derive stat counts from leaves
    const onLeaveToday = leaves.filter((l) => {
        if (l.status !== "approved") return false
        const start = parseKey(l.start_date)
        const end = parseKey(l.end_date)
        return today >= start && today <= end
    }).length

    const pendingCount = leaves.filter((l) => l.status === "pending").length
    const approvedCount = leaves.filter((l) => l.status === "approved").length

    // Unique leave types and departments for filters
    const leaveTypes = [...new Set(leaves.map((l) => l.leave_type_name))]
    const departments = [...new Set(leaves.map((l) => l.department_name))]

    const columns = getColumns()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Calendar" />

            <div className="flex h-full flex-1 flex-col gap-6 py-4 px-6">

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-200">
                    <StatCard
                        title="On Leave Today"
                        value={onLeaveToday}
                        description="Total Employees on Leave Today"
                        icon={<Users className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Pending Approval"
                        value={pendingCount}
                        description="Leave requests awaiting action"
                        icon={<CalendarClock className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Approved This Month"
                        value={approvedCount}
                        description="Leaves approved"
                        icon={<CalendarCheck className="size-4 text-primary" />}
                    />
                </div>

                {/* ── Tabs ── */}
                <Tabs defaultValue="calendar" className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-border px-4 pt-1 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        <TabsList className="h-auto bg-transparent gap-0 p-0 flex flex-nowrap">
                            <TabsTrigger value="calendar" className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                                <CalendarDays className="size-3.5" />
                                Calendar
                            </TabsTrigger>
                            <TabsTrigger value="list" className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                                <List className="size-3.5" />
                                List
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Calendar Tab */}
                    <TabsContent value="calendar" className="flex-1 flex flex-col min-h-0 mt-3">
                        <CalendarTab leaves={leaves} />
                    </TabsContent>

                    {/* List Tab */}
                    <TabsContent value="list" className="mt-3">
                        <DataTable
                            columns={columns}
                            data={leaves}
                            getRowId={(row) => String(row.leave_application_id)}
                            searchColumnId="employee_name"
                            searchPlaceholder="Search by employee name..."
                            filters={[
                                {
                                    columnId: "leave_type_name",
                                    title: "Leave Type",
                                    options: leaveTypes.map((t) => ({ label: t, value: t })),
                                },
                                {
                                    columnId: "status",
                                    title: "Status",
                                    options: [
                                        { label: "Approved", value: "approved" },
                                        { label: "Pending", value: "pending" },
                                        { label: "Rejected", value: "rejected" },
                                        { label: "Cancelled", value: "cancelled" },
                                        { label: "Draft", value: "draft" },
                                    ],
                                },
                                {
                                    columnId: "department_name",
                                    title: "Department",
                                    options: departments.map((d) => ({ label: d, value: d })),
                                },
                            ]}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    )
}