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
import { Checkbox } from '@/components/ui/checkbox';

import type { LeaveEntitlement } from '../data/schema';
import { toast } from 'sonner';

interface ColumnOptions {
    onEdit: (leaveEntitlement: LeaveEntitlement) => void;
}

// ─── Reusable mobile field row ─────────────────────────────────────────────────

function CardField({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}

export function getColumns({ onEdit }: ColumnOptions): DataTableColumnDef<LeaveEntitlement>[] {
    return [
        // {
        //     id: "spacer",
        //     header: () => <div className="w-1" />,
        //     cell: () => <div className="w-1" />,
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        // // checkbox
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

        // leave type name — pulled from the eager loaded leave_type relationship
        {
            accessorKey: 'leave_type_id',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <div className="min-w-32 font-medium">
                    {row.original.leave_type?.leave_type_name ?? 'N/A'}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <div className="flex flex-col -mx-3 -my-1.5">
                    <div className="px-3 py-3 space-y-2">
                        {/* show leave type name instead of raw ID */}
                        <p className="font-semibold text-sm leading-snug">
                            {row.leave_type?.leave_type_name ?? 'N/A'}
                        </p>
                        {row.leave_entitlement_description ? (
                            <p className="text-sm text-muted-foreground text-justify leading-relaxed">
                                {row.leave_entitlement_description}
                            </p>
                        ) : (
                            <p className="text-sm italic text-muted-foreground/50">
                                No description
                            </p>
                        )}
                    </div>

                    <div className="border-t border-secondary px-3 py-2.5 space-y-1.5">
                        <CardField
                            label="Years of Service"
                            value={`${row.years_of_service} yr${row.years_of_service !== 1 ? 's' : ''}`}
                        />
                        <CardField
                            label="Days Entitled"
                            value={`${row.days_entitled} day${Number(row.days_entitled) !== 1 ? 's' : ''}`}
                        />
                    </div>
                </div>
            ),
        },

        // description
        {
            accessorKey: 'leave_entitlement_description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const [expanded, setExpanded] = React.useState(false);
                const description = row.getValue('leave_entitlement_description') as string | null;
                return (
                    <div
                        className={`min-w-50 max-w-75 text-sm text-muted-foreground text-justify cursor-pointer ${expanded ? 'whitespace-normal wrap-break-word' : 'truncate'
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

        // years of service
        {
            accessorKey: 'years_of_service',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Years of Service" />
            ),
            cell: ({ row }) => {
                const years = row.getValue('years_of_service') as number;
                return (
                    <span className="text-sm text-muted-foreground">
                        {years} yr{years !== 1 ? 's' : ''}
                    </span>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },

        // days entitled
        {
            accessorKey: 'days_entitled',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Days Entitled" />
            ),
            cell: ({ row }) => {
                const days = parseFloat(row.getValue('days_entitled'))
                return (
                    <span className="text-sm text-muted-foreground">
                        {days} day{Number(days) !== 1 ? 's' : ''}
                    </span>
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
                            (leaveEntitlement: LeaveEntitlement) =>
                                router.delete(
                                    route('leave.leave-entitlement.destroy', leaveEntitlement.leave_entitlement_id),
                                    {
                                        onSuccess: () =>
                                            toast.success(`Leave entitlement deleted successfully.`),
                                        onError: () =>
                                            toast.error(`Failed to delete leave entitlement.`),
                                    },
                                ),
                            {
                                getName: (le) => `Entitlement #${le.leave_entitlement_id}`,
                                description: (le) => (
                                    <>
                                        Are you sure you want to delete this entitlement for{' '}
                                        <span className="font-medium text-foreground">
                                            {le.leave_type?.leave_type_name ?? 'this leave type'}
                                        </span>
                                        {' '}({le.days_entitled} day{Number(le.days_entitled) !== 1 ? 's' : ''},{' '}
                                        {le.years_of_service} yr{le.years_of_service !== 1 ? 's' : ''} of service)?
                                        This action cannot be undone.
                                    </>
                                ),
                                confirmLabel: 'Delete Entitlement',
                            },
                        ),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ];
}