// Other Deduction Entry components/columns.tsx

import { useState } from 'react';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { type OtherDeduction } from '../data/schema';

interface UseOtherDeductionColumnsProps {
    onDelete: (deduction: OtherDeduction) => void;
    onAmountChange: (deduction: OtherDeduction, newAmount: number) => void;
}

/** Inline-editable amount cell */
function AmountCell({
    row,
    onAmountChange,
}: {
    row: Row<OtherDeduction>;
    onAmountChange: (deduction: OtherDeduction, newAmount: number) => void;
}) {
    const [value, setValue] = useState(row.original.amount.toFixed(2));

    const handleBlur = () => {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed !== row.original.amount) {
            onAmountChange(row.original, parsed);
        } else {
            setValue(row.original.amount.toFixed(2));
        }
    };

    return (
        <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            className="h-8 w-36 text-right tabular-nums"
            step="0.01"
            min="0"
        />
    );
}

/** Format period as "Nov. 1 – 15, 2026" */
function formatPeriod(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const monthFmt = new Intl.DateTimeFormat('en-PH', { month: 'short' });
    const month = monthFmt.format(s);
    const year = e.getFullYear();
    return `${month}. ${s.getDate()} – ${e.getDate()}, ${year}`;
}

export function useOtherDeductionColumns({
    onDelete,
    onAmountChange,
}: UseOtherDeductionColumnsProps): ColumnDef<OtherDeduction>[] {
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
            accessorKey: 'employee_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ row }) => (
                <span className="text-sm font-medium">
                    {row.getValue('employee_name')}
                </span>
            ),
        },

        {
            accessorKey: 'description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.getValue('description') ?? '—'}
                </span>
            ),
        },

        {
            accessorKey: 'amount',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Amount (₱)" />
            ),
            cell: ({ row }) => (
                <AmountCell row={row} onAmountChange={onAmountChange} />
            ),
        },

        {
            id: 'period',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Period" />
            ),
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap">
                    {formatPeriod(
                        row.original.period_start,
                        row.original.period_end,
                    )}
                </span>
            ),
        },

        {
            id: 'actions',
            header: () => (
                <span className="text-xs text-muted-foreground">Actions</span>
            ),
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        deleteAction(onDelete, {
                            getName: (d) => d.employee_name,
                        }),
                    ]}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];
}
