import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
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
    gsis_mpl: number;
    gsis_emergency: number;
    gsis_salary_loan: number;
    gsis_policy_loan: number;
    pag_ibig_mpl: number;
    pag_ibig_housing: number;
    pag_ibig_calamity: number;
    internal_org_savings: number;
    internal_org_second: number;
    internal_org_loans: number;
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

function n(val: number): string {
    if (val === 0) return '—';
    return val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function nf(val: number): string {
    return val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// ── Table Header Helpers ──────────────────────────────────────────────────────

function GrpTh({
    children,
    colSpan,
    style,
}: {
    children: React.ReactNode;
    colSpan?: number;
    style?: React.CSSProperties;
}) {
    return (
        <th
            colSpan={colSpan}
            style={{
                border: '1px solid #000',
                backgroundColor: '#c8c8c8',
                padding: '2px 4px',
                textAlign: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#000',
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
    style,
    textLeft,
}: {
    children: React.ReactNode;
    rowSpan?: number;
    style?: React.CSSProperties;
    textLeft?: boolean;
}) {
    return (
        <th
            rowSpan={rowSpan}
            style={{
                border: '1px solid #000',
                backgroundColor: '#e8e8e8',
                padding: '2px 3px',
                textAlign: textLeft ? 'left' : 'center',
                fontSize: '7.5px',
                fontWeight: '600',
                lineHeight: '1.2',
                color: '#000',
                ...style,
            }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    right,
    center,
    style,
    bold,
}: {
    children: React.ReactNode;
    right?: boolean;
    center?: boolean;
    style?: React.CSSProperties;
    bold?: boolean;
}) {
    return (
        <td
            style={{
                border: '1px solid #000',
                padding: '2px 3px',
                fontSize: '8px',
                lineHeight: '1.2',
                textAlign: right ? 'right' : center ? 'center' : 'left',
                fontWeight: bold ? '600' : 'normal',
                color: '#000',
                fontVariantNumeric: 'tabular-nums',
                ...style,
            }}
        >
            {children}
        </td>
    );
}

function TotTd({
    children,
    colSpan,
    style,
    bold,
}: {
    children: React.ReactNode;
    colSpan?: number;
    style?: React.CSSProperties;
    bold?: boolean;
}) {
    return (
        <td
            colSpan={colSpan}
            style={{
                border: '1px solid #000',
                borderTop: '2px solid #000',
                backgroundColor: '#d4d4d4',
                padding: '2px 3px',
                fontSize: '8px',
                textAlign: 'right',
                fontWeight: bold ? '800' : '700',
                color: '#000',
                fontVariantNumeric: 'tabular-nums',
                ...style,
            }}
        >
            {children}
        </td>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Print({ period, records, summary }: Props) {
    const periodLabel = formatPeriod(period.start_date, period.end_date);
    const hrOfficer =
        records.find((r) => r.hr_officer_name && r.hr_officer_name !== '—')
            ?.hr_officer_name ?? '';

    // Auto-trigger print dialog when the page loads
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title={`Print – Payroll Register ${periodLabel}`} />

            {/* ── Non-print toolbar ── */}
            <div className="flex items-center justify-between bg-gray-100 px-6 py-3 print:hidden">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold">Payroll Register</span> ·{' '}
                    {periodLabel} · {period.cut_off ?? '—'} Cut-off
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: '#1d4ed8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 16px',
                            fontSize: 13,
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        🖨 Print
                    </button>
                    <button
                        onClick={() => window.close()}
                        style={{
                            background: '#6b7280',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 16px',
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        ✕ Close Tab
                    </button>
                </div>
            </div>

            {/* ── Printable document ── */}
            <div
                id="print-document"
                style={{
                    background: '#fff',
                    padding: '0.5cm 0.8cm',
                    minHeight: '100vh',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: 10,
                    }}
                >
                    <img
                        src={Logo}
                        alt="MKWD Logo"
                        style={{ height: 48, width: 48, objectFit: 'contain' }}
                        onError={(e) =>
                            ((e.target as HTMLImageElement).style.display =
                                'none')
                        }
                    />
                    <div>
                        <p
                            style={{
                                fontSize: 9,
                                fontWeight: 400,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: '#555',
                                margin: 0,
                            }}
                        >
                            Metro Kidapawan Water District
                        </p>
                        <p
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                margin: 0,
                                color: '#000',
                            }}
                        >
                            Payroll Register
                        </p>
                        <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
                            {periodLabel}&emsp;·&emsp;{period.cut_off ?? '—'}{' '}
                            Cut-off
                        </p>
                    </div>
                </div>

                {/* Table */}
                {records.length === 0 ? (
                    <p
                        style={{
                            textAlign: 'center',
                            color: '#666',
                            padding: 32,
                        }}
                    >
                        No payroll records found for this period.
                    </p>
                ) : (
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'auto',
                        }}
                    >
                        <thead>
                            <tr>
                                <GrpTh colSpan={5}>Employee Information</GrpTh>
                                <GrpTh
                                    colSpan={5}
                                    style={{ borderLeft: '2px solid #000' }}
                                >
                                    Earnings
                                </GrpTh>
                                <GrpTh
                                    colSpan={4}
                                    style={{ borderLeft: '2px solid #000' }}
                                >
                                    Mandatory Deductions
                                </GrpTh>
                                <GrpTh
                                    colSpan={10}
                                    style={{ borderLeft: '2px solid #000' }}
                                >
                                    Attendance
                                </GrpTh>
                                <GrpTh
                                    colSpan={12}
                                    style={{ borderLeft: '2px solid #000' }}
                                >
                                    Other Deductions
                                </GrpTh>
                                <GrpTh
                                    colSpan={2}
                                    style={{ borderLeft: '2px solid #000' }}
                                >
                                    Summary
                                </GrpTh>
                            </tr>
                            <tr>
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
                                        borderLeft: '2px solid #000',
                                        backgroundColor: '#e8e8e8',
                                    }}
                                />
                                <th
                                    colSpan={4}
                                    style={{
                                        border: '1px solid #000',
                                        borderLeft: '2px solid #000',
                                        backgroundColor: '#e8e8e8',
                                    }}
                                />
                                <th
                                    colSpan={10}
                                    style={{
                                        border: '1px solid #000',
                                        borderLeft: '2px solid #000',
                                        backgroundColor: '#e8e8e8',
                                    }}
                                />
                                <th
                                    colSpan={4}
                                    style={{
                                        border: '1px solid #000',
                                        borderLeft: '2px solid #000',
                                        backgroundColor: '#dcdcdc',
                                        padding: '1px 3px',
                                        textAlign: 'center',
                                        fontSize: '7.5px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        color: '#000',
                                    }}
                                >
                                    GSIS
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        border: '1px solid #000',
                                        backgroundColor: '#dcdcdc',
                                        padding: '1px 3px',
                                        textAlign: 'center',
                                        fontSize: '7.5px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        color: '#000',
                                    }}
                                >
                                    Pag-IBIG
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        border: '1px solid #000',
                                        backgroundColor: '#dcdcdc',
                                        padding: '1px 3px',
                                        textAlign: 'center',
                                        fontSize: '7.5px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        color: '#000',
                                    }}
                                >
                                    Internal Org
                                </th>
                                <th
                                    colSpan={2}
                                    style={{
                                        border: '1px solid #000',
                                        backgroundColor: '#dcdcdc',
                                        padding: '1px 3px',
                                        textAlign: 'center',
                                        fontSize: '7.5px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        color: '#000',
                                    }}
                                >
                                    Other
                                </th>
                                <th
                                    colSpan={2}
                                    style={{
                                        border: '1px solid #000',
                                        borderLeft: '2px solid #000',
                                        backgroundColor: '#e8e8e8',
                                    }}
                                />
                            </tr>
                            <tr>
                                <ColTh style={{ width: '2%' }}>#</ColTh>
                                <ColTh textLeft style={{ width: '9%' }}>
                                    Employee Name
                                </ColTh>
                                <ColTh textLeft style={{ width: '7%' }}>
                                    Position
                                </ColTh>
                                <ColTh style={{ width: '2.5%' }}>SG</ColTh>
                                <ColTh style={{ width: '2%' }}>Step</ColTh>
                                <ColTh
                                    style={{
                                        width: '5%',
                                        borderLeft: '2px solid #000',
                                    }}
                                >
                                    Basic Pay
                                </ColTh>
                                <ColTh style={{ width: '3%' }}>PERA</ColTh>
                                <ColTh style={{ width: '3%' }}>Rice</ColTh>
                                <ColTh style={{ width: '3%' }}>Uniform</ColTh>
                                <ColTh
                                    style={{ width: '5%', fontWeight: '700' }}
                                >
                                    Gross
                                </ColTh>
                                <ColTh
                                    style={{
                                        width: '4%',
                                        borderLeft: '2px solid #000',
                                    }}
                                >
                                    GSIS
                                </ColTh>
                                <ColTh style={{ width: '4%' }}>
                                    PhilHealth
                                </ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    Pag-IBIG
                                </ColTh>
                                <ColTh style={{ width: '4%' }}>W/Tax</ColTh>
                                <ColTh
                                    style={{
                                        width: '2.5%',
                                        borderLeft: '2px solid #000',
                                    }}
                                >
                                    Abs.Days
                                </ColTh>
                                <ColTh style={{ width: '3.5%' }}>Abs.Amt</ColTh>
                                <ColTh style={{ width: '2%' }}>Half Days</ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    Half Amt
                                </ColTh>
                                <ColTh style={{ width: '2.5%' }}>
                                    Late Min
                                </ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    Late Amt
                                </ColTh>
                                <ColTh style={{ width: '2%' }}>UT Min</ColTh>
                                <ColTh style={{ width: '3.5%' }}>UT Amt</ColTh>
                                <ColTh style={{ width: '2%' }}>Slip Min</ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    Slip Amt
                                </ColTh>
                                <ColTh
                                    style={{
                                        width: '3%',
                                        borderLeft: '2px solid #000',
                                    }}
                                >
                                    MPL
                                </ColTh>
                                <ColTh style={{ width: '3%' }}>Emg</ColTh>
                                <ColTh style={{ width: '3%' }}>Salary</ColTh>
                                <ColTh style={{ width: '3%' }}>Policy</ColTh>
                                <ColTh style={{ width: '3%' }}>MPL</ColTh>
                                <ColTh style={{ width: '3%' }}>Housing</ColTh>
                                <ColTh style={{ width: '3%' }}>Calamity</ColTh>
                                <ColTh style={{ width: '3.5%' }}>Savings</ColTh>
                                <ColTh style={{ width: '3%' }}>Dues</ColTh>
                                <ColTh style={{ width: '3.5%' }}>Loans</ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    NS&amp;ND
                                    <br />
                                    <span
                                        style={{
                                            fontSize: '6.5px',
                                            fontWeight: 'normal',
                                        }}
                                    >
                                        misc
                                    </span>
                                </ColTh>
                                <ColTh style={{ width: '3.5%' }}>
                                    Water Bill
                                </ColTh>
                                <ColTh
                                    style={{
                                        width: '5%',
                                        borderLeft: '2px solid #000',
                                    }}
                                >
                                    Total Deductions
                                </ColTh>
                                <ColTh
                                    style={{ width: '5%', fontWeight: '700' }}
                                >
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
                                    <Td bold style={{ paddingLeft: 5 }}>
                                        {rec.employee_name}
                                    </Td>
                                    <Td style={{ paddingLeft: 5 }}>
                                        {rec.position}
                                    </Td>
                                    <Td center>{rec.salary_grade || '—'}</Td>
                                    <Td center>{rec.step || '—'}</Td>
                                    <Td
                                        right
                                        style={{ borderLeft: '2px solid #000' }}
                                    >
                                        {n(rec.basic_pay)}
                                    </Td>
                                    <Td right>{n(rec.pera)}</Td>
                                    <Td right>{n(rec.rice_allowance)}</Td>
                                    <Td right>{n(rec.uniform_allowance)}</Td>
                                    <Td right bold>
                                        {n(rec.gross_pay)}
                                    </Td>
                                    <Td
                                        right
                                        style={{ borderLeft: '2px solid #000' }}
                                    >
                                        {n(rec.gsis_premium)}
                                    </Td>
                                    <Td right>{n(rec.philhealth)}</Td>
                                    <Td right>{n(rec.pag_ibig)}</Td>
                                    <Td right>{n(rec.withholding_tax)}</Td>
                                    <Td
                                        center
                                        style={{ borderLeft: '2px solid #000' }}
                                    >
                                        {rec.absent_days || '—'}
                                    </Td>
                                    <Td right>{n(rec.absent_deduction)}</Td>
                                    <Td center>{rec.half_days || '—'}</Td>
                                    <Td right>{n(rec.half_day_deduction)}</Td>
                                    <Td center>{rec.late_minutes || '—'}</Td>
                                    <Td right>{n(rec.late_deduction)}</Td>
                                    <Td center>
                                        {rec.undertime_minutes || '—'}
                                    </Td>
                                    <Td right>{n(rec.undertime_deduction)}</Td>
                                    <Td center>
                                        {rec.personal_slip_minutes || '—'}
                                    </Td>
                                    <Td right>
                                        {n(rec.personal_slip_deduction)}
                                    </Td>
                                    <Td
                                        right
                                        style={{ borderLeft: '2px solid #000' }}
                                    >
                                        {n(rec.gsis_mpl)}
                                    </Td>
                                    <Td right>{n(rec.gsis_emergency)}</Td>
                                    <Td right>
                                        {n(rec.gsis_salary_loan ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.gsis_policy_loan ?? 0)}
                                    </Td>
                                    <Td right>{n(rec.pag_ibig_mpl)}</Td>
                                    <Td right>
                                        {n(rec.pag_ibig_housing ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.pag_ibig_calamity ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.internal_org_savings ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.internal_org_second ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.internal_org_loans ?? 0)}
                                    </Td>
                                    <Td right>
                                        {n(rec.other_deductions_total ?? 0)}
                                    </Td>
                                    <Td right>{n(rec.water_bill)}</Td>
                                    <Td
                                        right
                                        bold
                                        style={{ borderLeft: '2px solid #000' }}
                                    >
                                        {n(rec.total_deductions)}
                                    </Td>
                                    <Td right bold>
                                        {n(rec.net_pay)}
                                    </Td>
                                </tr>
                            ))}

                            {/* Totals row */}
                            <tr>
                                <TotTd
                                    colSpan={5}
                                    style={{
                                        textAlign: 'left',
                                        paddingLeft: 5,
                                        fontSize: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Total ({summary.total_employees} employees)
                                </TotTd>
                                <TotTd style={{ borderLeft: '2px solid #000' }}>
                                    {nf(summary.total_basic_pay)}
                                </TotTd>
                                <TotTd>{nf(summary.total_pera)}</TotTd>
                                <TotTd>
                                    {nf(summary.total_rice_allowance)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_uniform_allowance)}
                                </TotTd>
                                <TotTd bold>{nf(summary.total_gross)}</TotTd>
                                <TotTd style={{ borderLeft: '2px solid #000' }}>
                                    {nf(summary.total_gsis_premium)}
                                </TotTd>
                                <TotTd>{nf(summary.total_philhealth)}</TotTd>
                                <TotTd>{nf(summary.total_pag_ibig)}</TotTd>
                                <TotTd>
                                    {nf(summary.total_withholding_tax)}
                                </TotTd>
                                <TotTd style={{ borderLeft: '2px solid #000' }}>
                                    —
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_absent_deduction)}
                                </TotTd>
                                <TotTd>—</TotTd>
                                <TotTd>
                                    {nf(summary.total_half_day_deduction ?? 0)}
                                </TotTd>
                                <TotTd>—</TotTd>
                                <TotTd>
                                    {nf(summary.total_late_deduction)}
                                </TotTd>
                                <TotTd>—</TotTd>
                                <TotTd>
                                    {nf(summary.total_undertime_deduction ?? 0)}
                                </TotTd>
                                <TotTd>—</TotTd>
                                <TotTd>
                                    {nf(
                                        summary.total_personal_slip_deduction ??
                                            0,
                                    )}
                                </TotTd>
                                <TotTd style={{ borderLeft: '2px solid #000' }}>
                                    {nf(summary.total_gsis_mpl)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_gsis_emergency)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_gsis_salary_loan ?? 0)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_gsis_policy_loan ?? 0)}
                                </TotTd>
                                <TotTd>{nf(summary.total_pag_ibig_mpl)}</TotTd>
                                <TotTd>
                                    {nf(summary.total_pag_ibig_housing ?? 0)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_pag_ibig_calamity ?? 0)}
                                </TotTd>
                                <TotTd>
                                    {nf(
                                        summary.total_internal_org_savings ?? 0,
                                    )}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_internal_org_second ?? 0)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_internal_org_loans ?? 0)}
                                </TotTd>
                                <TotTd>
                                    {nf(summary.total_other_deductions ?? 0)}
                                </TotTd>
                                <TotTd>{nf(summary.total_water_bill)}</TotTd>
                                <TotTd style={{ borderLeft: '2px solid #000' }}>
                                    {nf(summary.total_deductions)}
                                </TotTd>
                                <TotTd bold>{nf(summary.total_net_pay)}</TotTd>
                            </tr>
                        </tbody>
                    </table>
                )}

                <div id="print-bottom-block">
                    <div
                        style={{
                            marginTop: 16,
                            paddingTop: 20,
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 32,
                        }}
                    >
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
                            <div
                                key={role}
                                style={{ flex: 1, textAlign: 'center' }}
                            >
                                <p
                                    style={{
                                        fontSize: 10,
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: 4,
                                        minHeight: 14,
                                    }}
                                >
                                    {name || ''}
                                </p>
                                <div
                                    style={{
                                        borderTop: '1.5px solid #000',
                                        width: '75%',
                                        margin: '0 auto 4px',
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 9,
                                        color: '#666',
                                        margin: 0,
                                    }}
                                >
                                    {role}: {sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    <footer
                        style={{
                            marginTop: 10,
                            borderTop: '1px solid #e5e5e5',
                            paddingTop: 6,
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 8,
                            color: '#888',
                        }}
                    >
                        <span>Period ID: #{period.payroll_period_id}</span>
                        <span>Metro Kidapawan Water District — Payroll System</span>
                        <span>Print Date: {format(new Date(), 'MMM d, yyyy')}</span>
                    </footer>
                </div>
            </div>

            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: white; font-family: Arial, sans-serif; }

                @media print {
                    @page {
                        size: legal landscape;
                        margin-top: 1cm;
                        margin-right: 1cm;
                        margin-bottom: 1cm;
                        margin-left: 1cm;
                    }

                    /* Hide the toolbar */
                    .print\\:hidden { display: none !important; }

                    body { background: white; }

                    #print-document {
                        padding: 0.8cm 1cm !important;
                    }

                    table {
                        width: 100% !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    tbody tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }

                    /* Keep signatories + footer on the same page as the last table row */
                    #print-bottom-block {
                        page-break-before: avoid !important;
                        break-before: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>
        </>
    );
}