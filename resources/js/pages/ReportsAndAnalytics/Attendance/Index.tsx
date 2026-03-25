import { Head, router } from "@inertiajs/react"
import { useState, useMemo } from "react"
import { route } from "ziggy-js"
import {
    UserCheck, Coffee, UserX, AlertTriangle, Users,
    TrendingUp, TrendingDown, Minus,
    RefreshCw, CalendarDays, Building2, Clock,
    BarChart3, ListFilter, UserCircle2, Printer, Loader2,
    Umbrella,
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, ComposedChart, ReferenceLine, ResponsiveContainer, Line,
} from "recharts"

import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

import AppLayout from "@/layouts/app-layout"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/types"

import {
    type DepartmentStat, type DailyStat, type WeeklyStat,
    type MonthlyTrend, type Summary,
    computeDeptTotals, ratingOptions,
    rateCategory, RATE_PILL, RATE_LABEL, RATE_ICON, RATE_TEXT,
} from "./data/data"
import { getDeptColumns, buildDeptFooterRow, RateBar } from "./components/columns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import LogoSrc from "@/assets/images/logo.svg"
import SealSrc from "@/assets/images/Seal_of_the_Philippines.png"
import CscLogoSrc from "@/assets/images/CSC_logo.jpg"

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Reports & Analytics", href: route("reports_and_analytics.attendance-report.index") },
]

// ─── Types ────────────────────────────────────────────────────────────────────

/** Single attendance record for one day */
export interface DeptAttendanceRecord {
    date: string
    status: "PRESENT" | "HALF_DAY" | "ABSENT" | "ON_LEAVE_WP" | "ON_LEAVE_NP" | string
    time_in?: string | null
    time_out?: string | null
    late_minutes?: number | null
}

/** One employee with all their records across the date range */
export interface DeptEmployeeEntry {
    employee_id: number
    name: string
    avatar_url?: string | null
    position?: string
    records: DeptAttendanceRecord[]
}

interface Props {
    summary: Summary
    daily_breakdown: DailyStat[]
    weekly_breakdown: WeeklyStat[]
    monthly_trend: MonthlyTrend[]
    department_breakdown: DepartmentStat[]
    departments: string[]
    /** Map of department name → employee groups with date-range records */
    department_employees?: Record<string, DeptEmployeeEntry[]>
    filters: {
        department: string
        date_from: string
        date_to: string
    }
}

// ─── Chart tooltip style ──────────────────────────────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    fontSize: 11,
    padding: "6px 12px",
    background: "var(--color-card)",
    color: "var(--color-foreground)",
    boxShadow: "var(--shadow-md)",
}

// ─── Chart colours ────────────────────────────────────────────────────────────

const C = {
    present: "var(--color-chart-2)",
    late: "var(--color-chart-4)",
    absent: "var(--color-destructive)",
    halfDay: "var(--color-chart-1)",
    rate: "var(--color-primary)",
    trend: "var(--color-chart-5)",
} as const

const BG_COLOR = {
    present: { backgroundColor: "var(--color-chart-2)" },
    halfDay: { backgroundColor: "var(--color-chart-1)" },
    late: { backgroundColor: "var(--color-chart-4)" },
    absent: { backgroundColor: "var(--color-destructive)" },
} as const

// ─── Status config for drawer employee rows ───────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
    PRESENT:     { label: "Present",        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500"  },
    HALF_DAY:    { label: "Half Day",       className: "bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20",  dot: "bg-indigo-500"  },
    ABSENT:      { label: "Absent",         className: "bg-rose-500/10    text-rose-600    dark:text-rose-400    border-rose-500/20",     dot: "bg-rose-500"    },
    ON_LEAVE_WP: { label: "On Leave (WP)",  className: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",     dot: "bg-blue-500"    },
    ON_LEAVE_NP: { label: "On Leave (NP)",  className: "bg-violet-500/10  text-violet-600  dark:text-violet-400  border-violet-500/20",   dot: "bg-violet-500"  },
}

function fmtTime(t?: string | null) {
    if (!t) return "—"
    const [hh, mm] = t.split(":")
    const h = parseInt(hh, 10)
    return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h >= 12 ? "PM" : "AM"}`
}



// ─── PDF Generator (jsPDF + AutoTable) ───────────────────────────────────────

async function generatePDF(
    deptEmployees: Record<string, DeptEmployeeEntry[]>,
    filters: { date_from: string; date_to: string; department: string },
): Promise<void> {
    const DOW_SHORT = ["Su", "M", "T", "W", "Th", "F", "Sa"]
    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]

    // ── Convert bundled assets to PNG base64 data URLs ────────────────────────
    async function toDataUrl(src: string): Promise<string | undefined> {
        try {
            const res = await fetch(src)
            const blob = await res.blob()
            const isSvg = blob.type.includes("svg") || src.endsWith(".svg")

            if (isSvg) {
                const objectUrl = URL.createObjectURL(blob)
                return await new Promise<string>((resolve, reject) => {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        const size = Math.max(img.naturalWidth || 256, img.naturalHeight || 256)
                        const canvas = document.createElement("canvas")
                        canvas.width = size
                        canvas.height = size
                        canvas.getContext("2d")!.drawImage(img, 0, 0, size, size)
                        URL.revokeObjectURL(objectUrl)
                        resolve(canvas.toDataURL("image/png"))
                    }
                    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject() }
                    img.src = objectUrl
                })
            } else {
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(blob)
                })
            }
        } catch {
            return undefined
        }
    }

    const [sealB64, logoB64, cscB64] = await Promise.all([
        toDataUrl(SealSrc),
        toDataUrl(LogoSrc),
        toDataUrl(CscLogoSrc),
    ])

    // ── Build date list (range only) ──────────────────────────────────────────
    const allDates: string[] = []
    {
        const cur = new Date(filters.date_from + "T00:00:00")
        const end = new Date(filters.date_to + "T00:00:00")
        while (cur <= end) {
            allDates.push(cur.toISOString().split("T")[0])
            cur.setDate(cur.getDate() + 1)
        }
    }

    const monthsInRange = new Set<string>()
    for (const d of allDates) monthsInRange.add(d.slice(0, 7))

    const rangeMonthMap = new Map<string, string[]>()
    for (const monthKey of monthsInRange) {
        const [yr, mo] = monthKey.split("-").map(Number)
        const daysInMonth = new Date(yr, mo, 0).getDate()
        const dates: string[] = []
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${monthKey}-${String(d).padStart(2, "0")}`
            if (ds < filters.date_from) continue
            dates.push(ds)
        }
        if (dates.length > 0) rangeMonthMap.set(monthKey, dates)
    }

    const dateTo = filters.date_to

    // ── Labels ────────────────────────────────────────────────────────────────
    const fmt = (s: string) => s
        ? new Date(s + "T00:00:00").toLocaleDateString("en-US",
            { month: "long", day: "numeric", year: "numeric" })
        : "—"
    const fromLabel = fmt(filters.date_from)
    const toLabel = fmt(filters.date_to)
    const generatedAt = new Date().toLocaleString("en-US", {
        month: "long", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    })
    const deptLabel = (filters.department && filters.department !== "All Departments")
        ? filters.department : "All Departments"

    // ── Colours ───────────────────────────────────────────────────────────────
    const CLR = {
        black:      [0, 0, 0]         as [number, number, number],
        white:      [255, 255, 255]   as [number, number, number],
        headerBg:   [30, 30, 30]      as [number, number, number],
        subBg:      [220, 220, 220]   as [number, number, number],
        thBg:       [235, 235, 235]   as [number, number, number],
        weekendBg:  [200, 200, 200]   as [number, number, number],
        totBg:      [230, 230, 230]   as [number, number, number],
        lateFg:     [180, 120, 0]     as [number, number, number],
        absentFg:   [180, 30, 30]     as [number, number, number],
        presentFg:  [30, 130, 60]     as [number, number, number],
        halfDayFg:  [180, 140, 0]     as [number, number, number],
        mutedFg:    [120, 120, 120]   as [number, number, number],
        futureBg:   [250, 250, 240]   as [number, number, number],
        futureFg:   [200, 200, 200]   as [number, number, number],
        // ── NEW: leave colours ──
        leaveFg:    [30, 100, 200]    as [number, number, number],   // ON_LEAVE_WP (blue)
        leaveNpFg:  [120, 50, 200]    as [number, number, number],   // ON_LEAVE_NP (violet)
        leaveBg:    [235, 243, 255]   as [number, number, number],   // light blue tint for WP cells
        leaveNpBg:  [245, 238, 255]   as [number, number, number],   // light violet tint for NP cells
    }

    // ── Document ──────────────────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" })
    const PW = doc.internal.pageSize.getWidth()
    const PH = doc.internal.pageSize.getHeight()
    const ML = 36, MR = 36, MT = 36
    const availW = PW - ML - MR

    let y = MT
    let isFirstDept = true

    // ── Page header ───────────────────────────────────────────────────────────
    function drawPageHeader() {
        y = MT

        const sealS = 50
        const logoS = 44.8
        const cscS = 44.8
        const gap = 10

        const blockH = Math.max(sealS, logoS) + 4 + 10 + 12 + 10
        const lineY = MT + blockH
        const textBot = lineY - 6
        const textMid = textBot - 10
        const textTop = textMid - 12

        if (sealB64) {
            try { doc.addImage(sealB64, "PNG", PW / 2 - sealS / 2, MT, sealS, sealS) } catch { }
        }

        doc.setFont("times", "bold").setFontSize(11)
        const line2Text = "Metro Kidapawan Water District"
        const line2W = doc.getTextWidth(line2Text)
        const line2X = PW / 2 - line2W / 2
        const line2EndX = PW / 2 + line2W / 2

        if (logoB64) {
            try { doc.addImage(logoB64, "PNG", line2X - logoS - gap, textMid - logoS + 4, logoS, logoS) } catch { }
        }
        if (cscB64) {
            try { doc.addImage(cscB64, "PNG", line2EndX + gap, textMid - cscS + 4, cscS, cscS) } catch { }
        }

        doc.setFont("times", "normal").setFontSize(7.5).setTextColor(...CLR.black)
        doc.text("Republic of the Philippines", PW / 2, textTop, { align: "center" })

        doc.setFont("times", "bold").setFontSize(11).setTextColor(...CLR.black)
        doc.text(line2Text, PW / 2, textMid, { align: "center" })

        doc.setFont("times", "normal").setFontSize(8).setTextColor(...CLR.black)
        doc.text("Human Resources Management Office", PW / 2, textBot, { align: "center" })

        y = lineY
        doc.setDrawColor(...CLR.black).setLineWidth(1)
        doc.line(ML, y, PW - MR, y); y += 10

        doc.setFont("times", "normal").setFontSize(7).setTextColor(...CLR.mutedFg)
        doc.text("CSC Form No. 48 — Attendance Summary Sheet", PW / 2, y, { align: "center" }); y += 14
        doc.setFont("times", "bold").setFontSize(13).setTextColor(...CLR.black)
        doc.text("DAILY ATTENDANCE SUMMARY REPORT", PW / 2, y, { align: "center" }); y += 11
        doc.setFont("times", "italic").setFontSize(7.5).setTextColor(...CLR.black)
        doc.text("Employee Attendance Records with Daily Breakdown", PW / 2, y, { align: "center" }); y += 9

        const cells = [
            { label: "Coverage Period", value: `${fromLabel} — ${toLabel}` },
            { label: "Department / Scope", value: deptLabel },
            { label: "Date & Time Generated", value: generatedAt },
        ]
        const cellW = availW / cells.length
        const cellH = 22
        doc.setDrawColor(...CLR.black).setLineWidth(0.5)
        cells.forEach((c, i) => {
            const cx = ML + i * cellW
            doc.rect(cx, y, cellW, cellH)
            doc.setFont("times", "bold").setFontSize(6).setTextColor(...CLR.black)
            doc.text(c.label.toUpperCase(), cx + 5, y + 7)
            doc.setFont("times", "normal").setFontSize(7.5).setTextColor(...CLR.black)
            doc.text(c.value, cx + 5, y + 17)
        })
        y += cellH + 8
    }

    function addPageWithHeader() {
        doc.addPage()
        y = MT
        doc.setFont("times", "bold").setFontSize(7).setTextColor(...CLR.mutedFg)
        doc.text("DAILY ATTENDANCE SUMMARY REPORT", ML, y); y += 6
        doc.setLineWidth(0.5).setDrawColor(...CLR.mutedFg)
        doc.line(ML, y, PW - MR, y); y += 6
    }

    function drawDeptHeading(dept: string, empCount: number) {
        const barH = 14
        doc.setFillColor(...CLR.headerBg)
        doc.rect(ML, y, availW, barH, "F")
        doc.setFont("times", "bold").setFontSize(8).setTextColor(...CLR.white)
        doc.text(`DEPARTMENT / OFFICE: ${dept.toUpperCase()}`, ML + 5, y + 9.5)
        doc.setFont("times", "normal").setFontSize(7)
        doc.text(`${empCount} Employee${empCount !== 1 ? "s" : ""}`, PW - MR - 5, y + 9.5, { align: "right" })
        doc.setTextColor(...CLR.black)
        y += barH + 4
    }

    // ── Month table ───────────────────────────────────────────────────────────
    function drawMonthTable(
        employees: DeptEmployeeEntry[],
        dates: string[],
        monthLabel: string,
        cutoff: string,
    ) {
        const subH = 12
        doc.setFillColor(...CLR.subBg)
        doc.rect(ML, y, availW, subH, "F")
        doc.setDrawColor(...CLR.black).setLineWidth(0.3)
        doc.rect(ML, y, availW, subH)
        doc.setFont("times", "normal").setFontSize(7).setTextColor(...CLR.black)
        doc.text(`Attendance Record: ${monthLabel}`, ML + 5, y + 8)
        y += subH

        // ── Column widths ─────────────────────────────────────────────────────
        const seqW = 10
        const nameW = 120
        const posW = 80
        const sumW = 26
        // 5 summary columns now (Present, Half Day, Absent, Leave LP, Leave L)
        const dayBudget = availW - seqW - nameW - posW - sumW * 5
        const dayW = Math.min(40, Math.max(13, dayBudget / dates.length))
        const usedByDays = dayW * dates.length
        const adjNameW = availW - seqW - posW - usedByDays - sumW * 5
        const finalNameW = Math.max(80, adjNameW)
        const tableW = availW

        // ── Header ────────────────────────────────────────────────────────────
        const dayHeaderCells = dates.map((d, i) => {
            const day = parseInt(d.slice(8), 10)
            const dow = new Date(d + "T00:00:00").getDay()
            const isWE = dow === 0 || dow === 6
            const future = d > cutoff
            return {
                content: `${day}\n${DOW_SHORT[dow]}${future ? "\n·" : ""}`,
                styles: {
                    halign: "center" as const,
                    fontStyle: "bold" as const,
                    fontSize: 5.5,
                    fillColor: future ? [245, 245, 220] as [number, number, number]
                        : isWE ? CLR.weekendBg
                            : CLR.thBg,
                    textColor: future ? CLR.mutedFg : CLR.black,
                    cellPadding: 1,
                },
            }
        })

        const head = [
            [
                { content: "#",          rowSpan: 2, styles: { halign: "center" as const, valign: "middle" as const, fontStyle: "bold" as const, fontSize: 6 } },
                { content: "NAME",       rowSpan: 2, styles: { halign: "left" as const,   valign: "middle" as const, fontStyle: "bold" as const, fontSize: 6 } },
                { content: "POSITION",   rowSpan: 2, styles: { halign: "left" as const,   valign: "middle" as const, fontStyle: "bold" as const, fontSize: 6 } },
                { content: "ATTENDANCE PER DAY", colSpan: dates.length, styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 6 } },
                { content: "SUMMARY",    colSpan: 5, styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 6 } },
            ],
            [
                ...dayHeaderCells,
                { content: "Present",  styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 5.5, textColor: CLR.presentFg  } },
                { content: "Half Day", styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 5.5, textColor: CLR.halfDayFg  } },
                { content: "Absent",   styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 5.5, textColor: CLR.absentFg   } },
                { content: "", styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 5.5, textColor: CLR.leaveFg    } },
                { content: "", styles: { halign: "center" as const, fontStyle: "bold" as const, fontSize: 5.5, textColor: CLR.leaveNpFg  } },
            ],
        ]

        // ── Body ──────────────────────────────────────────────────────────────
        const parseName = (name: string) => {
            const parts = name.trim().split(/\s+/)
            const last = parts.length > 1 ? parts[parts.length - 1] : parts[0]
            const first = parts.length > 1 ? parts[0] : ""
            const middle = parts.length > 2 ? parts.slice(1, -1).join(" ") : ""
            const display = middle
                ? `${last.toUpperCase()}, ${first} ${middle}`
                : `${last.toUpperCase()}, ${first}`
            return { last, first, middle, display }
        }

        const sortedEmployees = [...employees]
            .map(emp => ({ ...emp, _parsed: parseName(emp.name) }))
            .sort((a, b) =>
                a._parsed.last.localeCompare(b._parsed.last)
                || a._parsed.first.localeCompare(b._parsed.first)
                || a._parsed.middle.localeCompare(b._parsed.middle)
            )

        const body: any[] = sortedEmployees.map((emp, idx) => {
            const byDate: Record<string, DeptAttendanceRecord> = {}
            for (const r of emp.records) byDate[r.date] = r

            let P = 0, HF = 0, A = 0, LeaveWP = 0, LeaveNP = 0

            const dayCells = dates.map(d => {
                const dow = new Date(d + "T00:00:00").getDay()
                const isWE = dow === 0 || dow === 6
                const future = d > cutoff
                const r = byDate[d]

                if (future) return {
                    content: "·",
                    styles: {
                        halign: "center" as const, fontSize: 6,
                        textColor: CLR.futureFg, fillColor: CLR.futureBg,
                        fontStyle: "italic" as const
                    },
                }

                let content = "—"
                let textColor: [number, number, number] = CLR.mutedFg
                let fontStyle: "bold" | "normal" = "normal"
                const fillColor = isWE ? CLR.weekendBg : undefined

                if (r) {
                    if (r.status === "PRESENT") {
                        content = "P"; P++; textColor = CLR.presentFg; fontStyle = "bold"
                    } else if (r.status === "HALF_DAY") {
                        content = "HD"; HF++; textColor = CLR.halfDayFg; fontStyle = "bold"
                    } else if (r.status === "ABSENT") {
                        content = "A"; A++; textColor = CLR.absentFg; fontStyle = "bold"
                    } else if (r.status === "ON_LEAVE_WP") {
                        content = "LP"; LeaveWP++; textColor = CLR.leaveFg; fontStyle = "bold"
                        return {
                            content,
                            styles: {
                                halign: "center" as const,
                                fontSize: 6,
                                fontStyle: "bold" as const,
                                textColor: CLR.leaveFg,
                                fillColor: isWE ? CLR.weekendBg : CLR.leaveBg,
                            },
                        }
                    } else if (r.status === "ON_LEAVE_NP") {
                        content = "L"; LeaveNP++; textColor = CLR.leaveNpFg; fontStyle = "bold"
                        return {
                            content,
                            styles: {
                                halign: "center" as const,
                                fontSize: 6,
                                fontStyle: "bold" as const,
                                textColor: CLR.leaveNpFg,
                                fillColor: isWE ? CLR.weekendBg : CLR.leaveNpBg,
                            },
                        }
                    }
                }

                return { content, styles: { halign: "center" as const, fontSize: 6, fontStyle, textColor, ...(fillColor ? { fillColor } : {}) } }
            })

            return [
                { content: String(idx + 1), styles: { halign: "center" as const, textColor: CLR.mutedFg, fontSize: 6 } },
                { content: emp._parsed.display, styles: { halign: "left" as const, fontStyle: "bold" as const, fontSize: 7, textColor: CLR.black } },
                { content: emp.position ?? "", styles: { halign: "left" as const, fontStyle: "normal" as const, fontSize: 6.5, textColor: CLR.black } },
                ...dayCells,
                { content: P       > 0 ? String(P)       : "—", styles: { halign: "center" as const, textColor: CLR.presentFg,  fontStyle: "bold" as const, fontSize: 6 } },
                { content: HF      > 0 ? String(HF)      : "—", styles: { halign: "center" as const, textColor: CLR.halfDayFg,  fontStyle: "bold" as const, fontSize: 6 } },
                { content: A       > 0 ? String(A)        : "—", styles: { halign: "center" as const, textColor: CLR.absentFg,   fontStyle: "bold" as const, fontSize: 6 } },
                { content: LeaveWP > 0 ? String(LeaveWP)  : "—", styles: { halign: "center" as const, textColor: CLR.leaveFg,    fontStyle: "bold" as const, fontSize: 6 } },
                { content: LeaveNP > 0 ? String(LeaveNP)  : "—", styles: { halign: "center" as const, textColor: CLR.leaveNpFg,  fontStyle: "bold" as const, fontSize: 6 } },
            ]
        })

        // ── Totals ────────────────────────────────────────────────────────────
        const totP = sortedEmployees.reduce((s, e) => {
            const bd: Record<string, string> = {}; e.records.forEach(r => { bd[r.date] = r.status })
            return s + dates.filter(d => d <= cutoff && bd[d] === "PRESENT").length
        }, 0)
        const totHF = sortedEmployees.reduce((s, e) => {
            const bd: Record<string, string> = {}; e.records.forEach(r => { bd[r.date] = r.status })
            return s + dates.filter(d => d <= cutoff && bd[d] === "HALF_DAY").length
        }, 0)
        const totA = sortedEmployees.reduce((s, e) => {
            const bd: Record<string, string> = {}; e.records.forEach(r => { bd[r.date] = r.status })
            return s + dates.filter(d => d <= cutoff && bd[d] === "ABSENT").length
        }, 0)
        const totLeaveWP = sortedEmployees.reduce((s, e) => {
            const bd: Record<string, string> = {}; e.records.forEach(r => { bd[r.date] = r.status })
            return s + dates.filter(d => d <= cutoff && bd[d] === "ON_LEAVE_WP").length
        }, 0)
        const totLeaveNP = sortedEmployees.reduce((s, e) => {
            const bd: Record<string, string> = {}; e.records.forEach(r => { bd[r.date] = r.status })
            return s + dates.filter(d => d <= cutoff && bd[d] === "ON_LEAVE_NP").length
        }, 0)

        // Attendance rate: (P + HF) / (P + HF + A)  — leave days are excused, not counted as absent
        const totAttended = totP + totHF
        const totAll = totP + totHF + totA     // leave days excluded from denominator
        const rateStr = totAll > 0 ? `${((totAttended / totAll) * 100).toFixed(1)}%` : "N/A"

        body.push([
            { content: "", styles: { fillColor: CLR.totBg, fontSize: 6 } },
            {
                content: `TOTAL — ${sortedEmployees.length} Employee${sortedEmployees.length !== 1 ? "s" : ""}`,
                styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, fontSize: 6, halign: "left" as const },
            },
            { content: "", styles: { fillColor: CLR.totBg } },
            ...dates.map(() => ({ content: "", styles: { fillColor: CLR.totBg } })),
            { content: totP       > 0 ? String(totP)       : "—", styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, textColor: CLR.presentFg,  halign: "center" as const, fontSize: 6 } },
            { content: totHF      > 0 ? String(totHF)      : "—", styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, textColor: CLR.halfDayFg,  halign: "center" as const, fontSize: 6 } },
            { content: totA       > 0 ? String(totA)       : "—", styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, textColor: CLR.absentFg,   halign: "center" as const, fontSize: 6 } },
            { content: totLeaveWP > 0 ? String(totLeaveWP) : "—", styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, textColor: CLR.leaveFg,    halign: "center" as const, fontSize: 6 } },
            { content: totLeaveNP > 0 ? String(totLeaveNP) : "—", styles: { fillColor: CLR.totBg, fontStyle: "bold" as const, textColor: CLR.leaveNpFg,  halign: "center" as const, fontSize: 6 } },
        ])

        const totalCols = 3 + dates.length + 5   // was +3, now +5 (added WP + NP cols)
        body.push([{
            content: `Rate: ${rateStr}  |  P=Present  HD=Half Day  A=Absent  Lv L(P)=Leave w/ Pay  Lv L=Leave No Pay  —=No Record  ·=Future`,
            colSpan: totalCols,
            styles: {
                halign: "left" as const,
                fontSize: 6,
                fontStyle: "italic" as const,
                textColor: CLR.mutedFg,
                fillColor: [245, 245, 245] as [number, number, number],
                cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
                overflow: "hidden" as const,
            },
        }])

        // ── Column style map ──────────────────────────────────────────────────
        const columnStyles: Record<number, object> = {
            0: { cellWidth: seqW },
            1: { cellWidth: finalNameW },
            2: { cellWidth: posW },
        }
        dates.forEach((_, i) => { columnStyles[3 + i] = { cellWidth: dayW } })
        columnStyles[3 + dates.length + 0] = { cellWidth: sumW }
        columnStyles[3 + dates.length + 1] = { cellWidth: sumW }
        columnStyles[3 + dates.length + 2] = { cellWidth: sumW }
        columnStyles[3 + dates.length + 3] = { cellWidth: sumW }   // Leave LP
        columnStyles[3 + dates.length + 4] = { cellWidth: sumW }   // Leave L

        autoTable(doc, {
            startY: y,
            head: head as any,
            body: body as any,
            margin: { left: ML, right: MR },
            tableWidth: tableW,
            columnStyles,
            theme: "grid",
            styles: {
                font: "times",
                fontSize: 6,
                cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
                overflow: "linebreak",
                lineColor: CLR.black,
                lineWidth: 0.2,
                valign: "middle",
            },
            headStyles: {
                fillColor: CLR.thBg,
                textColor: CLR.black,
                fontStyle: "bold",
                fontSize: 5.5,
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            didParseCell(data) {
                if (data.section !== "body") return
                const colIdx = data.column.index
                if (colIdx >= 3 && colIdx < 3 + dates.length) {
                    const d = dates[colIdx - 3]
                    if (d) {
                        const dow = new Date(d + "T00:00:00").getDay()
                        if ((dow === 0 || dow === 6) && !data.cell.styles.fillColor) {
                            data.cell.styles.fillColor = CLR.weekendBg
                        }
                    }
                }
            },
            didDrawCell(data) {
                const colIdx    = data.column.index
                const lwpCol    = 3 + dates.length + 3   // Leave-With-Pay summary col
                const lnpCol    = 3 + dates.length + 4   // Leave-No-Pay summary col
                const cellText  = Array.isArray(data.cell.text) ? data.cell.text[0] : ""

                const isBodyLP   = data.section === "body"   && cellText === "LP"
                const isHeadLWP  = data.section === "head"   && colIdx === lwpCol
                const isHeadLNP  = data.section === "head"   && colIdx === lnpCol

                if (!isBodyLP && !isHeadLWP && !isHeadLNP) return

                const { x, y, width, height } = data.cell

                // ── 1. Repaint cell interior (erase whatever autoTable drew) ───
                const bgFill: [number, number, number] =
                    (isHeadLWP || isHeadLNP) ? CLR.thBg
                    : isBodyLP               ? CLR.leaveBg
                    :                          CLR.leaveNpBg
                doc.setFillColor(...bgFill)
                doc.rect(x + 0.3, y + 0.3, width - 0.6, height - 0.6, "F")

                const fgColor: [number, number, number] =
                    (isBodyLP || isHeadLWP) ? CLR.leaveFg : CLR.leaveNpFg

                doc.setFont("times", "bold").setTextColor(...fgColor)

                if (isHeadLWP) {
                    // ── Header WP: two lines — "Lv" then L+ᴾ ─────────────────
                    // measure at render size first
                    const mainFs = 4.8
                    const supFs  = 3.0
                    const gap    = 0.3
                    const cx     = x + width / 2
                    const line1Y = y + height * 0.40
                    const line2Y = y + height * 0.80

                    // line 1: "Lv"
                    doc.setFontSize(mainFs)
                    doc.text("Lv", cx, line1Y, { align: "center" })

                    // line 2: "L" + small raised "P"
                    doc.setFontSize(mainFs)
                    const lW = doc.getTextWidth("L")
                    doc.setFontSize(supFs)
                    const pW = doc.getTextWidth("P")
                    const blkW = lW + gap + pW
                    const bx = cx - blkW / 2
                    doc.setFontSize(mainFs)
                    doc.text("L", bx, line2Y)
                    doc.setFontSize(supFs)
                    doc.text("P", bx + lW + gap, line2Y - 1.6)

                } else if (isHeadLNP) {
                    // ── Header NP: two lines — "Lv" then plain "L" ────────────
                    const mainFs = 4.8
                    const cx     = x + width / 2
                    const line1Y = y + height * 0.40
                    const line2Y = y + height * 0.80
                    doc.setFontSize(mainFs)
                    doc.text("Lv", cx, line1Y, { align: "center" })
                    doc.text("L",  cx, line2Y, { align: "center" })

                } else {
                    // ── Body LP cell: centred "L" + small raised "P" ──────────
                    const bodyFs = 6
                    const supFs  = 3.8
                    const gap    = 0.4
                    doc.setFontSize(bodyFs)
                    const lW = doc.getTextWidth("L")
                    doc.setFontSize(supFs)
                    const pW = doc.getTextWidth("P")
                    const totalW = lW + gap + pW
                    const bx     = x + (width - totalW) / 2
                    const baseY  = y + height * 0.68
                    doc.setFontSize(bodyFs)
                    doc.text("L", bx, baseY)
                    doc.setFontSize(supFs)
                    doc.text("P", bx + lW + gap, baseY - 2.3)
                }
            },
        })

        y = (doc as any).lastAutoTable.finalY + 8
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    drawPageHeader()

    for (const [dept, employees] of Object.entries(deptEmployees)) {
        const activeMonths = Array.from(rangeMonthMap.entries()).filter(([, dates]) =>
            employees.some(e => e.records.some(r => dates.includes(r.date)))
        )
        if (activeMonths.length === 0) continue

        if (!isFirstDept) { doc.addPage(); drawPageHeader() }
        isFirstDept = false
        drawDeptHeading(dept, employees.length)

        const allDeptDates: string[] = []
        for (const [, dates] of activeMonths) {
            for (const d of dates) allDeptDates.push(d)
        }

        const firstDate = allDeptDates[0]
        const lastDate = allDeptDates[allDeptDates.length - 1]
        const spanLabel = firstDate && lastDate
            ? `${new Date(firstDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — ${new Date(lastDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            : fromLabel + " — " + toLabel

        if (y > PH - 120) { addPageWithHeader() }
        drawMonthTable(employees, allDeptDates, spanLabel, dateTo)
    }
    console.log("y after last table:", y, "PH:", PH)

    y += 10

    if (y + 52 > PH - 20) {
        addPageWithHeader()
        y = MT + 20
    }

    const sigLabels = [
        { name: "Prepared By", role: "HR Officer / Timekeeper" },
        { name: "Verified By", role: "HR Manager" },
        { name: "Approved By", role: "Head of Office / Department Head" },
    ]
    const sigW = (availW - 40) / 3
    const sigTop = y
    sigLabels.forEach((sig, i) => {
        const sx = ML + i * (sigW + 20)

        doc.setDrawColor(...CLR.black).setLineWidth(0.5)
        doc.line(sx, sigTop, sx + sigW, sigTop)

        doc.setFont("times", "bold").setFontSize(7.5).setTextColor(...CLR.black)
        doc.text(sig.name, sx + sigW / 2, sigTop + 8, { align: "center" })

        doc.setFont("times", "italic").setFontSize(7).setTextColor(...CLR.mutedFg)
        doc.text(sig.role, sx + sigW / 2, sigTop + 18, { align: "center" })

        doc.setDrawColor(...CLR.black)
        doc.line(sx, sigTop + 34, sx + sigW, sigTop + 34)
        doc.setFont("times", "normal").setFontSize(6.5).setTextColor(...CLR.black)
        doc.text("Date", sx, sigTop + 42)
    })

    // ── Per-page footer ───────────────────────────────────────────────────────
    const pageCount = (doc.internal as any).getNumberOfPages()
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        const fy = PH - 20
        doc.setDrawColor(...CLR.mutedFg).setLineWidth(0.3)
        doc.line(ML, fy, PW - MR, fy)
        doc.setFont("times", "normal").setFontSize(6.5).setTextColor(...CLR.mutedFg)
        doc.text(`Daily Attendance Summary Report  •  ${deptLabel}  •  ${fromLabel} — ${toLabel}`, ML, fy + 8)
        doc.text(`For Official Use Only — Confidential`, PW / 2, fy + 8, { align: "center" })
        doc.text(`Page ${p} of ${pageCount}  |  Generated: ${generatedAt}`, PW - MR, fy + 8, { align: "right" })
    }

    const blob = doc.output("blob")
    const blobUrl = URL.createObjectURL(blob)

    const iframe = document.createElement("iframe")
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden"
    document.body.appendChild(iframe)

    iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        iframe.contentWindow?.addEventListener("afterprint", () => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(blobUrl)
        }, { once: true })
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe)
                URL.revokeObjectURL(blobUrl)
            }
        }, 60_000)
    }

    iframe.src = blobUrl
}

// ─── Print Export Dialog ──────────────────────────────────────────────────────

interface PrintExportDialogProps {
    open: boolean
    onClose: () => void
    departments: string[]
    currentFilters: Props["filters"]
    reportRoute: string
}

function PrintExportDialog({
    open, onClose, departments, currentFilters, reportRoute,
}: PrintExportDialogProps) {
    const [dept, setDept] = useState(currentFilters.department ?? "All Departments")
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: currentFilters.date_from ? new Date(currentFilters.date_from) : undefined,
        to: currentFilters.date_to ? new Date(currentFilters.date_to) : undefined,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const dateLabel = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
            : format(dateRange.from, "MMM d, yyyy")
        : "Pick a date range"

    async function handleGenerate() {
        if (!dateRange?.from) { setError("Please select a start date."); return }
        setError(null)
        setLoading(true)

        try {
            const params = new URLSearchParams({
                export: "print",
                ...(dept !== "All Departments" && { department: dept }),
                ...(dateRange.from && { date_from: format(dateRange.from, "yyyy-MM-dd") }),
                ...(dateRange.to && { date_to: format(dateRange.to, "yyyy-MM-dd") }),
            })

            const res = await fetch(`${reportRoute}?${params.toString()}`, {
                headers: { Accept: "application/json" },
            })

            if (!res.ok) throw new Error(`Server returned ${res.status}`)

            const data = await res.json() as {
                department_employees: Record<string, DeptEmployeeEntry[]>
                filters: { date_from: string; date_to: string; department: string }
            }

            await generatePDF(data.department_employees ?? {}, data.filters)

            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    function handleOpenChange(o: boolean) {
        if (!o) { onClose(); return }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-115">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <Printer className="w-4 h-4 text-primary" />
                        Print / Export Employee Records
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Choose a date range and department. A PDF will be generated and downloaded
                        directly — landscape legal paper (14 × 8.5 in), ready to print or share.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-1">
                    {/* ── Department ── */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground">Department</label>
                        <Select value={dept} onValueChange={setDept}>
                            <SelectTrigger className="h-8 text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Departments" className="text-xs">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ── Date range ── */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground">Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-normal justify-start">
                                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className={dateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                                        {dateLabel}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* ── Print format info ── */}
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
                        <Printer className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            The report is downloaded as a{" "}
                            <strong className="text-foreground">landscape legal PDF</strong>{" "}
                            (14 × 8.5 in) using jsPDF. Open it in any PDF viewer to print or share.
                        </p>
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleGenerate} disabled={loading}>
                        {loading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                            : <><Printer className="w-3.5 h-3.5" /> Generate Report</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Department Drawer ────────────────────────────────────────────────────────

interface DeptDrawerProps {
    dept: DepartmentStat | null
    employees: DeptEmployeeEntry[]
    onClose: () => void
}

function DeptDrawer({ dept, employees, onClose }: DeptDrawerProps) {
    const isOpen = !!dept
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

    function toggleExpanded(id: number) {
        setExpandedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const rate = dept ? (Number(dept.rate) || 0) : 0
    const cat = rateCategory(rate)
    const RateIcon = RATE_ICON[cat]

    return (
        <Sheet open={isOpen} onOpenChange={o => { if (!o) { onClose(); setExpandedIds(new Set()) } }}>
            <SheetContent side="right" className="flex flex-col w-full sm:max-w-105 p-0 gap-0">
                {!dept ? null : (
                    <>
                        {/* ── Header ── */}
                        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border space-y-0">
                            <div className="flex items-start gap-3 pr-8">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-sm font-extrabold leading-tight truncate">
                                        {dept.department}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs mt-0.5">
                                        Attendance across filtered date range
                                    </SheetDescription>
                                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                        <Badge className={cn("text-[10px] gap-1 border", RATE_PILL[cat])}>
                                            <RateIcon className="w-2.5 h-2.5" />
                                            {RATE_LABEL[cat]}
                                        </Badge>
                                        <span className={cn("text-xs font-bold tabular-nums", RATE_TEXT[cat])}>
                                            {rate.toFixed(1)}% attendance rate
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Today's stat strip — 6 columns */}
                            <div className="grid grid-cols-6 gap-1.5 pt-4">
                                {[
                                    { key: "PRESENT",     val: dept.present,     label: "Present"  },
                                    { key: "HALF_DAY",    val: dept.half_day,    label: "Half Day" },
                                    { key: "ABSENT",      val: dept.absent,      label: "Absent"   },
                                    { key: "LATE",        val: dept.late,        label: "Late"     },
                                    { key: "ON_LEAVE_WP", val: dept.on_leave_wp, label: "Lv WP"    },
                                    { key: "ON_LEAVE_NP", val: dept.on_leave_np, label: "Lv NP"    },
                                ].map(s => {
                                    const cfg = STATUS_CONFIG[s.key] ?? STATUS_CONFIG.ABSENT
                                    return (
                                        <div
                                            key={s.key}
                                            className={cn(
                                                "flex flex-col items-center gap-0.5 rounded-lg border py-2 px-1",
                                                cfg.className,
                                            )}
                                        >
                                            <span className="text-base font-black tabular-nums leading-none">{s.val}</span>
                                            <span className="text-[9px] uppercase tracking-wide font-medium opacity-80">{s.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="pt-3"><RateBar rate={rate} /></div>
                        </SheetHeader>

                        {/* ── Employee count bar ── */}
                        <div className="px-5 py-2.5 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground">
                                    {employees.length > 0
                                        ? `${employees.length} employee${employees.length !== 1 ? "s" : ""}`
                                        : "No employee data"}
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                {dept.total} total headcount
                            </span>
                        </div>

                        {/* ── Employee list with expandable records ── */}
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-3 space-y-2">
                                {employees.length > 0 ? employees.map(emp => {
                                    const isExpanded = expandedIds.has(emp.employee_id)
                                    const init = emp.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

                                    const tally = {
                                        P:  emp.records.filter(r => r.status === "PRESENT").length,
                                        H:  emp.records.filter(r => r.status === "HALF_DAY").length,
                                        A:  emp.records.filter(r => r.status === "ABSENT").length,
                                        WP: emp.records.filter(r => r.status === "ON_LEAVE_WP").length,
                                        NP: emp.records.filter(r => r.status === "ON_LEAVE_NP").length,
                                    }

                                    return (
                                        <div key={emp.employee_id} className="rounded-lg border border-border bg-card overflow-hidden">

                                            <button
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                                                onClick={() => toggleExpanded(emp.employee_id)}
                                            >
                                                <Avatar className="h-8 w-8 shrink-0">
                                                    {emp.avatar_url ? <AvatarImage src={emp.avatar_url} alt={emp.name} /> : null}
                                                    <AvatarFallback className="text-[10px] font-bold">{init}</AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">{emp.name}</p>
                                                    {emp.position && (
                                                        <p className="text-[10px] text-muted-foreground truncate">{emp.position}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {tally.P > 0 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                            {tally.P}P
                                                        </span>
                                                    )}
                                                    {tally.H > 0 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {tally.H}HD
                                                        </span>
                                                    )}
                                                    {tally.A > 0 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                                            {tally.A}A
                                                        </span>
                                                    )}
                                                    {tally.WP > 0 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                            {tally.WP}L<sup style={{ fontSize: "0.68em", verticalAlign: "super", lineHeight: 0 }}>P</sup>
                                                        </span>
                                                    )}
                                                    {tally.NP > 0 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                            {tally.NP}L
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "ml-1 text-muted-foreground text-xs transition-transform duration-200 inline-block",
                                                        isExpanded && "rotate-180"
                                                    )}>▾</span>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-border divide-y divide-border/50">
                                                    {emp.records.length === 0 ? (
                                                        <p className="px-4 py-3 text-xs text-muted-foreground text-center">
                                                            No records in this date range
                                                        </p>
                                                    ) : emp.records.map((rec, i) => {
                                                        const cfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.ABSENT
                                                        let dateLabel = rec.date
                                                        try {
                                                            dateLabel = new Date(rec.date).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric", year: "numeric",
                                                            })
                                                        } catch { /* keep raw */ }

                                                        return (
                                                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-muted/20">
                                                                <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-22.5 shrink-0">
                                                                    {dateLabel}
                                                                </span>
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
                                                                    cfg.className,
                                                                )}>
                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                                    {cfg.label}
                                                                </span>
                                                                {(rec.time_in || rec.time_out) && (
                                                                    <span className="text-[10px] text-muted-foreground font-mono tabular-nums ml-auto shrink-0">
                                                                        {fmtTime(rec.time_in)} → {fmtTime(rec.time_out)}
                                                                    </span>
                                                                )}
                                                                {(rec.late_minutes ?? 0) > 0 && (
                                                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                                                        +{rec.late_minutes}m
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }) : (
                                    <div className="py-10 flex flex-col items-center gap-3 text-center">
                                        <UserCircle2 className="w-10 h-10 text-muted-foreground/20" />
                                        <p className="text-sm font-medium text-muted-foreground">No employee records available</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

// ─── Delta chip ───────────────────────────────────────────────────────────────

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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ departments, filters, onApply, onPrint }: {
    departments: string[]
    filters: Props["filters"]
    onApply: (f: Props["filters"]) => void
    onPrint: () => void
}) {
    const [local, setLocal] = useState(filters)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.date_from ? new Date(filters.date_from) : undefined,
        to: filters.date_to ? new Date(filters.date_to) : undefined,
    })

    function set<K extends keyof Props["filters"]>(k: K, v: string) {
        setLocal(f => ({ ...f, [k]: v }))
    }

    const isDirty = local.department !== "All Departments" || !!local.date_from || !!local.date_to

    function handleDateSelect(range: DateRange | undefined) {
        setDateRange(range)
        const from = range?.from ? format(range.from, "yyyy-MM-dd") : ""
        const to = range?.to ? format(range.to, "yyyy-MM-dd") : ""
        setLocal(f => ({ ...f, date_from: from, date_to: to }))
    }

    function reset() {
        const cleared = { department: "All Departments", date_from: "", date_to: "" }
        setLocal(cleared); setDateRange(undefined); onApply(cleared)
    }

    const dateLabel = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
            : format(dateRange.from, "MMM d, yyyy")
        : "Pick a date range"

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select value={local.department} onValueChange={v => { set("department", v); onApply({ ...local, department: v }) }}>
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

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-normal">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className={dateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                            {dateLabel}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                </PopoverContent>
            </Popover>

            <Button size="sm" className="h-8 text-xs" onClick={() => onApply(local)}>
                <ListFilter className="w-3.5 h-3.5 mr-1.5" /> Apply
            </Button>
            {isDirty && (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={reset}>
                    Reset
                </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                    onClick={() => router.get(
                        route("reports_and_analytics.attendance-report.index"),
                        {
                            department: local.department !== "All Departments" ? local.department : undefined,
                            date_from: local.date_from || undefined,
                            date_to: local.date_to || undefined,
                        },
                        { preserveScroll: true }
                    )}>
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>

                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={onPrint}>
                    <Printer className="w-3.5 h-3.5" /> Print Report
                </Button>
            </div>
        </div>
    )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

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
                        <Bar dataKey="present" name="Present" fill={C.present} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="late" name="Late" fill={C.late} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="half_day" name="Half Day" fill={C.halfDay} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent" name="Absent" fill={C.absent} radius={[4, 4, 0, 0]} />
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
                        <Bar yAxisId="c" dataKey="absent" name="Absent" fill={C.absent} radius={[3, 3, 0, 0]} opacity={0.45} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceReportIndex({
    summary,
    daily_breakdown,
    weekly_breakdown,
    monthly_trend,
    department_breakdown,
    departments,
    department_employees = {},
    filters: propFilters,
}: Props) {
    const [filters, setFilters] = useState(propFilters ?? { department: "All Departments", date_from: "", date_to: "" })

    // ── Drawer state ──────────────────────────────────────────────────────────
    const [selectedDept, setSelectedDept] = useState<DepartmentStat | null>(null)
    const drawerEmployees = useMemo(
        () => selectedDept ? (department_employees[selectedDept.department] ?? []) : [],
        [selectedDept, department_employees],
    )

    // ── Print dialog state ────────────────────────────────────────────────────
    const [printOpen, setPrintOpen] = useState(false)

    const depts = department_breakdown ?? []
    const s: Summary = summary ?? {
        total_employees:    0,
        present_today:      0,
        late_today:         0,
        absent_today:       0,
        half_day_today:     0,
        attendance_rate:    0,
        rate_delta:         0,
        rate_delta_direction: "same",
        on_leave_today:     0,
        on_leave_wp_today:  0,
        on_leave_np_today:  0,
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

                {/* ── Page header ───────────────────────────────────────── */}
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

                <FilterBar
                    departments={departments ?? []}
                    filters={filters}
                    onApply={applyFilters}
                    onPrint={() => setPrintOpen(true)}
                />

                {/* ── Stat cards — 6 columns ────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard title="Total Employees" value={s.total_employees} description="Active headcount"
                        icon={<Users className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Present Today" value={s.present_today} description="Clocked in or active"
                        icon={<UserCheck className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Late Today" value={s.late_today} description="Arrived after schedule"
                        icon={<AlertTriangle className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="Absent Today" value={s.absent_today} description="No attendance recorded"
                        icon={<UserX className="w-4 h-4 m-2 text-primary" />} />
                    <StatCard title="On Leave Today" value={s.on_leave_today} description={`WP: ${s.on_leave_wp_today ?? 0} · NP: ${s.on_leave_np_today ?? 0}`}
                        icon={<Umbrella className="w-4 h-4 m-2 text-primary" />} />
                </div>

                {/* ── Rate banner ───────────────────────────────────────── */}
                <Card className="border-l-4" style={rateAccentStyle}>
                    <CardContent className="py-3 px-5 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Today's Attendance Rate</p>
                                <p className="text-lg font-bold tabular-nums tracking-tight">{s.attendance_rate.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                            {[
                                { bgStyle: BG_COLOR.present, label: "Present",  val: s.present_today  },
                                { bgStyle: BG_COLOR.halfDay, label: "Half Day", val: s.half_day_today },
                                { bgStyle: BG_COLOR.late,    label: "Late",     val: s.late_today     },
                                { bgStyle: BG_COLOR.absent,  label: "Absent",   val: s.absent_today   },
                                // On Leave chip — inline blue dot
                                { bgStyle: { backgroundColor: "var(--color-blue-500, #3b82f6)" }, label: "On Leave", val: s.on_leave_today },
                            ].map(({ bgStyle, label, val }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={bgStyle} />
                                    {label} <span className="font-semibold text-foreground">{val}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Charts ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <DailyBreakdownChart data={daily_breakdown} />
                    <WeeklyRateChart data={weekly_breakdown} />
                </div>

                <MonthlyTrendChart data={monthly_trend} />

                {/* ── Department Breakdown ─────────────────────────────── */}
                <div className="flex flex-col gap-2">
                    <div>
                        <h2 className="text-base font-semibold tracking-tight">Department Breakdown</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Attendance by department · {depts.length} department{depts.length !== 1 ? "s" : ""} ·{" "}
                            <span className="font-semibold text-foreground">{deptTotals.total}</span> total employees
                            {" "}·{" "}
                            <span className="text-muted-foreground/60">click a row to view employees</span>
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
                        onRowClick={row => setSelectedDept(row.original)}
                    />
                </div>

            </div>

            {/* ── Department drawer ─────────────────────────────────────── */}
            <DeptDrawer
                dept={selectedDept}
                employees={drawerEmployees}
                onClose={() => setSelectedDept(null)}
            />

            {/* ── Print Export Dialog ───────────────────────────────────── */}
            <PrintExportDialog
                open={printOpen}
                onClose={() => setPrintOpen(false)}
                departments={departments ?? []}
                currentFilters={filters}
                reportRoute={route("reports_and_analytics.attendance-report.index")}
            />
        </AppLayout>
    )
}