'use client';

import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useRef } from 'react';
import { Pen, Trash } from 'lucide-react';

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
            onFinish: () => {
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
                <DialogHeader className="border-border border-b px-5 py-4">
                    <DialogTitle className="text-foreground text-sm font-semibold">
                        Delete Unit
                    </DialogTitle>
                </DialogHeader>

                <div className="text-muted-foreground px-5 py-4 text-sm">
                    Are you sure you want to delete{' '}
                    <span className="text-foreground font-medium">
                        {unit?.unit_name}
                    </span>
                    ? This will also affect any positions assigned to this unit.
                    This action cannot be undone.
                </div>

                <DialogFooter className="border-border bg-muted/30 flex flex-row justify-end border-t px-5 py-4">
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
}

function MobileUnitCard({ row, onEdit }: MobileUnitCardProps) {
    const [confirmUnit, setConfirmUnit] = useState<Unit | null>(null);
    const suppressNextClick = useRef(false);

    function handleDialogClose() {
        suppressNextClick.current = true;
        setConfirmUnit(null);
        // reset after the click event has had time to propagate
        setTimeout(() => {
            suppressNextClick.current = false;
        }, 200);
    }

    return (
        <>
            <div
                className="bg-background flex flex-col overflow-hidden"
                onClick={(e) => {
                    if (suppressNextClick.current) e.stopPropagation();
                }}
            >
                {/* ── Card Body ── */}
                <div className="space-y-2 px-4 pb-5 pt-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground text-base font-semibold">
                            {row.unit_name}
                        </span>
                        <Badge
                            variant="default"
                            className="shrink-0 font-mono text-xs"
                        >
                            {row.unit_acronym}
                        </Badge>
                    </div>

                    <div className="text-muted-foreground text-xs">
                        {row.division?.division_name ?? '—'}
                    </div>

                    {row.unit_description && (
                        <p className="text-muted-foreground line-clamp-3 text-sm">
                            {row.unit_description}
                        </p>
                    )}
                </div>

                {/* ── Card Footer ── */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-t px-4 py-2.5">
                    <span className="text-muted-foreground text-xs">
                        {row.positions?.length ?? 0} position
                        {(row.positions?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-12 w-12 p-0 text-xs"
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
                            className="text-muted-foreground hover:text-destructive h-12 w-12 p-0 text-xs"
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
            mobileCard: (row) => <MobileUnitCard row={row} onEdit={onEdit} />,
        },
        {
            accessorKey: 'unit_acronym',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Acronym" />
            ),
            cell: ({ row }) => (
                <Badge variant="default" className="font-mono text-xs">
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
                <div className="text-muted-foreground min-w-[200px] max-w-[300px] truncate text-sm">
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
                        editAction(onEdit),
                        deleteAction(
                            (unit) =>
                                router.delete(
                                    route('unit.destroy', unit.unit_id),
                                ),
                            {
                                getName: (u) => u.unit_name,
                                description: (u) => (
                                    <>
                                        Are you sure you want to delete{' '}
                                        <span className="text-foreground font-medium">
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
