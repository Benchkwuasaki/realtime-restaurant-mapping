import { type ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import type { SslTableSummary } from '@/pages/Payroll/Configuration/SalaryGradeTable/Index';

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SslTableSummary['status'] }) {
    if (status === 'active') {
        return (
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle2 className="size-3" />
                Active
            </Badge>
        );
    }
    if (status === 'draft') {
        return (
            <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400">
                <CircleDashed className="size-3" />
                Draft
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="gap-1 text-muted-foreground">
            <Clock className="size-3" />
            Superseded
        </Badge>
    );
}

// ── Fill Progress Bar ──────────────────────────────────────────────────────────

function FillProgress({ filled, total }: { filled: number; total: number }) {
    const pct = Math.round((filled / total) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
                {filled}/{total}
            </span>
        </div>
    );
}

// ── Columns ────────────────────────────────────────────────────────────────────

export const sslTableColumns: ColumnDef<SslTableSummary>[] = [
    {
        accessorKey: 'ssl_version',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="SSL Version" />
        ),
        cell: ({ row }) => (
            <span className="font-medium">{row.original.ssl_version}</span>
        ),
    },
    {
        accessorKey: 'tranche_ordinal',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Tranche" />
        ),
        cell: ({ row }) => <span>{row.original.tranche_ordinal} Tranche</span>,
    },
    {
        accessorKey: 'legal_basis',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Legal Basis" />
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.legal_basis}
            </span>
        ),
    },
    {
        accessorKey: 'effectivity_date',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Effectivity Date" />
        ),
        cell: ({ row }) => (
            <span>
                {new Date(row.original.effectivity_date).toLocaleDateString(
                    'en-PH',
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    },
                )}
            </span>
        ),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        filterFn: (row, _id, filterValues: string[]) =>
            filterValues.includes(row.original.status),
    },
    {
        accessorKey: 'filled_cells',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Completion" />
        ),
        cell: ({ row }) => {
            const { status, filled_cells, total_cells } = row.original;
            if (status !== 'draft') {
                return (
                    <span className="text-xs text-muted-foreground">
                        {status === 'active' ? 'Fully filled' : '—'}
                    </span>
                );
            }
            return <FillProgress filled={filled_cells} total={total_cells} />;
        },
    },
    {
        accessorKey: 'activated_by_name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Activated By" />
        ),
        cell: ({ row }) => {
            const { activated_by_name, activated_at } = row.original;
            if (!activated_by_name)
                return <span className="text-muted-foreground">—</span>;
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium">
                        {activated_by_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(activated_at!).toLocaleDateString('en-PH')}
                    </span>
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const t = row.original;
            return (
                <DataTableRowActions
                    row={row}
                    actions={[
                        ...(t.status === 'draft'
                            ? [
                                  deleteAction<SslTableSummary>(
                                      (r) =>
                                          router.delete(
                                              route(
                                                  'payroll.salary-grade.destroy',
                                                  r.ssl_table_id,
                                              ),
                                          ),
                                      {
                                          getName: (r) =>
                                              `${r.ssl_version} ${r.tranche_ordinal} Tranche`,
                                          description: (r) => (
                                              <>
                                                  This will permanently delete
                                                  the{' '}
                                                  <span className="font-semibold text-foreground">
                                                      {r.ssl_version}{' '}
                                                      {r.tranche_ordinal}{' '}
                                                      Tranche
                                                  </span>{' '}
                                                  draft and all its salary
                                                  amounts.
                                              </>
                                          ),
                                      },
                                  ),
                              ]
                            : []),
                    ]}
                />
            );
        },
    },
];
