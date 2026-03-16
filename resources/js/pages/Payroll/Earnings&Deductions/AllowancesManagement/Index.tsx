// Allowance Management Index.tsx

import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/shared/data-table/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Trash2, Users } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAllowanceColumns } from '@/components/Payroll/Earnings&Deductions/AllowanceManagement/components/columns';
import { type Allowance } from '@/components/Payroll/Earnings&Deductions/AllowanceManagement/data/schema';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Classification {
    id: number;
    name: string;
}

interface Employee {
    employee_id: number;
    name: string;
    employment_classification: string;
    assigned_allowances: string[];
}

interface Props {
    allowances: Allowance[];
    classifications: Classification[];
    employees: Employee[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Pay Adjustments', href: '#' },
    { title: 'Allowance Management', href: route('allowancemanagement.index') },
];

const BASIS_OPTIONS = ['Fixed', 'Percentage', 'Daily Rate'];

const taxableFilterOptions = [
    { value: false, label: 'Non-Taxable' },
    { value: true, label: 'Taxable' },
];

const emptyForm = {
    name: '',
    description: '',
    monthly_salary: '',
    taxable: 'false',
    applicable_to: [] as string[],
    mandatory: 'false',
    basis: '',
};

// ── AllowanceDialog ────────────────────────────────────────────────────────────

interface AllowanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allowance?: Allowance | null;
    classifications: Classification[];
}

function AllowanceDialog({
    open,
    onOpenChange,
    allowance,
    classifications,
}: AllowanceDialogProps) {
    const isEdit = !!allowance;

    const buildForm = (a?: Allowance | null) => ({
        name: a?.name ?? '',
        description: a?.description ?? '',
        monthly_salary: a?.monthly_salary?.toString() ?? '',
        taxable: a?.taxable ? 'true' : 'false',
        applicable_to: a?.applicable_to
            ? a.applicable_to.split(', ').map((s) => s.trim())
            : ([] as string[]),
        mandatory: a?.mandatory ? 'true' : 'false',
        basis: a?.basis ?? '',
    });

    const [form, setForm] = useState(() => buildForm(allowance));

    useEffect(() => {
        setForm(buildForm(allowance));
    }, [allowance]);

    const set = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const toggleApplicable = (option: string, checked: boolean) => {
        setForm((f) => ({
            ...f,
            applicable_to: checked
                ? [...f.applicable_to, option]
                : f.applicable_to.filter((v) => v !== option),
        }));
    };

    const handleSubmit = () => {
        const payload = {
            ...form,
            taxable: form.taxable === 'true',
            mandatory: form.mandatory === 'true',
            monthly_salary: parseFloat(form.monthly_salary) || 0,
            applicable_to: form.applicable_to.join(', ') || null,
        };

        if (isEdit) {
            router.put(
                route('allowancemanagement.update', allowance!.id),
                payload,
                { onSuccess: () => onOpenChange(false) },
            );
        } else {
            router.post(route('allowancemanagement.store'), payload, {
                onSuccess: () => {
                    onOpenChange(false);
                    setForm(emptyForm);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Allowance' : 'Add Allowance'}
                    </DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">
                            Allowance Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g. PERA"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="e.g. Personnel Economic Relief Allowance"
                            value={form.description ?? ''}
                            onChange={(e) => set('description', e.target.value)}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="monthly_salary">
                            Monthly Amount{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="monthly_salary"
                            type="number"
                            placeholder="0.00"
                            value={form.monthly_salary}
                            onChange={(e) =>
                                set('monthly_salary', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Taxable?</Label>
                            <Select
                                value={form.taxable}
                                onValueChange={(v) => set('taxable', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">
                                        Non-Taxable
                                    </SelectItem>
                                    <SelectItem value="true">
                                        Taxable
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Mandatory?</Label>
                            <Select
                                value={form.mandatory}
                                onValueChange={(v) => set('mandatory', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Applicable To</Label>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-input px-4 py-3">
                            {classifications.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                    No classifications available.
                                </span>
                            ) : (
                                classifications.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`applicable-${c.id}`}
                                            checked={form.applicable_to.includes(
                                                c.name,
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleApplicable(
                                                    c.name,
                                                    !!checked,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={`applicable-${c.id}`}
                                            className="cursor-pointer text-sm font-normal"
                                        >
                                            {c.name}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Basis</Label>
                        <Select
                            value={form.basis ?? ''}
                            onValueChange={(v) => set('basis', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BASIS_OPTIONS.map((o) => (
                                    <SelectItem key={o} value={o}>
                                        {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {isEdit ? 'Save Changes' : 'Add Allowance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── AssignEmployeesDialog ──────────────────────────────────────────────────────

interface AssignEmployeesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allowance: Allowance | null;
    employees: Employee[];
}

function AssignEmployeesDialog({
    open,
    onOpenChange,
    allowance,
    employees,
}: AssignEmployeesDialogProps) {
    const [search, setSearch] = useState('');
    const [beneficiarySearch, setBeneficiarySearch] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [toAdd, setToAdd] = useState<number[]>([]);
    const [toRemove, setToRemove] = useState<number[]>([]);
    const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

    const applicableClassifications = useMemo(() => {
        if (!allowance?.applicable_to) return [];
        return allowance.applicable_to.split(', ').map((s) => s.trim());
    }, [allowance]);

    // Split employees into current beneficiaries vs unassigned
    const currentBeneficiaries = useMemo(() => {
        if (!allowance) return [];
        return employees.filter((e) =>
            e.assigned_allowances.includes(allowance.name),
        );
    }, [employees, allowance]);

    const filteredBeneficiaries = useMemo(() => {
        if (!beneficiarySearch.trim()) return currentBeneficiaries;
        const q = beneficiarySearch.toLowerCase();
        return currentBeneficiaries.filter((e) =>
            e.name.toLowerCase().includes(q),
        );
    }, [currentBeneficiaries, beneficiarySearch]);

    const unassignedEmployees = useMemo(() => {
        if (!allowance) return [];
        return employees.filter(
            (e) => !e.assigned_allowances.includes(allowance.name),
        );
    }, [employees, allowance]);

    // Reset on open
    useEffect(() => {
        if (!open) return;
        setToAdd([]);
        setToRemove([]);
        setConfirmRemoveOpen(false);
        setSearch('');
        setBeneficiarySearch('');
        setShowAll(false);
    }, [open]);

    // Filtered unassigned list for right panel
    const visibleUnassigned = useMemo(() => {
        let list = unassignedEmployees;
        if (!showAll && applicableClassifications.length > 0) {
            list = list.filter((e) =>
                applicableClassifications.includes(e.employment_classification),
            );
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((e) => e.name.toLowerCase().includes(q));
        }
        return list;
    }, [unassignedEmployees, applicableClassifications, showAll, search]);

    const toggle = (id: number) =>
        setToAdd((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );

    const allVisibleSelected =
        visibleUnassigned.length > 0 &&
        visibleUnassigned.every((e) => toAdd.includes(e.employee_id));

    const someVisibleSelected =
        !allVisibleSelected &&
        visibleUnassigned.some((e) => toAdd.includes(e.employee_id));

    const toggleAll = (checked: boolean) => {
        const ids = visibleUnassigned.map((e) => e.employee_id);
        if (checked) {
            setToAdd((prev) => [...new Set([...prev, ...ids])]);
        } else {
            const set = new Set(ids);
            setToAdd((prev) => prev.filter((id) => !set.has(id)));
        }
    };

    const handleSubmit = () => {
        if (!allowance || toAdd.length === 0) return;
        router.post(
            route('allowancemanagement.assign', allowance.id),
            { employee_ids: toAdd },
            { onSuccess: () => onOpenChange(false) },
        );
    };

    const handleUnassign = () => {
        if (!allowance || toRemove.length === 0) return;
        router.delete(route('allowancemanagement.unassign', allowance.id), {
            data: { employee_ids: toRemove },
            preserveScroll: true,
            onSuccess: () => {
                setToRemove([]);
                setConfirmRemoveOpen(false);
            },
        });
    };

    const toggleRemove = (id: number) =>
        setToRemove((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );

    const allBeneficiariesSelected =
        currentBeneficiaries.length > 0 &&
        currentBeneficiaries.every((e) => toRemove.includes(e.employee_id));

    const someBeneficiariesSelected =
        !allBeneficiariesSelected &&
        currentBeneficiaries.some((e) => toRemove.includes(e.employee_id));

    const toggleAllRemove = (checked: boolean) => {
        if (checked) {
            setToRemove(currentBeneficiaries.map((e) => e.employee_id));
        } else {
            setToRemove([]);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Assign Employees
                        </DialogTitle>
                        <DialogDescription>
                            <span className="font-medium text-foreground">
                                {allowance?.name}
                            </span>{' '}
                            — ₱
                            {Number(
                                allowance?.monthly_salary ?? 0,
                            ).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                            })}{' '}
                            / month
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        {/* ── Left: Current Beneficiaries ── */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Current Beneficiaries
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                    {currentBeneficiaries.length}
                                </Badge>
                            </div>

                            {/* Beneficiary search */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search beneficiaries..."
                                    value={beneficiarySearch}
                                    onChange={(e) =>
                                        setBeneficiarySearch(e.target.value)
                                    }
                                    className="h-8 pl-8"
                                />
                            </div>

                            <div className="rounded-md border border-input">
                                {/* Select-all + Remove button header */}
                                <div className="flex items-center justify-between border-b px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={
                                                allBeneficiariesSelected ||
                                                (someBeneficiariesSelected &&
                                                    'indeterminate')
                                            }
                                            onCheckedChange={(v) =>
                                                toggleAllRemove(!!v)
                                            }
                                            disabled={
                                                currentBeneficiaries.length ===
                                                0
                                            }
                                            aria-label="Select all beneficiaries"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Select all
                                        </span>
                                    </div>
                                    {toRemove.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                                setConfirmRemoveOpen(true)
                                            }
                                        >
                                            <Trash2 className="size-3" />
                                            Remove ({toRemove.length})
                                        </Button>
                                    )}
                                </div>
                                <ScrollArea className="h-52">
                                    {currentBeneficiaries.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No employees assigned yet.
                                        </p>
                                    ) : filteredBeneficiaries.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No results found.
                                        </p>
                                    ) : (
                                        filteredBeneficiaries.map((e) => (
                                            <div
                                                key={e.employee_id}
                                                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50"
                                                onClick={() =>
                                                    toggleRemove(e.employee_id)
                                                }
                                            >
                                                <Checkbox
                                                    checked={toRemove.includes(
                                                        e.employee_id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleRemove(
                                                            e.employee_id,
                                                        )
                                                    }
                                                    onClick={(ev) =>
                                                        ev.stopPropagation()
                                                    }
                                                />
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-medium">
                                                        {e.name}
                                                    </span>
                                                    {e.employment_classification && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="shrink-0 text-xs"
                                                        >
                                                            {
                                                                e.employment_classification
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </ScrollArea>
                            </div>
                        </div>

                        {/* ── Right: Add Employees ── */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Add Employees
                                </p>
                                {toAdd.length > 0 && (
                                    <Badge
                                        variant="default"
                                        className="text-xs"
                                    >
                                        {toAdd.length} selected
                                    </Badge>
                                )}
                            </div>

                            {/* Search + filter */}
                            <div className="flex flex-col gap-1.5">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employees..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-8 pl-8"
                                    />
                                </div>
                                {applicableClassifications.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            {showAll
                                                ? 'Showing all'
                                                : `${applicableClassifications.join(', ')} only`}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                            onClick={() =>
                                                setShowAll((v) => !v)
                                            }
                                        >
                                            {showAll ? 'Filter' : 'Show all'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* List */}
                            <div className="rounded-md border border-input">
                                <div className="flex items-center gap-3 border-b px-3 py-2">
                                    <Checkbox
                                        checked={
                                            allVisibleSelected ||
                                            (someVisibleSelected &&
                                                'indeterminate')
                                        }
                                        onCheckedChange={(v) => toggleAll(!!v)}
                                        aria-label="Select all"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Select all
                                    </span>
                                </div>
                                <ScrollArea className="h-56">
                                    {visibleUnassigned.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No employees to add.
                                        </p>
                                    ) : (
                                        visibleUnassigned.map((e) => (
                                            <div
                                                key={e.employee_id}
                                                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50"
                                                onClick={() =>
                                                    toggle(e.employee_id)
                                                }
                                            >
                                                <Checkbox
                                                    checked={toAdd.includes(
                                                        e.employee_id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggle(e.employee_id)
                                                    }
                                                    onClick={(ev) =>
                                                        ev.stopPropagation()
                                                    }
                                                />
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-medium">
                                                        {e.name}
                                                    </span>
                                                    {e.employment_classification && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="shrink-0 text-xs"
                                                        >
                                                            {
                                                                e.employment_classification
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={toAdd.length === 0}
                        >
                            Assign{toAdd.length > 0 ? ` (${toAdd.length})` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={confirmRemoveOpen}
                onOpenChange={(open) => !open && setConfirmRemoveOpen(false)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Remove Beneficiaries?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove{' '}
                            <span className="font-semibold text-foreground">
                                {toRemove.length} employee
                                {toRemove.length > 1 ? 's' : ''}
                            </span>{' '}
                            from{' '}
                            <span className="font-semibold text-foreground">
                                {allowance?.name}
                            </span>
                            . Their deduction will no longer be applied in
                            future payroll runs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleUnassign}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function Index({
    allowances = [],
    classifications = [],
    employees = [],
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Allowance | null>(null);

    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<Allowance | null>(null);

    const handleEdit = (allowance: Allowance) => {
        setEditTarget(allowance);
        setDialogOpen(true);
    };

    const handleDelete = (allowance: Allowance) => {
        router.delete(route('allowancemanagement.destroy', allowance.id), {
            preserveScroll: true,
        });
    };

    const handleAssign = (allowance: Allowance) => {
        setAssignTarget(allowance);
        setAssignDialogOpen(true);
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) setEditTarget(null);
        setDialogOpen(open);
    };

    const handleAssignDialogClose = (open: boolean) => {
        if (!open) setAssignTarget(null);
        setAssignDialogOpen(open);
    };

    const columns = useAllowanceColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAssign: handleAssign,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Allowance Management" />

            <div className="h-full flex-col gap-8 p-8">
                <Heading
                    title="Allowance Management"
                    description="Manage allowances for employees here"
                />

                <DataTable
                    data={allowances}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    searchColumnId="name"
                    searchPlaceholder="Search allowances..."
                    filters={[
                        {
                            columnId: 'taxable',
                            title: 'Taxable',
                            options: taxableFilterOptions,
                        },
                    ]}
                    addButton={{
                        label: 'Add Allowance',
                        onClick: () => {
                            setEditTarget(null);
                            setDialogOpen(true);
                        },
                    }}
                    bulkDelete={{
                        route: '',
                        entityName: 'Allowance',
                        getId: (row) => (row as Allowance).id,
                    }}
                />
            </div>

            <AllowanceDialog
                open={dialogOpen}
                onOpenChange={handleDialogClose}
                allowance={editTarget}
                classifications={classifications}
            />

            <AssignEmployeesDialog
                open={assignDialogOpen}
                onOpenChange={handleAssignDialogClose}
                allowance={assignTarget}
                employees={employees}
            />
        </AppLayout>
    );
}
