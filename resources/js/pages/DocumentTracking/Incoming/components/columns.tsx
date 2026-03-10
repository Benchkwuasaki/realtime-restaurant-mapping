import { useState } from "react"
import { useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    ACTION_CONFIG,
    getRowActions,
    type ActionType,
} from "../data/data"
import { type IncomingRow, type Department } from "../data/schema"

// ─── Office Status Badge ──────────────────────────────────────────────────────

function OfficeStatusBadge({ status }: { status: string }) {
    const Icon = OFFICE_STATUS_ICON[status]
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${OFFICE_STATUS_PILL[status] ?? "bg-muted text-muted-foreground"}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {OFFICE_STATUS_LABEL[status] ?? status}
        </span>
    )
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function ReceiveDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const form = useForm({ remarks: "" })
    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking.receive", documentId), { onSuccess: onClose })
    }
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Receive Document</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Confirm that your department has received this document.
                    </p>
                    <div className="space-y-1.5">
                        <Label>Remarks <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea value={form.data.remarks} onChange={e => form.setData("remarks", e.target.value)} placeholder="Optional remarks…" rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>Confirm Receipt</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ForwardDialog({ documentId, departments, open, onClose }: { documentId: number; departments: Department[]; open: boolean; onClose: () => void }) {
    const form = useForm({ to_office_id: "", remarks: "" })
    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking.forward", documentId), { onSuccess: onClose })
    }
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Forward Document</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Forward To <span className="text-destructive">*</span></Label>
                        <Select value={form.data.to_office_id} onValueChange={v => form.setData("to_office_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Select department…" /></SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d.department_id} value={String(d.department_id)}>
                                        {d.department_acronym} — {d.department_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.to_office_id && <p className="text-xs text-destructive">{form.errors.to_office_id}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Remarks <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea value={form.data.remarks} onChange={e => form.setData("remarks", e.target.value)} placeholder="Optional forwarding note…" rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing || !form.data.to_office_id}>Forward</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ReturnDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const form = useForm({ remarks: "" })
    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking.return", documentId), { onSuccess: onClose })
    }
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Return Document</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The document will be returned to the department that last sent it here.
                    </p>
                    <div className="space-y-1.5">
                        <Label>Remarks <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea value={form.data.remarks} onChange={e => form.setData("remarks", e.target.value)} placeholder="Reason for returning…" rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="secondary" disabled={form.processing}>Return</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function CompleteDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const form = useForm({ remarks: "" })
    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking.complete", documentId), { onSuccess: onClose })
    }
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Complete Request</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Mark this request as completed. This will close the request.</p>
                    <div className="space-y-1.5">
                        <Label>Remarks <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea value={form.data.remarks} onChange={e => form.setData("remarks", e.target.value)} placeholder="Optional closing remarks…" rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={form.processing}>Mark Complete</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function CancelDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const form = useForm({ remarks: "" })
    function submit(e: React.FormEvent) {
        e.preventDefault()
        form.post(route("document-tracking.cancel", documentId), { onSuccess: onClose })
    }
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Cancel Request</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                        <p className="text-sm font-medium text-destructive">This will permanently cancel the request. This action cannot be undone.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Reason <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea value={form.data.remarks} onChange={e => form.setData("remarks", e.target.value)} placeholder="Reason for cancellation…" rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Keep Request</Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>Cancel Request</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Action Cell ──────────────────────────────────────────────────────────────
// Each row manages its own dialog state independently.

function ActionCell({ row, departments }: { row: IncomingRow; departments: Department[] }) {
    const [open, setOpen] = useState<ActionType | null>(null)
    const actions = getRowActions(row)

    return (
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
            {actions.map(action => {
                const cfg = ACTION_CONFIG[action]
                return (
                    <Button key={action} size="sm" className={cfg.className} onClick={() => setOpen(action)}>
                        {cfg.label}
                    </Button>
                )
            })}

            <ReceiveDialog documentId={row.id} open={open === "receive"} onClose={() => setOpen(null)} />
            <ForwardDialog documentId={row.id} departments={departments} open={open === "forward"} onClose={() => setOpen(null)} />
            <ReturnDialog documentId={row.id} open={open === "return"} onClose={() => setOpen(null)} />
            <CompleteDialog documentId={row.id} open={open === "complete"} onClose={() => setOpen(null)} />
            <CancelDialog documentId={row.id} open={open === "cancel"} onClose={() => setOpen(null)} />
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileIncomingCard({ row, departments }: { row: IncomingRow; departments: Department[] }) {
    const [open, setOpen] = useState<ActionType | null>(null)
    const actions = getRowActions(row)

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
                {/* Title + badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${OFFICE_STATUS_DOT[row.office_status] ?? "bg-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground truncate">{row.title}</span>
                    </div>
                    <OfficeStatusBadge status={row.office_status} />
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between pl-3.5 text-xs text-muted-foreground">
                    <span>From: <span className="font-medium text-foreground">{row.from_office?.acronym ?? "—"}</span></span>
                    <span>{row.days_stayed}</span>
                </div>
            </div>

            {/* Action footer */}
            {actions.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/30 flex-wrap">
                    {actions.map(action => {
                        const cfg = ACTION_CONFIG[action]
                        return (
                            <Button key={action} size="sm" className={cfg.className} onClick={() => setOpen(action)}>
                                {cfg.label}
                            </Button>
                        )
                    })}
                </div>
            )}

            <ReceiveDialog documentId={row.id} open={open === "receive"} onClose={() => setOpen(null)} />
            <ForwardDialog documentId={row.id} departments={departments} open={open === "forward"} onClose={() => setOpen(null)} />
            <ReturnDialog documentId={row.id} open={open === "return"} onClose={() => setOpen(null)} />
            <CompleteDialog documentId={row.id} open={open === "complete"} onClose={() => setOpen(null)} />
            <CancelDialog documentId={row.id} open={open === "cancel"} onClose={() => setOpen(null)} />
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(departments: Department[]): DataTableColumnDef<IncomingRow>[] {
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
            mobileCard: (row) => <MobileIncomingCard row={row} departments={departments} />,
        },

        // From Office
        {
            id: "from_office",
            accessorFn: row => row.from_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="From Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.from_office?.acronym ?? "—"}
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
                <span className="text-sm tabular-nums text-muted-foreground">{row.original.days_stayed}</span>
            ),
            enableSorting: false,
        },

        // Actions
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => <ActionCell row={row.original} departments={departments} />,
            enableSorting: false,
            enableHiding: false,
        },
    ]
}