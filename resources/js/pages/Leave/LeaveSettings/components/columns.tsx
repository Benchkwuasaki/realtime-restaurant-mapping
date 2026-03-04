'use client';

import { router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { route } from 'ziggy-js';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import React from 'react';
import type { LeaveType } from '../data/schema';
import { toast } from 'sonner'

interface ColumnOptions {
    onEdit: (leaveType: LeaveType) => void;
}

export function getColumns({ onEdit }: ColumnOptions): ColumnDef<LeaveType>[] {
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
        },

        // description
        {
            accessorKey: "leave_type_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => {
                const [expanded, setExpanded] = React.useState(false)
                const description = row.getValue("leave_type_description") as string | null

                return (
                    <div
                        className={`min-w-50 max-w-75 text-sm text-muted-foreground text-justify cursor-pointer ${expanded ? "whitespace-normal wrap-break-word" : "truncate"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation()
                            setExpanded((prev) => !prev)
                        }}
                        title="click to expand">
                        {description || "N/A"}
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: true,
        },

        // requirements
        {
            accessorKey: "requirements",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Requirements" />
            ),
            cell: ({ row }) => {
                const [expanded, setExpanded] = React.useState(false)
                const requirements = row.original.requirements

                if (!requirements || requirements.length === 0) {
                    return <span className="text-sm text-muted-foreground">N/A</span>
                }

                return (
                    <div
                        className={`min-w-40 max-w-70 text-sm text-muted-foreground cursor-pointer ${expanded ? "whitespace-normal wrap-break-word" : "truncate"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation()
                            setExpanded((prev) => !prev)
                        }}
                        title="click to expand">
                        {requirements.map((req) => req.requirement_name).join(", ")}
                    </div>
                )
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
                    <span className="text-sm text-muted-foreground">
                        {val}
                    </span>


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
                <DataTableColumnHeader column={column} title="Compensation Status" />
            ),
            cell: ({ row }) => {
                const isPaid = row.getValue('is_paid') as boolean;
                return (
                    <Badge variant={isPaid ? 'default' : 'secondary'}>
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
                <DataTableColumnHeader column={column} title="Cash Convertible" />
            ),
            cell: ({ row }) => {
                const isConvertible = row.getValue('is_convertible') as boolean;
                return (
                    <Badge variant={isConvertible ? 'default' : 'secondary'}>
                        {isConvertible ? 'Convertible' : 'Not Convertible'}
                    </Badge>
                );
            },
            enableSorting: true,
            enableHiding: true,
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
                    <Badge variant={status ? 'default' : 'secondary'}>
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
                                    route('leave.destroy', leaveType.leave_type_id,),
                                    {
                                        onSuccess: () => toast.success(`${leaveType.leave_type_name} deleted successfully.`),
                                        onError: () => toast.error(`Failed to delete ${leaveType.leave_type_name}.`),
                                    }
                                ),
                            {
                                getName: (lt) => lt.leave_type_name,
                                description: (lt) => (
                                    <>
                                        Are you sure you want to delete{' '}
                                        <span className="font-medium text-foreground">
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
        },
    ];
}
