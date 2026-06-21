'use client';

import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useRef } from 'react';
import { Pen, Trash, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from '@/components/shared/data-table/data-table-row-action';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { type Unit } from '../data/schema';

interface ColumnOptions {
    onEdit: (unit: Unit) => void;
    onAssign: (unit: Unit) => void;
}

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    unit: Unit | null;
    onClose: () => void;
}

function DeleteConfirmDialog({ unit, onClose }: DeleteConfirmDialogProps) {
    const [processing, setProcessing] = useState(false);

    function handleConfirm() {
        if (!unit) return;
        setProcessing(true);
        router.delete(route('unit.destroy', unit.unit_id), {
            onSuccess: () => {
                toast.success('Unit deleted', {
                    description: `"${unit.unit_name}" has been permanently removed.`,
                });
                setProcessing(false);
                onClose();
            },
            onError: () => {
                toast.error('Failed to delete unit', {
                    description: 'Something went wrong. Please try again.',
                });
                setProcessing(false);
                onClose();
            },
        });
    }

    return (
        <Dialog
            open={unit !== null}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
        >
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader className="border-b border-border px-5 py-4">
                    <DialogTitle className="text-sm font-semibold text-foreground">
                        Delete Unit
                    </DialogTitle>
                </DialogHeader>

                <div className="px-5 py-4 text-sm text-muted-foreground">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-foreground">
                        {unit?.unit_name}
                    </span>
                    ? This will also affect any positions assigned to this unit.
                    This action cannot be undone.
                </div>

                <DialogFooter className="flex flex-row justify-end border-t border-border bg-muted/30 px-5 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        onClick={handleConfirm}
                        className="text-xs"
                    >
                        {processing ? 'Deleting…' : 'Delete Unit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileUnitCardProps {
    row: Unit;
    onEdit: (unit: Unit) => void;
    onAssign: (unit: Unit) => void;
}

function MobileUnitCard({ row, onEdit, onAssign }: MobileUnitCardProps) {
    const [confirmUnit, setConfirmUnit] = useState<Unit | null>(null);
    const suppressNextClick = useRef(false);

    function handleDialogClose() {
        suppressNextClick.current = true;
        setConfirmUnit(null);
        setTimeout(() => {
            suppressNextClick.current = false;
        }, 200);
    }

    return (
        <>
            <div
                className="flex flex-col overflow-hidden bg-background"
                onClick={(e) => {
                    if (suppressNextClick.current) e.stopPropagation();
                }}
            >
                {/* ── Card Body ── */}
                <div className="space-y-2 px-4 pt-4 pb-5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-semibold text-foreground">
                            {row.unit_name}
                        </span>
                        <Badge
                            variant="outline"
                            className="shrink-0 font-mono text-xs"
                        >
                            {row.unit_acronym}
                        </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row.division?.division_name ?? '—'}
                    </div>

                    {row.unit_description && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                            {row.unit_description}
                        </p>
                    )}
                </div>

                {/* ── Card Footer ── */}
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">
                        {row.positions?.length ?? 0} position
                        {(row.positions?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 text-xs text-muted-foreground hover:text-primary"
                            title="Assign employees"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssign(row);
                            }}
                        >
                            <UserPlus />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                            }}
                        >
                            <Pen />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 text-xs text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmUnit(row);
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                unit={confirmUnit}
                onClose={handleDialogClose}
            />
        </>
    );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({
    onEdit,
    onAssign,
}: ColumnOptions): DataTableColumnDef<Unit>[] {
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
                    className="h-5 w-5 translate-y-0.5"
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
            accessorKey: 'unit_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[160px] font-medium">
                    {row.getValue('unit_name')}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobileUnitCard row={row} onEdit={onEdit} onAssign={onAssign} />
            ),
        },
        {
            accessorKey: 'unit_acronym',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-xs">
                    {row.getValue('unit_acronym')}
                </Badge>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'division.division_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[140px]">
                    {row.original.division?.division_name ?? '—'}
                </div>
            ),
            id: 'division_name',
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'unit_description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => (
                <div className="max-w-[300px] min-w-[200px] truncate text-sm text-muted-foreground">
                    {row.getValue('unit_description') || '—'}
                </div>
            ),
            enableSorting: false,
            enableHiding: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DataTableRowActions
                    row={row}
                    actions={[
                        // ── Assign employees action ──
                        {
                            icon: UserPlus,
                            label: 'Assign Employees',
                            onClick: (unit) => onAssign(unit),
                        },
                        editAction(onEdit),
                        deleteAction(
                            (unit) =>
                                router.delete(
                                    route('unit.destroy', unit.unit_id),
                                    {
                                        onSuccess: () => {
                                            toast.success('Unit deleted', {
                                                description: `"${unit.unit_name}" has been permanently removed.`,
                                            });
                                        },
                                        onError: () => {
                                            toast.error(
                                                'Failed to delete unit',
                                                {
                                                    description:
                                                        'Something went wrong. Please try again.',
                                                },
                                            );
                                        },
                                    },
                                ),
                            {
                                getName: (u) => u.unit_name,
                                description: (u) => (
                                    <>
                                        Are you sure you want to delete{' '}
                                        <span className="font-medium text-foreground">
                                            {u.unit_name}
                                        </span>
                                        ? This will also affect any positions
                                        assigned to this unit. This action
                                        cannot be undone.
                                    </>
                                ),
                                confirmLabel: 'Delete Unit',
                            },
                        ),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ];
}
