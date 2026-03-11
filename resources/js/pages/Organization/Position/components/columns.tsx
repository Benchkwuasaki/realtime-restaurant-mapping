'use client';

// resources/js/pages/Organization/Position/components/columns.tsx

import { router } from '@inertiajs/react';
import { Pen, Trash } from 'lucide-react';
import { useState, useRef } from 'react';
import { route } from 'ziggy-js';

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

import { type Position, type PositionType } from '../data/schema';

interface ColumnOptions {
    onEdit: (position: Position) => void;
}

const typeBadgeVariant: Record<
    PositionType,
    'default' | 'secondary' | 'outline'
> = {
    Regular: 'default',
    Casual: 'outline',
    'Job Order': 'secondary',
};

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    position: Position | null;
    onClose: () => void;
}

function DeleteConfirmDialog({ position, onClose }: DeleteConfirmDialogProps) {
    const [processing, setProcessing] = useState(false);

    function handleConfirm() {
        if (!position) return;
        setProcessing(true);
        router.delete(route('position.destroy', position.position_id), {
            onFinish: () => {
                setProcessing(false);
                onClose();
            },
        });
    }

    return (
        <Dialog
            open={position !== null}
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
                        Delete Position
                    </DialogTitle>
                </DialogHeader>

                <div className="text-muted-foreground px-5 py-4 text-sm">
                    Are you sure you want to delete{' '}
                    <span className="text-foreground font-medium">
                        {position?.position_name}
                    </span>
                    ? This will also affect any items assigned to this position.
                    This action cannot be undone.
                </div>

                <DialogFooter className="border-border xs:flex xs:flex-row xs:justify-end bg-muted/30 border-t px-5 py-4">
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
                        {processing ? 'Deleting…' : 'Delete Position'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobilePositionCardProps {
    row: Position;
    onEdit: (position: Position) => void;
}

function MobilePositionCard({ row, onEdit }: MobilePositionCardProps) {
    const [confirmPosition, setConfirmPosition] = useState<Position | null>(
        null,
    );
    const suppressNextClick = useRef(false);

    function handleDialogClose() {
        suppressNextClick.current = true;
        setConfirmPosition(null);
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
                            {row.position_name}
                        </span>
                        <Badge
                            variant={typeBadgeVariant[row.position_type]}
                            className="shrink-0 whitespace-nowrap text-xs"
                        >
                            {row.position_type}
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        {row.department?.department_name && (
                            <span className="text-muted-foreground text-xs">
                                {row.department.department_name}
                                {row.division?.division_name && (
                                    <> · {row.division.division_name}</>
                                )}
                                {row.unit?.unit_name && (
                                    <> · {row.unit.unit_name}</>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Card Footer ── */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-t px-4 py-2.5">
                    <span className="text-muted-foreground text-xs">
                        {row.occupied_slots} / {row.total_slots} slot
                        {row.total_slots !== 1 ? 's' : ''} filled
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
                                setConfirmPosition(row);
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                position={confirmPosition}
                onClose={handleDialogClose}
            />
        </>
    );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function getColumns({
    onEdit,
}: ColumnOptions): DataTableColumnDef<Position>[] {
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
            accessorKey: 'position_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Position Name" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[180px] font-medium">
                    {row.getValue('position_name')}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobilePositionCard row={row} onEdit={onEdit} />
            ),
        },
        {
            accessorKey: 'position_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
            cell: ({ row }) => {
                const type = row.getValue<PositionType>('position_type');
                return (
                    <Badge
                        variant={typeBadgeVariant[type]}
                        className="whitespace-nowrap text-xs"
                    >
                        {type}
                    </Badge>
                );
            },
            filterFn: (row, _id, value: string[]) =>
                value.includes(row.getValue('position_type')),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: 'department',
            accessorFn: (row) => row.department?.department_name ?? '',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[140px]">
                    {row.original.department?.department_name ?? '—'}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.department_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: 'division',
            accessorFn: (row) => row.division?.division_name ?? '',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Division" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[140px]">
                    {row.original.division?.division_name ?? '—'}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.division_id)),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: 'unit',
            accessorFn: (row) => row.unit?.unit_name ?? '',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[120px]">
                    {row.original.unit?.unit_name ?? '—'}
                </div>
            ),
            filterFn: (row, _id, value: string[]) =>
                value.includes(String(row.original.unit_id ?? '')),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'total_slots',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Slots" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[80px] text-center">
                    {row.getValue('total_slots')}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'occupied_slots',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Occupied" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[80px] text-center">
                    {row.getValue('occupied_slots')}
                </div>
            ),
            enableSorting: true,
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
                            (position) =>
                                router.delete(
                                    route(
                                        'position.destroy',
                                        position.position_id,
                                    ),
                                ),
                            {
                                getName: (p) => p.position_name,
                                description: (p) => (
                                    <>
                                        Are you sure you want to delete{' '}
                                        <span className="text-foreground font-medium">
                                            {p.position_name}
                                        </span>
                                        ? This will also affect any items
                                        assigned to this position. This action
                                        cannot be undone.
                                    </>
                                ),
                                confirmLabel: 'Delete Position',
                            },
                        ),
                    ]}
                />
            ),
            enableHiding: false,
        },
    ];
}
