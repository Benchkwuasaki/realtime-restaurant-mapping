import { useState } from "react"
import { router } from "@inertiajs/react"
import { route } from "ziggy-js"
import {
    MoreHorizontal,
    PackageCheck,
    ArrowRightCircle,
    Undo2,
    CheckCircle2,
    XCircle,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// ─── Shared state helpers ─────────────────────────────────────────────────────

interface DS { remarks: string; to_office_id: string; processing: boolean }
const EMPTY: DS = { remarks: "", to_office_id: "", processing: false }

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function ReceiveDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const [s, set] = useState(EMPTY)
    const close = () => { set(EMPTY); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <PackageCheck className="w-4 h-4 text-blue-500" /> Receive Document
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); set(s => ({ ...s, processing: true })); router.post(route("document-tracking-incoming.receive", documentId), { remarks: s.remarks }, { onSuccess: close, onError: () => set(s => ({ ...s, processing: false })) }) }}>
                    <div className="px-5 py-5 space-y-4">
                        <p className="text-sm text-muted-foreground">Confirm that your department has received this document.</p>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <Textarea value={s.remarks} onChange={e => set(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional remarks…" rows={3} className="text-sm resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Cancel</Button>
                        <Button type="submit" size="sm" disabled={s.processing} className="text-xs">{s.processing ? "Confirming…" : "Confirm Receipt"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ForwardDialog({ documentId, forwardOffices, open, onClose }: { documentId: number; forwardOffices: Department[]; open: boolean; onClose: () => void }) {
    const [s, set] = useState(EMPTY)
    const close = () => { set(EMPTY); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <ArrowRightCircle className="w-4 h-4 text-indigo-500" /> Forward Document
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); set(s => ({ ...s, processing: true })); router.post(route("document-tracking-incoming.forward", documentId), { to_office_id: s.to_office_id, remarks: s.remarks }, { onSuccess: close, onError: () => set(s => ({ ...s, processing: false })) }) }}>
                    <div className="px-5 py-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Forward To <span className="text-destructive">*</span></label>
                            <Select value={s.to_office_id} onValueChange={v => set(p => ({ ...p, to_office_id: v }))}>
                                <SelectTrigger className="text-sm"><SelectValue placeholder="Select department…" /></SelectTrigger>
                                <SelectContent>
                                    {forwardOffices.map(d => (
                                        <SelectItem key={d.department_id} value={String(d.department_id)}>
                                            {d.department_acronym} — {d.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <Textarea value={s.remarks} onChange={e => set(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional forwarding note…" rows={3} className="text-sm resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Cancel</Button>
                        <Button type="submit" size="sm" disabled={s.processing || !s.to_office_id} className="text-xs">{s.processing ? "Forwarding…" : "Forward"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ReturnDialog({ documentId, returnOffices, open, onClose }: { documentId: number; returnOffices: Department[]; open: boolean; onClose: () => void }) {
    const [s, set] = useState(EMPTY)
    const close = () => { set(EMPTY); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Undo2 className="w-4 h-4 text-yellow-500" /> Return Document
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); set(s => ({ ...s, processing: true })); router.post(route("document-tracking-incoming.return", documentId), { to_office_id: s.to_office_id, remarks: s.remarks }, { onSuccess: close, onError: () => set(s => ({ ...s, processing: false })) }) }}>
                    <div className="px-5 py-5 space-y-4">
                        <p className="text-sm text-muted-foreground">Select which department to return this document to. Only departments that have previously handled it are listed.</p>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Return To <span className="text-destructive">*</span></label>
                            {returnOffices.length === 0
                                ? <p className="text-xs text-muted-foreground italic">No previous departments found.</p>
                                : (
                                    <Select value={s.to_office_id} onValueChange={v => set(p => ({ ...p, to_office_id: v }))}>
                                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select department…" /></SelectTrigger>
                                        <SelectContent>
                                            {returnOffices.map(d => (
                                                <SelectItem key={d.department_id} value={String(d.department_id)}>
                                                    {d.department_acronym} — {d.department_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )
                            }
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <Textarea value={s.remarks} onChange={e => set(p => ({ ...p, remarks: e.target.value }))} placeholder="Reason for returning…" rows={3} className="text-sm resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Cancel</Button>
                        <Button type="submit" variant="secondary" size="sm" disabled={s.processing || !s.to_office_id || returnOffices.length === 0} className="text-xs">{s.processing ? "Returning…" : "Return"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function CompleteDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const [s, set] = useState(EMPTY)
    const close = () => { set(EMPTY); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Complete Request
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); set(s => ({ ...s, processing: true })); router.post(route("document-tracking-incoming.complete", documentId), { remarks: s.remarks }, { onSuccess: close, onError: () => set(s => ({ ...s, processing: false })) }) }}>
                    <div className="px-5 py-5 space-y-4">
                        <p className="text-sm text-muted-foreground">Mark this request as completed. It will be moved to the archive.</p>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <Textarea value={s.remarks} onChange={e => set(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional closing remarks…" rows={3} className="text-sm resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Cancel</Button>
                        <Button type="submit" size="sm" disabled={s.processing} className="bg-green-600 hover:bg-green-700 text-white text-xs">{s.processing ? "Completing…" : "Mark Complete"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function CancelDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const [s, set] = useState(EMPTY)
    const close = () => { set(EMPTY); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <XCircle className="w-4 h-4 text-destructive" /> Cancel Request
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); set(s => ({ ...s, processing: true })); router.post(route("document-tracking-incoming.cancel", documentId), { remarks: s.remarks }, { onSuccess: close, onError: () => set(s => ({ ...s, processing: false })) }) }}>
                    <div className="px-5 py-5 space-y-4">
                        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                            <p className="text-sm font-medium text-destructive">This will permanently cancel the request and move it to the archive. This action cannot be undone.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Reason <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <Textarea value={s.remarks} onChange={e => set(p => ({ ...p, remarks: e.target.value }))} placeholder="Reason for cancellation…" rows={3} className="text-sm resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Keep Request</Button>
                        <Button type="submit" variant="destructive" size="sm" disabled={s.processing} className="text-xs">{s.processing ? "Cancelling…" : "Cancel Request"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Action Cell ──────────────────────────────────────────────────────────────

function ActionCell({ row }: { row: IncomingRow }) {
    const [open, setOpen] = useState<ActionType | null>(null)
    const actions = getRowActions(row)

    if (actions.length === 0) return null

    const isPending = row.office_status === "pending_receipt"
    const isReceived = row.office_status === "received"

    return (
        <div onClick={e => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {isPending && (
                        <DropdownMenuItem onClick={() => setOpen("receive")} className="gap-2 cursor-pointer">
                            <PackageCheck className="w-4 h-4 text-blue-500" />
                            Receive
                        </DropdownMenuItem>
                    )}

                    {isReceived && (<>
                        <DropdownMenuItem onClick={() => setOpen("complete")} className="gap-2 cursor-pointer">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpen("forward")} className="gap-2 cursor-pointer">
                            <ArrowRightCircle className="w-4 h-4 text-indigo-500" />
                            Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpen("return")} className="gap-2 cursor-pointer">
                            <Undo2 className="w-4 h-4 text-yellow-500" />
                            Return
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setOpen("cancel")} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                            <XCircle className="w-4 h-4" />
                            Cancel Request
                        </DropdownMenuItem> */}
                    </>)}
                </DropdownMenuContent>
            </DropdownMenu>

            <ReceiveDialog documentId={row.id} open={open === "receive"} onClose={() => setOpen(null)} />
            <ForwardDialog documentId={row.id} forwardOffices={row.forward_offices} open={open === "forward"} onClose={() => setOpen(null)} />
            <ReturnDialog documentId={row.id} returnOffices={row.return_offices} open={open === "return"} onClose={() => setOpen(null)} />
            <CompleteDialog documentId={row.id} open={open === "complete"} onClose={() => setOpen(null)} />
            <CancelDialog documentId={row.id} open={open === "cancel"} onClose={() => setOpen(null)} />
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileIncomingCard({ row }: { row: IncomingRow }) {
    const [open, setOpen] = useState<ActionType | null>(null)
    const actions = getRowActions(row)

    const isPending = row.office_status === "pending_receipt"
    const isReceived = row.office_status === "received"

    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${OFFICE_STATUS_DOT[row.office_status] ?? "bg-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground truncate">{row.title}</span>
                    </div>
                    <OfficeStatusBadge status={row.office_status} />
                </div>
                <div className="flex items-center justify-between pl-3.5 text-xs text-muted-foreground">
                    <span>From: <span className="font-medium text-foreground">{row.from_office?.acronym ?? "—"}</span></span>
                    <span>{row.elapsed_time}</span>
                </div>
            </div>

            {actions.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="text-xs gap-1.5">
                                Actions <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isPending && (
                                <DropdownMenuItem onClick={() => setOpen("receive")} className="gap-2 cursor-pointer">
                                    <PackageCheck className="w-4 h-4 text-blue-500" /> Receive
                                </DropdownMenuItem>
                            )}
                            {isReceived && (<>
                                <DropdownMenuItem onClick={() => setOpen("complete")} className="gap-2 cursor-pointer">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setOpen("forward")} className="gap-2 cursor-pointer">
                                    <ArrowRightCircle className="w-4 h-4 text-indigo-500" /> Forward
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setOpen("return")} className="gap-2 cursor-pointer">
                                    <Undo2 className="w-4 h-4 text-yellow-500" /> Return
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setOpen("cancel")} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                    <XCircle className="w-4 h-4" /> Cancel Request
                                </DropdownMenuItem>
                            </>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <ReceiveDialog documentId={row.id} open={open === "receive"} onClose={() => setOpen(null)} />
            <ForwardDialog documentId={row.id} forwardOffices={row.forward_offices} open={open === "forward"} onClose={() => setOpen(null)} />
            <ReturnDialog documentId={row.id} returnOffices={row.return_offices} open={open === "return"} onClose={() => setOpen(null)} />
            <CompleteDialog documentId={row.id} open={open === "complete"} onClose={() => setOpen(null)} />
            <CancelDialog documentId={row.id} open={open === "cancel"} onClose={() => setOpen(null)} />
        </div>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns(): DataTableColumnDef<IncomingRow>[] {
    return [
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
        {
            id: "title",
            accessorKey: "title",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span>,
            mobileCard: (row) => <MobileIncomingCard row={row} />,
        },
        {
            id: "from_office",
            accessorFn: row => row.from_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="From Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{row.original.from_office?.acronym ?? "—"}</span>
            ),
        },
        {
            accessorKey: "office_status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => <OfficeStatusBadge status={row.original.office_status} />,
            filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: "elapsed_time",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Elapsed Time" />,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums text-muted-foreground">{row.original.elapsed_time}</span>
            ),
            enableSorting: false,
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => <ActionCell row={row.original} />,
            enableSorting: false,
            enableHiding: false,
        },
    ]
}
