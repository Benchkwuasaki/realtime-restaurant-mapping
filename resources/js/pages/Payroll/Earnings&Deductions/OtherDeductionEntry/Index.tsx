// Other Deduction Entry — Index.tsx

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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useOtherDeductionColumns } from '@/components/Payroll/Earnings&Deductions/OtherDeductionEntry/components/columns';
import type { OtherDeduction } from '@/components/Payroll/Earnings&Deductions/OtherDeductionEntry/data/schema';
import type { BreadcrumbItem } from '@/types';

// ── Fixed special category tabs ───────────────────────────────────────────────

const SPECIAL_TABS = [
    { key: 'Water Bill', label: 'Water Bill' },
    { key: 'NS & ND (COA)', label: 'NS & ND (COA)' },
    { key: 'Miscellaneous', label: 'Miscellaneous' },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
    id: number;
    full_name: string;
    position?: string;
}

interface Tab {
    key: string;
    label: string;
}

interface Props {
    deductions: OtherDeduction[];
    employees: Employee[];
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Pay Adjustments', href: '#' },
    { title: 'Other Deduction Entry', href: route('otherdeductions.index') },
];

// ── Empty form ────────────────────────────────────────────────────────────────

const makeEmptyForm = () => ({
    employee_id: '',
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
    const [employeeOpen, setEmployeeOpen] = useState(false);

    const set = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            setForm(makeEmptyForm());
            setEmployeeOpen(false);
        }
        onOpenChange(value);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route('otherdeductions.store'),
            {
                employee_id: parseInt(form.employee_id) || form.employee_id,
                internal_organization_id: null,
                category: activeTab.key,
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

    const selectedEmployee = employees.find(
        (e) => String(e.id) === form.employee_id,
    );

    const isValid =
        form.employee_id &&
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
                    <div className="rounded-lg border border-input bg-muted/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Adding entry under
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {activeTab.label}
                        </p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>
                            Employee <span className="text-destructive">*</span>
                        </Label>
                        <Popover
                            open={employeeOpen}
                            onOpenChange={setEmployeeOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeOpen}
                                    className="w-full justify-between border-input font-normal"
                                >
                                    <span className="truncate">
                                        {selectedEmployee
                                            ? selectedEmployee.full_name
                                            : 'Select employee...'}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[--radix-popover-trigger-width] border-input p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Search employee..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            No employee found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((e) => (
                                                <CommandItem
                                                    key={e.id}
                                                    value={e.full_name}
                                                    onSelect={() => {
                                                        set(
                                                            'employee_id',
                                                            String(e.id),
                                                        );
                                                        setEmployeeOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={`mr-2 h-4 w-4 ${
                                                            String(e.id) ===
                                                            form.employee_id
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        }`}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {e.full_name}
                                                        </span>
                                                        {e.position && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {e.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Description */}
                    <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Input
                            placeholder="Optional additional details..."
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
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

export default function Index({ deductions = [], employees = [] }: Props) {
    const tabs = useMemo<Tab[]>(
        () => SPECIAL_TABS.map((s) => ({ key: s.key, label: s.label })),
        [],
    );

    const [activeTabKey, setActiveTabKey] = useState<string>(
        () => tabs[0]?.key ?? SPECIAL_TABS[0].key,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    const activeTab = useMemo(
        () => tabs.find((t) => t.key === activeTabKey) ?? tabs[0],
        [tabs, activeTabKey],
    );

    const filtered = useMemo(
        () => deductions.filter((d) => d.tab_key === activeTabKey),
        [deductions, activeTabKey],
    );

    const handleDelete = (deduction: OtherDeduction) => {
        router.delete(route('otherdeductions.destroy', deduction.id), {
            preserveScroll: true,
        });
    };

    const handleAmountChange = (
        deduction: OtherDeduction,
        newAmount: number,
    ) => {
        router.patch(
            route('otherdeductions.updateAmount', deduction.id),
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
            <Head title="Other Deductions Entry" />

            <div className="flex h-full flex-1 flex-col gap-4 p-8">
                <section className="rounded-lg border border-secondary bg-card p-6">
                    <Tabs
                        value={activeTabKey}
                        onValueChange={setActiveTabKey}
                        className="pb-6"
                    >
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
                            route: route('otherdeductions.bulk-destroy'),
                            entityName: 'Deduction',
                            getId: (row) => (row as OtherDeduction).id,
                        }}
                    />
                </section>
            </div>

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
