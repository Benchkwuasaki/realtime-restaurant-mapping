// Loan Entry components/columns.tsx

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { type Loan } from '../data/schema';

interface UseLoanColumnsProps {
    onEdit: (loan: Loan) => void;
    onDelete: (loan: Loan) => void;
}

function SourceBadge({ source }: { source: string }) {
    const isGSIS = source === 'GSIS';
    return (
        <Badge
            className={
                isGSIS
                    ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50'
                    : 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50'
            }
        >
            {source}
        </Badge>
    );
}

function StatusBadge({ status }: { status: Loan['status'] }) {
    const map: Record<
        Loan['status'],
        { label: string; className: string; dot: string }
    > = {
        Active: {
            label: 'Active',
            className:
                'border border-green-200 bg-green-50 text-green-700 hover:bg-green-50',
            dot: 'bg-green-500',
        },
        Completed: {
            label: 'Completed',
            className:
                'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100',
            dot: 'bg-slate-400',
        },
        Suspended: {
            label: 'Suspended',
            className:
                'border border-red-200 bg-red-50 text-red-700 hover:bg-red-50',
            dot: 'bg-red-500',
        },
    };
    const { label, className, dot } = map[status];
    return (
        <Badge className={`gap-1.5 ${className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
        </Badge>
    );
}

function BalanceCell({ loan }: { loan: Loan }) {
    const paid = loan.total_amount - loan.balance;
    const pct =
        loan.total_amount > 0
            ? Math.round((paid / loan.total_amount) * 100)
            : 0;

    return (
        <div className="min-w-[120px]">
            <div className="text-sm font-medium">
                ₱
                {loan.balance.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                })}
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
                {pct}% paid
            </div>
        </div>
    );
}

export function useLoanColumns({
    onEdit,
    onDelete,
}: UseLoanColumnsProps): ColumnDef<Loan>[] {
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
                <div>
                    <div className="text-sm font-medium">
                        {row.getValue('employee_name')}
                    </div>
                    {row.original.employee_position && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            {row.original.employee_position}
                        </div>
                    )}
                </div>
            ),
        },

        {
            accessorKey: 'loan_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Loan Type" />
            ),
            cell: ({ row }) => {
                const type = row.getValue<string>('loan_type');
                const isGSIS = row.original.source === 'GSIS';
                return (
                    <Badge
                        variant="outline"
                        className={
                            isGSIS
                                ? 'border-blue-300 text-blue-700'
                                : 'border-orange-300 text-orange-700'
                        }
                    >
                        {type}
                    </Badge>
                );
            },
        },

        {
            accessorKey: 'source',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Source" />
            ),
            cell: ({ row }) => <SourceBadge source={row.getValue('source')} />,
            filterFn: (row, id, value: string[]) =>
                value.includes(row.getValue(id)),
        },

        {
            accessorKey: 'total_amount',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Amount" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    ₱
                    {Number(row.getValue('total_amount')).toLocaleString(
                        'en-PH',
                        { minimumFractionDigits: 2 },
                    )}
                </span>
            ),
        },

        {
            accessorKey: 'monthly_amortization',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Monthly Amort." />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    ₱
                    {Number(
                        row.getValue('monthly_amortization'),
                    ).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
            ),
        },

        {
            accessorKey: 'semi_monthly_deduction',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Semi-Mo. Ded." />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    ₱
                    {Number(
                        row.getValue('semi_monthly_deduction'),
                    ).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
            ),
        },

        {
            accessorKey: 'balance',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Balance" />
            ),
            cell: ({ row }) => <BalanceCell loan={row.original} />,
        },

        {
            id: 'period',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Period" />
            ),
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap">
                    {row.original.start_period} – {row.original.end_period}
                </span>
            ),
        },

        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
            filterFn: (row, id, value: string[]) =>
                value.includes(row.getValue(id)),
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
                        editAction(onEdit),
                        deleteAction(onDelete, {
                            getName: (l) => l.employee_name,
                        }),
                    ]}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];
}
