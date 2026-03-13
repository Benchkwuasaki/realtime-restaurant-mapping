import { CheckCircle2, XCircle } from "lucide-react"

// ─── Faceted filter options ───────────────────────────────────────────────────

export const requestStatusOptions = [
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
]

// ─── Request status display maps ─────────────────────────────────────────────

export const REQUEST_STATUS_PILL: Record<string, string> = {
    completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
}

export const REQUEST_STATUS_LABEL: Record<string, string> = {
    completed: "Completed",
    cancelled: "Cancelled",
}

export const REQUEST_STATUS_ICON: Record<string, React.ElementType> = {
    completed: CheckCircle2,
    cancelled: XCircle,
}