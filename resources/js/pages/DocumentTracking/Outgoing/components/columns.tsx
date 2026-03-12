import { useState } from "react"
import { router } from "@inertiajs/react"
import { route } from "ziggy-js"
import {
    MoreHorizontal,
    Eye,
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

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({ documentId, open, onClose }: { documentId: number; open: boolean; onClose: () => void }) {
    const [remarks, setRemarks] = useState("")
    const [processing, setProcessing] = useState(false)

    function close() { setRemarks(""); setProcessing(false); onClose() }

    return (
        <Dialog open={open} onOpenChange={v => !v && close()}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <XCircle className="w-4 h-4 text-destructive" /> Cancel Request
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={e => {
                    e.preventDefault()
                    setProcessing(true)
                    router.post(
                        route("document-tracking.outgoing.cancel", documentId),
                        { remarks },
                        { onSuccess: close, onError: () => setProcessing(false) },
                    )
                }}>
                    <div className="px-5 py-5 space-y-4">
                        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                            <p className="text-sm font-medium text-destructive">
                                This will permanently cancel the request and move it to the archive. This action cannot be undone.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">
                                Reason <span className="text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <Textarea
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Reason for cancellation…"
                                rows={3}
                                className="text-sm resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={close} className="text-xs">Keep Request</Button>
                        <Button type="submit" variant="destructive" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Cancelling…" : "Cancel Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Action Cell ──────────────────────────────────────────────────────────────

function ActionCell({ row, departmentId }: { row: OutgoingRow; departmentId: number }) {
    const [cancelOpen, setCancelOpen] = useState(false)
    const canCancel = row.origin_office_id === departmentId && !["completed", "cancelled"].includes(row.status)

    return (
        <div onClick={e => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                    {canCancel && (<>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setCancelOpen(true)}
                            variant="destructive"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Request
                        </DropdownMenuItem>
                    </>)}
                </DropdownMenuContent>
            </DropdownMenu>

            <CancelDialog documentId={row.id} open={cancelOpen} onClose={() => setCancelOpen(false)} />
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileOutgoingCard({ row, departmentId, showOrigin }: { row: OutgoingRow; departmentId: number; showOrigin: boolean }) {
    const [cancelOpen, setCancelOpen] = useState(false)
    const canCancel = row.origin_office_id === departmentId && !["completed", "cancelled"].includes(row.status)

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
                    <div className="flex items-center gap-3">
                        {showOrigin && (
                            <span>Origin: <span className="font-medium text-foreground">{row.origin_office?.acronym ?? "—"}</span></span>
                        )}
                        <span>Current: <span className="font-medium text-foreground">{row.current_office?.acronym ?? "—"}</span></span>
                    </div>
                    <span>{row.elapsed_time}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs gap-1.5">
                            Actions <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.visit(route("document-tracking.show", row.id))}
                            className="gap-2 cursor-pointer"
                        >
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                        </DropdownMenuItem>
                        {canCancel && (<>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setCancelOpen(true)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                                <XCircle className="w-4 h-4" /> Cancel Request
                            </DropdownMenuItem>
                        </>)}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <CancelDialog documentId={row.id} open={cancelOpen} onClose={() => setCancelOpen(false)} />
        </div>
    )
}

// ─── Columns factory ──────────────────────────────────────────────────────────

export function getColumns(departmentId: number, showOrigin: boolean): DataTableColumnDef<OutgoingRow>[] {
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
            mobileCard: (row) => <MobileOutgoingCard row={row} departmentId={departmentId} showOrigin={showOrigin} />,
        },
        ...(showOrigin ? [{
            id: "origin_office",
            accessorFn: (row: OutgoingRow) => row.origin_office?.acronym ?? "",
            header: ({ column }: any) => <DataTableColumnHeader column={column} title="Origin" />,
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">{row.original.origin_office?.acronym ?? "—"}</span>
            ),
        }] as DataTableColumnDef<OutgoingRow>[] : []),
        {
            id: "current_office",
            accessorFn: row => row.current_office?.acronym ?? "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Current Office" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{row.original.current_office?.acronym ?? "—"}</span>
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
            cell: ({ row }) => <ActionCell row={row.original} departmentId={departmentId} />,
            enableSorting: false,
            enableHiding: false,
        },
    ]
}
