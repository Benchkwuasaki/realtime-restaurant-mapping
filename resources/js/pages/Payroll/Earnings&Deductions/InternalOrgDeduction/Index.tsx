// Internal Organization Deductions — Index.tsx

import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/shared/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import AppLayout from '@/layouts/app-layout';
import { useInternalOrgDeductionColumns } from '@/pages/Payroll/Earnings&Deductions/InternalOrgDeduction/components/columns';
import {
    type InternalOrgDeduction,
    type ServiceCategory,
    SERVICE_CATEGORY_LABELS,
    SERVICE_CATEGORY_CUTOFF,
} from '@/pages/Payroll/Earnings&Deductions/InternalOrgDeduction/data/schema';
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

interface ServiceOption {
    id: number;
    name: string;
    category: ServiceCategory;
}

/** { [org_id]: { [category]: ServiceOption[] } } */
type ServicesByOrg = Record<string, Record<string, ServiceOption[]>>;

interface Tab {
    key: string;
    label: string;
    orgId: string;
}

interface Props {
    deductions: InternalOrgDeduction[];
    employeesByOrg: Record<string, Employee[]>;
    organizations: Organization[];
    servicesByOrg: ServicesByOrg;
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
    service_category: '' as ServiceCategory | '',
    internal_organization_service_id: '',
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
    servicesForOrg: Record<string, ServiceOption[]>;
}

function DeductionDialog({
    open,
    onOpenChange,
    employees,
    activeTab,
    servicesForOrg,
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

    const availableCategories = Object.keys(
        servicesForOrg,
    ) as ServiceCategory[];

    const servicesForCategory: ServiceOption[] = form.service_category
        ? (servicesForOrg[form.service_category] ?? [])
        : [];

    const handleCategoryChange = (category: string) => {
        setForm((f) => ({
            ...f,
            service_category: category as ServiceCategory,
            internal_organization_service_id: '',
        }));
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route('internal-org-deductions.store'),
            {
                employee_id: parseInt(form.employee_id) || form.employee_id,
                internal_organization_id: activeTab.orgId,
                internal_organization_service_id:
                    parseInt(form.internal_organization_service_id) || null,
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
        !!form.employee_id &&
        !!form.service_category &&
        !!form.internal_organization_service_id &&
        !!form.amount &&
        parseFloat(form.amount) > 0 &&
        !!form.period_start &&
        !!form.period_end;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Deduction Entry</DialogTitle>
                </DialogHeader>

                <Separator />

                <div className="grid gap-4 py-2">
                    {/* Organization info */}
                    <div className="rounded-lg border border-input bg-muted/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Organization
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {activeTab.label}
                        </p>
                    </div>

                    {/* Employee — Popover + Command */}
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
                                        {employees.find(
                                            (e) =>
                                                String(e.id) ===
                                                form.employee_id,
                                        )?.full_name ?? 'Select employee...'}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[--radix-popover-trigger-width] border-input p-0"
                                align="start"
                            >
                                <Command className="border-0">
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

                    {/* Category */}
                    <div className="grid gap-1.5">
                        <Label>
                            Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={form.service_category}
                            onValueChange={handleCategoryChange}
                            disabled={availableCategories.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {SERVICE_CATEGORY_LABELS[
                                            cat as ServiceCategory
                                        ] ?? cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.service_category && (
                            <p className="text-xs text-muted-foreground">
                                Deducted on:{' '}
                                <span className="font-medium">
                                    {
                                        SERVICE_CATEGORY_CUTOFF[
                                            form.service_category as ServiceCategory
                                        ]
                                    }
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Service */}
                    <div className="grid gap-1.5">
                        <Label>
                            Service <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={form.internal_organization_service_id}
                            onValueChange={(v) =>
                                set('internal_organization_service_id', v)
                            }
                            disabled={
                                !form.service_category ||
                                servicesForCategory.length === 0
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        !form.service_category
                                            ? 'Select a category first...'
                                            : 'Select service...'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {servicesForCategory.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Input
                            placeholder="Additional notes (optional)"
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

export default function Index({
    deductions = [],
    employeesByOrg = {},
    organizations = [],
    servicesByOrg = {},
}: Props) {
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

    const filtered = useMemo(
        () => deductions.filter((d) => String(d.tab_key) === activeTabKey),
        [deductions, activeTabKey],
    );

    const activeEmployees = useMemo(
        () => employeesByOrg[activeTabKey] ?? [],
        [employeesByOrg, activeTabKey],
    );

    const activeServices = useMemo(
        () => servicesByOrg[activeTabKey] ?? {},
        [servicesByOrg, activeTabKey],
    );

    const handleDelete = (deduction: InternalOrgDeduction) => {
        router.delete(route('internal-org-deductions.destroy', deduction.id), {
            preserveScroll: true,
        });
    };

    const handleAmountChange = (
        deduction: InternalOrgDeduction,
        newAmount: number,
    ) => {
        router.patch(
            route('internal-org-deductions.updateAmount', deduction.id),
            { amount: newAmount },
            { preserveScroll: true },
        );
    };

    const columns = useInternalOrgDeductionColumns({
        onDelete: handleDelete,
        onAmountChange: handleAmountChange,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Internal Organization Deductions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-8">
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
                        getId: (row) => (row as InternalOrgDeduction).id,
                    }}
                />
            </div>

            {activeTab && (
                <DeductionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    employees={activeEmployees}
                    activeTab={activeTab}
                    servicesForOrg={activeServices}
                />
            )}
        </AppLayout>
    );
}
