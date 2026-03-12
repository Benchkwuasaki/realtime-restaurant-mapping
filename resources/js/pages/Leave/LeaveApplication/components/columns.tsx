'use client';

import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import {
    MoreHorizontal,
    Pencil,
    Send,
    Ban,
    CheckCircle,
    XCircle,
} from 'lucide-react';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { LeaveFiling } from '../data/schema';


// ─── Action Mode ─────────────────────────────────────────────────────────────

export type ActionMode =
    | 'view'
    | 'recommend-approval'
    | 'recommend-disapproval'
    | 'approve'
    | 'disapprove';

// ─── Column Options ───────────────────────────────────────────────────────────

interface ColumnOptions {
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    const s = new Date(sy, sm - 1, sd); // local midnight, avoids UTC shift
    const e = new Date(ey, em - 1, ed);
    if (e < s) return null;
    let n = 0;
    const cur = new Date(s);
    while (cur <= e) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) n++;
        cur.setDate(cur.getDate() + 1);
    }
    return n;
}

function employeeName(row: LeaveFiling): string {
    return (
        (row as any).employee?.employee_name ?? `Employee #${row.employee_id}`
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    'Pending':          'gray',
    'For Approval':     'blue',
    'For Disapproval':  'yellow',
    'Approved':         'green',
    'Disapproved':      'red',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge variant={STATUS_BADGE[status] ?? 'default'}>
            {status}
        </Badge>
    );
}

// ─── Row Actions (kebab) ──────────────────────────────────────────────────────

interface RowActionsProps {
    row: LeaveFiling;
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}

function RowActions({ row, onEdit, onAction }: RowActionsProps) {
    const status = row.status;
    const isPending = status === 'Pending';
    const isForDecision = status === 'For Approval' || status === 'For Disapproval';

    // No actions for terminal statuses
    if (status === 'Approved' || status === 'Disapproved') return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted data-[state=open]:bg-muted data-[state=open]:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open actions menu</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="w-48 rounded-lg p-1 shadow-md border border-border/60"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Pending: recommendation + edit ── */}
                {isPending && (
                    <>
                        <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
                            Recommendation
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                                onClick={() => onAction(row, 'recommend-approval')}
                            >
                                <Send className="h-3.5 w-3.5 shrink-0" />
                                For Approval
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs cursor-pointer text-orange-700 focus:bg-orange-50 focus:text-orange-700"
                                onClick={() => onAction(row, 'recommend-disapproval')}
                            >
                                <Ban className="h-3.5 w-3.5 shrink-0" />
                                For Disapproval
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="my-1 -mx-1" />

                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs cursor-pointer text-foreground"
                                onClick={() => onEdit(row)}
                            >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                Edit application
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}

                {/* ── For Approval / For Disapproval: approve or disapprove ── */}
                {isForDecision && (
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs cursor-pointer text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                            onClick={() => onAction(row, 'approve')}
                        >
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs cursor-pointer text-red-700 focus:bg-red-50 focus:text-red-700"
                            onClick={() => onAction(row, 'disapprove')}
                        >
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            Disapprove
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileLeaveCard({
    row,
    onEdit,
    onAction,
}: {
    row: LeaveFiling;
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}) {
    const days = calcDaysApplied(row.start_date, row.end_date);
    return (
        <div className="-mx-3 -my-1.5 flex flex-col">
            <div className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug font-semibold">
                        {employeeName(row)}
                    </p>
                    <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                    {row.leave_type_availed ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                    {days ? ` · ${days} day${days !== 1 ? 's' : ''}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                    Filed: {formatDate(row.date_of_filing)}
                </p>
            </div>
            <div className="flex items-center justify-end border-t border-secondary px-3 py-2.5">
                <RowActions row={row} onEdit={onEdit} onAction={onAction} />
            </div>
        </div>
    );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({
    onEdit,
    onAction,
}: ColumnOptions): DataTableColumnDef<LeaveFiling>[] {
    return [
        // Checkbox
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
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

        // Employee
        {
            id: 'employee_name',
            accessorFn: (row) => employeeName(row),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ getValue }) => (
                <div className="min-w-40 font-medium">
                    {getValue() as string}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobileLeaveCard
                    row={row}
                    onEdit={onEdit}
                    onAction={onAction}
                />
            ),
        },

        // Leave Type
        {
            accessorKey: 'leave_type_availed',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 text-sm">
                    {row.getValue('leave_type_availed') ?? 'N/A'}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
        },

        // Date Filed
        {
            accessorKey: 'date_of_filing',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date Filed" />
            ),
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                    {formatDate(row.getValue('date_of_filing'))}
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },

        // Inclusive Dates
        {
            id: 'inclusive_dates',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Inclusive Dates"
                />
            ),
            cell: ({ row }) => {
                const start = row.original.start_date;
                const end = row.original.end_date;

                return start && end ? (
                    <p className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(start)} — {formatDate(end)}
                    </p>
                ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // Days Applied
        {
            id: 'days_applied',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Days Applied" />
            ),
            cell: ({ row }) => {
                const days = calcDaysApplied(
                    row.original.start_date,
                    row.original.end_date,
                );
                return days != null ? (
                    <p className="text-sm text-muted-foreground">{days} days</p>
                ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // is_with_pay (hidden filter-only)
        {
            accessorKey: 'is_with_pay',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            enableSorting: false,
            enableHiding: true,
            header: () => null,
            cell: () => null,
        },

        // Status
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

        // Actions
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <RowActions
                    row={row.original}
                    onEdit={onEdit}
                    onAction={onAction}
                />
            ),
            enableHiding: false,
        },
    ];
}