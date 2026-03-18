import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
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
import { Separator } from '@/components/ui/separator';
import { StatCard as SharedStatCard } from '@/components/shared/stat-card';
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
    overtime_pay: number;
    absent_days: number;
    absent_deduction: number;
    half_days: number;
    half_day_deduction: number;
    late_minutes: number;
    late_deduction: number;
    undertime_minutes: number;
    undertime_deduction: number;
    personal_slip_minutes: number;
    personal_slip_deduction: number;
    // Gov't loan breakdown
    gsis_mpl: number;
    gsis_emergency: number;
    gsis_salary_loan: number;
    gsis_policy_loan: number;
    pag_ibig_mpl: number;
    pag_ibig_housing: number;
    pag_ibig_calamity: number;
    // Internal org breakdown
    internal_org_savings: number;
    internal_org_second: number;
    internal_org_loans: number;
    /** NS&ND, misc, org loans aggregate */
    other_deductions_total: number;
    water_bill: number;
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
    total_half_day_deduction: number;
    total_late_deduction: number;
    total_undertime_deduction: number;
    total_personal_slip_deduction: number;
    total_gsis_mpl: number;
    total_gsis_emergency: number;
    total_gsis_salary_loan: number;
    total_gsis_policy_loan: number;
    total_pag_ibig_mpl: number;
    total_pag_ibig_housing: number;
    total_pag_ibig_calamity: number;
    total_internal_org_savings: number;
    total_internal_org_second: number;
    total_internal_org_loans: number;
    /** Renamed from total_ama_y2k_union */
    total_other_deductions: number;
    total_water_bill: number;
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

// ── Stat Card Component ───────────────────────────────────────────────────────
// Local wrapper so we can pass formatted peso strings without modifying the
// shared StatCard component (which expects value: number).
function StatCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number | string;
    description?: string;
    icon: React.ReactNode;
}) {
    return (
        <SharedStatCard
            title={title}
            value={typeof value === 'number' ? value : (value as any)}
            description={description}
            icon={icon}
        />
    );
}

// ── Table Header Helpers ──────────────────────────────────────────────────────

function GrpTh({
    children,
    colSpan,
    className = '',
    style,
}: {
    children: React.ReactNode;
    colSpan?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <th
            colSpan={colSpan}
            className={`border border-border/60 px-1.5 py-1 text-center text-[9px] font-bold tracking-wider uppercase ${className}`}
            style={style}
        >
            {children}
        </th>
    );
}

function ColTh({
    children,
    rowSpan,
    className = '',
    style,
}: {
    children: React.ReactNode;
    rowSpan?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <th
            rowSpan={rowSpan}
            className={`border border-border/60 px-1 py-1 text-center text-[9px] leading-tight font-semibold ${className}`}
            style={style}
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
    colSpan,
}: {
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
}) {
    return (
        <td
            colSpan={colSpan}
            className={`border border-border/60 bg-muted/50 px-1 py-1 text-right text-[8.5px] font-bold tabular-nums ${className}`}
        >
            {children}
        </td>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Show({ period, records, summary }: Props) {
    // ── Computed values ───────────────────────────────────────────────────────

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

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll Register – ${periodLabel}`} />

            <div className="flex items-center justify-between gap-8 p-8 print:hidden">
                <div className="flex items-center gap-3">
                    <Link href={route('payroll-register.index')}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>

                    <Separator orientation="vertical" className="h-5" />

                    <div>
                        <h1 className="text-base leading-none font-medium">
                            Payroll Register
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                {periodLabel} · {period.cut_off ?? '—'} Cut-off
                            </p>
                        </div>
                    </div>
                </div>

                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Register
                </Button>
            </div>

            <div className="flex flex-col items-center bg-slate-50 px-6 pt-3 pb-0 print:hidden">
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-4 w-4" />}
                        title="Total Employees"
                        value={summary.total_employees}
                        description={`Period #${period.payroll_period_id}`}
                    />
                    <StatCard
                        icon={<TrendingUp className="h-4 w-4" />}
                        title="Total Gross Pay"
                        value={peso(summary.total_gross)}
                        description="Earnings before deductions"
                    />
                    <StatCard
                        icon={<Landmark className="h-4 w-4" />}
                        title="Total Deductions"
                        value={peso(summary.total_deductions)}
                        description="All deduction types"
                    />
                    <StatCard
                        icon={<Receipt className="h-4 w-4" />}
                        title="Total Net Pay"
                        value={peso(summary.total_net_pay)}
                        description="Final take-home pay"
                    />
                </div>
            </div>

            {/* ── Paper wrapper ── unchanged ── */}
            <div className="flex flex-1 flex-col items-center bg-slate-50 px-6 pt-3 pb-6 print:block print:overflow-visible print:bg-white print:p-0">
                <div
                    id="payroll-register-document"
                    className="w-full bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200 print:max-w-none print:px-6 print:py-4 print:shadow-none print:ring-0"
                >
                    {/* ── Document header ───────────────────────────────────── */}
                    <div className="mb-2 flex flex-col items-center text-center">
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
                                    {periodLabel}&emsp;·&emsp;
                                    {period.cut_off ?? '—'} Cut-off
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 h-[2px] border-b border-foreground/80 bg-foreground/80" />

                    {/* ── Register table ───────────────────────────────────── */}
                    {records.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            No payroll records found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="overflow-hidden rounded-md border border-border/60">
                                <table className="w-full border-collapse text-[8.5px]">
                                    <thead className="bg-muted/50 text-foreground">
                                        {/* ── Top alignment row ── */}
                                        <tr className="bg-slate-200">
                                            <GrpTh
                                                colSpan={5}
                                                className="bg-slate-300 text-foreground"
                                            >
                                                Employee Information
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={5}
                                                className="bg-slate-300 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Earnings
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={4}
                                                className="bg-slate-300 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Mandatory Deductions
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={10}
                                                className="bg-slate-300 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Attendance
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={12}
                                                className="bg-slate-300 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Other Deductions
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={2}
                                                className="bg-slate-300 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Summary
                                            </GrpTh>
                                        </tr>

                                        {/* ── Source group row (2nd header tier) ── */}
                                        <tr className="bg-slate-200/60">
                                            {/* Employee Info + Earnings + Mandatory + Attendance — empty cells spanning those columns */}
                                            <th
                                                colSpan={5}
                                                className="border border-border/40 bg-slate-100"
                                            />
                                            <th
                                                colSpan={5}
                                                className="border border-border/40 bg-slate-100"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            />
                                            <th
                                                colSpan={4}
                                                className="border border-border/40 bg-slate-100"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            />
                                            <th
                                                colSpan={10}
                                                className="border border-border/40 bg-slate-100"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            />
                                            {/* Other Deductions source groupings */}
                                            <th
                                                colSpan={4}
                                                className="border border-border/60 bg-blue-100/70 px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-blue-800 uppercase"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                GSIS
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="border border-border/60 bg-cyan-100/70 px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-cyan-800 uppercase"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                Pag-IBIG
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="border border-border/60 bg-violet-100/70 px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-violet-800 uppercase"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                Internal Org
                                            </th>
                                            <th
                                                colSpan={2}
                                                className="border border-border/60 bg-slate-100 px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-slate-500 uppercase"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                Other
                                            </th>
                                            {/* Summary — empty */}
                                            <th
                                                colSpan={2}
                                                className="border border-border/40 bg-slate-100"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            />
                                        </tr>

                                        {/* ── Sub-column labels row ── */}
                                        <tr className="bg-slate-50">
                                            <ColTh className="w-[2%] bg-slate-50">
                                                #
                                            </ColTh>
                                            <ColTh className="w-[9%] bg-slate-50 pl-2 text-left">
                                                Employee Name
                                            </ColTh>
                                            <ColTh className="w-[7%] bg-slate-50 pl-2 text-left">
                                                Position
                                            </ColTh>
                                            <ColTh className="w-[2.5%] bg-slate-50">
                                                SG
                                            </ColTh>
                                            <ColTh className="w-[2%] bg-slate-50">
                                                Step
                                            </ColTh>

                                            {/* Earnings sub-cols */}
                                            <ColTh
                                                className="w-[5%] bg-slate-50"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Basic Pay
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-slate-50">
                                                PERA
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-slate-50">
                                                Rice
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-slate-50">
                                                Uniform
                                            </ColTh>
                                            <ColTh className="w-[5%] bg-slate-50 font-bold">
                                                Gross
                                            </ColTh>

                                            {/* Mandatory sub-cols */}
                                            <ColTh
                                                className="w-[4%] bg-slate-50"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                GSIS
                                            </ColTh>
                                            <ColTh className="w-[4%] bg-slate-50">
                                                PhilHealth
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Pag-IBIG
                                            </ColTh>
                                            <ColTh className="w-[4%] bg-slate-50">
                                                W/Tax
                                            </ColTh>

                                            {/* Attendance sub-cols */}
                                            <ColTh
                                                className="w-[2.5%] bg-slate-50"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Abs.Days
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Abs.Amt
                                            </ColTh>
                                            <ColTh className="w-[2%] bg-slate-50">
                                                Half Days
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Half Amt
                                            </ColTh>
                                            <ColTh className="w-[2.5%] bg-slate-50">
                                                Late Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Late Amt
                                            </ColTh>
                                            <ColTh className="w-[2%] bg-slate-50">
                                                UT Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                UT Amt
                                            </ColTh>
                                            <ColTh className="w-[2%] bg-slate-50">
                                                Slip Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Slip Amt
                                            </ColTh>

                                            {/* Other sub-cols — GSIS */}
                                            <ColTh
                                                className="w-[3%] bg-blue-50/60"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                MPL
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60">
                                                Emg
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60">
                                                Salary
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-blue-50/60">
                                                Policy
                                            </ColTh>

                                            {/* Other sub-cols — Pag-IBIG */}
                                            <ColTh
                                                className="w-[3%] bg-cyan-50/60"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                MPL
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-cyan-50/60">
                                                Housing
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-cyan-50/60">
                                                Calamity
                                            </ColTh>

                                            {/* Other sub-cols — Internal Org */}
                                            <ColTh
                                                className="w-[3.5%] bg-violet-50/60"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                Savings
                                            </ColTh>
                                            <ColTh className="w-[3%] bg-violet-50/60">
                                                Dues
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-violet-50/60">
                                                Loans
                                            </ColTh>

                                            {/* Other sub-cols — Misc & Water */}
                                            <ColTh
                                                className="w-[3.5%] bg-slate-50"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #aaa',
                                                }}
                                            >
                                                NS&amp;ND
                                                <br />
                                                <span className="text-[7px] font-normal normal-case">
                                                    misc
                                                </span>
                                            </ColTh>
                                            <ColTh className="w-[3.5%] bg-slate-50">
                                                Water Bill
                                            </ColTh>

                                            {/* Summary sub-cols */}
                                            <ColTh
                                                className="w-[5%] bg-slate-50 text-foreground"
                                                style={{
                                                    borderLeft:
                                                        '1px solid #000',
                                                }}
                                            >
                                                Total Deductions
                                            </ColTh>
                                            <ColTh className="w-[5%] bg-slate-50 font-bold text-foreground">
                                                Net Pay
                                            </ColTh>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {records.map((rec, idx) => (
                                            <tr
                                                key={rec.payroll_record_id}
                                                className={`transition-colors ${idx % 2 !== 0 ? 'bg-muted/20' : ''}`}
                                            >
                                                <Td
                                                    center
                                                    className="text-muted-foreground"
                                                >
                                                    {idx + 1}
                                                </Td>
                                                <Td className="pl-2 font-semibold">
                                                    {rec.employee_name}
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
                                                    {rec.half_days || '—'}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {n(rec.half_day_deduction)}
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
                                                <Td
                                                    center
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {rec.undertime_minutes ||
                                                        '—'}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {n(rec.undertime_deduction)}
                                                </Td>
                                                <Td
                                                    center
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {rec.personal_slip_minutes ||
                                                        '—'}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-purple-800 dark:text-purple-300"
                                                >
                                                    {n(
                                                        rec.personal_slip_deduction,
                                                    )}
                                                </Td>

                                                {/* GSIS Loans */}
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-300"
                                                >
                                                    {n(rec.gsis_mpl)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-300"
                                                >
                                                    {n(rec.gsis_emergency)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-300"
                                                >
                                                    {n(
                                                        rec.gsis_salary_loan ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-blue-800 dark:text-blue-300"
                                                >
                                                    {n(
                                                        rec.gsis_policy_loan ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* Pag-IBIG Loans */}
                                                <Td
                                                    right
                                                    className="text-cyan-800 dark:text-cyan-300"
                                                >
                                                    {n(rec.pag_ibig_mpl)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-cyan-800 dark:text-cyan-300"
                                                >
                                                    {n(
                                                        rec.pag_ibig_housing ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-cyan-800 dark:text-cyan-300"
                                                >
                                                    {n(
                                                        rec.pag_ibig_calamity ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* Internal Org */}
                                                <Td
                                                    right
                                                    className="text-violet-800 dark:text-violet-300"
                                                >
                                                    {n(
                                                        rec.internal_org_savings ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-violet-800 dark:text-violet-300"
                                                >
                                                    {n(
                                                        rec.internal_org_second ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td
                                                    right
                                                    className="text-violet-800 dark:text-violet-300"
                                                >
                                                    {n(
                                                        rec.internal_org_loans ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* NS&ND/Misc + Water Bill */}
                                                <Td
                                                    right
                                                    className="text-red-800 dark:text-red-400"
                                                >
                                                    {n(
                                                        rec.other_deductions_total ??
                                                            0,
                                                    )}
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
                                                    className="font-bold text-green-800 dark:text-green-400"
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
                                                    summary.total_half_day_deduction ??
                                                        0,
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
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                —
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                {nf(
                                                    summary.total_undertime_deduction ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                —
                                            </TotTd>
                                            <TotTd className="text-purple-800 dark:text-purple-300">
                                                {nf(
                                                    summary.total_personal_slip_deduction ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* GSIS Loans totals */}
                                            <TotTd className="text-blue-800 dark:text-blue-300">
                                                {nf(summary.total_gsis_mpl)}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-300">
                                                {nf(
                                                    summary.total_gsis_emergency,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-300">
                                                {nf(
                                                    summary.total_gsis_salary_loan ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-blue-800 dark:text-blue-300">
                                                {nf(
                                                    summary.total_gsis_policy_loan ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* Pag-IBIG Loans totals */}
                                            <TotTd className="text-cyan-800 dark:text-cyan-300">
                                                {nf(summary.total_pag_ibig_mpl)}
                                            </TotTd>
                                            <TotTd className="text-cyan-800 dark:text-cyan-300">
                                                {nf(
                                                    summary.total_pag_ibig_housing ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-cyan-800 dark:text-cyan-300">
                                                {nf(
                                                    summary.total_pag_ibig_calamity ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* Internal Org totals */}
                                            <TotTd className="text-violet-800 dark:text-violet-300">
                                                {nf(
                                                    summary.total_internal_org_savings ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-violet-800 dark:text-violet-300">
                                                {nf(
                                                    summary.total_internal_org_second ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd className="text-violet-800 dark:text-violet-300">
                                                {nf(
                                                    summary.total_internal_org_loans ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* NS&ND/Misc + Water Bill totals */}
                                            <TotTd className="text-red-800 dark:text-red-400">
                                                {nf(
                                                    summary.total_other_deductions ??
                                                        0,
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
                                    <p className="mb-0.5 min-h-[1rem] text-[11px] font-semibold tracking-wide uppercase">
                                        {name || ''}
                                    </p>
                                    <div
                                        className="mx-auto mb-1 w-3/4"
                                        style={{
                                            borderTop: '1.5px solid #000',
                                        }}
                                    />
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                        {role}: {sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Document footer ──────────────────────────────────── */}
                    <div className="mt-5 border-t border-border/40 pt-2">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                            <span>Period ID: #{period.payroll_period_id}</span>
                            <span>
                                Metro Kidapawan Water District — Payroll System
                            </span>
                            <span>
                                Print Date: {format(new Date(), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Print styles ─────────────────────────────────────────────── */}
            <style>{`
                @media print {
                    @page {
                        size: legal landscape;
                        margin: 0;
                    }

                    /* Hide AppLayout chrome: breadcrumb bar, sidebar, nav */
                    header, nav, aside { display: none !important; }

                    /* Hide screen-only elements */
                    .print\\:hidden { display: none !important; }

                    /* Ensure all layout wrappers don't clip or constrain the document */
                    html, body {
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* Remove any layout constraints from ancestor containers */
                    body > * {
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* Document itself — use padding since @page margin is 0 */
                    #payroll-register-document {
                     width: 100% !important;
                     height: auto !important;
                     overflow: visible !important;
                     background: white !important;
                     box-shadow: none !important;
                     ring: none !important;
                     padding: 1cm 1.5cm !important;
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
                }
            `}</style>
        </AppLayout>
    );
}
