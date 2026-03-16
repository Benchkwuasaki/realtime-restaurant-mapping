// resources/js/Pages/Payroll/Outputs/PaySlipGeneration/Index.tsx

import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronsUpDown,
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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

import {
    PayslipDocument,
    Row,
    peso,
} from '@/pages/Payroll/Outputs/PaySlipGeneration/PayslipDocument';

type PayrollPeriodWithClassifications = PayrollPeriod & {
    available_classifications: string[];
    employee_ids: number[];
};

interface Props {
    employees: EmployeeOption[];
    payroll_periods: PayrollPeriodWithClassifications[];
    payslip: PayslipData | null;
    bulk_payslips: PayslipData[];
    selected_employee_id: number | null;
    selected_period_id: number | null;
    is_bulk: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    { title: 'Pay Slip Generation', href: route('payslipgeneration.index') },
];

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
    const [employeeOpen, setEmployeeOpen] = useState(false);

    const [bulkPeriodId, setBulkPeriodId] = useState<string>('');
    const [bulkClassification, setBulkClassification] = useState<string>('All');

    const classifications = [
        'All',
        ...Array.from(
            new Set(employees.map((e) => e.employment_classification)),
        ).sort(),
    ];

    const filteredEmployees = employees.filter(
        (e) =>
            (e.employment_classification ?? '').toLowerCase() ===
            classification.toLowerCase(),
    );

    // Employees filtered by BOTH classification AND selected period.
    // When a period is chosen, only employees who actually have a payroll
    // record in that period are shown in the dropdown.
    const selectedPeriod = payroll_periods.find(
        (p) => String(p.payroll_period_id) === periodId,
    );
    const filteredEmployeesForPeriod = filteredEmployees.filter(
        (e) =>
            !selectedPeriod ||
            (selectedPeriod.employee_ids ?? []).includes(e.employee_id),
    );
    const filteredPeriods = payroll_periods.filter((p) =>
        (p.available_classifications ?? []).some(
            (c) => c.toLowerCase() === classification.toLowerCase(),
        ),
    );

    const bulkFilteredPeriods = payroll_periods.filter((p) => {
        if (bulkClassification === 'All')
            return (p.available_classifications ?? []).length > 0;
        return (p.available_classifications ?? []).some(
            (c) => c.toLowerCase() === bulkClassification.toLowerCase(),
        );
    });

    const bulkEmployees = employees.filter((e) => {
        // Must match classification filter
        const matchesClass =
            bulkClassification === 'All' ||
            e.employment_classification.toLowerCase() ===
                bulkClassification.toLowerCase();
        if (!matchesClass) return false;

        // If a period is selected, only include employees who have a record in it
        if (bulkPeriodId) {
            const bulkSelectedPeriod = payroll_periods.find(
                (p) => String(p.payroll_period_id) === bulkPeriodId,
            );
            if (bulkSelectedPeriod) {
                return bulkSelectedPeriod.employee_ids.includes(e.employee_id);
            }
        }

        return true;
    });

    function handleClassificationChange(value: string) {
        setClassification(value);
        setEmployeeId('');
        setPeriodId('');
        setEmployeeOpen(false);
    }

    function handlePeriodChange(value: string) {
        setPeriodId(value);
        setEmployeeId('');
        setEmployeeOpen(false);
    }

    // CHANGE 5 — new handler that also resets bulk period when no longer valid
    function handleBulkClassificationChange(value: string) {
        setBulkClassification(value);
        const stillValid = payroll_periods.some((p) => {
            if (String(p.payroll_period_id) !== bulkPeriodId) return false;
            if (value === 'All') return p.available_classifications.length > 0;
            return p.available_classifications.some(
                (c) => c.toLowerCase() === value.toLowerCase(),
            );
        });
        if (!stillValid) setBulkPeriodId('');
    }

    // ── FIX: Open a clean popup window for bulk printing ──────────────────────
    useEffect(() => {
        if (is_bulk && bulk_payslips.length > 0) {
            const timer = setTimeout(() => {
                const printArea = document.getElementById('bulk-print-area');
                if (!printArea) return;

                const printWindow = window.open(
                    '',
                    '_blank',
                    'width=900,height=700',
                );
                if (!printWindow) return;

                printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Pay Slips — Bulk Print</title>
                            <style>
                                @page { size: portrait; margin: 1cm; }
                                * {
                                    box-sizing: border-box;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    font-family: 'Courier New', Courier, monospace !important;
                                }
                                body { margin: 0; padding: 0; background: #fff; }
                                .bulk-payslip-page {
                                    page-break-after: always;
                                    break-after: page;
                                    page-break-inside: avoid;
                                    break-inside: avoid;
                                }
                                .bulk-payslip-page:last-child {
                                    page-break-after: avoid;
                                    break-after: avoid;
                                }
                            </style>
                        </head>
                        <body>${printArea.innerHTML}</body>
                        </html>
                    `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 800);
            }, 600);
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

            <div className="flex flex-1 flex-col gap-8 p-8">
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

                    <TabsContent value="generate" className="mt-6">
                        <div className="flex items-start gap-6">
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

                                    {/* CHANGE 6 — use filteredPeriods instead of payroll_periods */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Payroll Period
                                        </label>
                                        <Select
                                            value={periodId}
                                            onValueChange={handlePeriodChange}
                                            disabled={
                                                filteredPeriods.length === 0
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        filteredPeriods.length ===
                                                        0
                                                            ? 'No periods available'
                                                            : 'Select period'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredPeriods.map((p) => (
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
                                        {filteredPeriods.length === 0 && (
                                            <p className="text-[11px] text-muted-foreground">
                                                No processed periods found for{' '}
                                                <span className="font-medium text-foreground">
                                                    {classification}
                                                </span>{' '}
                                                employees.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Employee
                                        </label>
                                        <Popover
                                            open={employeeOpen}
                                            onOpenChange={setEmployeeOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={employeeOpen}
                                                    disabled={
                                                        !periodId ||
                                                        filteredEmployeesForPeriod.length ===
                                                            0
                                                    }
                                                    className="w-full justify-between font-normal"
                                                >
                                                    <span className="truncate">
                                                        {employeeId
                                                            ? (filteredEmployeesForPeriod.find(
                                                                  (e) =>
                                                                      String(
                                                                          e.employee_id,
                                                                      ) ===
                                                                      employeeId,
                                                              )?.full_name ??
                                                              employees.find(
                                                                  (e) =>
                                                                      String(
                                                                          e.employee_id,
                                                                      ) ===
                                                                      employeeId,
                                                              )?.full_name ??
                                                              'Select employee')
                                                            : !periodId
                                                              ? 'Select period first'
                                                              : filteredEmployeesForPeriod.length ===
                                                                  0
                                                                ? 'No employees found'
                                                                : 'Select employee'}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[--radix-popover-trigger-width] p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput placeholder="Search employee…" />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No employee found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {filteredEmployeesForPeriod.map(
                                                                (e) => (
                                                                    <CommandItem
                                                                        key={
                                                                            e.employee_id
                                                                        }
                                                                        value={
                                                                            e.full_name
                                                                        }
                                                                        onSelect={() => {
                                                                            setEmployeeId(
                                                                                String(
                                                                                    e.employee_id,
                                                                                ),
                                                                            );
                                                                            setEmployeeOpen(
                                                                                false,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 ${
                                                                                String(
                                                                                    e.employee_id,
                                                                                ) ===
                                                                                employeeId
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0'
                                                                            }`}
                                                                        />
                                                                        {
                                                                            e.full_name
                                                                        }
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
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
                                </CardContent>
                            </Card>

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
                                        </div>
                                        <div style={{ fontFamily: "'Courier New', Courier, monospace" }} className="[&_*]:!font-mono">
                                            <PayslipDocument
                                                data={payslip}
                                                printId="payslip-print-area"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <EmptyPreview />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="bulk" className="mt-6">
                        <div className="flex items-start gap-6">
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
                                            Classification
                                        </label>
                                        {/* CHANGE 7 — use handleBulkClassificationChange */}
                                        <Select
                                            value={bulkClassification}
                                            onValueChange={
                                                handleBulkClassificationChange
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

                                    {/* CHANGE 8 — use bulkFilteredPeriods instead of payroll_periods */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Payroll Period
                                        </label>
                                        <Select
                                            value={bulkPeriodId}
                                            onValueChange={setBulkPeriodId}
                                            disabled={
                                                bulkFilteredPeriods.length === 0
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        bulkFilteredPeriods.length ===
                                                        0
                                                            ? 'No periods available'
                                                            : 'Select period'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bulkFilteredPeriods.map(
                                                    (p) => (
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
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {bulkFilteredPeriods.length === 0 && (
                                            <p className="text-[11px] text-muted-foreground">
                                                No processed periods found for{' '}
                                                <span className="font-medium text-foreground">
                                                    {bulkClassification}
                                                </span>{' '}
                                                employees.
                                            </p>
                                        )}
                                    </div>

                                    <Separator />

                                    {bulkPeriodId && (
                                        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                            <p className="font-medium text-foreground">
                                                {bulkEmployees.length} employee
                                                {bulkEmployees.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </p>
                                            <p className="mt-0.5">
                                                will be printed. Each payslip
                                                gets its own page.
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full gap-2"
                                        disabled={
                                            !bulkPeriodId ||
                                            bulkEmployees.length === 0
                                        }
                                        onClick={() => {
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
                                        Use Short Bond Paper (8.5" × 11") —
                                        Portrait
                                    </p>
                                </CardContent>
                            </Card>

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

            {/* ── Print styles — single payslip centered on page ── */}
            <style>{`
                    @media print {
                        @page {
                            size: portrait;
                            margin: 1cm;
                        }

                        /* Hide the entire page UI */
                        body * {
                            visibility: hidden;
                        }

                        /* Show only the single payslip */
                        #payslip-print-area {
                            visibility: visible;
                            position: absolute;
                            top: 0;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 720px;
                            max-width: 100%;
                            box-shadow: none !important;
                            font-family: 'Courier New', Courier, monospace !important;
                        }

                        #payslip-print-area * {
                            visibility: visible;
                            font-family: 'Courier New', Courier, monospace !important;
                        }

                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .print\\:hidden { display: none !important; }
                    }
                `}</style>

            {/* ── Hidden bulk payslip container (read by useEffect for popup printing) ── */}
            {bulk_payslips.length > 0 && (
                <div id="bulk-print-area" className="hidden" aria-hidden="true">
                    {bulk_payslips.map((slip, i) => (
                        <div
                            key={i}
                            className="bulk-payslip-page"
                            style={{
                                pageBreakAfter: 'always',
                                breakAfter: 'page',
                                pageBreakInside: 'avoid',
                                breakInside: 'avoid',
                            }}
                        >
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