import { UserCheck, Coffee, UserX, SquareArrowRight, Banknote } from "lucide-react"
import type { AttendanceRecord } from "./schema"

// ─── Status options (for faceted filter) ─────────────────────────────────────

export const statusOptions = [
    { value: "PRESENT",      label: "Present"            },
    { value: "HALF_DAY",     label: "Half Day"           },
    { value: "ABSENT",       label: "Absent"             },
    { value: "ON_LEAVE_WP",  label: "On Leave (With Pay)"    },
    { value: "ON_LEAVE_NP",  label: "On Leave (No Pay)"      },
]

// ─── Status pill styles ───────────────────────────────────────────────────────

export const STATUS_PILL: Record<string, string> = {
    PRESENT:     "bg-emerald-500 text-white border-emerald-500",
    HALF_DAY:    "bg-yellow-500  text-white border-yellow-500",
    ABSENT:      "bg-destructive text-white border-destructive [a&]:hover:bg-destructive/90",
    ON_LEAVE_WP: "bg-blue-500    text-white border-blue-500",
    ON_LEAVE_NP: "bg-indigo-500  text-white border-indigo-500",
}

export const STATUS_DOT: Record<string, string> = {
    PRESENT:     "bg-emerald-500",
    HALF_DAY:    "bg-yellow-500",
    ABSENT:      "bg-destructive",
    ON_LEAVE_WP: "bg-blue-500",
    ON_LEAVE_NP: "bg-indigo-500",
}

// Human-readable labels shown in pills and dialogs
export const STATUS_LABEL: Record<string, string> = {
    PRESENT:     "Present",
    HALF_DAY:    "Half Day",
    ABSENT:      "Absent",
    ON_LEAVE_WP: "On Leave (WP)",
    ON_LEAVE_NP: "On Leave (NP)",
}

// Short descriptions used in stat cards
export const STATUS_DESCRIPTION: Record<string, string> = {
    PRESENT:     "Clocked in or actively working",
    HALF_DAY:    "Left before time out",
    ABSENT:      "No clock-in recorded",
    ON_LEAVE_WP: "On approved leave — with pay",
    ON_LEAVE_NP: "On approved leave — no pay",
}

export const STATUS_ICON = {
    PRESENT:     UserCheck,
    HALF_DAY:    Coffee,
    ABSENT:      UserX,
    ON_LEAVE_WP: Banknote,
    ON_LEAVE_NP: SquareArrowRight,
}

// ─── Leave status helper ──────────────────────────────────────────────────────

export function isOnLeave(status: string): boolean {
    return status === "ON_LEAVE_WP" || status === "ON_LEAVE_NP"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getEmployeeName(record: AttendanceRecord): string {
    const b = record.employee?.basic_info
    return b ? `${b.first_name} ${b.last_name}` : `#${record.employee_id}`
}

/** HH:MM:SS → 12-hour string, e.g. "08:05 AM" */
export function fmtTime(t: string | null): string {
    if (!t) return "—"
    const [h, m] = t.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const h12  = h % 12 || 12
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

/** Whole minutes → "Xh Ym" or "Ym" */
export function fmtMinutes(min: number | null | undefined): string {
    if (min == null) return "—"
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}