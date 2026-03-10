import { Clock, CheckCircle2, XCircle } from "lucide-react"
import type { IncomingRow } from "./schema"

// ─── Faceted filter options ───────────────────────────────────────────────────

export const officeStatusOptions = [
    { value: "pending_receipt", label: "Pending Receipt" },
    { value: "received", label: "Received" },
]

// ─── Office status display maps ───────────────────────────────────────────────

export const OFFICE_STATUS_PILL: Record<string, string> = {
    pending_receipt: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    received: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
}

export const OFFICE_STATUS_DOT: Record<string, string> = {
    pending_receipt: "bg-yellow-400",
    received: "bg-blue-400",
    done: "bg-green-400",
}

export const OFFICE_STATUS_LABEL: Record<string, string> = {
    pending_receipt: "Pending Receipt",
    received: "Received",
    done: "Done",
}

export const OFFICE_STATUS_ICON: Record<string, React.ElementType> = {
    pending_receipt: Clock,
    received: CheckCircle2,
    done: CheckCircle2,
}

// ─── Action button display config ─────────────────────────────────────────────

export const ACTION_CONFIG = {
    receive: { label: "Receive", className: "bg-blue-600 hover:bg-blue-700 text-white" },
    complete: { label: "Complete", className: "bg-green-600 hover:bg-green-700 text-white" },
    forward: { label: "Forward", className: "bg-indigo-600 hover:bg-indigo-700 text-white" },
    return: { label: "Return", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
    cancel: { label: "Cancel", className: "bg-destructive hover:bg-destructive/90 text-white" },
} as const

export type ActionType = keyof typeof ACTION_CONFIG

// ─── Derive available actions from status fields (no can_* flags) ─────────────

export function getRowActions(row: IncomingRow): ActionType[] {
    if (row.office_status === "pending_receipt") return ["receive"]
    if (row.office_status === "received") return ["complete", "forward", "return", "cancel"]
    return []
}