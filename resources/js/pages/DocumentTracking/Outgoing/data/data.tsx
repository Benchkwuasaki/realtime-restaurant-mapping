import { Clock, CheckCircle2, XCircle } from "lucide-react"

// ─── Faceted filter options ───────────────────────────────────────────────────

export const officeStatusOptions = [
    { value: "pending_receipt", label: "Pending Receipt" },
    { value: "received", label: "Received" },
    { value: "done", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
]

export const requestStatusOptions = [
    { value: "filed", label: "Filed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
]

// ─── Office status display maps ───────────────────────────────────────────────

export const OFFICE_STATUS_PILL: Record<string, string> = {
    pending_receipt: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    received: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
}

export const OFFICE_STATUS_DOT: Record<string, string> = {
    pending_receipt: "bg-yellow-400",
    received: "bg-blue-400",
    done: "bg-green-400",
    cancelled: "bg-red-400",
}

export const OFFICE_STATUS_LABEL: Record<string, string> = {
    pending_receipt: "Pending Receipt",
    received: "Received",
    done: "Done",
    cancelled: "Cancelled",
}

export const OFFICE_STATUS_ICON: Record<string, React.ElementType> = {
    pending_receipt: Clock,
    received: CheckCircle2,
    done: CheckCircle2,
    cancelled: XCircle,
}

// ─── Request status display maps ─────────────────────────────────────────────

export const REQUEST_STATUS_PILL: Record<string, string> = {
    filed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
}

export const REQUEST_STATUS_LABEL: Record<string, string> = {
    filed: "Filed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
}