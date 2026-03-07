// Internal Organization Deductions — Index.tsx
// Handles deductions for internal organizations (Union, Cooperative, Association, etc.)
// Designed to support multiple service types per organization (loans, savings, dues, etc.)

import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOtherDeductionColumns } from '@/components/Payroll/Earnings&Deductions/OtherDeductionEntry/components/columns';
import type { OtherDeduction } from '@/components/Payroll/Earnings&Deductions/OtherDeductionEntry/data/schema';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Organization {
    internal_organization_id: string;
    name: string;
    type: 'Union' | 'Cooperative' | 'Association';
}

interface Employee {
    id: number;
    full_name: string;
    position?: string;
}

interface Tab {
    key: string; // org UUID
    label: string;
    orgId: string;
}

interface Props {
    deductions: OtherDeduction[];
    employees: Employee[];
    organizations: Organization[];
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Earnings & Deductions', href: '#' },
    {
        title: 'Internal Org Deductions',
        href: route('internal-org-deductions.index'),
    },
];

// ── Empty form ────────────────────────────────────────────────────────────────

const makeEmptyForm = () => ({
    employee_id: '',
    internal_organization_id: '',
    description: '',
    amount: '',
    period_start: '',
    period_end: '',
});

// ── Dialog ────────────────────────────────────────────────────────────────────

interface DeductionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    activeTab: Tab;
}

function DeductionDialog({
    open,
    onOpenChange,
    employees,
    activeTab,
}: DeductionDialogProps) {
    const [form, setForm] = useState(makeEmptyForm);
    const [submitting, setSubmitting] = useState(false);

    const set = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleOpenChange = (value: boolean) => {
        if (!value) setForm(makeEmptyForm());
        onOpenChange(value);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route('internal-org-deductions.store'),
            {
                employee_id: parseInt(form.employee_id) || form.employee_id,
                internal_organization_id: activeTab.orgId,
                category: null,
                description: form.description || null,
                amount: parseFloat(form.amount) || 0,
                period_start: form.period_start,
                period_end: form.period_end,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setForm(makeEmptyForm());
                    onOpenChange(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const isValid =
        form.employee_id &&
        form.description &&
        form.amount &&
        parseFloat(form.amount) > 0 &&
        form.period_start &&
        form.period_end;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Deduction Entry</DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="grid gap-4 py-2">
                    {/* Organization info */}
                    <div className="rounded-lg border bg-muted/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Organization
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {activeTab.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Use Description to specify the service type (e.g.,
                            Loan, Savings, Dues, Share Capital)
                        </p>
                    </div>

                    {/* Employee */}
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
                                    <SelectItem key={e.id} value={String(e.id)}>
                                        {e.full_name}
                                        {e.position ? ` — ${e.position}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description - REQUIRED for org deductions */}
                    <div className="grid gap-1.5">
                        <Label>
                            Description{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            placeholder="e.g., Loan Payment, Savings Contribution, Membership Dues"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Specify the type of deduction and any relevant
                            details
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="grid gap-1.5">
                        <Label>
                            Amount (₱){' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={form.amount}
                            onChange={(e) => set('amount', e.target.value)}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    {/* Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Period Start{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={form.period_start}
                                onChange={(e) =>
                                    set('period_start', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>
                                Period End{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={form.period_end}
                                onChange={(e) =>
                                    set('period_end', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                    >
                        {submitting ? 'Saving...' : 'Add Entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
    deductions = [],
    employees = [],
    organizations = [],
}: Props) {
    // Build tab list from organizations — stringify IDs to avoid number/string mismatch
    const tabs = useMemo<Tab[]>(
        () =>
            organizations.map((org) => ({
                key: String(org.internal_organization_id),
                label: org.name,
                orgId: String(org.internal_organization_id),
            })),
        [organizations],
    );

    const [activeTabKey, setActiveTabKey] = useState<string>(() =>
        String(tabs[0]?.key ?? ''),
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    const activeTab = useMemo(
        () => tabs.find((t) => t.key === activeTabKey) ?? tabs[0],
        [tabs, activeTabKey],
    );

    // Filter deductions by organization UUID
    const filtered = useMemo(
        () => deductions.filter((d) => String(d.tab_key) === activeTabKey),
        [deductions, activeTabKey],
    );

    const handleDelete = (deduction: OtherDeduction) => {
        router.delete(route('internal-org-deductions.destroy', deduction.id), {
            preserveScroll: true,
        });
    };

    const handleAmountChange = (
        deduction: OtherDeduction,
        newAmount: number,
    ) => {
        router.patch(
            route('internal-org-deductions.updateAmount', deduction.id),
            { amount: newAmount },
            { preserveScroll: true },
        );
    };

    const columns = useOtherDeductionColumns({
        onDelete: handleDelete,
        onAmountChange: handleAmountChange,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Internal Organization Deductions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-8">
                {/* ── Tab Navigation ──────────────────────────────────────── */}
                <Tabs value={activeTabKey} onValueChange={setActiveTabKey}>
                    <div className="shrink-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <TabsList className="flex h-auto flex-nowrap gap-0 bg-transparent p-0">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.key}
                                    value={tab.key}
                                    className="relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                {/* ── Table ───────────────────────────────────────────────── */}
                <DataTable
                    data={filtered}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    searchColumnId="employee_name"
                    searchPlaceholder={`Search ${activeTab?.label ?? ''} entries...`}
                    addButton={{
                        label: 'Add New Entry',
                        onClick: () => setDialogOpen(true),
                    }}
                    bulkDelete={{
                        route: route('internal-org-deductions.bulk-destroy'),
                        entityName: 'Deduction',
                        getId: (row) => (row as OtherDeduction).id,
                    }}
                />
            </div>

            {/* ── Dialog ──────────────────────────────────────────────────── */}
            {activeTab && (
                <DeductionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    employees={employees}
                    activeTab={activeTab}
                />
            )}
        </AppLayout>
    );
}
