// resources/js/components/Payroll/Outputs/GovernmentRemittance/columns.tsx

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RemittanceEmployee {
    id: number;
    name: string;
    position: string;
    classification: string;
    basic_pay: number;
    employee_share: number;
    employer_share: number;
    subtotal: number;
    employee_type?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseRemittanceColumnsProps {
    agencyId: string;
    onEmployeeClick?: (employee: RemittanceEmployee, agencyId: string) => void;
}

export function useRemittanceColumns({
    agencyId,
    onEmployeeClick,
}: UseRemittanceColumnsProps): ColumnDef<RemittanceEmployee>[] {
    return [
        // {
        //     id: 'select',
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={
        //                 table.getIsAllPageRowsSelected() ||
        //                 (table.getIsSomePageRowsSelected() && 'indeterminate')
        //             }
        //             onCheckedChange={(value) =>
        //                 table.toggleAllPageRowsSelected(!!value)
        //             }
        //             aria-label="Select all"
        //             className="translate-y-0.5"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value) => row.toggleSelected(!!value)}
        //             aria-label="Select row"
        //             className="translate-y-0.5"
        //             onClick={(e) => e.stopPropagation()}
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },

        {
            id: 'index',
            header: () => (
                <span className="text-xs text-muted-foreground">#</span>
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.index + 1}
                </span>
            ),
            enableSorting: false,
        },

        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee Name" />
            ),
            cell: ({ row }) => (
                <div>
                    <div className="text-sm font-medium">
                        {row.getValue('name')}
                    </div>
                    {row.original.position && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            {row.original.position}
                        </div>
                    )}
                </div>
            ),
        },

        {
            accessorKey: 'position',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Position" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">{row.getValue('position')}</span>
            ),
        },

        {
            accessorKey: 'employee_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
            cell: ({ row }) => {
                const type = row.original.employee_type;
                if (!type)
                    return (
                        <span className="text-xs text-muted-foreground">—</span>
                    );
                return (
                    <Badge
                        variant={type === 'regular' ? 'default' : 'secondary'}
                        className="min-w-[60px] justify-center"
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                );
            },
            filterFn: (row, _id, value: string[]) =>
                value.includes(row.original.employee_type ?? ''),
        },

        {
            accessorKey: 'basic_pay',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Basic Pay" />
            ),
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {formatCurrency(row.getValue('basic_pay'))}
                </span>
            ),
            enableSorting: false,
            enableHiding: false,
        },

        {
            accessorKey: 'employee_share',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee Share" />
            ),
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {formatCurrency(row.getValue('employee_share'))}
                </span>
            ),
            enableSorting: false,
            enableHiding: false,
        },

        {
            accessorKey: 'employer_share',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employer Share" />
            ),
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {formatCurrency(row.getValue('employer_share'))}
                </span>
            ),
            enableSorting: false,
            enableHiding: false,
        },

        {
            accessorKey: 'subtotal',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Subtotal" />
            ),
            cell: ({ row }) => (
                <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(row.getValue('subtotal'))}
                </span>
            ),
            enableSorting: false,
            enableHiding: false,
        },

        // {
        //     id: 'actions',
        //     header: () => (
        //         <span className="text-xs text-muted-foreground">Details</span>
        //     ),
        //     cell: ({ row }) => (
        //         <Button
        //             variant="ghost"
        //             size="sm"
        //             className="h-8 w-8 p-0"
        //             onClick={() => onEmployeeClick?.(row.original, agencyId)}
        //         >
        //             <Info className="h-4 w-4 text-muted-foreground" />
        //             <span className="sr-only">View details</span>
        //         </Button>
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
    ];
}
