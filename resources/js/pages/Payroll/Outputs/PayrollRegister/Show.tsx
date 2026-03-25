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
            className={`px-1.5 py-1 text-center text-[9px] font-bold tracking-wider text-black uppercase ${className}`}
            style={{
                border: '1px solid #000',
                backgroundColor: '#c8c8c8',
                ...style,
            }}
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
            className={`px-1 py-1 text-center text-[9px] leading-tight font-semibold text-black ${className}`}
            style={{
                border: '1px solid #000',
                backgroundColor: '#e8e8e8',
                ...style,
            }}
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
    style,
}: {
    children: React.ReactNode;
    right?: boolean;
    center?: boolean;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <td
            className={`px-1 py-[3px] text-[8.5px] leading-tight text-black ${
                right
                    ? 'text-right tabular-nums'
                    : center
                      ? 'text-center'
                      : 'text-left'
            } ${className}`}
            style={{ border: '1px solid #000', ...style }}
        >
            {children}
        </td>
    );
}

function TotTd({
    children,
    className = '',
    colSpan,
    style,
}: {
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
    style?: React.CSSProperties;
}) {
    return (
        <td
            colSpan={colSpan}
            className={`px-1 py-1 text-right text-[8.5px] font-bold text-black tabular-nums ${className}`}
            style={{
                border: '1px solid #000',
                borderTop: '2px solid #000',
                backgroundColor: '#d4d4d4',
                ...style,
            }}
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

                <Button
                    onClick={() =>
                        window.open(
                            route(
                                'payroll-register.print',
                                period.payroll_period_id,
                            ),
                            '_blank',
                        )
                    }
                    className="gap-2"
                >
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

            <div className="flex flex-1 flex-col items-center bg-slate-50 px-6 pt-3 pb-6 print:block print:overflow-visible print:bg-white print:p-0">
                <div
                    id="payroll-register-document"
                    className="w-full bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200 print:max-w-none print:px-6 print:py-4 print:shadow-none print:ring-0"
                >
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

                    {/* <div className="mb-4 h-[1px] border-b border-foreground/80 bg-foreground/80" /> */}

                    {records.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            No payroll records found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="overflow-hidden border border-1">
                                <table className="w-full border-collapse text-[8.5px]">
                                    <thead className="text-black">
                                        <tr>
                                            <GrpTh colSpan={5}>
                                                Employee Information
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={5}
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Earnings
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={4}
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Mandatory Deductions
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={10}
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Attendance
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={12}
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Other Deductions
                                            </GrpTh>
                                            <GrpTh
                                                colSpan={2}
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Summary
                                            </GrpTh>
                                        </tr>

                                        {/* ── Source group row (2nd header tier) ── */}
                                        <tr>
                                            {/* Employee Info + Earnings + Mandatory + Attendance — empty spacer cells */}
                                            <th
                                                colSpan={5}
                                                style={{
                                                    border: '1px solid #000',
                                                    backgroundColor: '#e8e8e8',
                                                }}
                                            />
                                            <th
                                                colSpan={5}
                                                style={{
                                                    border: '1px solid #000',
                                                    borderLeft:
                                                        '2px solid #000',
                                                    backgroundColor: '#e8e8e8',
                                                }}
                                            />
                                            <th
                                                colSpan={4}
                                                style={{
                                                    border: '1px solid #000',
                                                    borderLeft:
                                                        '2px solid #000',
                                                    backgroundColor: '#e8e8e8',
                                                }}
                                            />
                                            <th
                                                colSpan={10}
                                                style={{
                                                    border: '1px solid #000',
                                                    borderLeft:
                                                        '2px solid #000',
                                                    backgroundColor: '#e8e8e8',
                                                }}
                                            />
                                            {/* Other Deductions source groupings */}
                                            <th
                                                colSpan={4}
                                                className="px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-black uppercase"
                                                style={{
                                                    border: '1px solid #000',
                                                    borderLeft:
                                                        '2px solid #000',
                                                    backgroundColor: '#dcdcdc',
                                                }}
                                            >
                                                GSIS
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-black uppercase"
                                                style={{
                                                    border: '1px solid #000',
                                                    backgroundColor: '#dcdcdc',
                                                }}
                                            >
                                                Pag-IBIG
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-black uppercase"
                                                style={{
                                                    border: '1px solid #000',
                                                    backgroundColor: '#dcdcdc',
                                                }}
                                            >
                                                Internal Org
                                            </th>
                                            <th
                                                colSpan={2}
                                                className="px-1 py-0.5 text-center text-[8px] font-bold tracking-wider text-black uppercase"
                                                style={{
                                                    border: '1px solid #000',
                                                    backgroundColor: '#dcdcdc',
                                                }}
                                            >
                                                Other
                                            </th>
                                            {/* Summary — empty */}
                                            <th
                                                colSpan={2}
                                                style={{
                                                    border: '1px solid #000',
                                                    borderLeft:
                                                        '2px solid #000',
                                                    backgroundColor: '#e8e8e8',
                                                }}
                                            />
                                        </tr>

                                        <tr>
                                            <ColTh className="w-[2%]">#</ColTh>
                                            <ColTh className="w-[9%] pl-2 text-left">
                                                Employee Name
                                            </ColTh>
                                            <ColTh className="w-[7%] pl-2 text-left">
                                                Position
                                            </ColTh>
                                            <ColTh className="w-[2.5%]">
                                                SG
                                            </ColTh>
                                            <ColTh className="w-[2%]">
                                                Step
                                            </ColTh>

                                            <ColTh
                                                className="w-[5%]"
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Basic Pay
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                PERA
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Rice
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Uniform
                                            </ColTh>
                                            <ColTh className="w-[5%] font-bold">
                                                Gross
                                            </ColTh>

                                            {/* Mandatory sub-cols */}
                                            <ColTh
                                                className="w-[4%]"
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                GSIS
                                            </ColTh>
                                            <ColTh className="w-[4%]">
                                                PhilHealth
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Pag-IBIG
                                            </ColTh>
                                            <ColTh className="w-[4%]">
                                                W/Tax
                                            </ColTh>

                                            {/* Attendance sub-cols */}
                                            <ColTh
                                                className="w-[2.5%]"
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Abs.Days
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Abs.Amt
                                            </ColTh>
                                            <ColTh className="w-[2%]">
                                                Half Days
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Half Amt
                                            </ColTh>
                                            <ColTh className="w-[2.5%]">
                                                Late Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Late Amt
                                            </ColTh>
                                            <ColTh className="w-[2%]">
                                                UT Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                UT Amt
                                            </ColTh>
                                            <ColTh className="w-[2%]">
                                                Slip Min
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Slip Amt
                                            </ColTh>

                                            {/* Other sub-cols — GSIS */}
                                            <ColTh
                                                className="w-[3%]"
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                MPL
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Emg
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Salary
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Policy
                                            </ColTh>

                                            {/* Other sub-cols — Pag-IBIG */}
                                            <ColTh className="w-[3%]">
                                                MPL
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Housing
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Calamity
                                            </ColTh>

                                            {/* Other sub-cols — Internal Org */}
                                            <ColTh className="w-[3.5%]">
                                                Savings
                                            </ColTh>
                                            <ColTh className="w-[3%]">
                                                Dues
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Loans
                                            </ColTh>

                                            {/* Other sub-cols — Misc & Water */}
                                            <ColTh className="w-[3.5%]">
                                                NS&amp;ND
                                                <br />
                                                <span className="text-[7px] font-normal normal-case">
                                                    misc
                                                </span>
                                            </ColTh>
                                            <ColTh className="w-[3.5%]">
                                                Water Bill
                                            </ColTh>

                                            {/* Summary sub-cols */}
                                            <ColTh
                                                className="w-[5%]"
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                Total Deductions
                                            </ColTh>
                                            <ColTh className="w-[5%] font-bold">
                                                Net Pay
                                            </ColTh>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {records.map((rec, idx) => (
                                            <tr
                                                key={rec.payroll_record_id}
                                                style={{
                                                    backgroundColor:
                                                        idx % 2 !== 0
                                                            ? '#f5f5f5'
                                                            : '#ffffff',
                                                }}
                                            >
                                                <Td center>{idx + 1}</Td>
                                                <Td className="pl-2 font-semibold">
                                                    {rec.employee_name}
                                                </Td>
                                                <Td className="pl-2">
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
                                                    style={{
                                                        border: '1px solid #000',
                                                        borderLeft:
                                                            '2px solid #000',
                                                    }}
                                                >
                                                    {n(rec.basic_pay)}
                                                </Td>
                                                <Td right>{n(rec.pera)}</Td>
                                                <Td right>
                                                    {n(rec.rice_allowance)}
                                                </Td>
                                                <Td right>
                                                    {n(rec.uniform_allowance)}
                                                </Td>
                                                <Td
                                                    right
                                                    className="font-semibold"
                                                >
                                                    {n(rec.gross_pay)}
                                                </Td>

                                                {/* Mandatory */}
                                                <Td
                                                    right
                                                    style={{
                                                        border: '1px solid #000',
                                                        borderLeft:
                                                            '2px solid #000',
                                                    }}
                                                >
                                                    {n(rec.gsis_premium)}
                                                </Td>
                                                <Td right>
                                                    {n(rec.philhealth)}
                                                </Td>
                                                <Td right>{n(rec.pag_ibig)}</Td>
                                                <Td right>
                                                    {n(rec.withholding_tax)}
                                                </Td>

                                                {/* Attendance */}
                                                <Td
                                                    center
                                                    style={{
                                                        border: '1px solid #000',
                                                        borderLeft:
                                                            '2px solid #000',
                                                    }}
                                                >
                                                    {rec.absent_days || '—'}
                                                </Td>
                                                <Td right>
                                                    {n(rec.absent_deduction)}
                                                </Td>
                                                <Td center>
                                                    {rec.half_days || '—'}
                                                </Td>
                                                <Td right>
                                                    {n(rec.half_day_deduction)}
                                                </Td>
                                                <Td center>
                                                    {rec.late_minutes || '—'}
                                                </Td>
                                                <Td right>
                                                    {n(rec.late_deduction)}
                                                </Td>
                                                <Td center>
                                                    {rec.undertime_minutes ||
                                                        '—'}
                                                </Td>
                                                <Td right>
                                                    {n(rec.undertime_deduction)}
                                                </Td>
                                                <Td center>
                                                    {rec.personal_slip_minutes ||
                                                        '—'}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.personal_slip_deduction,
                                                    )}
                                                </Td>

                                                {/* GSIS Loans */}
                                                <Td
                                                    right
                                                    style={{
                                                        border: '1px solid #000',
                                                        borderLeft:
                                                            '2px solid #000',
                                                    }}
                                                >
                                                    {n(rec.gsis_mpl)}
                                                </Td>
                                                <Td right>
                                                    {n(rec.gsis_emergency)}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.gsis_salary_loan ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.gsis_policy_loan ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* Pag-IBIG Loans */}
                                                <Td right>
                                                    {n(rec.pag_ibig_mpl)}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.pag_ibig_housing ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.pag_ibig_calamity ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* Internal Org */}
                                                <Td right>
                                                    {n(
                                                        rec.internal_org_savings ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.internal_org_second ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td right>
                                                    {n(
                                                        rec.internal_org_loans ??
                                                            0,
                                                    )}
                                                </Td>

                                                {/* NS&ND/Misc + Water Bill */}
                                                <Td right>
                                                    {n(
                                                        rec.other_deductions_total ??
                                                            0,
                                                    )}
                                                </Td>
                                                <Td right>
                                                    {n(rec.water_bill)}
                                                </Td>

                                                {/* Summary */}
                                                <Td
                                                    right
                                                    className="font-semibold"
                                                    style={{
                                                        border: '1px solid #000',
                                                        borderLeft:
                                                            '2px solid #000',
                                                    }}
                                                >
                                                    {n(rec.total_deductions)}
                                                </Td>
                                                <Td right className="font-bold">
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
                                            <TotTd
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                {nf(summary.total_basic_pay)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(summary.total_pera)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_rice_allowance,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_uniform_allowance,
                                                )}
                                            </TotTd>
                                            <TotTd className="font-extrabold">
                                                {nf(summary.total_gross)}
                                            </TotTd>

                                            {/* Mandatory */}
                                            <TotTd
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                {nf(summary.total_gsis_premium)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(summary.total_philhealth)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(summary.total_pag_ibig)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_withholding_tax,
                                                )}
                                            </TotTd>

                                            {/* Attendance */}
                                            <TotTd
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                —
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_absent_deduction,
                                                )}
                                            </TotTd>
                                            <TotTd>—</TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_half_day_deduction ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>—</TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_late_deduction,
                                                )}
                                            </TotTd>
                                            <TotTd>—</TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_undertime_deduction ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>—</TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_personal_slip_deduction ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* GSIS Loans totals */}
                                            <TotTd
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                {nf(summary.total_gsis_mpl)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_gsis_emergency,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_gsis_salary_loan ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_gsis_policy_loan ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* Pag-IBIG Loans totals */}
                                            <TotTd>
                                                {nf(summary.total_pag_ibig_mpl)}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_pag_ibig_housing ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_pag_ibig_calamity ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* Internal Org totals */}
                                            <TotTd>
                                                {nf(
                                                    summary.total_internal_org_savings ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_internal_org_second ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(
                                                    summary.total_internal_org_loans ??
                                                        0,
                                                )}
                                            </TotTd>

                                            {/* NS&ND/Misc + Water Bill totals */}
                                            <TotTd>
                                                {nf(
                                                    summary.total_other_deductions ??
                                                        0,
                                                )}
                                            </TotTd>
                                            <TotTd>
                                                {nf(summary.total_water_bill)}
                                            </TotTd>

                                            {/* Summary */}
                                            <TotTd
                                                style={{
                                                    borderLeft:
                                                        '2px solid #000',
                                                }}
                                            >
                                                {nf(summary.total_deductions)}
                                            </TotTd>
                                            <TotTd className="font-extrabold">
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
                        margin: 1cm 1cm 1cm 1cm;
                    }

                    body * { visibility: hidden !important; }

                    #payroll-register-document,
                    #payroll-register-document * {
                        visibility: visible !important;
                    }

                    #payroll-register-document {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                    }

                    #payroll-register-document .overflow-x-auto,
                    #payroll-register-document .overflow-hidden {
                        overflow: visible !important;
                        width: 100% !important;
                        max-width: none !important;
                    }

                    #payroll-register-document table {
                        width: 100% !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Never split a data row across a page break */
                    tbody tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* Repeat table headers on every page */
                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }

                    /* Signatories / footer block: keep together */
                    #payroll-register-document .mt-8 {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    #payroll-register-document table td,
                    #payroll-register-document table th {
                        padding: 2px 2px !important;
                        font-size: 6.8px !important;
                        line-height: 1.15 !important;
                        white-space: nowrap !important;
                    }

                    #payroll-register-document .text-\\[20px\\] {
                        font-size: 14px !important;
                    }
                    #payroll-register-document .text-xs,
                    #payroll-register-document .text-\\[11px\\],
                    #payroll-register-document .text-\\[10px\\],
                    #payroll-register-document .text-\\[9px\\] {
                        font-size: 8px !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
