'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export type ActivityLogRow = {
    user: string;
    module: string;
    activity: string;
    device: string;
    platform: string;
    timestamp: string;
};

export const columns: ColumnDef<ActivityLogRow>[] = [
    {
        id: 'spacer',
        header: () => <div className="w-1" />,
        cell: () => <div className="w-1" />,
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'user',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="User" />
        ),
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue('user')}</div>;
        },
    },
    {
        accessorKey: 'module',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Module" />
        ),
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue('module')}</div>;
        },
        filterFn: (row, id, value: boolean[]) =>
            value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'activity',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Activity" />
        ),
        cell: ({ row }) => {
            return (
                <div className="font-medium">{row.getValue('activity')}</div>
            );
        },
    },
    {
        accessorKey: 'device',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Device" />
        ),
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue('device')}</div>;
        },
    },
    {
        accessorKey: 'platform',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Platform" />
        ),
        cell: ({ row }) => {
            return (
                <div className="font-medium">{row.getValue('platform')}</div>
            );
        },
    },
    {
        accessorKey: 'timestamp',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Timestamp" />
        ),
        cell: ({ row }) => {
            return (
                <div className="font-medium">{row.getValue('timestamp')}</div>
            );
        },
    },
];
