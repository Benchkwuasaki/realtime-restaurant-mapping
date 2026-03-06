'use client';

import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { EllipsisVertical, Pen, Send, Ban, CheckCircle, XCircle } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { LeaveFiling } from '../data/schema';

interface ColumnOptions {
    onEdit: (app: LeaveFiling) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function calcDaysApplied(start?: string | null, end?: string | null): number | null {
    if (!start || !end) return null;
    const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
}

function employeeName(row: LeaveFiling): string {
    return (row as any).employee?.employee_name ?? `Employee #${row.employee_id}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
    'Pending':          'bg-yellow-100 text-yellow-800 border-yellow-200',
    'For Approval':     'bg-blue-100 text-blue-800 border-blue-200',
    'For Disapproval':  'bg-orange-100 text-orange-800 border-orange-200',
    'Approved':         'bg-green-100 text-green-800 border-green-200',
    'Disapproved':      'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge variant="outline" className={`text-xs font-medium ${STATUS_CLASS[status] ?? ''}`}>
            {status}
        </Badge>
    );
}

// ─── Reason Dialog ────────────────────────────────────────────────────────────

interface ReasonDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmClassName?: string;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

function ReasonDialog({
    open, title, description, confirmLabel, confirmClassName, onConfirm, onClose,
}: ReasonDialogProps) {
    const [reason, setReason] = useState('');

    function handleClose() {
        setReason('');
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
                </DialogHeader>
                <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="State the reason..."
                        rows={3}
                        className="text-sm resize-none"
                    />
                </div>
                <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                    <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!reason.trim()}
                        onClick={() => onConfirm(reason)}
                        className={`text-xs ${confirmClassName ?? ''}`}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Approve Dialog ───────────────────────────────────────────────────────────

interface ApproveDialogProps {
    open: boolean;
    app: LeaveFiling | null;
    onClose: () => void;
}

function ApproveDialog({ open, app, onClose }: ApproveDialogProps) {
    const [specifics, setSpecifics] = useState('');
    const [processing, setProcessing] = useState(false);
    const days = calcDaysApplied(app?.start_date, app?.end_date);

    function handleClose() {
        setSpecifics('');
        setProcessing(false);
        onClose();
    }

    function handleConfirm() {
        if (!app) return;
        setProcessing(true);
        router.patch(
            route('leave.leave-application.update-status', app.leave_application_id),
            { status: 'Approved', approved_for_specifics: specifics },
            {
                preserveScroll: true,
                onSuccess: () => { toast.success('Leave application approved.'); handleClose(); },
                onError:   () => { toast.error('Failed to approve.'); setProcessing(false); },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="text-sm font-semibold">Approve Leave Application</DialogTitle>
                </DialogHeader>
                <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Approve leave for{' '}
                        <span className="font-medium text-foreground">{app ? employeeName(app) : ''}</span>
                        {days ? ` (${days} day${days !== 1 ? 's' : ''})` : ''}?
                    </p>
                    <div>
                        <label className="text-xs font-medium block mb-1.5">
                            Approved For{' '}
                            <span className="text-muted-foreground font-normal">(Specifics — optional)</span>
                        </label>
                        <Input
                            value={specifics}
                            onChange={(e) => setSpecifics(e.target.value)}
                            placeholder="e.g. 5 days with pay"
                            className="text-sm"
                        />
                    </div>
                </div>
                <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                    <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={processing}
                        onClick={handleConfirm}
                        className="text-xs bg-green-700 hover:bg-green-800 text-white"
                    >
                        {processing ? 'Saving…' : 'Confirm Approval'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Kebab Row Actions ────────────────────────────────────────────────────────
//
// Permission rules per status:
//   Pending          → Recommend, For Disapproval, Edit  (no Delete)
//   For Approval     → Approve, Disapprove               (no Edit, no Delete)
//   For Disapproval  → Approve, Disapprove               (no Edit, no Delete)
//   Approved         → (no actions)
//   Disapproved      → (no actions)

interface RowActionsProps {
    row: LeaveFiling;
    onEdit: (app: LeaveFiling) => void;
}

function RowActions({ row, onEdit }: RowActionsProps) {
    const [recommendOpen,  setRecommendOpen]  = useState(false);
    const [forDisapprOpen, setForDisapprOpen] = useState(false);
    const [approveOpen,    setApproveOpen]    = useState(false);
    const [disapproveOpen, setDisapproveOpen] = useState(false);

    const status = row.status;

    // Terminal statuses — no actions available
    if (status === 'Approved' || status === 'Disapproved') {
        return null;
    }

    function handleRecommend() {
        router.patch(
            route('leave.leave-application.update-status', row.leave_application_id),
            { status: 'For Approval' },
            {
                preserveScroll: true,
                onSuccess: () => { toast.success('Recommended for approval.'); setRecommendOpen(false); },
                onError:   () => toast.error('Failed to update status.'),
            },
        );
    }

    function handleForDisapproval(reason: string) {
        router.patch(
            route('leave.leave-application.update-status', row.leave_application_id),
            { status: 'For Disapproval', for_disapproval_reason: reason },
            {
                preserveScroll: true,
                onSuccess: () => { toast.success('Marked for disapproval.'); setForDisapprOpen(false); },
                onError:   () => toast.error('Failed to update status.'),
            },
        );
    }

    function handleDisapprove(reason: string) {
        router.patch(
            route('leave.leave-application.update-status', row.leave_application_id),
            { status: 'Disapproved', disapproved_reason: reason },
            {
                preserveScroll: true,
                onSuccess: () => { toast.success('Leave application disapproved.'); setDisapproveOpen(false); },
                onError:   () => toast.error('Failed to update status.'),
            },
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="sr-only">Open menu</span>
                        <EllipsisVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>

                    {/* ── Pending: Recommending Officer acts + Edit ── */}
                    {status === 'Pending' && (
                        <>
                            <DropdownMenuItem
                                className="text-xs gap-2 text-green-700 focus:text-green-700 focus:bg-green-50"
                                onClick={() => setRecommendOpen(true)}
                            >
                                <Send className="w-3.5 h-3.5" />
                                Recommend for Approval
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-xs gap-2 text-orange-700 focus:text-orange-700 focus:bg-orange-50"
                                onClick={() => setForDisapprOpen(true)}
                            >
                                <Ban className="w-3.5 h-3.5" />
                                For Disapproval
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-xs gap-2"
                                onClick={() => onEdit(row)}
                            >
                                <Pen className="w-3.5 h-3.5" />
                                Edit
                            </DropdownMenuItem>
                        </>
                    )}

                    {/* ── For Approval / For Disapproval: Approving Officer acts only ── */}
                    {(status === 'For Approval' || status === 'For Disapproval') && (
                        <>
                            <DropdownMenuItem
                                className="text-xs gap-2 text-green-700 focus:text-green-700 focus:bg-green-50"
                                onClick={() => setApproveOpen(true)}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-xs gap-2 text-red-700 focus:text-red-700 focus:bg-red-50"
                                onClick={() => setDisapproveOpen(true)}
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Disapprove
                            </DropdownMenuItem>
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Recommend confirmation ── */}
            <AlertDialog open={recommendOpen} onOpenChange={setRecommendOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Recommend this application?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will forward the leave application of{' '}
                            <span className="font-medium text-foreground">{employeeName(row)}</span>{' '}
                            for approval.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-700 hover:bg-green-800 text-white"
                            onClick={handleRecommend}
                        >
                            Recommend
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── For Disapproval reason ── */}
            <ReasonDialog
                open={forDisapprOpen}
                title="Recommend for Disapproval"
                description="Please provide the reason for recommending this application for disapproval."
                confirmLabel="Mark for Disapproval"
                confirmClassName="bg-orange-600 hover:bg-orange-700 text-white"
                onConfirm={handleForDisapproval}
                onClose={() => setForDisapprOpen(false)}
            />

            {/* ── Approve dialog ── */}
            <ApproveDialog
                open={approveOpen}
                app={row}
                onClose={() => setApproveOpen(false)}
            />

            {/* ── Disapprove reason ── */}
            <ReasonDialog
                open={disapproveOpen}
                title="Disapprove Application"
                description="Please provide the reason for disapproving this leave application."
                confirmLabel="Disapprove"
                confirmClassName="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onConfirm={handleDisapprove}
                onClose={() => setDisapproveOpen(false)}
            />
        </>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileLeaveCard({ row, onEdit }: { row: LeaveFiling; onEdit: (app: LeaveFiling) => void }) {
    const days = calcDaysApplied(row.start_date, row.end_date);
    return (
        <div className="flex flex-col -mx-3 -my-1.5">
            <div className="px-3 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug">{employeeName(row)}</p>
                    <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-muted-foreground">{row.leave_type_availed ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                    {days ? ` · ${days} day${days !== 1 ? 's' : ''}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">Filed: {formatDate(row.date_of_filing)}</p>
            </div>
            <div className="border-t border-secondary px-3 py-2.5 flex items-center justify-end">
                <RowActions row={row} onEdit={onEdit} />
            </div>
        </div>
    );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({ onEdit }: ColumnOptions): DataTableColumnDef<LeaveFiling>[] {
    return [
        // ── Checkbox ──
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // ── Employee ──
        {
            id: 'employee_name',
            accessorFn: (row) => employeeName(row),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ getValue }) => (
                <div className="min-w-40 font-medium">{getValue() as string}</div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => <MobileLeaveCard row={row} onEdit={onEdit} />,
        },

        // ── Leave Type ──
        {
            accessorKey: 'leave_type_availed',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 text-sm">{row.getValue('leave_type_availed') ?? '—'}</div>
            ),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
        },

        // ── Date Filed ──
        {
            accessorKey: 'date_of_filing',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date Filed" />
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(row.getValue('date_of_filing'))}
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },

        // ── Inclusive Dates ──
        {
            id: 'inclusive_dates',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Inclusive Dates" />
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(row.original.start_date)} — {formatDate(row.original.end_date)}
                </span>
            ),
            enableSorting: false,
            enableHiding: true,
        },

        // ── Days Applied ──
        {
            id: 'days_applied',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Days Applied" />
            ),
            cell: ({ row }) => {
                const days = calcDaysApplied(row.original.start_date, row.original.end_date);
                return days != null ? (
                    <p className="text-muted-foreground text-sm">{days} days</p>
                ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // ── Status ──
        // is_with_pay is kept as a hidden filter-only column (no visible cell)
        {
            accessorKey: 'is_with_pay',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            enableSorting: false,
            enableHiding: true,
            header: () => null,
            cell: () => null,
        },
        {
            accessorKey: 'status',
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
            enableSorting: true,
            enableHiding: true,
        },

        // ── Actions (kebab) ──
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => <RowActions row={row.original} onEdit={onEdit} />,
            enableHiding: false,
        },
    ];
}