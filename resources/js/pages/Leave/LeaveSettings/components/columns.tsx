'use client';

import { router } from '@inertiajs/react';
import React from 'react';
import { route } from 'ziggy-js';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { LeaveType } from '../data/schema';
import { toast } from 'sonner';

interface ColumnOptions {
    onEdit: (leaveType: LeaveType) => void;
}

// ─── Reusable mobile field row ─────────────────────────────────────────────────

function CardField({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}

export function getColumns({
    onEdit,
}: ColumnOptions): DataTableColumnDef<LeaveType>[] {
    return [
        // checkbox
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

        // leave type name
        {
            accessorKey: 'leave_type_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 font-medium">
                    {row.getValue('leave_type_name')}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <div className="-mx-3 -my-1.5 flex flex-col">
                    <div className="space-y-2 px-3 py-3">
                        <p className="text-sm font-semibold leading-snug">
                            {row.leave_type_name}
                        </p>
                        {row.leave_type_description ? (
                            <p className="text-muted-foreground text-justify text-sm leading-relaxed">
                                {row.leave_type_description}
                            </p>
                        ) : (
                            <p className="text-muted-foreground/50 text-sm italic">
                                No description
                            </p>
                        )}
                    </div>

                    <div className="border-secondary flex items-center border-t px-3 py-2.5">
                        <Badge variant={row.status ? 'default' : 'destructive'}>
                            {row.status ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>
            ),
        },

        // description
        {
            accessorKey: 'leave_type_description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const [expanded, setExpanded] = React.useState(false);
                const description = row.getValue('leave_type_description') as
                    | string
                    | null;
                return (
                    <div
                        className={`min-w-50 max-w-75 text-muted-foreground cursor-pointer text-justify text-sm ${
                            expanded
                                ? 'wrap-break-word whitespace-normal'
                                : 'truncate'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((prev) => !prev);
                        }}
                        title="click to expand"
                    >
                        {description || 'N/A'}
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // requirements
        {
            accessorKey: 'requirements',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Requirements" />
            ),
            cell: ({ row }) => {
                const [expanded, setExpanded] = React.useState(false);
                const requirements = row.original.requirements;
                if (!requirements || requirements.length === 0) {
                    return (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    );
                }
                return (
                    <div
                        className={`max-w-70 text-muted-foreground min-w-40 cursor-pointer text-sm ${
                            expanded
                                ? 'wrap-break-word whitespace-normal'
                                : 'truncate'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((prev) => !prev);
                        }}
                        title="click to expand"
                    >
                        {requirements
                            .map((req) => req.requirement_name)
                            .join(', ')}
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // eligible sex
        {
            accessorKey: 'eligible_sex',
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Eligible Sex" />
            ),
            cell: ({ row }) => {
                const val = row.getValue('eligible_sex') as string | null;
                return (
                    <span className="text-muted-foreground text-sm">{val}</span>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },

        // is paid
        {
            accessorKey: 'is_paid',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Compensation Status"
                />
            ),
            cell: ({ row }) => {
                const isPaid = row.getValue('is_paid') as boolean;
                return (
                    <Badge variant={isPaid ? 'default' : 'destructive'}>
                        {isPaid ? 'Paid' : 'Not paid'}
                    </Badge>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },

        // is convertible
        {
            accessorKey: 'is_convertible',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Cash Convertible"
                />
            ),
            cell: ({ row }) => {
                const isConvertible = row.getValue('is_convertible') as boolean;
                return (
                    <Badge variant={isConvertible ? 'default' : 'destructive'}>
                        {isConvertible ? 'Convertible' : 'Not Convertible'}
                    </Badge>
                );
            },
            enableSorting: true,
            enableHiding: true,
            // no mobileCard — rendered inside is_paid card above
        },

        // is accrual
        {
            accessorKey: 'is_accrual',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Accrual" />
            ),
            cell: ({ row }) => {
                const isConvertible = row.getValue('is_accrual') as boolean;
                return (
                    <Badge variant={isConvertible ? 'default' : 'destructive'}>
                        {isConvertible ? 'Accrual' : 'Not Accrual'}
                    </Badge>
                );
            },
            enableSorting: true,
            enableHiding: true,
            // no mobileCard — rendered inside is_paid card above
        },

        // status
        {
            accessorKey: 'status',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={status ? 'default' : 'destructive'}>
                        {status ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },

        // actions
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        editAction(onEdit),
                        deleteAction(
                            (leaveType: LeaveType) =>
                                router.delete(
                                    route(
                                        'leave.leave-type.destroy',
                                        leaveType.leave_type_id,
                                    ),
                                    {
                                        onSuccess: () =>
                                            toast.success(
                                                `${leaveType.leave_type_name} deleted successfully.`,
                                            ),
                                        onError: () =>
                                            toast.error(
                                                `Failed to delete ${leaveType.leave_type_name}.`,
                                            ),
                                    },
                                ),
                            {
                                getName: (lt) => lt.leave_type_name,
                                description: (lt) => (
                                    <>
                                        Are you sure you want to delete{' '}
                                        <span className="text-foreground font-medium">
                                            {lt.leave_type_name}
                                        </span>
                                        ? This will also remove all associated
                                        requirements. This action cannot be
                                        undone.
                                    </>
                                ),
                                confirmLabel: 'Delete Leave Type',
                            },
                        ),
                    ]}
                />
            ),
            enableHiding: false,
            // no mobileCard
        },
    ];
}
