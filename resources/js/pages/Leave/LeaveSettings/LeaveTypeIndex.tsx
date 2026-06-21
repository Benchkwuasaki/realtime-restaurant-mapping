'use client';

import { useForm } from '@inertiajs/react';
import { type Row } from '@tanstack/react-table';
import { Trash2, Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import { DataTable } from '@/components/shared/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getColumns } from './components/columns';
import type { LeaveType } from './data/schema';

type Props = {
    leave_types: LeaveType[];
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

//  View Modal
// Opens when a row is clicked. Read-only view of all leave type fields.
// Layout: title + status badge → 2-col grid fields → requirements → description.

interface ViewModalProps {
    leaveType: LeaveType | null;
    onClose: () => void;
}

function ViewModal({ leaveType, onClose }: ViewModalProps) {
    if (!leaveType) return null;

    const availmentTypeLabel: Record<string, string> = {
        continuous: 'Continuous',
        intermittent: 'Intermittent',
        both: 'Both',
    };

    return (
        <Dialog open={!!leaveType} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
                {/* Header — title + status badge */}
                <DialogHeader className="shrink-0 border-b border-secondary px-6 py-5">
                    <div className="flex items-center gap-2 pr-6">
                        <DialogTitle className="text-base font-medium">
                            {leaveType.leave_type_name}
                        </DialogTitle>
                        <Badge
                            variant={leaveType.status ? 'default' : 'secondary'}
                        >
                            {leaveType.status ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* General fields — 2 column grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-secondary px-6 py-4">
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Eligible sex
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.eligible_sex}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Compensation
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.is_paid ? 'Paid' : 'Not Paid'}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Cash convertible
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.is_convertible
                                    ? 'Convertible'
                                    : 'Not Convertible'}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Accrual
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.is_accrual
                                    ? 'Accrual'
                                    : 'Non-Accrual'}
                            </p>
                        </div>
                    </div>

                    {/*  Availment fields — 2 column grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-secondary px-6 py-4">
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Cumulative
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.is_cumulative
                                    ? 'Cumulative'
                                    : 'Non-Cumulative'}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Per event
                            </p>
                            <p className="text-sm font-medium">
                                {leaveType.is_per_event
                                    ? 'Per Event'
                                    : 'Not Per Event'}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Availment type
                            </p>
                            <p className="text-sm font-medium">
                                {availmentTypeLabel[leaveType.availment_type]}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Max lifetime grants
                            </p>
                            <p
                                className={`text-sm font-medium ${leaveType.max_lifetime_grants == null ? 'text-muted-foreground italic' : ''}`}
                            >
                                {leaveType.max_lifetime_grants ?? 'Unlimited'}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0.5 text-xs text-muted-foreground">
                                Availment deadline
                            </p>
                            <p
                                className={`text-sm font-medium ${leaveType.availment_deadline_days == null ? 'text-muted-foreground italic' : ''}`}
                            >
                                {leaveType.availment_deadline_days != null
                                    ? `${leaveType.availment_deadline_days} days`
                                    : 'No deadline'}
                            </p>
                        </div>
                    </div>

                    {/* Requirements — bullet list */}
                    <div className="border-b border-secondary px-6 py-4">
                        <p className="mb-2 text-xs text-muted-foreground">
                            Requirements
                        </p>
                        {leaveType.requirements &&
                        leaveType.requirements.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-4">
                                {leaveType.requirements.map((r) => (
                                    <li
                                        key={r.leave_type_requirement_id}
                                        className="text-sm"
                                    >
                                        {r.requirement_name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                None
                            </p>
                        )}
                    </div>

                    {/* Description — at the bottom */}
                    <div className="px-6 py-4">
                        <p className="mb-0.5 text-xs text-muted-foreground">
                            Description
                        </p>
                        <p className="text-justify text-sm leading-relaxed text-muted-foreground">
                            {leaveType.leave_type_description || '—'}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Create / Edit Modal

interface LeaveTypeModalProps {
    open: boolean;
    editingLeaveType: LeaveType | null;
    onClose: () => void;
}

function LeaveTypeModal({
    open,
    editingLeaveType,
    onClose,
}: LeaveTypeModalProps) {
    const isEdit = editingLeaveType !== null;

    const [requirementInputs, setRequirementInputs] = React.useState<
        { leave_type_requirement_id?: number; requirement_name: string }[]
    >(
        () =>
            editingLeaveType?.requirements?.map((r) => ({
                leave_type_requirement_id: r.leave_type_requirement_id,
                requirement_name: r.requirement_name,
            })) ?? [],
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            leave_type_name: editingLeaveType?.leave_type_name ?? '',
            leave_type_description:
                editingLeaveType?.leave_type_description ?? '',
            eligible_sex: editingLeaveType?.eligible_sex ?? '',
            is_paid: editingLeaveType
                ? editingLeaveType.is_paid
                    ? '1'
                    : '0'
                : '',
            is_convertible: editingLeaveType
                ? editingLeaveType.is_convertible
                    ? '1'
                    : '0'
                : '',
            is_accrual: editingLeaveType
                ? editingLeaveType.is_accrual
                    ? '1'
                    : '0'
                : '',
            is_cumulative: editingLeaveType
                ? editingLeaveType.is_cumulative
                    ? '1'
                    : '0'
                : '1',
            is_per_event: editingLeaveType
                ? editingLeaveType.is_per_event
                    ? '1'
                    : '0'
                : '0',
            max_lifetime_grants:
                editingLeaveType?.max_lifetime_grants != null
                    ? String(editingLeaveType.max_lifetime_grants)
                    : '',
            availment_type: editingLeaveType?.availment_type ?? 'both',
            availment_deadline_days:
                editingLeaveType?.availment_deadline_days != null
                    ? String(editingLeaveType.availment_deadline_days)
                    : '',
            status: editingLeaveType
                ? editingLeaveType.status
                    ? '1'
                    : '0'
                : '',
            requirements: editingLeaveType?.requirements ?? [],
        });

    React.useEffect(() => {
        setData('requirements', requirementInputs as any);
    }, [requirementInputs]);

    function addRequirement() {
        setRequirementInputs((prev) => [...prev, { requirement_name: '' }]);
    }

    function removeRequirement(index: number) {
        setRequirementInputs((prev) => prev.filter((_, i) => i !== index));
    }

    function updateRequirement(index: number, value: string) {
        setRequirementInputs((prev) =>
            prev.map((req, i) =>
                i === index ? { ...req, requirement_name: value } : req,
            ),
        );
    }

    function handleClose() {
        reset();
        clearErrors();
        setRequirementInputs([]);
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...data, requirements: requirementInputs };
        if (isEdit) {
            put(
                route(
                    'leave.leave-type.update',
                    editingLeaveType!.leave_type_id,
                ),
                {
                    data: payload,
                    onSuccess: () => {
                        toast.success('Leave type updated successfully.');
                        handleClose();
                    },
                    onError: () => toast.error('Failed to update leave type.'),
                } as any,
            );
        } else {
            post(route('leave.leave-type.store'), {
                data: payload,
                onSuccess: () => {
                    toast.success('Leave type created successfully.');
                    handleClose();
                },
                onError: () => toast.error('Failed to create leave type.'),
            } as any);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b px-5 py-4">
                    <DialogTitle className="text-sm font-semibold">
                        {isEdit ? 'Edit Leave Type' : 'Create Leave Type'}
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                        <p className="text-xs text-muted-foreground">
                            All fields with{' '}
                            <span className="text-red-600">*</span> are
                            required.
                        </p>

                        {/* Leave Type */}
                        <div>
                            <label className="text-xs font-medium">
                                Leave Type Name{' '}
                                <span className="text-red-600">*</span>
                            </label>
                            <Input
                                value={data.leave_type_name}
                                onChange={(e) =>
                                    setData('leave_type_name', e.target.value)
                                }
                                className="mt-1 text-sm"
                                placeholder="e.g. Maternity Leave"
                            />
                            <FieldError message={errors.leave_type_name} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-medium">
                                Description
                            </label>
                            <Textarea
                                value={data.leave_type_description}
                                onChange={(e) =>
                                    setData(
                                        'leave_type_description',
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                className="mt-1 text-sm"
                                placeholder="The description is optional..."
                            />
                            <FieldError
                                message={errors.leave_type_description}
                            />
                        </div>

                        <section className="grid grid-cols-2 gap-5">
                            {/* Eligible Sex */}
                            <div>
                                <label className="text-xs font-medium">
                                    Eligible Sex{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.eligible_sex}
                                    onValueChange={(v) =>
                                        setData('eligible_sex', v)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select eligible sex" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Male">
                                            Male
                                        </SelectItem>
                                        <SelectItem value="Female">
                                            Female
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.eligible_sex} />
                            </div>

                            {/* Compensation Status */}
                            <div>
                                <label className="text-xs font-medium">
                                    Compensation Status{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_paid}
                                    onValueChange={(v) => setData('is_paid', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select compensation status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Paid</SelectItem>
                                        <SelectItem value="0">
                                            Not Paid
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.is_paid} />
                            </div>
                        </section>

                        <section className="grid grid-cols-2 gap-5">
                            {/* Cash Convertible */}
                            <div>
                                <label className="text-xs font-medium">
                                    Cash Convertible Status{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_convertible}
                                    onValueChange={(v) =>
                                        setData('is_convertible', v)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select conversion status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            Convertible
                                        </SelectItem>
                                        <SelectItem value="0">
                                            Not Convertible
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.is_convertible} />
                            </div>

                            {/* Accrual */}
                            <div>
                                <label className="text-xs font-medium">
                                    Accrual{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_accrual}
                                    onValueChange={(v) =>
                                        setData('is_accrual', v)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select accrual status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            Accrual
                                        </SelectItem>
                                        <SelectItem value="0">
                                            Non-Accrual
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.is_accrual} />
                            </div>
                        </section>

                        {/*   Cumulative + Per Event */}
                        <section className="grid grid-cols-2 gap-5">
                            {/* Cumulative */}
                            <div>
                                <label className="text-xs font-medium">
                                    Cumulative{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_cumulative}
                                    onValueChange={(v) =>
                                        setData('is_cumulative', v)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select cumulative status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            Cumulative
                                        </SelectItem>
                                        <SelectItem value="0">
                                            Non-Cumulative
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.is_cumulative} />
                            </div>

                            {/* Per Event */}
                            <div>
                                <label className="text-xs font-medium">
                                    Per Event{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_per_event}
                                    onValueChange={(v) =>
                                        setData('is_per_event', v)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select per event status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            Per Event
                                        </SelectItem>
                                        <SelectItem value="0">
                                            Not Per Event
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.is_per_event} />
                            </div>
                        </section>

                        {/*   Availment Type + Max Lifetime Grants */}
                        <section className="grid grid-cols-2 gap-5">
                            {/* Availment Type */}
                            <div>
                                <label className="text-xs font-medium">
                                    Availment Type{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.availment_type}
                                    onValueChange={(v) =>
                                        setData(
                                            'availment_type',
                                            v as
                                                | 'continuous'
                                                | 'intermittent'
                                                | 'both',
                                        )
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select availment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="continuous">
                                            Continuous
                                        </SelectItem>
                                        <SelectItem value="intermittent">
                                            Intermittent
                                        </SelectItem>
                                        <SelectItem value="both">
                                            Both
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.availment_type} />
                            </div>

                            {/* Max Lifetime Grants */}
                            <div>
                                <label className="text-xs font-medium">
                                    Max Lifetime Grants
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={data.max_lifetime_grants}
                                    onChange={(e) =>
                                        setData(
                                            'max_lifetime_grants',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 text-sm"
                                    placeholder="e.g. 3 (optional)"
                                />
                                <FieldError
                                    message={errors.max_lifetime_grants}
                                />
                            </div>
                        </section>

                        {/*   Availment Deadline Days + Status */}
                        <section className="grid grid-cols-2 gap-5">
                            {/* Availment Deadline */}
                            <div>
                                <label className="text-xs font-medium">
                                    Availment Deadline (days)
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={data.availment_deadline_days}
                                    onChange={(e) =>
                                        setData(
                                            'availment_deadline_days',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 text-sm"
                                    placeholder="e.g. 30 (optional)"
                                />
                                <FieldError
                                    message={errors.availment_deadline_days}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-medium">
                                    Status{' '}
                                    <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) => setData('status', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="0">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.status} />
                            </div>
                        </section>

                        {/* Requirements */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium">
                                    Requirements
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={addRequirement}
                                >
                                    <Plus className="h-3 w-3" />
                                    Requirement
                                </Button>
                            </div>

                            {requirementInputs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    No requirements added yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {requirementInputs.map((req, index) => (
                                        <div
                                            key={index}
                                            className="relative flex items-center gap-2 bg-muted/20"
                                        >
                                            <Input
                                                value={req.requirement_name}
                                                onChange={(e) =>
                                                    updateRequirement(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-sm"
                                                placeholder="e.g. Medical Certificate"
                                            />
                                            {(errors as any)[
                                                `requirements.${index}.requirement_name`
                                            ] && (
                                                <FieldError
                                                    message={
                                                        (errors as any)[
                                                            `requirements.${index}.requirement_name`
                                                        ]
                                                    }
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeRequirement(index)
                                                }
                                                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                                                title="Remove requirement"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 border-t bg-muted/30 px-5 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing
                                ? 'Saving...'
                                : isEdit
                                  ? 'Update'
                                  : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LeaveTypeIndex({ leave_types }: Props) {
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editingLeaveType, setEditingLeaveType] =
        React.useState<LeaveType | null>(null);
    const [detailLeaveType, setDetailLeaveType] =
        React.useState<LeaveType | null>(null);

    function openCreate() {
        setEditingLeaveType(null);
        setModalOpen(true);
    }

    function openEdit(leaveType: LeaveType) {
        setEditingLeaveType(leaveType);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingLeaveType(null);
    }

    // Opens ViewModal on any row click (desktop + mobile)
    function handleRowClick(row: Row<LeaveType>) {
        setDetailLeaveType(row.original);
    }

    const columns = getColumns({ onEdit: openEdit });

    return (
        <section className="space-y-4">
            <DataTable
                columns={columns}
                data={leave_types}
                getRowId={(row) => String(row.leave_type_id)}
                searchColumnId="leave_type_name"
                searchPlaceholder="Search leave types..."
                onRowClick={handleRowClick}
                filters={[
                    {
                        columnId: 'eligible_sex',
                        title: 'Eligible Sex',
                        options: [
                            { label: 'All', value: 'All' },
                            { label: 'Male', value: 'Male' },
                            { label: 'Female', value: 'Female' },
                        ],
                    },
                    {
                        columnId: 'is_paid',
                        title: 'Paid',
                        options: [
                            { label: 'Paid', value: true },
                            { label: 'Not Paid', value: false },
                        ],
                    },
                    {
                        columnId: 'is_convertible',
                        title: 'Convertible',
                        options: [
                            { label: 'Convertible', value: true },
                            { label: 'Not Convertible', value: false },
                        ],
                    },
                    {
                        columnId: 'status',
                        title: 'Status',
                        options: [
                            { label: 'Active', value: true },
                            { label: 'Inactive', value: false },
                        ],
                    },
                ]}
                addButton={{
                    label: 'Add Leave Type',
                    onClick: openCreate,
                }}
                bulkDelete={{
                    route: route('leave.leave-type.bulk-destroy'),
                    entityName: 'Leave Type',
                    getId: (row) => (row as LeaveType).leave_type_id,
                }}
            />

            {/* View modal — opens on row click */}
            <ViewModal
                leaveType={detailLeaveType}
                onClose={() => setDetailLeaveType(null)}
            />

            {/* Create / Edit modal */}
            <LeaveTypeModal
                key={editingLeaveType?.leave_type_id ?? 'create'}
                open={modalOpen}
                editingLeaveType={editingLeaveType}
                onClose={closeModal}
            />
        </section>
    );
}
