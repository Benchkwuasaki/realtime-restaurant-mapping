// Allowance Management components/columns.tsx

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    editAction,
    deleteAction,
    type RowActionButton,
} from '@/components/shared/data-table/data-table-row-action';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';
import { type Allowance } from '../data/schema';

interface UseAllowanceColumnsProps {
    onEdit: (allowance: Allowance) => void;
    onDelete: (allowance: Allowance) => void;
    onAssign: (allowance: Allowance) => void;
}

export function useAllowanceColumns({
    onEdit,
    onDelete,
    onAssign,
}: UseAllowanceColumnsProps): ColumnDef<Allowance>[] {
    return [
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

        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Allowance Name" />
            ),
            cell: ({ row }) => (
                <div>
                    <div className="text-sm font-medium">
                        {row.getValue('name')}
                    </div>
                    {row.original.description && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            {row.original.description}
                        </div>
                    )}
                </div>
            ),
        },

        {
            accessorKey: 'monthly_salary',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Monthly Amount" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    ₱
                    {Number(row.getValue('monthly_salary')).toLocaleString(
                        'en-PH',
                        { minimumFractionDigits: 2 },
                    )}
                </span>
            ),
        },

        {
            accessorKey: 'taxable',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Taxable?" />
            ),
            cell: ({ row }) => {
                const taxable = row.getValue<boolean>('taxable');
                return taxable ? (
                    <Badge variant="yellow">Taxable</Badge>
                ) : (
                    <Badge variant="green">Non-Taxable</Badge>
                );
            },
            filterFn: (row, id, value: boolean[]) =>
                value.includes(row.getValue(id)),
        },

        {
            accessorKey: 'applicable_to',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Applicable To" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.getValue('applicable_to') ?? '—'}
                </span>
            ),
        },

        {
            accessorKey: 'mandatory',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Mandatory" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.getValue<boolean>('mandatory') ? 'Yes' : 'No'}
                </span>
            ),
        },

        {
            accessorKey: 'basis',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Basis" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">{row.getValue('basis') ?? '—'}</span>
            ),
        },

        {
            id: 'actions',
            header: () => <span className="text-xs">Actions</span>,
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        {
                            label: 'Assign Employees',
                            icon: Users,
                            onClick: onAssign,
                        } satisfies RowActionButton<Allowance>,
                        editAction(onEdit),
                        // deleteAction(onDelete, { getName: (a) => a.name }),
                    ]}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];
}
