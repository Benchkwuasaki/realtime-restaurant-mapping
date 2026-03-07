// Loan Entry Index.tsx

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
import { Separator } from '@/components/ui/separator';
import { useLoanColumns } from '@/components/Payroll/Earnings&Deductions/LoanEntry/components/columns';
import { type Loan } from '@/components/Payroll/Earnings&Deductions/LoanEntry/data/schema';
import type { BreadcrumbItem } from '@/types';

interface Employee {
    id: number;
    full_name: string;
    position?: string;
}

interface Props {
    loans: Loan[];
    employees: Employee[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Earnings & Deductions', href: '#' },
    { title: 'Loan Entry', href: route('loanentry.index') },
];

// TODO: Extract from database. Dummy datda for now hehe
// HMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm
const LOAN_TYPES: { label: string; source: 'GSIS' | 'PagIBIG' }[] = [
    { label: 'GSIS MPL', source: 'GSIS' },
    { label: 'GSIS Emergency Loan', source: 'GSIS' },
    { label: 'GSIS Salary Loan', source: 'GSIS' },
    { label: 'GSIS Policy Loan', source: 'GSIS' },
    { label: 'Pag-IBIG MPL', source: 'PagIBIG' },
    { label: 'Pag-IBIG Housing Loan', source: 'PagIBIG' },
    { label: 'Pag-IBIG Calamity Loan', source: 'PagIBIG' },
];

const STATUS_OPTIONS: Loan['status'][] = ['Active', 'Completed', 'Suspended'];

const statusFilterOptions = STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
const sourceFilterOptions = [
    { value: 'GSIS', label: 'GSIS' },
    { value: 'PagIBIG', label: 'PagIBIG' },
];

const emptyForm = {
    employee_id: '',
    loan_type: '',
    source: '',
    total_amount: '',
    monthly_amortization: '',
    semi_monthly_deduction: '',
    start_period: '',
    end_period: '',
    status: 'Active' as Loan['status'],
};

interface LoanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loan?: Loan | null;
    employees: Employee[];
}

function LoanDialog({ open, onOpenChange, loan, employees }: LoanDialogProps) {
    const isEdit = !!loan;

    const buildForm = (l?: Loan | null) => ({
        employee_id: l?.employee_id?.toString() ?? '',
        loan_type: l?.loan_type ?? '',
        source: l?.source ?? '',
        total_amount: l?.total_amount?.toString() ?? '',
        monthly_amortization: l?.monthly_amortization?.toString() ?? '',
        semi_monthly_deduction: l?.semi_monthly_deduction?.toString() ?? '',
        start_period: l?.start_period ?? '',
        end_period: l?.end_period ?? '',
        status: l?.status ?? ('Active' as Loan['status']),
    });

    const [form, setForm] = useState(() => buildForm(loan));

    useEffect(() => {
        setForm(buildForm(loan));
    }, [loan]);

    const set = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleLoanTypeChange = (value: string) => {
        const found = LOAN_TYPES.find((lt) => lt.label === value);
        setForm((f) => ({
            ...f,
            loan_type: value,
            source: found?.source ?? f.source,
        }));
    };

    const handleMonthlyAmortChange = (value: string) => {
        const monthly = parseFloat(value) || 0;
        const semi = (monthly / 2).toFixed(2);
        setForm((f) => ({
            ...f,
            monthly_amortization: value,
            semi_monthly_deduction: semi,
        }));
    };

    const handleSubmit = () => {
        const payload = {
            employee_id: parseInt(form.employee_id),
            loan_type: form.loan_type,
            source: form.source,
            total_amount: parseFloat(form.total_amount) || 0,
            monthly_amortization: parseFloat(form.monthly_amortization) || 0,
            semi_monthly_deduction:
                parseFloat(form.semi_monthly_deduction) || 0,
            start_period: form.start_period,
            end_period: form.end_period,
            status: form.status,
        };

        if (isEdit) {
            router.put(route('loanentry.update', loan!.id), payload, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            router.post(route('loanentry.store'), payload, {
                onSuccess: () => {
                    onOpenChange(false);
                    setForm(emptyForm);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Loan' : 'New Loan Entry'}
                    </DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label>
                            Employee <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={form.employee_id}
                            onValueChange={(v) => set('employee_id', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select employee..." />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((e) => (
                                    <SelectItem
                                        key={e.id}
                                        value={e.id.toString()}
                                    >
                                        {e.full_name}
                                        {e.position ? ` — ${e.position}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Loan Type{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.loan_type}
                                onValueChange={handleLoanTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOAN_TYPES.map((lt) => (
                                        <SelectItem
                                            key={lt.label}
                                            value={lt.label}
                                        >
                                            {lt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Source</Label>
                            <Input
                                value={form.source}
                                readOnly
                                className="bg-muted text-muted-foreground"
                                placeholder="Auto-filled"
                            />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>
                            Total Loan Amount{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={form.total_amount}
                            onChange={(e) =>
                                set('total_amount', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Monthly Amortization{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={form.monthly_amortization}
                                onChange={(e) =>
                                    handleMonthlyAmortChange(e.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Semi-Monthly Deduction</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={form.semi_monthly_deduction}
                                onChange={(e) =>
                                    set(
                                        'semi_monthly_deduction',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Auto-computed as Monthly ÷ 2
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Start Period{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="month"
                                value={form.start_period}
                                onChange={(e) =>
                                    set('start_period', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>
                                End Period{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="month"
                                value={form.end_period}
                                onChange={(e) =>
                                    set('end_period', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Status</Label>
                        <Select
                            value={form.status}
                            onValueChange={(v) =>
                                set('status', v as Loan['status'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
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
                        {isEdit ? 'Save Changes' : 'Add Loan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Index({ loans = [], employees = [] }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Loan | null>(null);

    const handleEdit = (loan: Loan) => {
        setEditTarget(loan);
        setDialogOpen(true);
    };

    const handleDelete = (loan: Loan) => {
        router.delete(route('loanentry.destroy', loan.id), {
            preserveScroll: true,
        });
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) setEditTarget(null);
        setDialogOpen(open);
    };

    const columns = useLoanColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loan Entry" />

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
                <DataTable
                    data={loans}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    searchColumnId="employee_name"
                    searchPlaceholder="Search by employee..."
                    filters={[
                        {
                            columnId: 'source',
                            title: 'Source',
                            options: sourceFilterOptions,
                        },
                        {
                            columnId: 'status',
                            title: 'Status',
                            options: statusFilterOptions,
                        },
                    ]}
                    addButton={{
                        label: 'New Loan',
                        onClick: () => {
                            setEditTarget(null);
                            setDialogOpen(true);
                        },
                    }}
                    bulkDelete={{
                        route: '',
                        entityName: 'Loan',
                        getId: (row) => (row as Loan).id,
                    }}
                />
            </div>

            <LoanDialog
                open={dialogOpen}
                onOpenChange={handleDialogClose}
                loan={editTarget}
                employees={employees}
            />
        </AppLayout>
    );
}
