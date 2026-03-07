// Allowance Management Index.tsx

import { useState, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAllowanceColumns } from '@/components/Payroll/Earnings&Deductions/AllowanceManagement/components/columns';
import { type Allowance } from '@/components/Payroll/Earnings&Deductions/AllowanceManagement/data/schema';
import type { BreadcrumbItem } from '@/types';

interface Props {
    allowances: Allowance[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Earnings & Deductions', href: '#' },
    { title: 'Allowance Management', href: route('allowancemanagement.index') },
];

// TODO: Make it base on the database
const APPLICABLE_OPTIONS = ['Regular', 'Casual', 'Job Order'];

// TODO: Hmmmmmmm
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

interface AllowanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allowance?: Allowance | null;
}

function AllowanceDialog({
    open,
    onOpenChange,
    allowance,
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
                {
                    onSuccess: () => onOpenChange(false),
                },
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
                        <div className="flex items-center gap-6 rounded-md border px-4 py-3">
                            {APPLICABLE_OPTIONS.map((option) => (
                                <div
                                    key={option}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        id={`applicable-${option}`}
                                        checked={form.applicable_to.includes(
                                            option,
                                        )}
                                        onCheckedChange={(checked) =>
                                            toggleApplicable(option, !!checked)
                                        }
                                    />
                                    <Label
                                        htmlFor={`applicable-${option}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {option}
                                    </Label>
                                </div>
                            ))}
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

export default function Index({ allowances = [] }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Allowance | null>(null);

    const handleEdit = (allowance: Allowance) => {
        setEditTarget(allowance);
        setDialogOpen(true);
    };

    const handleDelete = (allowance: Allowance) => {
        router.delete(route('allowancemanagement.destroy', allowance.id), {
            preserveScroll: true,
        });
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) setEditTarget(null);
        setDialogOpen(open);
    };

    const columns = useAllowanceColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Allowance Management" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
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
            />
        </AppLayout>
    );
}
