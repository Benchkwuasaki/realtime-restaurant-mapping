// Loan Entry — Index.tsx

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
import { useLoanColumns } from '@/components/Payroll/Earnings&Deductions/LoanEntry/components/columns';
import { type Loan } from '@/components/Payroll/Earnings&Deductions/LoanEntry/data/schema';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
    id: number;
    full_name: string;
    position?: string;
}

interface LoanService {
    id: number;
    name: string;
}

interface InternalOrganization {
    id: string;
    name: string;
    type: string;
    loan_services: LoanService[];
}

interface Props {
    loans: Loan[];
    employees: Employee[];
    internalOrganizations: InternalOrganization[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Earnings & Deductions', href: '#' },
    { title: 'Loan Entry', href: route('loanentry.index') },
];

const GOVT_LOAN_TYPES: { label: string; source: 'GSIS' | 'Pag-IBIG' }[] = [
    { label: 'GSIS MPL',             source: 'GSIS' },
    { label: 'GSIS Emergency Loan',  source: 'GSIS' },
    { label: 'GSIS Salary Loan',     source: 'GSIS' },
    { label: 'GSIS Policy Loan',     source: 'GSIS' },
    { label: 'Pag-IBIG MPL',         source: 'Pag-IBIG' },
    { label: 'Pag-IBIG Housing Loan',source: 'Pag-IBIG' },
    { label: 'Pag-IBIG Calamity Loan', source: 'Pag-IBIG' },
];

const STATUS_OPTIONS: Loan['status'][] = ['Active', 'Completed', 'Suspended'];

const statusFilterOptions = STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
const sourceFilterOptions = [
    { value: 'GSIS',    label: 'GSIS' },
    { value: 'Pag-IBIG', label: 'Pag-IBIG' },
];

type LoanTab = 'govt' | 'internal';

// ── Empty forms ───────────────────────────────────────────────────────────────

const emptyGovtForm = {
    employee_id:  '',
    loan_type:    '',
    source:       '',
    total_amount: '',
    term_months:  '',
    start_period: '',
    status:       'Active' as Loan['status'],
};

const emptyInternalForm = {
    employee_id:               '',
    internal_organization_id:  '',
    loan_type:                 '',   // service name
    source:                    '',   // org name (auto-filled)
    total_amount:              '',
    term_months:               '',
    start_period:              '',
    status:                    'Active' as Loan['status'],
};

// ── Computed preview ──────────────────────────────────────────────────────────

function computeAmortization(totalAmount: string, termMonths: string) {
    const total = parseFloat(totalAmount) || 0;
    const term  = parseInt(termMonths)    || 0;
    if (!total || !term) return { monthly: '—', semi: '—', endPeriod: '—' };
    const monthly = (total / term).toFixed(2);
    const semi    = (total / term / 2).toFixed(2);
    return { monthly, semi };
}

function computeEndPeriod(startPeriod: string, termMonths: string): string {
    if (!startPeriod || !termMonths) return '—';
    const term = parseInt(termMonths) || 0;
    if (!term) return '—';
    const [year, month] = startPeriod.split('-').map(Number);
    const endDate = new Date(year, month - 1 + term - 1);
    return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface LoanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loan?: Loan | null;
    employees: Employee[];
    internalOrganizations: InternalOrganization[];
}

function LoanDialog({
    open,
    onOpenChange,
    loan,
    employees,
    internalOrganizations,
}: LoanDialogProps) {
    const isEdit = !!loan;

    // Determine initial tab from existing loan
    const initialTab: LoanTab =
        loan?.internal_organization_id ? 'internal' : 'govt';

    const [activeTab, setActiveTab] = useState<LoanTab>(initialTab);

    // ── Gov't form ────────────────────────────────────────────────────────────
    const buildGovtForm = (l?: Loan | null) => ({
        employee_id:  l?.employee_id?.toString() ?? '',
        loan_type:    l?.loan_type ?? '',
        source:       l?.source ?? '',
        total_amount: l?.total_amount?.toString() ?? '',
        term_months:  l ? String(computeTermFromLoan(l)) : '',
        start_period: l?.start_period ?? '',
        status:       (l?.status ?? 'Active') as Loan['status'],
    });

    // ── Internal org form ─────────────────────────────────────────────────────
    const buildInternalForm = (l?: Loan | null) => ({
        employee_id:              l?.employee_id?.toString() ?? '',
        internal_organization_id: l?.internal_organization_id?.toString() ?? '',
        loan_type:                l?.loan_type ?? '',
        source:                   l?.source ?? '',
        total_amount:             l?.total_amount?.toString() ?? '',
        term_months:              l ? String(computeTermFromLoan(l)) : '',
        start_period:             l?.start_period ?? '',
        status:                   (l?.status ?? 'Active') as Loan['status'],
    });

    const [govtForm, setGovtForm]         = useState(() => buildGovtForm(loan));
    const [internalForm, setInternalForm] = useState(() => buildInternalForm(loan));

    useEffect(() => {
        setActiveTab(loan?.internal_organization_id ? 'internal' : 'govt');
        setGovtForm(buildGovtForm(loan));
        setInternalForm(buildInternalForm(loan));
    }, [loan]);

    const setG = (key: string, value: string) =>
        setGovtForm((f) => ({ ...f, [key]: value }));
    const setI = (key: string, value: string) =>
        setInternalForm((f) => ({ ...f, [key]: value }));

    // Auto-fill source when loan type selected (govt)
    const handleGovtLoanTypeChange = (value: string) => {
        const found = GOVT_LOAN_TYPES.find((lt) => lt.label === value);
        setGovtForm((f) => ({
            ...f,
            loan_type: value,
            source: found?.source ?? f.source,
        }));
    };

    // Auto-fill source when org selected (internal)
    const handleOrgChange = (orgId: string) => {
        const org = internalOrganizations.find((o) => o.id === orgId);
        setInternalForm((f) => ({
            ...f,
            internal_organization_id: orgId,
            source: org?.name ?? '',
            loan_type: '',           // reset service selection
        }));
    };

    // Services for selected org
    const activeOrgServices = useMemo(() => {
        const org = internalOrganizations.find(
            (o) => o.id === internalForm.internal_organization_id
        );
        return org?.loan_services ?? [];
    }, [internalOrganizations, internalForm.internal_organization_id]);

    // Computed amortization preview
    const govtPreview  = computeAmortization(govtForm.total_amount, govtForm.term_months);
    const internalPreview = computeAmortization(internalForm.total_amount, internalForm.term_months);
    const govtEndPeriod    = computeEndPeriod(govtForm.start_period, govtForm.term_months);
    const internalEndPeriod = computeEndPeriod(internalForm.start_period, internalForm.term_months);

    const handleSubmit = () => {
        const isInternal = activeTab === 'internal';
        const f = isInternal ? internalForm : govtForm;

        const payload: Record<string, unknown> = {
            employee_id:  parseInt(f.employee_id),
            loan_type:    f.loan_type,
            source:       f.source,
            total_amount: parseFloat(f.total_amount) || 0,
            term_months:  parseInt(f.term_months)    || 0,
            start_period: f.start_period,
            status:       f.status,
        };

        if (isInternal) {
            payload.internal_organization_id =
                (internalForm as typeof emptyInternalForm).internal_organization_id;
        }

        if (isEdit) {
            router.put(route('loanentry.update', loan!.id), payload, {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            });
        } else {
            router.post(route('loanentry.store'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    setGovtForm(emptyGovtForm);
                    setInternalForm(emptyInternalForm);
                },
            });
        }
    };

    const isGovtValid =
        !!govtForm.employee_id &&
        !!govtForm.loan_type &&
        !!govtForm.total_amount &&
        !!govtForm.term_months &&
        !!govtForm.start_period;

    const isInternalValid =
        !!internalForm.employee_id &&
        !!internalForm.internal_organization_id &&
        !!internalForm.loan_type &&
        !!internalForm.total_amount &&
        !!internalForm.term_months &&
        !!internalForm.start_period;

    const canSubmit = activeTab === 'govt' ? isGovtValid : isInternalValid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Loan' : 'New Loan Entry'}
                    </DialogTitle>
                </DialogHeader>

                <Separator />

                {/* ── Tab selector (hidden in edit mode — type is fixed) ── */}
                {!isEdit && (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as LoanTab)}
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="govt">Government Loan</TabsTrigger>
                            <TabsTrigger value="internal">Internal Org Loan</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                <div className="grid gap-4 py-2">
                    {/* ── Employee (shared) ─────────────────────────────── */}
                    <div className="grid gap-1.5">
                        <Label>
                            Employee <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={activeTab === 'govt' ? govtForm.employee_id : internalForm.employee_id}
                            onValueChange={(v) =>
                                activeTab === 'govt' ? setG('employee_id', v) : setI('employee_id', v)
                            }
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

                    {/* ── Gov't-specific fields ─────────────────────────── */}
                    {activeTab === 'govt' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>
                                    Loan Type <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={govtForm.loan_type}
                                    onValueChange={handleGovtLoanTypeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOVT_LOAN_TYPES.map((lt) => (
                                            <SelectItem key={lt.label} value={lt.label}>
                                                {lt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Source</Label>
                                <Input
                                    value={govtForm.source}
                                    readOnly
                                    className="bg-muted text-muted-foreground"
                                    placeholder="Auto-filled"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Internal org-specific fields ──────────────────── */}
                    {activeTab === 'internal' && (
                        <>
                            <div className="grid gap-1.5">
                                <Label>
                                    Organization <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={internalForm.internal_organization_id}
                                    onValueChange={handleOrgChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {internalOrganizations.map((org) => (
                                            <SelectItem key={org.id} value={org.id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label>
                                        Loan Service <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={internalForm.loan_type}
                                        onValueChange={(v) => setI('loan_type', v)}
                                        disabled={!internalForm.internal_organization_id || activeOrgServices.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    !internalForm.internal_organization_id
                                                        ? 'Select org first...'
                                                        : 'Select service...'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeOrgServices.map((s) => (
                                                <SelectItem key={s.id} value={s.name}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Source</Label>
                                    <Input
                                        value={internalForm.source}
                                        readOnly
                                        className="bg-muted text-muted-foreground"
                                        placeholder="Auto-filled from org"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Amount + Term (shared) ────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Total Loan Amount (₱) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={activeTab === 'govt' ? govtForm.total_amount : internalForm.total_amount}
                                onChange={(e) =>
                                    activeTab === 'govt'
                                        ? setG('total_amount', e.target.value)
                                        : setI('total_amount', e.target.value)
                                }
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>
                                Term (months) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="12"
                                value={activeTab === 'govt' ? govtForm.term_months : internalForm.term_months}
                                onChange={(e) =>
                                    activeTab === 'govt'
                                        ? setG('term_months', e.target.value)
                                        : setI('term_months', e.target.value)
                                }
                                min="1"
                            />
                        </div>
                    </div>

                    {/* ── Amortization preview ──────────────────────────── */}
                    {(() => {
                        const preview = activeTab === 'govt' ? govtPreview : internalPreview;
                        const endPeriod = activeTab === 'govt' ? govtEndPeriod : internalEndPeriod;
                        const hasValues = preview.monthly !== '—';
                        return hasValues ? (
                            <div className="rounded-lg border bg-muted/40 px-4 py-3">
                                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Computed Amortization
                                </p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Monthly</p>
                                        <p className="font-medium">₱{preview.monthly}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Semi-Monthly</p>
                                        <p className="font-medium">₱{preview.semi}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">End Period</p>
                                        <p className="font-medium">{endPeriod}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* ── Start Period + Status ─────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Start Period <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="month"
                                value={activeTab === 'govt' ? govtForm.start_period : internalForm.start_period}
                                onChange={(e) =>
                                    activeTab === 'govt'
                                        ? setG('start_period', e.target.value)
                                        : setI('start_period', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Status</Label>
                            <Select
                                value={activeTab === 'govt' ? govtForm.status : internalForm.status}
                                onValueChange={(v) =>
                                    activeTab === 'govt'
                                        ? setG('status', v)
                                        : setI('status', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Separator />

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {isEdit ? 'Save Changes' : 'Add Loan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Helper: estimate term from loan record ────────────────────────────────────

function computeTermFromLoan(loan: Loan): number {
    if (!loan.start_period || !loan.end_period) return 0;
    const [sy, sm] = loan.start_period.split('-').map(Number);
    const [ey, em] = loan.end_period.split('-').map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
    loans = [],
    employees = [],
    internalOrganizations = [],
}: Props) {
    const [dialogOpen, setDialogOpen]   = useState(false);
    const [editTarget, setEditTarget]   = useState<Loan | null>(null);
    const [activeTabKey, setActiveTabKey] = useState<LoanTab>('govt');

    // Split loans into govt and internal org for the table tabs
    const govtLoans     = useMemo(() => loans.filter((l) => !l.internal_organization_id), [loans]);
    const internalLoans = useMemo(() => loans.filter((l) =>  l.internal_organization_id), [loans]);
    const displayedLoans = activeTabKey === 'govt' ? govtLoans : internalLoans;

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

    const columns = useLoanColumns({ onEdit: handleEdit, onDelete: handleDelete });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loan Entry" />

            <div className="flex h-full flex-1 flex-col gap-4 p-8">
                {/* ── Tab Navigation ──────────────────────────────────── */}
                <Tabs value={activeTabKey} onValueChange={(v) => setActiveTabKey(v as LoanTab)}>
                    <div className="shrink-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <TabsList className="flex h-auto flex-nowrap gap-0 bg-transparent p-0">
                            {([
                                { key: 'govt',     label: "Gov't Loans" },
                                { key: 'internal', label: 'Internal Org Loans' },
                            ] as { key: LoanTab; label: string }[]).map(({ key, label }) => (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className="relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    {label}
                                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        {key === 'govt' ? govtLoans.length : internalLoans.length}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                {/* ── Table ───────────────────────────────────────────── */}
                <DataTable
                    data={displayedLoans}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    searchColumnId="employee_name"
                    searchPlaceholder="Search by employee..."
                    filters={
                        activeTabKey === 'govt'
                            ? [
                                { columnId: 'source', title: 'Source', options: sourceFilterOptions },
                                { columnId: 'status', title: 'Status', options: statusFilterOptions },
                              ]
                            : [
                                { columnId: 'status', title: 'Status', options: statusFilterOptions },
                              ]
                    }
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
                internalOrganizations={internalOrganizations}
            />
        </AppLayout>
    );
}