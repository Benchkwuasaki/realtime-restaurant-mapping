'use client';

import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import {
    MoreHorizontal,
    Pencil,
    Send,
    Ban,
    CheckCircle,
    XCircle,
} from 'lucide-react';

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { LeaveFiling } from '../data/schema';

// actions that can be done to a leave application
export type ActionMode =
    | 'view'
    | 'recommend-approval'
    | 'recommend-disapproval'
    | 'approve'
    | 'disapprove';

// column options
interface ColumnOptions {
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}

// convert date string into readable PH format
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * calculate number of working days between two dates
 * weekends (Saturday and Sunday) are not counted
 */
function calcDaysApplied(
    start?: string | null,
    end?: string | null,
): number | null {

    // if dates are missing, cannot calculate
    if (!start || !end) return null;

    // split YYYY-MM-DD into numbers
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);

    // month - 1 because JS months start at 0
    const s = new Date(sy, sm - 1, sd);
    const e = new Date(ey, em - 1, ed);

    // if end date is before start date, return null
    if (e < s) return null;

    let n = 0;

    // create a pointer date we will move day by day
    const cur = new Date(s);

    while (cur <= e) {
        // 0 = Sunday, 6 = Saturday
        const d = cur.getDay();

        // skip weekends
        if (d !== 0 && d !== 6) n++;

        // move to next day
        cur.setDate(cur.getDate() + 1);
    }
    return n;
}

/**
 * get employee name from relation
 * fallback to employee id if relation is missi
 */
function employeeName(row: LeaveFiling): string {
    return (
        (row as any).employee?.employee_name ?? `Employee #${row.employee_id}`
    );
}

// status badge
const STATUS_BADGE: Record<
    string,
    React.ComponentProps<typeof Badge>['variant']
> = {
    Pending: 'gray',
    'For Approval': 'blue',
    'For Disapproval': 'yellow',
    Approved: 'green',
    Disapproved: 'red',
};

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_BADGE[status] ?? 'default'}>{status}</Badge>;
}


/**
 * Read current user roles from Inertia props
 * and determine what actions are allowed
 */
function useRoles() {
    const { auth } = usePage<{ auth: { user: { roles: string[] } } }>().props;
    const roles: string[] = auth?.user?.roles ?? [];

    // helper to check if user has a role
    const hasRole = (role: string) => roles.includes(role);

    const isHr = hasRole('hr_admin');
    const isDto = hasRole('document_tracking_operator');
    const isSuperAdmin = hasRole('super_admin');
    const isEmployee = hasRole('employee');
    const isOgm = hasRole('ogm');

    /**
     * OGM alone cannot perform any actions.
     * But if OGM has another role (ex: HR), actions are allowed.
     */
    const hideActions =
        isOgm && !isHr && !isDto && !isSuperAdmin && !isEmployee;

    // employees and HR can edit their applications
    const canEdit = isSuperAdmin || isHr || isEmployee;

    // DTO can recommend approval/disapproval
    const canRecommend = isSuperAdmin || isDto;

    // HR can make final decision
    const canDecide = isSuperAdmin || isHr;

    return { hideActions, canEdit, canRecommend, canDecide };
}

// row actions props
interface RowActionsProps {
    row: LeaveFiling;
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}


/**
 * Row action buttons
 */
function RowActions({ row, onEdit, onAction }: RowActionsProps) {
    const { hideActions, canEdit, canRecommend, canDecide } = useRoles();

    const status = row.status;

    // pending status allows editing and recommendation
    const isPending = status === 'Pending';

    // only these statuses allow final approval/disapproval
    const isForDecision =
        status === 'For Approval' || status === 'For Disapproval';

    if (hideActions) return null;

    /**
     * Count how many capabilities user has
     * Example:
     * edit only = 1
     * edit + recommend = 2
     * edit + recommend + decide = 3
     */
    const combos = [canEdit, canRecommend, canDecide].filter(Boolean).length;

    /**
     * If user can recommend AND decide,
     * use dropdown menu instead of many buttons
     */
    const useKebab = combos >= 2 && canRecommend && canDecide; 

    // approved or disapproved cannot be changed anymore
    const isTerminal = status === 'Approved' || status === 'Disapproved';

    

    /**
     * Employee only — edit button
     */
    if (canEdit && !canRecommend && !canDecide) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                }}
                disabled={!isPending}
                title={isPending ? 'Edit application' : 'No action available'}
            >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit application</span>
            </Button>
        );
    }

    // recommend only (dto alone, dto+ogm)
    if (canRecommend && !canDecide && !canEdit) {
        return (
            <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                {/* recommend approval */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'recommend-approval')}
                    disabled={!isPending}
                    title={
                        isPending
                            ? 'Recommend for approval'
                            : 'No action available'
                    }
                >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Recommend for approval</span>
                </Button>

                {/* recommend disapproval */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-orange-600 hover:bg-orange-50 hover:text-orange-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'recommend-disapproval')}
                    disabled={!isPending}
                    title={
                        isPending
                            ? 'Recommend for disapproval'
                            : 'No action available'
                    }
                >
                    <Ban className="h-4 w-4" />
                    <span className="sr-only">Recommend for disapproval</span>
                </Button>
            </div>
        );
    }

    // decide only (hr_admin alone, hr_admin+ogm)
    if (canDecide && !canRecommend && !canEdit) {
        return (
            <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                {/* approve leave */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'approve')}
                    disabled={!isForDecision}
                    title={isForDecision ? 'Approve' : 'No action available'}
                >
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                </Button>

                {/* disapprove leave */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'disapprove')}
                    disabled={!isForDecision}
                    title={isForDecision ? 'Disapprove' : 'No action available'}
                >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Disapprove</span>
                </Button>
            </div>
        );
    }

    // two capabilities: no recommend+decide overlap yet

    // edit + recommend (employee+dto)
    if (canEdit && canRecommend && !canDecide) {
        return (
            <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'recommend-approval')}
                    disabled={!isPending}
                    title={
                        isPending
                            ? 'Recommend for approval'
                            : 'No action available'
                    }
                >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Recommend for approval</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-orange-600 hover:bg-orange-50 hover:text-orange-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'recommend-disapproval')}
                    disabled={!isPending}
                    title={
                        isPending
                            ? 'Recommend for disapproval'
                            : 'No action available'
                    }
                >
                    <Ban className="h-4 w-4" />
                    <span className="sr-only">Recommend for disapproval</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                    }}
                    disabled={!isPending}
                    title={
                        isPending ? 'Edit application' : 'No action available'
                    }
                >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit application</span>
                </Button>
            </div>
        );
    }

    // edit + decide (employee+hr, hr+ogm+employee)
    if (canEdit && canDecide && !canRecommend) {
        return (
            <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'approve')}
                    disabled={!isForDecision}
                    title={isForDecision ? 'Approve' : 'No action available'}
                >
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-30"
                    onClick={() => onAction(row, 'disapprove')}
                    disabled={!isForDecision}
                    title={isForDecision ? 'Disapprove' : 'No action available'}
                >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Disapprove</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                    }}
                    disabled={!isPending}
                    title={
                        isPending ? 'Edit application' : 'No action available'
                    }
                >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit application</span>
                </Button>
            </div>
        );
    }

    // kebab: any combo with both recommend + decide (dto+hr, super_admin, all roles)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isTerminal}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open actions menu</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="w-48 rounded-lg border border-border/60 p-1 shadow-md"
                onClick={(e) => e.stopPropagation()}
            >
                {canRecommend && (
                    <>
                        <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase select-none">
                            Recommendation
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 disabled:pointer-events-none disabled:opacity-40"
                                onClick={() =>
                                    isPending &&
                                    onAction(row, 'recommend-approval')
                                }
                                disabled={!isPending}
                            >
                                <Send className="h-3.5 w-3.5 shrink-0" />
                                For Approval
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-orange-700 focus:bg-orange-50 focus:text-orange-700 disabled:pointer-events-none disabled:opacity-40"
                                onClick={() =>
                                    isPending &&
                                    onAction(row, 'recommend-disapproval')
                                }
                                disabled={!isPending}
                            >
                                <Ban className="h-3.5 w-3.5 shrink-0" />
                                For Disapproval
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        {(canEdit || canDecide) && (
                            <DropdownMenuSeparator className="-mx-1 my-1" />
                        )}
                    </>
                )}

                {canEdit && (
                    <>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-foreground disabled:pointer-events-none disabled:opacity-40"
                                onClick={() => isPending && onEdit(row)}
                                disabled={!isPending}
                            >
                                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                Edit application
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        {canDecide && (
                            <DropdownMenuSeparator className="-mx-1 my-1" />
                        )}
                    </>
                )}

                {canDecide && (
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 disabled:pointer-events-none disabled:opacity-40"
                            onClick={() =>
                                isForDecision && onAction(row, 'approve')
                            }
                            disabled={!isForDecision}
                        >
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-red-700 focus:bg-red-50 focus:text-red-700 disabled:pointer-events-none disabled:opacity-40"
                            onClick={() =>
                                isForDecision && onAction(row, 'disapprove')
                            }
                            disabled={!isForDecision}
                        >
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            Disapprove
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// mobile card for small screens
function MobileLeaveCard({
    row,
    onEdit,
    onAction,
}: {
    row: LeaveFiling;
    onEdit: (app: LeaveFiling) => void;
    onAction: (app: LeaveFiling, mode: ActionMode) => void;
}) {
    const days = calcDaysApplied(row.start_date, row.end_date);
    return (
        <div className="-mx-3 -my-1.5 flex flex-col">
            <div className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug font-semibold">
                        {employeeName(row)}
                    </p>
                    <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                    {row.leave_type_availed ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                    {days ? ` · ${days} day${days !== 1 ? 's' : ''}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                    Filed: {formatDate(row.date_of_filing)}
                </p>
            </div>
            <div className="flex items-center justify-end border-t border-secondary px-3 py-2.5">
                <RowActions row={row} onEdit={onEdit} onAction={onAction} />
            </div>
        </div>
    );
}

// column definitions
export function getColumns({
    onEdit,
    onAction,
}: ColumnOptions): DataTableColumnDef<LeaveFiling>[] {
    const { hideActions } = useRoles();

    return [
        // checkbox
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

        // employee name
        {
            id: 'employee_name',
            accessorFn: (row) => employeeName(row),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ getValue }) => (
                <div className="min-w-40 font-medium">
                    {getValue() as string}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            mobileCard: (row) => (
                <MobileLeaveCard
                    row={row}
                    onEdit={onEdit}
                    onAction={onAction}
                />
            ),
        },

        // department
        {
            accessorKey: 'office_department',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Department" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 text-sm">
                    {row.getValue('office_department') ?? 'N/A'}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.some((val) =>
                    (row.getValue(columnId) ?? '')
                        .toString()
                        .toLowerCase()
                        .includes(val.toLowerCase()),
                ),
        },

        // leave type
        {
            accessorKey: 'leave_type_availed',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Leave Type" />
            ),
            cell: ({ row }) => (
                <div className="min-w-40 text-sm">
                    {row.getValue('leave_type_availed') ?? 'N/A'}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
        },

        // date filed
        {
            accessorKey: 'date_of_filing',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date Filed" />
            ),
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                    {formatDate(row.getValue('date_of_filing'))}
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },

        // inclusive dates
        {
            id: 'inclusive_dates',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Inclusive Dates"
                />
            ),
            cell: ({ row }) => {
                const start = row.original.start_date;
                const end = row.original.end_date;
                return start && end ? (
                    <p className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(start)} — {formatDate(end)}
                    </p>
                ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // days applied
        {
            id: 'days_applied',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Days Applied" />
            ),
            cell: ({ row }) => {
                const days = calcDaysApplied(
                    row.original.start_date,
                    row.original.end_date,
                );
                return days != null ? (
                    <p className="text-sm text-muted-foreground">{days} days</p>
                ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },

        // is_with_pay — hidden, used for filtering only
        {
            accessorKey: 'is_with_pay',
            filterFn: (row, columnId, filterValues: boolean[]) =>
                filterValues.includes(Boolean(row.getValue(columnId))),
            enableSorting: false,
            enableHiding: true,
            header: () => null,
            cell: () => null,
        },

        // status
        {
            accessorKey: 'status',
            filterFn: (row, columnId, filterValues: string[]) =>
                filterValues.includes(row.getValue(columnId)),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
            enableSorting: true,
            enableHiding: true,
        },

        // actions — hidden entirely for ogm only
        ...(!hideActions
            ? ([
                  {
                      id: 'actions',
                      header: 'Actions',
                      cell: ({ row }: any) => (
                          <RowActions
                              row={row.original}
                              onEdit={onEdit}
                              onAction={onAction}
                          />
                      ),
                      enableHiding: false,
                  },
              ] as DataTableColumnDef<LeaveFiling>[])
            : []),
    ];
}



