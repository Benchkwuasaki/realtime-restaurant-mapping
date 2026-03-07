// resources/js/Pages/Payroll/Outputs/PaySlipGeneration/Index.tsx

import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Printer,
    User,
    FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem } from '@/types';
import Logo from '@/assets/images/logo.svg';

import type {
    EmployeeOption,
    PayrollPeriod,
    PayslipData,
} from '@/components/Payroll/Outputs/PaySlipGeneration/data/schema';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    employees: EmployeeOption[];
    payroll_periods: PayrollPeriod[];
    payslip: PayslipData | null;
    bulk_payslips: PayslipData[];
    selected_employee_id: number | null;
    selected_period_id: number | null;
    is_bulk: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    { title: 'Pay Slip Generation', href: route('payslipgeneration.index') },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function peso(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));
}

// ── PaySlip Document ──────────────────────────────────────────────────────────

function PayslipDocument({
    data,
    printId,
}: {
    data: PayslipData;
    printId: string;
}) {
    const grossPay =
        data.basic_pay +
        data.pera +
        data.rice_allowance +
        data.uniform_allowance;

    const totalMandatory =
        data.gsis_premium +
        data.philhealth +
        data.pag_ibig +
        data.withholding_tax;

    const totalAttendance = data.absent_deduction + data.late_deduction;

    const totalLoans =
        data.gsis_mpl +
        data.gsis_emergency +
        data.pag_ibig_mpl +
        data.ama_y2k_union +
        data.water_bill;

    const totalDeductions = totalMandatory + totalAttendance + totalLoans;

    return (
        <div
            id={printId}
            className="mx-auto w-full max-w-[720px] bg-white font-sans shadow-md ring-1 ring-border/20 print:shadow-none print:ring-0"
            style={{ minWidth: 560 }}
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b-2 border-foreground/80 px-8 py-5">
                <div className="flex items-center gap-3">
                    <img
                        src={Logo}
                        alt="MKWD Logo"
                        className="h-12 w-12 object-contain"
                        onError={(e) =>
                            ((e.target as HTMLImageElement).style.display =
                                'none')
                        }
                    />
                    <div>
                        <p className="text-[10px] font-normal tracking-widest text-muted-foreground uppercase">
                            Metro Kidapawan Water District
                        </p>
                        <p className="text-[18px] leading-none font-bold tracking-wide uppercase">
                            Pay Slip
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {data.period_label}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-semibold">
                        {data.employee_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {data.position}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        SG {data.salary_grade} · Step {data.step}
                    </p>
                    <p className="mt-0.5 text-[10px]">
                        <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                data.floor_check_passed
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {data.floor_check_passed
                                ? '✓ Floor Check Passed'
                                : '⚠ Below Minimum Take-Home'}
                        </span>
                    </p>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="grid grid-cols-2 gap-0 divide-x divide-border/50 px-0">
                {/* Left column — Earnings */}
                <div className="space-y-4 px-8 py-5">
                    {/* Earnings */}
                    <div>
                        <p className="mb-2 border-b border-blue-200 pb-1 text-[9px] font-bold tracking-widest text-blue-700 uppercase">
                            Earnings
                        </p>
                        <Row label="Basic Pay" value={data.basic_pay} />
                        <Row label="PERA" value={data.pera} />
                        <Row
                            label="Rice Allowance"
                            value={data.rice_allowance}
                        />
                        <Row
                            label="Uniform Allowance"
                            value={data.uniform_allowance}
                        />
                        <div className="mt-1.5 flex justify-between border-t border-blue-200 pt-1.5">
                            <span className="text-[10px] font-bold text-blue-800">
                                Gross Pay
                            </span>
                            <span className="text-[10px] font-bold text-blue-800 tabular-nums">
                                ₱{peso(grossPay)}
                            </span>
                        </div>
                    </div>

                    {/* Attendance */}
                    <div>
                        <p className="mb-2 border-b border-purple-200 pb-1 text-[9px] font-bold tracking-widest text-purple-700 uppercase">
                            Attendance Deductions
                        </p>
                        {data.absent_days > 0 ? (
                            <Row
                                label={`Absent (${data.absent_days} day${data.absent_days !== 1 ? 's' : ''})`}
                                value={data.absent_deduction}
                                negative
                            />
                        ) : null}
                        {data.late_minutes > 0 ? (
                            <Row
                                label={`Late (${data.late_minutes} min${data.late_minutes !== 1 ? 's' : ''})`}
                                value={data.late_deduction}
                                negative
                            />
                        ) : null}
                        {data.absent_days === 0 && data.late_minutes === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">
                                No attendance deductions
                            </p>
                        )}
                        {(data.absent_days > 0 || data.late_minutes > 0) && (
                            <div className="mt-1.5 flex justify-between border-t border-purple-200 pt-1.5">
                                <span className="text-[10px] font-bold text-purple-800">
                                    Subtotal
                                </span>
                                <span className="text-[10px] font-bold text-red-600 tabular-nums">
                                    -₱{peso(totalAttendance)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column — Deductions */}
                <div className="space-y-4 px-8 py-5">
                    {/* Mandatory */}
                    <div>
                        <p className="mb-2 border-b border-orange-200 pb-1 text-[9px] font-bold tracking-widest text-orange-700 uppercase">
                            Mandatory Deductions
                        </p>
                        <Row
                            label="GSIS Premium"
                            value={data.gsis_premium}
                            negative
                        />
                        <Row
                            label="PhilHealth"
                            value={data.philhealth}
                            negative
                        />
                        <Row label="Pag-IBIG" value={data.pag_ibig} negative />
                        <Row
                            label="Withholding Tax"
                            value={data.withholding_tax}
                            negative
                        />
                        <div className="mt-1.5 flex justify-between border-t border-orange-200 pt-1.5">
                            <span className="text-[10px] font-bold text-orange-800">
                                Subtotal
                            </span>
                            <span className="text-[10px] font-bold text-red-600 tabular-nums">
                                -₱{peso(totalMandatory)}
                            </span>
                        </div>
                    </div>

                    {/* Loans & Others */}
                    <div>
                        <p className="mb-2 border-b border-red-200 pb-1 text-[9px] font-bold tracking-widest text-red-700 uppercase">
                            Loans &amp; Other Deductions
                        </p>
                        {data.gsis_mpl > 0 && (
                            <Row
                                label="GSIS MPL"
                                value={data.gsis_mpl}
                                negative
                            />
                        )}
                        {data.gsis_emergency > 0 && (
                            <Row
                                label="GSIS Emergency"
                                value={data.gsis_emergency}
                                negative
                            />
                        )}
                        {data.pag_ibig_mpl > 0 && (
                            <Row
                                label="Pag-IBIG MPL"
                                value={data.pag_ibig_mpl}
                                negative
                            />
                        )}
                        {data.ama_y2k_union > 0 && (
                            <Row
                                label="AMA / Y2K / Union"
                                value={data.ama_y2k_union}
                                negative
                            />
                        )}
                        {data.water_bill > 0 && (
                            <Row
                                label="Water Bill"
                                value={data.water_bill}
                                negative
                            />
                        )}
                        {totalLoans === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">
                                No loan deductions
                            </p>
                        )}
                        {totalLoans > 0 && (
                            <div className="mt-1.5 flex justify-between border-t border-red-200 pt-1.5">
                                <span className="text-[10px] font-bold text-red-800">
                                    Subtotal
                                </span>
                                <span className="text-[10px] font-bold text-red-600 tabular-nums">
                                    -₱{peso(totalLoans)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Net Pay banner ── */}
            <div className="mx-8 mb-0 rounded-lg border-2 border-foreground/10 bg-muted/30 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Total Deductions
                        </p>
                        <p className="text-sm font-bold text-red-600 tabular-nums">
                            -₱{peso(totalDeductions)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Net Pay
                        </p>
                        <p className="text-2xl font-bold text-green-700 tabular-nums">
                            ₱{peso(data.net_pay)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-8 py-5">
                {/* Paper note */}
                <div className="mb-4 flex items-center justify-center gap-1.5 rounded border border-dashed border-amber-400 bg-amber-50/60 px-3 py-1 text-[9px] font-medium text-amber-700 print:border-amber-300 print:bg-transparent">
                    📄 Print on{' '}
                    <strong className="mx-0.5">
                        Short Bond Paper (8.5" × 11")
                    </strong>{' '}
                    — Portrait orientation
                </div>

                {/* Signature lines */}
                <div className="flex justify-between gap-6">
                    <div className="flex-1 text-center">
                        <div className="mb-6 border-b border-dashed border-muted-foreground/50" />
                        <p className="text-[10px] font-semibold tracking-wide uppercase">
                            {data.hr_officer !== '—'
                                ? data.hr_officer
                                : '________________________________'}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                            Prepared by: HR Officer
                        </p>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="mb-6 border-b border-dashed border-muted-foreground/50" />
                        <p className="text-[10px] font-semibold tracking-wide uppercase">
                            ________________________________
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                            Received by: Employee
                        </p>
                    </div>
                </div>

                {/* Meta info */}
                <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-[8.5px] text-muted-foreground">
                    <span>Posted: {data.posted_date}</span>
                    <span>Metro Kidapawan Water District — Payroll System</span>
                    <span>{data.employment_classification} Employee</span>
                </div>
            </div>
        </div>
    );
}

// ── Row helper ────────────────────────────────────────────────────────────────

function Row({
    label,
    value,
    negative = false,
}: {
    label: string;
    value: number;
    negative?: boolean;
}) {
    if (value === 0) return null;
    return (
        <div className="flex items-center justify-between py-[2px]">
            <span className="text-[10px] text-foreground/75">{label}</span>
            <span
                className={`text-[10px] font-medium tabular-nums ${
                    negative ? 'text-red-600' : 'text-foreground'
                }`}
            >
                {negative ? '-' : ''}₱{peso(value)}
            </span>
        </div>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyPreview() {
    return (
        <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                    No payslip loaded
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Select an employee and period, then click{' '}
                    <span className="font-semibold text-foreground">
                        Load Payslip
                    </span>
                    .
                </p>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Index({
    employees,
    payroll_periods,
    payslip,
    bulk_payslips = [],
    selected_employee_id,
    selected_period_id,
    is_bulk = false,
}: Props) {
    const initialClassification = selected_employee_id
        ? (employees.find((e) => e.employee_id === selected_employee_id)
              ?.employment_classification ?? 'Regular')
        : 'Regular';

    const [classification, setClassification] = useState<string>(
        initialClassification,
    );
    const [employeeId, setEmployeeId] = useState<string>(
        selected_employee_id ? String(selected_employee_id) : '',
    );
    const [periodId, setPeriodId] = useState<string>(
        selected_period_id ? String(selected_period_id) : '',
    );
    const [isLoading, setIsLoading] = useState(false);

    // Bulk print state
    const [bulkPeriodId, setBulkPeriodId] = useState<string>('');
    const [bulkClassification, setBulkClassification] = useState<string>('All');

    // Derive unique classifications from employees list
    const classifications = [
        'All',
        ...Array.from(
            new Set(employees.map((e) => e.employment_classification)),
        ).sort(),
    ];

    const filteredEmployees = employees.filter(
        (e) =>
            e.employment_classification.toLowerCase() ===
            classification.toLowerCase(),
    );

    const bulkEmployees = employees.filter(
        (e) =>
            bulkClassification === 'All' ||
            e.employment_classification.toLowerCase() ===
                bulkClassification.toLowerCase(),
    );

    function handleClassificationChange(value: string) {
        setClassification(value);
        setEmployeeId('');
    }

    // Auto-trigger print when the page loads in bulk mode
    useEffect(() => {
        if (is_bulk && bulk_payslips.length > 0) {
            const timer = setTimeout(() => window.print(), 600);
            return () => clearTimeout(timer);
        }
    }, [is_bulk, bulk_payslips.length]);

    function handleLoad() {
        if (!employeeId || !periodId) return;
        setIsLoading(true);
        router.get(
            route('payslipgeneration.index'),
            { employee_id: employeeId, period_id: periodId },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    }

    const canLoad = !!employeeId && !!periodId && !isLoading;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pay Slip Generation" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page heading */}
                <div>
                    <h1 className="text-2xl font-semibold">
                        Pay Slip Generation
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Generate and print individual payslips for processed
                        payroll periods.
                    </p>
                </div>

                <Tabs defaultValue={is_bulk ? 'bulk' : 'generate'}>
                    {/* ── Tab nav ── */}
                    <div className="w-full border-b border-border">
                        <TabsList className="inline-flex h-auto gap-0 rounded-none bg-transparent p-0">
                            {[
                                {
                                    value: 'generate',
                                    label: 'Generate Payslip',
                                },
                                { value: 'bulk', label: 'Bulk Print' },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="relative -mb-px inline-flex items-center rounded-none border-b-2 border-transparent bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* ── Generate tab ── */}
                    <TabsContent value="generate" className="mt-6">
                        <div className="flex items-start gap-6">
                            {/* Sidebar controls */}
                            <Card className="w-72 shrink-0">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Select Employee
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Classification
                                        </label>
                                        <Select
                                            value={classification}
                                            onValueChange={
                                                handleClassificationChange
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select classification" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classifications
                                                    .filter((c) => c !== 'All')
                                                    .map((c) => (
                                                        <SelectItem
                                                            key={c}
                                                            value={c}
                                                        >
                                                            {c}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Employee
                                        </label>
                                        <Select
                                            value={employeeId}
                                            onValueChange={setEmployeeId}
                                            disabled={
                                                filteredEmployees.length === 0
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        filteredEmployees.length ===
                                                        0
                                                            ? 'No employees found'
                                                            : 'Select employee'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredEmployees.map((e) => (
                                                    <SelectItem
                                                        key={e.employee_id}
                                                        value={String(
                                                            e.employee_id,
                                                        )}
                                                    >
                                                        {e.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Payroll Period
                                        </label>
                                        <Select
                                            value={periodId}
                                            onValueChange={setPeriodId}
                                            disabled={
                                                payroll_periods.length === 0
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {payroll_periods.map((p) => (
                                                    <SelectItem
                                                        key={
                                                            p.payroll_period_id
                                                        }
                                                        value={String(
                                                            p.payroll_period_id,
                                                        )}
                                                    >
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <Button
                                        className="w-full"
                                        onClick={handleLoad}
                                        disabled={!canLoad}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading…
                                            </>
                                        ) : (
                                            'Load Payslip'
                                        )}
                                    </Button>

                                    {payslip && (
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => window.print()}
                                        >
                                            <Printer className="h-4 w-4" />
                                            Print Payslip
                                        </Button>
                                    )}

                                    {/* Floor check badge */}
                                    {payslip && (
                                        <div className="flex justify-center">
                                            {payslip.floor_check_passed ? (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 border-green-500 text-green-600"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Floor Check Passed
                                                </Badge>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 border-amber-500 text-amber-600"
                                                            >
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Below Minimum
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Net pay is below the
                                                            minimum take-home
                                                            threshold.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payslip preview area */}
                            <div className="min-w-0 flex-1">
                                {payslip ? (
                                    <>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                    Preview
                                                </p>
                                                <p className="mt-0.5 text-sm font-semibold">
                                                    {payslip.employee_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {payslip.period_label}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 print:hidden"
                                                onClick={() => window.print()}
                                            >
                                                <Printer className="h-3.5 w-3.5" />
                                                Print
                                            </Button>
                                        </div>
                                        <PayslipDocument
                                            data={payslip}
                                            printId="payslip-print-area"
                                        />
                                    </>
                                ) : (
                                    <EmptyPreview />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Bulk Print tab ── */}
                    <TabsContent value="bulk" className="mt-6">
                        <div className="flex items-start gap-6">
                            {/* Bulk controls */}
                            <Card className="w-72 shrink-0">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Printer className="h-4 w-4 text-muted-foreground" />
                                        Bulk Print Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Payroll Period
                                        </label>
                                        <Select
                                            value={bulkPeriodId}
                                            onValueChange={setBulkPeriodId}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {payroll_periods.map((p) => (
                                                    <SelectItem
                                                        key={
                                                            p.payroll_period_id
                                                        }
                                                        value={String(
                                                            p.payroll_period_id,
                                                        )}
                                                    >
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Classification
                                        </label>
                                        <Select
                                            value={bulkClassification}
                                            onValueChange={
                                                setBulkClassification
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classifications.map((c) => (
                                                    <SelectItem
                                                        key={c}
                                                        value={c}
                                                    >
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                        <p className="font-medium text-foreground">
                                            {bulkEmployees.length} employee
                                            {bulkEmployees.length !== 1
                                                ? 's'
                                                : ''}
                                        </p>
                                        <p className="mt-0.5">
                                            will be printed. Each payslip gets
                                            its own page.
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full gap-2"
                                        disabled={
                                            !bulkPeriodId ||
                                            bulkEmployees.length === 0
                                        }
                                        onClick={() => {
                                            // Navigate to the bulk print URL with params,
                                            // which will load all payslips and trigger print
                                            router.get(
                                                route(
                                                    'payslipgeneration.index',
                                                ),
                                                {
                                                    bulk: true,
                                                    period_id: bulkPeriodId,
                                                    classification:
                                                        bulkClassification ===
                                                        'All'
                                                            ? ''
                                                            : bulkClassification,
                                                },
                                                { preserveState: false },
                                            );
                                        }}
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print All Payslips
                                    </Button>

                                    <p className="text-center text-[10px] text-muted-foreground">
                                        📄 Use Short Bond Paper (8.5" × 11") —
                                        Portrait
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Bulk info panel */}
                            <div className="min-w-0 flex-1">
                                {!bulkPeriodId ? (
                                    <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <Printer className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Select a payroll period
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                All payslips for the chosen
                                                period and classification will
                                                be printed sequentially.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border bg-muted/20 p-5">
                                        <p className="mb-3 text-sm font-semibold">
                                            Employees to be printed
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                            {bulkEmployees.map((e, i) => (
                                                <div
                                                    key={e.employee_id}
                                                    className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 text-xs dark:bg-muted/30"
                                                >
                                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                                        {String(i + 1).padStart(
                                                            2,
                                                            '0',
                                                        )}
                                                    </span>
                                                    <span className="truncate font-medium">
                                                        {e.full_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-[11px] text-muted-foreground">
                                            Note: Only employees with a
                                            processed payroll record for the
                                            selected period will have a payslip
                                            generated. Others will be skipped.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── Print styles ── */}
            <style>{`
                @media print {
                    @page {
                        size: portrait;
                        margin: 1cm;
                    }

                    /* Hide everything except the active print area */
                    body > * { visibility: hidden; }

                    /* Single payslip */
                    #payslip-print-area,
                    #payslip-print-area * { visibility: visible; }

                    /* Bulk payslips */
                    #bulk-print-area,
                    #bulk-print-area * { visibility: visible; }

                    #payslip-print-area {
                        position: static !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        margin: 0 auto !important;
                    }

                    #bulk-print-area {
                        position: static !important;
                        width: 100% !important;
                    }

                    /* Each bulk payslip on its own page */
                    .bulk-payslip-page {
                        page-break-after: always;
                        break-after: page;
                    }
                    .bulk-payslip-page:last-child {
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .print\\:hidden { display: none !important; }
                }
            `}</style>

            {/* ── Hidden bulk print area — rendered off-screen, printed on demand ── */}
            {bulk_payslips.length > 0 && (
                <div
                    id="bulk-print-area"
                    className="absolute top-0 left-[-9999px] w-[210mm]"
                    aria-hidden="true"
                >
                    {bulk_payslips.map((slip, i) => (
                        <div key={i} className="bulk-payslip-page">
                            <PayslipDocument
                                data={slip}
                                printId={`bulk-slip-${i}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
