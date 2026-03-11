import { useState } from "react"
import { router, useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { type DataTableColumnDef } from "@/components/shared/data-table/types/data-table-types"
import {
    OFFICE_STATUS_PILL,
    OFFICE_STATUS_LABEL,
    OFFICE_STATUS_ICON,
    OFFICE_STATUS_DOT,
    REQUEST_STATUS_PILL,
    REQUEST_STATUS_LABEL,
} from "../data/data"
import { type OutgoingRow } from "../data/schema"

// ─── Badges ───────────────────────────────────────────────────────────────────

function OfficeStatusBadge({ status }: { status: string }) {
    const Icon = OFFICE_STATUS_ICON[status]
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${OFFICE_STATUS_PILL[status] ?? "bg-muted text-muted-foreground"}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {OFFICE_STATUS_LABEL[status] ?? status}
        </span>
    )
}

function RequestStatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${REQUEST_STATUS_PILL[status] ?? "bg-muted text-muted-foreground"}`}>
            {REQUEST_STATUS_LABEL[status] ?? status}
        </span>
    )
}

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({
    documentId,
    open,
    onClose,
}: {
    documentId: number
    open: boolean
    onClose: () => void
}) {
    const form = useForm({ remarks: "" })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking-outgoing.cancel", documentId), { onSuccess: onClose })
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Cancel Request</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                        <p className="text-sm font-medium text-destructive">
                            This will permanently cancel the request. This action cannot be undone.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Reason <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea
                            value={form.data.remarks}
                            onChange={e => form.setData("remarks", e.target.value)}
                            placeholder="Reason for cancellation…"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Keep Request</Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            Cancel Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Action Cell ──────────────────────────────────────────────────────────────

function ActionCell({
    row,
    departmentId,
}: {
    row: OutgoingRow
    departmentId: number
}) {
    const [cancelOpen, setCancelOpen] = useState(false)

    // Cancel is only available if this dept is the origin and request is still active
    const canCancel =
        row.origin_office_id === departmentId &&
        !["completed", "cancelled"].includes(row.status)

    return (
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
            <Button
                size="sm"
                variant="outline"
                onClick={() => router.visit(route("document-tracking.show", row.id))}
            >
                View
            </Button>
            {canCancel && (
                <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
                    Cancel
                </Button>
            )}
            <CancelDialog
                documentId={row.id}
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
            />
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileOutgoingCard({
    row,
    departmentId,
    showOrigin,
}: {
    row: OutgoingRow
    departmentId: number
    showOrigin: boolean
}) {
    const [cancelOpen, setCancelOpen] = useState(false)

    const canCancel =
        row.origin_office_id === departmentId &&
        !["completed", "cancelled"].includes(row.status)

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
                {/* Title + office status */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${OFFICE_STATUS_DOT[row.office_status] ?? "bg-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground truncate">{row.title}</span>
                    </div>
                    <OfficeStatusBadge status={row.office_status} />
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between pl-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {showOrigin && (
                            <span>Origin: <span className="font-medium text-foreground">{row.origin_office?.acronym ?? "—"}</span></span>
                        )}
                        <span>Current: <span className="font-medium text-foreground">{row.current_office?.acronym ?? "—"}</span></span>
                    </div>
                    <span>{row.days_stayed}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.visit(route("document-tracking.show", row.id))}
                >
                    View
                </Button>
                {canCancel && (
                    <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
                        Cancel
                    </Button>
                )}
            </div>

            <CancelDialog
                documentId={row.id}
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
            />
        </div>
    )
}

// ─── Columns factory ──────────────────────────────────────────────────────────
// showOrigin: true on "Other Offices" tab to show the Origin Office column.

export function getColumns(
    departmentId: number,
    showOrigin: boolean,
): DataTableColumnDef<OutgoingRow>[] {
    return [
        // Select
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={v => row.toggleSelected(!!v)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={e => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // Title
        {
            id: "title",
            accessorKey: "title",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.title}</span>
            ),
            mobileCard: (row) => (
                <MobileOutgoingCard
                    row={row}
                    departmentId={departmentId}
                    showOrigin={showOrigin}
                />
            ),
        },

        // Origin Office — only on "Other Offices" tab
        ...(showOrigin ? [{
            id: "origin_office",
            accessorFn: (row: OutgoingRow) => row.origin_office?.acronym ?? "",
            header: ({ column }: any) => <DataTableColumnHeader column={column} title="Origin" />,
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.origin_office?.acronym ?? "—"}
                </span>
            ),
        }] as DataTableColumnDef<OutgoingRow>[] : []),

        // Current Office
        {
            id: "current_office",
            accessorFn: row => row.current_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Current Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.current_office?.acronym ?? "—"}
                </span>
            ),
        },

        // Office Status
        {
            accessorKey: "office_status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => <OfficeStatusBadge status={row.original.office_status} />,
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },

        // Days Stayed
        {
            accessorKey: "days_stayed",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Days Stayed" />,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums text-muted-foreground">
                    {row.original.days_stayed}
                </span>
            ),
            enableSorting: false,
        },

        // Actions
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <ActionCell row={row.original} departmentId={departmentId} />
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ]
}