// resources/js/Pages/Payroll/Outputs/PayrollRegister/Show.tsx

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Printer,
    Users,
    TrendingUp,
    Landmark,
    Receipt,
} from 'lucide-react';
import { route } from 'ziggy-js';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem } from '@/types';
import Logo from '@/assets/images/logo.svg';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PayrollRecord {
    payroll_record_id: number;
    employee_id: number;
    employee_name: string;
    position: string;
    salary_grade: number;
    step: number;
    basic_pay: number;
    pera: number;
    rice_allowance: number;
    uniform_allowance: number;
    gross_pay: number;
    gsis_premium: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
    absent_days: number;
    absent_deduction: number;
    late_minutes: number;
    late_deduction: number;
    gsis_mpl: number;
    gsis_emergency: number;
    pag_ibig_mpl: number;
    ama_y2k_union: number;
    water_bill: number;
    internal_org_savings: number;
    internal_org_second: number;
    total_deductions: number;
    net_pay: number;
    floor_check_passed: boolean;
    status: string;
    hr_officer_name: string;
}

interface Period {
    payroll_period_id: number;
    start_date: string;
    end_date: string;
    cut_off: string | null;
    status: string;
}

interface Summary {
    total_employees: number;
    total_basic_pay: number;
    total_pera: number;
    total_rice_allowance: number;
    total_uniform_allowance: number;
    total_gross: number;
    total_gsis_premium: number;
    total_philhealth: number;
    total_pag_ibig: number;
    total_withholding_tax: number;
    total_absent_deduction: number;
    total_late_deduction: number;
    total_gsis_mpl: number;
    total_gsis_emergency: number;
    total_pag_ibig_mpl: number;
    total_ama_y2k_union: number;
    total_water_bill: number;
    total_internal_org_savings: number;
    total_internal_org_second: number;
    total_deductions: number;
    total_net_pay: number;
    floor_issues: number;
    hr_officer_name: string;
}

interface Props {
    auth: { user: any };
    period: Period;
    records: PayrollRecord[];
    summary: Summary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string): string {
    try {
        const s = parseISO(start);
        const e = parseISO(end);
        if (
            s.getMonth() === e.getMonth() &&
            s.getFullYear() === e.getFullYear()
        ) {
            return `${format(s, 'MMMM d')} – ${format(e, 'd, yyyy')}`;
        }
        return `${format(s, 'MMMM d')} – ${format(e, 'MMMM d, yyyy')}`;
    } catch {
        return `${start} – ${end}`;
    }
}

/** Zero → em-dash, otherwise locale number */
function n(val: number): string {
    if (val === 0) return '—';
    return val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Always locale number (used in totals row) */
function nf(val: number): string {
    return val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function peso(val: number): string {
    return '₱' + nf(val);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                <Icon
                    className={`h-4 w-4 ${accent ?? 'text-muted-foreground'}`}
                />
            </CardHeader>
            <CardContent>
                <p
                    className={`text-2xl font-bold tabular-nums ${accent ?? ''}`}
                >
                    {value}
                </p>
                {sub && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {sub}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ── Grouped TH helpers ────────────────────────────────────────────────────────

function GrpTh({
    children,
    colSpan,
    className = '',
}: {
    children: React.ReactNode;
    colSpan?: number;
    className?: string;
}) {
    return (
        <th
            colSpan={colSpan}
            className={`border border-border/60 px-1.5 py-1 text-center text-[9px] font-bold tracking-wider uppercase ${className}`}
        >
            {children}
        </th>
    );
}

function ColTh({
    children,
    rowSpan,
    className = '',
}: {
    children: React.ReactNode;
    rowSpan?: number;
    className?: string;
}) {
    return (
        <th
            rowSpan={rowSpan}
            className={`border border-border/60 px-1 py-1 text-center text-[9px] leading-tight font-semibold ${className}`}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    right = false,
    center = false,
    className = '',
}: {
    children: React.ReactNode;
    right?: boolean;
    center?: boolean;
    className?: string;
}) {
    return (
        <td
            className={`border border-border/40 px-1 py-[3px] text-[8.5px] leading-tight ${
                right
                    ? 'text-right tabular-nums'
                    : center
                      ? 'text-center'
                      : 'text-left'
            } ${className}`}
        >
            {children}
        </td>
    );
}

function TotTd({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <td
            className={`border border-border/60 bg-muted/50 px-1 py-1 text-right text-[8.5px] font-bold tabular-nums ${className}`}
        >
            {children}
        </td>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Show({ period, records, summary }: Props) {
    const periodLabel = formatPeriod(period.start_date, period.end_date);
    const hrOfficer =
        records.find((r) => r.hr_officer_name && r.hr_officer_name !== '—')
            ?.hr_officer_name ?? '';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll', href: route('payroll.index') },
        { title: 'Outputs', href: '#' },
        {
            title: 'Payroll Register',
            href: route('payroll-register.index'),
        },
        {
            title: periodLabel,
            href: route('payroll-register.show', period.payroll_period_id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll Register – ${periodLabel}`} />

            {/* ── Screen toolbar (hidden on print) ────────────────────────── */}
            <div className="flex items-center justify-between border-b px-6 py-3 print:hidden">
                <div className="flex items-center gap-3">
                    <Link href={route('payroll-register.index')}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>

                    <Separator orientation="vertical" className="h-5" />

                    <div>
                        <h1 className="text-lg leading-none font-semibold">
                            Payroll Register
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {periodLabel} · Cut-off {period.cut_off ?? '—'}
                        </p>
                    </div>

                    <Badge
                        variant="outline"
                        className={
                            period.status === 'Closed'
                                ? 'border-green-500 text-green-600'
                                : 'border-blue-500 text-blue-600'
                        }
                    >
                        {period.status}
                    </Badge>

                    {summary.floor_issues > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-amber-500 text-amber-600"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        {summary.floor_issues} floor issue
                                        {summary.floor_issues > 1 ? 's' : ''}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {summary.floor_issues} employee
                                        {summary.floor_issues > 1
                                            ? 's have'
                                            : ' has'}{' '}
                                        a net pay below the minimum take-home
                                        threshold.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                <Button
                    onClick={() => window.print()}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Printer className="h-4 w-4" />
                    Print Register
                </Button>
            </div>

            {/* ── Summary stat cards (screen only) ────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 px-6 pt-5 sm:grid-cols-4 print:hidden">
                <StatCard
                    icon={Users}
                    label="Total Employees"
                    value={String(summary.total_employees)}
                    sub={`Period #${period.payroll_period_id}`}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Total Gross Pay"
                    value={peso(summary.total_gross)}
                    sub="Earnings before deductions"
                    accent="text-blue-600"
                />
                <StatCard
                    icon={Landmark}
                    label="Total Deductions"
                    value={peso(summary.total_deductions)}
                    sub="All deduction types"
                    accent="text-orange-600"
                />
                <StatCard
                    icon={Receipt}
                    label="Total Net Pay"
                    value={peso(summary.total_net_pay)}
                    sub={
                        summary.floor_issues > 0
                            ? `⚠ ${summary.floor_issues} floor issue${summary.floor_issues > 1 ? 's' : ''}`
                            : 'All employees passed floor check'
                    }
                    accent="text-green-600"
                />
            </div>

            {/* ── Paper wrapper ─────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col items-center bg-muted/30 px-6 py-8 print:block print:overflow-visible print:bg-white print:p-0">
                <div
                    id="payroll-register-document"
                    className="w-full max-w-[1500px] bg-white px-10 py-8 shadow-xl ring-1 ring-border/20 print:max-w-none print:px-6 print:py-4 print:shadow-none print:ring-0"
                >
                    {/* ── Document header ──────────────────────────────────── */}
                    <div className="mb-5 flex flex-col items-center text-center">
                        <div className="flex items-center gap-4">
                            <img
                                src={Logo}
                                alt="MKWD Logo"
                                className="h-12 w-12 object-contain"
                                onError={(e) =>
                                    ((
                                        e.target as HTMLImageElement
                                    ).style.display = 'none')
                                }
                            />
                            <div className="text-left">
                                <p className="text-xs font-normal tracking-widest text-muted-foreground uppercase">
                                    Metro Kidapawan Water District
                                </p>
                                <p className="text-[20px] font-bold tracking-wide uppercase">
                                    Payroll Register
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {periodLabel}&emsp;·&emsp;Cut-off:{' '}
                                    {period.cut_off ?? '—'}&emsp;·&emsp;
                                    <span
                                        className={
                                            period.status === 'Closed'
                                                ? 'font-semibold text-green-700'
                                                : 'font-semibold text-blue-700'
                                        }
                                    >
                                        {period.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 h-[2px] bg-foreground/80" />

                    {/* ── Floor-check alert ─────────────────────────────────── */}
                    {summary.floor_issues > 0 && (
                        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                                <strong>Floor-check notice:</strong>{' '}
                                {summary.floor_issues} employee
                                {summary.floor_issues > 1 ? 's' : ''} (marked ⚠)
                                ha{summary.floor_issues > 1 ? 've' : 's'} a net
                                pay below the minimum take-home threshold.
                                Please review before release.
                            </span>
                        </div>
                    )}

                    {/* ── Register table ───────────────────────────────────── */}
                    {records.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            No payroll records found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {/*
                             * We intentionally bypass shadcn's Table wrapper for the
                             * inner <thead> rows because we need colspan + rowspan for
                             * the grouped header design, which shadcn TableHead does
                             * not expose. The outer chrome (border, overflow) still
                             * comes from shadcn's rounded-md border wrapper.
                             */}
                            <div className="overflow-hidden rounded-md border border-border/60">
                                <table className="w-full border-collapse text-[8.5px]">
                                    <thead className="bg-muted/50 text-foreground">
                                        {/* ── Group labels row ── */}
                                        <tr>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[2%] bg-muted/70"
                                            >
                                                #
                                            </ColTh>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[9%] bg-muted/70 pl-2 text-left"
                                            >
                                                Employee Name
                                            </ColTh>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[7%] bg-muted/70 pl-2 text-left"
                                            >
                                                Position
                                            </ColTh>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[2.5%] bg-muted/70"
                                            >
                                                SG
                                            </ColTh>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[2%] bg-muted/70"
                                            >
                                                Step
                                            </ColTh>

                                            {/* EARNINGS */}
                                            <GrpTh
                                                colSpan={5}
                                                className="bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                            >
                                                Earnings
                                            </GrpTh>

                                            {/* MANDATORY */}
                                            <GrpTh
                                                colSpan={4}
                                                className="bg-orange-50/80 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                                            >
                                                Mandatory Deductions
                                            </GrpTh>

                                            {/* ATTENDANCE */}
                                            <GrpTh
                                                colSpan={4}
                                                className="bg-purple-50/80 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                            >
                                                Attendance
                                            </GrpTh>

                                            {/* OTHER */}
                                            <GrpTh
                                                colSpan={7}
                                                className="bg-red-50/80 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                            >
                                                Other Deductions
                                            </GrpTh>

                                            {/* SUMMARY */}
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[5%] bg-muted/70"
                                            >
                                                Total Deductions
                                            </ColTh>
                                            <ColTh
                                                rowSpan={2}
                                                className="w-[5%] bg-green-50/80 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                            >
                                                Net Pay
                                            </ColTh>
                                        </tr>

                                        {/* ── Sub-column labels row ── */}
                                        <tr>
                                            {/* Earnings sub-cols */}
                                            <ColTh className="w-[5%] bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                Basic Pay
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                PERA
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                Rice
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                Uniform
                                            </ColTh>
                                            <ColTh className="w-[5%] bg-blue-50/80 font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                                Gross
                                            </ColTh>

                                            {/* Mandatory sub-cols */}
                                            <ColTh className="w-[4%] bg-orange-50/60 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                                GSIS
                                            </ColTh>
                                            <ColTh className="w-[4%] bg-orange-50/60 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                                PhilHealth
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-orange-50/60 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                                Pag-IBIG
                                            </ColTh>
                                            <ColTh className="w-[4%] bg-orange-50/60 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                                W/Tax
                                            </ColTh>

                                            {/* Attendance sub-cols */}
                                            <ColTh className="w-[2.5%] bg-purple-50/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                                Abs.Days
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-purple-50/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                                Abs.Amt
                                            </ColTh>
                                            <ColTh className="w-[2.5%] bg-purple-50/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                                Late Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-purple-50/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                                Late Amt
                                            </ColTh>

                                            {/* Other sub-cols */}
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                GSIS MPL
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                GSIS Emg
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                PagIBIG MPL
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                Org Savings
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                Org Dues &amp; Loans
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                AMA/Union
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-red-50/60 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                                Water Bill
                                            </ColTh>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {records.map((rec, idx) => (
                                            <tr
                                                key={rec.payroll_record_id}
                                                className={[
                                                    'transition-colors',
                                                    idx % 2 !== 0
                                                        ? 'bg-muted/20'
                                                        : '',
                                                    !rec.floor_check_passed
                                                        ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                                        : '',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
                                                <Td
                                                    center
                                                    className="text-muted-foreground"
                                                >
                                                    {idx + 1}
                                                </Td>
                                                <Td className="pl-2 font-semibold">
                                                    {rec.employee_name}
                                                    {!rec.floor_check_passed && (
                                                        <span className="ml-1 text-amber-500">
                                                            ⚠
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td className="pl-2 text-muted-foreground">
                                                    {rec.position}
                                                </Td>
                                                <Td center>
                                                    {rec.salary_grade || '—'}
                                                </Td>
                                                <Td center>
                                                    {rec.step || '—'}
                                                </Td>

                                                {/* Earnings */}
                                                <Td
                                                    right
                                                    className="text-blue-900 dark:text-blue-300"
                                                >
                                                    {n(rec.basic_pay)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-400"
                                                >
                                                    {n(rec.pera)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-400"
                                                >
                                                    {n(rec.rice_allowance)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-400"
                                                >
                                                    {n(rec.uniform_allowance)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="font-semibold text-blue-900 dark:text-blue-300"
                                                >
                                                    {n(rec.gross_pay)}
                                                </Td>

                                                {/* Mandatory */}
                                                <Td
                                                    right
                                                    className="text-orange-800 dark:text-orange-300"
                                                >
                                                    {n(rec.gsis_premium)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-orange-800 dark:text-orange-300"
                                                >
                                                    {n(rec.philhealth)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-orange-800 dark:text-orange-300"
                                                >
                                                    {n(rec.pag_ibig)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-orange-800 dark:text-orange-300"
                                                >
                                                    {n(rec.withholding_tax)}
                                                </Td>

                                                {/* Attendance */}
                                                <Td
                                                    center
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {rec.absent_days || '—'}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {n(rec.absent_deduction)}
                                                </Td>
                                                <Td
                                                    center
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {rec.late_minutes || '—'}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {n(rec.late_deduction)}
                                                </Td>

                                                {/* Other */}
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(rec.gsis_mpl)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(rec.gsis_emergency)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(rec.pag_ibig_mpl)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(
                                                        rec.internal_org_savings ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(
                                                        rec.internal_org_second ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(rec.ama_y2k_union)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(rec.water_bill)}
                                                </Td>

                                                {/* Summary */}
                                                <Td
                                                    right
                                                    className="font-semibold"
                                                >
                                                    {n(rec.total_deductions)}
                                                </Td>
                                                <Td
                                                    right
                                                    className={`font-bold ${
                                                        rec.floor_check_passed
                                                            ? 'text-green-800 dark:text-green-400'
                                                            : 'text-amber-700 dark:text-amber-400'
                                                    }`}
                                                >
                                                    {n(rec.net_pay)}
                                                </Td>
                                            </tr>
                                        ))}

                                        {/* ── Totals row ── */}
                                        <tr>
                                            <TotTd
                                                colSpan={5}
                                                className="pl-2 text-left text-[9px] font-bold tracking-wider uppercase"
                                            >
                                                Total ({summary.total_employees}{' '}
                                                employees)
                                            </TotTd>

                                            {/* Earnings */}
                                            <TotTd className="text-blue-900 dark:text-blue-300">
                                                {nf(summary.total_basic_pay)}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-400">
                                                {nf(summary.total_pera)}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-400">
                                                {nf(
                                                    summary.total_rice_allowance,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-400">
                                                {nf(
                                                    summary.total_uniform_allowance,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-blue-900 dark:text-blue-300">
                                                {nf(summary.total_gross)}
                                            </TotTd>

                                            {/* Mandatory */}
                                            <TotTd className="text-orange-800 dark:text-orange-300">
                                                {nf(summary.total_gsis_premium)}
                                            </TotTd>
                                            <TotTd className="text-orange-800 dark:text-orange-300">
                                                {nf(summary.total_philhealth)}
                                            </TotTd>
                                            <TotTd className="text-orange-800 dark:text-orange-300">
                                                {nf(summary.total_pag_ibig)}
                                            </TotTd>
                                            <TotTd className="text-orange-800 dark:text-orange-300">
                                                {nf(
                                                    summary.total_withholding_tax,
                                                )}
                                            </TotTd>

                                            {/* Attendance */}
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                —
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                {nf(
                                                    summary.total_absent_deduction,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                —
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                {nf(
                                                    summary.total_late_deduction,
                                                )}
                                            </TotTd>

                                            {/* Other */}
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(summary.total_gsis_mpl)}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(
                                                    summary.total_gsis_emergency,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(summary.total_pag_ibig_mpl)}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(
                                                    summary.total_internal_org_savings ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(
                                                    summary.total_internal_org_second ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(
                                                    summary.total_ama_y2k_union,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(summary.total_water_bill)}
                                            </TotTd>

                                            {/* Summary */}
                                            <TotTd>
                                                {nf(summary.total_deductions)}
                                            </TotTd>
                                            <TotTd className="text-green-800 dark:text-green-300">
                                                {nf(summary.total_net_pay)}
                                            </TotTd>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Certification text ───────────────────────────────── */}
                    <div className="mt-8 border-t border-border pt-5">
                        <p className="mb-6 text-[10px] leading-relaxed text-muted-foreground">
                            We hereby certify on our official oaths that the
                            services and the corresponding compensations of the
                            employees listed above have been rendered and that
                            the payrolls are correct and just, that the services
                            were actually rendered, and that the disbursements
                            made conform with existing government accounting and
                            auditing rules and regulations.
                        </p>

                        {/* Signature blocks */}
                        <div className="flex justify-between gap-8">
                            {[
                                {
                                    role: 'Prepared by',
                                    sub: 'HR Officer',
                                    name: hrOfficer,
                                },
                                {
                                    role: 'Verified by',
                                    sub: 'Finance Officer',
                                    name: '',
                                },
                                {
                                    role: 'Approved by',
                                    sub: 'General Manager',
                                    name: '',
                                },
                            ].map(({ role, sub, name }) => (
                                <div key={role} className="flex-1 text-center">
                                    <div className="mb-8 h-px border-b border-dashed border-border" />
                                    <p className="text-[11px] font-semibold tracking-wide uppercase">
                                        {name ||
                                            '________________________________'}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                        {role}: {sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Document footer ──────────────────────────────────── */}
                    <div className="mt-5 border-t border-border/40 pt-2">
                        {/* Paper note — visible on screen, also prints */}
                        <div className="mb-2 flex items-center justify-center gap-1.5 rounded border border-dashed border-amber-400 bg-amber-50/60 px-3 py-1 text-[10px] font-medium text-amber-700 dark:border-amber-600 dark:bg-amber-950/20 dark:text-amber-400 print:border-amber-300 print:bg-transparent">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span>
                                Please print on{' '}
                                <strong>
                                    Legal / Long Bond Paper (8.5" × 14")
                                </strong>{' '}
                                — Landscape orientation
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                            <span>Period ID: #{period.payroll_period_id}</span>
                            <span>
                                Metro Kidapawan Water District — Payroll System
                            </span>
                            <span>
                                Printed: {format(new Date(), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Print styles ─────────────────────────────────────────────── */}
            <style>{`
                @media print {
                    @page {
                        size: legal landscape; /* Legal / Long Bond Paper (8.5" x 14") */
                        margin: 0.8cm 1cm;
                    }

                    /* Hide ALL chrome — sidebar, toolbar, breadcrumbs, stat cards */
                    body > * { visibility: hidden; }
                    #payroll-register-document,
                    #payroll-register-document * { visibility: visible; }

                    /* Let document flow naturally across pages — NOT fixed/absolute */
                    #payroll-register-document {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        box-shadow: none !important;
                        padding: 8px !important;
                        margin: 0 !important;
                        font-size: 7.5px !important;
                    }

                    /* Preserve coloured cell backgrounds */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Never split a single data row across pages */
                    tbody tr { page-break-inside: avoid; }

                    /* Repeat column headers on every page */
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }

                    /* Tighten cell padding for print */
                    #payroll-register-document table td,
                    #payroll-register-document table th {
                        padding: 2px 3px !important;
                        font-size: 7px !important;
                        line-height: 1.2 !important;
                    }

                    /* Hide screen-only wrappers */
                    .print\:hidden { display: none !important; }
                }
            `}</style>
        </AppLayout>
    );
}
