// Payroll/Earnings&Deductions/InternalOrgDeduction/components/columns.tsx

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    type InternalOrgDeduction,
    type ServiceCategory,
    SERVICE_CATEGORY_LABELS,
    SERVICE_CATEGORY_CUTOFF,
} from '../data/schema';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseInternalOrgDeductionColumnsProps {
    onDelete: (deduction: InternalOrgDeduction) => void;
    onAmountChange: (deduction: InternalOrgDeduction, newAmount: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format period as "Nov. 1 – 15, 2026" */
function formatPeriod(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const month = new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(s);
    return `${month}. ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
}

const CATEGORY_BADGE_VARIANTS: Record<ServiceCategory, string> = {
    Loan:          'bg-orange-100 text-orange-700 border-orange-200',
    Savings:       'bg-green-100 text-green-700 border-green-200',
    Dues:          'bg-blue-100 text-blue-700 border-blue-200',
    Share_Capital: 'bg-purple-100 text-purple-700 border-purple-200',
};


function CategoryBadge({ category }: { category: ServiceCategory | null | undefined }) {
    if (!category) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const cutoff = SERVICE_CATEGORY_CUTOFF[category];

    return (
        <div className="flex flex-col gap-1">
            <span
                className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_VARIANTS[category]}`}
            >
                {SERVICE_CATEGORY_LABELS[category]}
            </span>
            <span className="text-[10px] text-muted-foreground">{cutoff}</span>
        </div>
    );
}

// ── Inline-editable amount cell ───────────────────────────────────────────────

function AmountCell({
    row,
    onAmountChange,
}: {
    row: Row<InternalOrgDeduction>;
    onAmountChange: (deduction: InternalOrgDeduction, newAmount: number) => void;
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

// ── Columns ───────────────────────────────────────────────────────────────────

export function useInternalOrgDeductionColumns({
    onDelete,
    onAmountChange,
}: UseInternalOrgDeductionColumnsProps): ColumnDef<InternalOrgDeduction>[] {
    return [
        // ── Select ────────────────────────────────────────────────────────────
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

        // ── Employee ──────────────────────────────────────────────────────────
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

        // ── Category ──────────────────────────────────────────────────────────
        {
            accessorKey: 'service_category',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Category" />
            ),
            cell: ({ row }) => (
                <CategoryBadge category={row.original.service_category} />
            ),
            filterFn: (row, _columnId, filterValue) => {
                if (!filterValue || filterValue === 'all') return true;
                return row.original.service_category === filterValue;
            },
        },

        // ── Service ───────────────────────────────────────────────────────────
        {
            accessorKey: 'service_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Service" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.service_name ?? '—'}
                </span>
            ),
        },

        // ── Description ───────────────────────────────────────────────────────
        {
            accessorKey: 'description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue('description') ?? '—'}
                </span>
            ),
        },

        // ── Amount ────────────────────────────────────────────────────────────
        {
            accessorKey: 'amount',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Amount (₱)" />
            ),
            cell: ({ row }) => (
                <AmountCell row={row} onAmountChange={onAmountChange} />
            ),
        },

        // ── Period ────────────────────────────────────────────────────────────
        {
            id: 'period',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Period" />
            ),
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap">
                    {formatPeriod(row.original.period_start, row.original.period_end)}
                </span>
            ),
        },

        // ── Actions ───────────────────────────────────────────────────────────
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