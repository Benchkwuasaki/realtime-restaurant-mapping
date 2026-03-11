'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useRef } from 'react';
import { Pen, Trash } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
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
import { type InternalOrganization } from '../data/schema';
import {
    DataTableRowActions,
    deleteAction,
    editAction,
} from '@/components/shared/data-table/data-table-row-action';

// ─── Column Options ────────────────────────────────────────────────────────────

interface ColumnOptions {
    onEdit: (org: InternalOrganization) => void;
}

// ─── Mobile Delete Confirm Dialog ─────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    org: InternalOrganization | null;
    onClose: () => void;
}

function DeleteConfirmDialog({ org, onClose }: DeleteConfirmDialogProps) {
    const [processing, setProcessing] = useState(false);

    function handleConfirm() {
        if (!org) return;
        setProcessing(true);
        router.delete(
            route(
                'internal-organization.destroy',
                org.internal_organization_id,
            ),
            {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    }

    return (
        <Dialog
            open={org !== null}
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
                        Delete Organization
                    </DialogTitle>
                </DialogHeader>

                <div className="text-muted-foreground px-5 py-4 text-sm">
                    Are you sure you want to delete{' '}
                    <span className="text-foreground font-medium">
                        {org?.name}
                    </span>
                    ? This action cannot be undone.
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
                        {processing ? 'Deleting…' : 'Delete Organization'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileOrgCardProps {
    row: InternalOrganization;
    onEdit: (org: InternalOrganization) => void;
}

function MobileOrgCard({ row, onEdit }: MobileOrgCardProps) {
    const [confirmOrg, setConfirmOrg] = useState<InternalOrganization | null>(
        null,
    );
    const suppressNextClick = useRef(false);

    function handleDialogClose() {
        suppressNextClick.current = true;
        setConfirmOrg(null);
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
                            {row.name}
                        </span>
                        <Badge
                            variant="outline"
                            className="shrink-0 font-mono text-xs"
                        >
                            {row.code}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                            {row.type}
                        </span>
                        {row.head && (
                            <span className="text-muted-foreground text-xs">
                                · {row.head}
                            </span>
                        )}
                    </div>

                    {row.payroll_deduction_linked && (
                        <Badge variant="secondary" className="text-xs">
                            Payroll Linked
                        </Badge>
                    )}
                </div>

                {/* ── Card Footer ── */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-t px-4 py-2.5">
                    <Badge
                        variant={row.status ? 'default' : 'secondary'}
                        className="text-xs"
                    >
                        {row.status ? 'Active' : 'Inactive'}
                    </Badge>
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
                                setConfirmOrg(row);
                            }}
                        >
                            <Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog org={confirmOrg} onClose={handleDialogClose} />
        </>
    );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columns = ({
    onEdit,
}: ColumnOptions): ColumnDef<InternalOrganization>[] => [
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
        accessorKey: 'code',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Code / ID" />
        ),
        cell: ({ row }) => (
            <div className="min-w-[80px] font-mono text-sm">
                {row.getValue('code')}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Organization Name" />
        ),
        cell: ({ row }) => (
            <div className="min-w-[160px] font-medium">
                {row.getValue('name')}
            </div>
        ),
        enableSorting: true,
        enableHiding: true,
        mobileCard: (row) => <MobileOrgCard row={row} onEdit={onEdit} />,
    },
    {
        accessorKey: 'type',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
            <div className="min-w-[110px]">{row.getValue('type')}</div>
        ),
        filterFn: (row, id, value: string[]) =>
            value.includes(row.getValue(id)),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'head',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Head" />
        ),
        cell: ({ row }) => (
            <div className="min-w-[140px]">{row.getValue('head')}</div>
        ),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'payroll_deduction_linked',
        header: ({ column }) => (
            <DataTableColumnHeader
                column={column}
                title="Payroll Deduction Linked"
            />
        ),
        cell: ({ row }) => {
            const linked: boolean = row.getValue('payroll_deduction_linked');
            return (
                <div className="min-w-[100px]">
                    <Badge variant={linked ? 'default' : 'secondary'}>
                        {linked ? 'Yes' : 'No'}
                    </Badge>
                </div>
            );
        },
        filterFn: (row, id, value: boolean[]) =>
            value.includes(row.getValue(id)),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const isActive: boolean = row.getValue('status');
            return (
                <div className="min-w-[90px]">
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            );
        },
        filterFn: (row, id, value: boolean[]) =>
            value.includes(row.getValue(id)),
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
                    editAction((org) => onEdit(org)),
                    deleteAction(
                        (org) =>
                            router.delete(
                                route(
                                    'internal-organization.destroy',
                                    org.internal_organization_id,
                                ),
                            ),
                        {
                            getName: (org) => org.name,
                            description: (org) => (
                                <>
                                    Are you sure you want to delete{' '}
                                    <span className="text-foreground font-medium">
                                        {org.name}
                                    </span>
                                    ? This action cannot be undone.
                                </>
                            ),
                            confirmLabel: 'Delete Organization',
                        },
                    ),
                ]}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
];
