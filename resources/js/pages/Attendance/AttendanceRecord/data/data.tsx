import { UserCheck, Coffee, UserX } from "lucide-react"
import type { AttendanceRecord } from "./schema"

// ─── Status options (for faceted filter) ─────────────────────────────────────

export const statusOptions = [
    { value: "PRESENT",  label: "Present"  },
    { value: "HALF_DAY", label: "Half Day" },
    { value: "ABSENT",   label: "Absent"   },
]

// ─── Status pill styles ───────────────────────────────────────────────────────

export const STATUS_PILL: Record<string, string> = {
    PRESENT:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    HALF_DAY: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    ABSENT:   "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
}

export const STATUS_DOT: Record<string, string> = {
    PRESENT:  "bg-emerald-400",
    HALF_DAY: "bg-amber-400",
    ABSENT:   "bg-rose-400",
}

// Human-readable labels shown in pills and dialogs
export const STATUS_LABEL: Record<string, string> = {
    PRESENT:  "Present",
    HALF_DAY: "Half Day",
    ABSENT:   "Absent",
}

// Short descriptions used in stat cards
export const STATUS_DESCRIPTION: Record<string, string> = {
    PRESENT:  "Clocked in or actively working",
    HALF_DAY: "Left before time out",
    // Absent = no clock-in AND no break_out scan. May still have a break_in
    // entry if the employee scanned arriving from lunch but never clocked in.
    ABSENT:   "No clock-in recorded",
}

export const STATUS_ICON = {
    PRESENT:  UserCheck,
    HALF_DAY: Coffee,
    ABSENT:   UserX,
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