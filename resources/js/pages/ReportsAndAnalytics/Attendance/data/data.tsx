import { TrendingUp, TrendingDown, Minus } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentStat {
    department: string
    total: number
    present: number
    late: number
    absent: number
    half_day: number
    rate: number   // attendance rate %
}

export interface DailyStat {
    day: string    // e.g. "Mon"
    date: string   // ISO date
    present: number
    late: number
    absent: number
    half_day: number
}

export interface WeeklyStat {
    week: string   // e.g. "Wk 1"
    present: number
    absent: number
    late: number
    rate: number
}

export interface MonthlyTrend {
    month: string  // e.g. "Jan"
    rate: number
    trend: number
}

export interface Summary {
    total_employees: number
    present_today: number
    late_today: number
    absent_today: number
    half_day_today: number
    attendance_rate: number
    rate_delta: number
    rate_delta_direction: "up" | "down" | "same"
}

// ─── Rate category ────────────────────────────────────────────────────────────

export type RateCategory = "good" | "average" | "poor"

export function rateCategory(rate: number): RateCategory {
    if (rate >= 92) return "good"
    if (rate >= 85) return "average"
    return "poor"
}

// ─── Filter options (for DataTableFacetedFilter) ──────────────────────────────

export const ratingOptions = [
    { value: "good",    label: "Good (≥ 92%)"     },
    { value: "average", label: "Average (85–91%)"  },
    { value: "poor",    label: "Poor (< 85%)"      },
]

// ─── Rate category display maps ───────────────────────────────────────────────

export const RATE_PILL: Record<RateCategory, string> = {
    good:    "bg-emerald-500 text-white border-emerald-500",
    average: "bg-amber-500   text-white border-amber-500",
    poor:    "bg-destructive text-destructive-foreground border-destructive",
}

export const RATE_BAR_FILL: Record<RateCategory, string> = {
    good:    "bg-emerald-500",
    average: "bg-amber-500",
    poor:    "bg-destructive",
}

export const RATE_TEXT: Record<RateCategory, string> = {
    good:    "text-emerald-600 dark:text-emerald-400",
    average: "text-amber-600   dark:text-amber-400",
    poor:    "text-destructive",
}

export const RATE_LABEL: Record<RateCategory, string> = {
    good:    "Good",
    average: "Average",
    poor:    "Poor",
}

export const RATE_ICON = {
    good:    TrendingUp,
    average: Minus,
    poor:    TrendingDown,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute aggregate totals across an array of DepartmentStat rows */
export function computeDeptTotals(rows: DepartmentStat[] | undefined | null) {
    const safe = rows ?? []
    return {
        total:    safe.reduce((s, r) => s + r.total,    0),
        present:  safe.reduce((s, r) => s + r.present,  0),
        late:     safe.reduce((s, r) => s + r.late,     0),
        half_day: safe.reduce((s, r) => s + r.half_day, 0),
        absent:   safe.reduce((s, r) => s + r.absent,   0),
        avgRate:  safe.length > 0
            ? safe.reduce((s, r) => s + r.rate, 0) / safe.length
            : 0,
    }
}