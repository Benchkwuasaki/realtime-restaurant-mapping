// Payroll/Configuration/StepIncrement/components/columns.tsx

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { type StepIncrementEmployee } from '../data/schema';

function formatPHP(amount: number | null) {
    if (amount === null) return '—';
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

interface UseStepIncrementColumnsProps {
    incrementNum: number;
    stepSalaryMap: Record<string, number>;
    selectedIds: number[];
    onToggle: (id: number) => void;
    onToggleAll: (ids: number[], checked: boolean) => void;
}

export function useStepIncrementColumns({
    incrementNum,
    stepSalaryMap,
    selectedIds,
    onToggle,
    onToggleAll,
}: UseStepIncrementColumnsProps): ColumnDef<StepIncrementEmployee>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => {
                const eligibleRows = table
                    .getFilteredRowModel()
                    .rows.filter((r) => (r.original.step ?? 0) < 8);

                const eligibleIds = eligibleRows.map(
                    (r) => r.original.employee_id,
                );

                const allSelected =
                    eligibleIds.length > 0 &&
                    eligibleIds.every((id) => selectedIds.includes(id));

                const someSelected =
                    !allSelected &&
                    eligibleIds.some((id) => selectedIds.includes(id));

                return (
                    <Checkbox
                        checked={
                            allSelected || (someSelected && 'indeterminate')
                        }
                        onCheckedChange={(value) =>
                            onToggleAll(eligibleIds, !!value)
                        }
                        aria-label="Select all eligible"
                        className="translate-y-0.5"
                    />
                );
            },
            cell: ({ row }) => {
                const atMax = (row.original.step ?? 0) >= 8;
                const isChecked = selectedIds.includes(
                    row.original.employee_id,
                );
                return (
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                            onToggle(row.original.employee_id)
                        }
                        disabled={atMax}
                        aria-label="Select row"
                        className="translate-y-0.5"
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
        },

        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ row }) => (
                <span className="text-sm font-medium">
                    {row.getValue('name')}
                </span>
            ),
        },

        {
            accessorKey: 'employment_classification',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Classification" />
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue('employment_classification') ?? '—'}
                </span>
            ),
            filterFn: (row, id, value: string[]) =>
                value.includes(row.getValue(id)),
            enableSorting: false,
        },

        {
            accessorKey: 'salary_grade',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Salary Grade" />
            ),
            cell: ({ row }) => (
                <span className="text-sm">
                    SG {row.getValue('salary_grade') ?? '—'}
                </span>
            ),
            enableSorting: false,
        },

        {
            id: 'current_step',
            accessorKey: 'step',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Current Step / Salary"
                />
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    Step {row.original.step ?? '—'} ·{' '}
                    {formatPHP(row.original.monthly_salary)}
                </span>
            ),
            enableSorting: false,
        },

        {
            id: 'new_step',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="New Step / Salary"
                />
            ),
            cell: ({ row }) => {
                const { salary_grade, step } = row.original;
                const atMax = (step ?? 0) >= 8;

                if (atMax) {
                    return (
                        <Badge variant="outline" className="text-xs">
                            At max step
                        </Badge>
                    );
                }

                const newStep =
                    step !== null ? Math.min(step + incrementNum, 8) : null;
                const newSalary =
                    salary_grade !== null && newStep !== null
                        ? (stepSalaryMap[`${salary_grade}-${newStep}`] ?? null)
                        : null;

                return (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                        <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                        Step {newStep} · {formatPHP(newSalary)}
                    </span>
                );
            },
            enableSorting: false,
        },
    ];
}
