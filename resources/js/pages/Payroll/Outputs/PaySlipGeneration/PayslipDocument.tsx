// resources/js/components/Payroll/Outputs/PaySlipGeneration/PayslipDocument.tsx
//

import Logo from '@/assets/images/logo.svg';
import type { PayslipData } from '@/components/Payroll/Outputs/PaySlipGeneration/data/schema';

export function peso(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));
}
  
export function Row({
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
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
                fontFamily: "'Times New Roman', Times, serif",
            }}
        >
            <span style={{ fontSize: 10 }}>{label}</span>
            <span style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                {negative ? '-' : ''}&#8369;{peso(value)}
            </span>
        </div>
    );
}

export function PayslipDocument({
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

    const totalAttendance =
        data.absent_deduction +
        data.half_day_deduction +
        data.late_deduction +
        data.undertime_deduction +
        data.personal_slip_deduction;

    const totalLoans =
        data.gsis_mpl +
        data.gsis_emergency +
        data.pag_ibig_mpl +
        data.internal_org_savings +
        data.internal_org_second +
        (data.internal_org_loans ?? 0) +
        data.other_deductions_total +
        data.water_bill;

    const totalDeductions = totalMandatory + totalAttendance + totalLoans;

    const serif: React.CSSProperties = {
        fontFamily: "'Times New Roman', Times, serif",
        color: '#000',
        backgroundColor: '#fff',
    };
    const sectionLabel: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderBottom: '1px solid #000',
        paddingBottom: 3,
        margin: '0 0 6px',
    };
    const subtotalRow: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #000',
        marginTop: 6,
        paddingTop: 4,
    };

    return (
        <div
            id={printId}
            style={{ ...serif, minWidth: 560 }}
            className="mx-auto w-full max-w-[720px] shadow-md print:shadow-none"
        >
            {/* ── Header ── */}
            <div
                style={{
                    borderBottom: '2px solid #000',
                    padding: '20px 32px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontFamily: "'Times New Roman', Times, serif",
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                margin: 0,
                            }}
                        >
                            Metro Kidapawan Water District
                        </p>
                        <p
                            style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                margin: '2px 0 0',
                                lineHeight: 1,
                            }}
                        >
                            PAYSLIP
                        </p>
                        <p style={{ fontSize: 10, margin: '4px 0 0' }}>
                            {data.period_label}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0 }}>
                        {data.employee_name}
                    </p>
                    <p style={{ fontSize: 10, margin: '2px 0 0' }}>
                        {data.position}
                    </p>
                    <p style={{ fontSize: 10, margin: '2px 0 0' }}>
                        SG {data.salary_grade} &middot; Step {data.step}
                    </p>
                </div>
            </div>

            {/* ── Body ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    borderBottom: '1px solid #000',
                    fontFamily: "'Times New Roman', Times, serif",
                }}
            >
                {/* LEFT — Earnings + Attendance */}
                <div
                    style={{
                        padding: '16px 28px',
                        borderRight: '1px solid #ccc',
                    }}
                >
                    <p style={sectionLabel}>Earnings</p>
                    <Row label="Basic Pay" value={data.basic_pay} />
                    <Row label="PERA" value={data.pera} />
                    <Row label="Rice Allowance" value={data.rice_allowance} />
                    <Row
                        label="Uniform Allowance"
                        value={data.uniform_allowance}
                    />
                    <div style={subtotalRow}>
                        <span style={{ fontSize: 10, fontWeight: 'bold' }}>
                            Gross Pay
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            &#8369;{peso(grossPay)}
                        </span>
                    </div>

                    <p style={{ ...sectionLabel, margin: '16px 0 6px' }}>
                        Attendance Deductions
                    </p>
                    {data.absent_days > 0 && (
                        <Row
                            label={`Absent (${data.absent_days} day${data.absent_days !== 1 ? 's' : ''})`}
                            value={data.absent_deduction}
                            negative
                        />
                    )}
                    {data.late_minutes > 0 && (
                        <Row
                            label={`Late (${data.late_minutes} min${data.late_minutes !== 1 ? 's' : ''})`}
                            value={data.late_deduction}
                            negative
                        />
                    )}
                    {data.half_days > 0 && (
                        <Row
                            label={`Half Day (${data.half_days} day${data.half_days !== 1 ? 's' : ''})`}
                            value={data.half_day_deduction}
                            negative
                        />
                    )}
                    {data.undertime_minutes > 0 && (
                        <Row
                            label={`Undertime (${data.undertime_minutes} min${data.undertime_minutes !== 1 ? 's' : ''})`}
                            value={data.undertime_deduction}
                            negative
                        />
                    )}
                    {data.personal_slip_minutes > 0 && (
                        <Row
                            label={`Personal Slip (${data.personal_slip_minutes} min${data.personal_slip_minutes !== 1 ? 's' : ''})`}
                            value={data.personal_slip_deduction}
                            negative
                        />
                    )}
                    {totalAttendance === 0 && (
                        <p
                            style={{
                                fontSize: 10,
                                fontStyle: 'italic',
                                margin: 0,
                            }}
                        >
                            No attendance deductions
                        </p>
                    )}
                    {totalAttendance > 0 && (
                        <div style={subtotalRow}>
                            <span style={{ fontSize: 10, fontWeight: 'bold' }}>
                                Subtotal
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                -&#8369;{peso(totalAttendance)}
                            </span>
                        </div>
                    )}
                </div>

                {/* RIGHT — Mandatory + Loans */}
                <div style={{ padding: '16px 28px' }}>
                    <p style={sectionLabel}>Mandatory Deductions</p>
                    <Row
                        label="GSIS Premium"
                        value={data.gsis_premium}
                        negative
                    />
                    <Row label="PhilHealth" value={data.philhealth} negative />
                    <Row label="Pag-IBIG" value={data.pag_ibig} negative />
                    <Row
                        label="Withholding Tax"
                        value={data.withholding_tax}
                        negative
                    />
                    <div style={subtotalRow}>
                        <span style={{ fontSize: 10, fontWeight: 'bold' }}>
                            Subtotal
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            -&#8369;{peso(totalMandatory)}
                        </span>
                    </div>

                    <p style={{ ...sectionLabel, margin: '16px 0 6px' }}>
                        Loans &amp; Other Deductions
                    </p>
                    {data.gsis_mpl > 0 && (
                        <Row label="GSIS MPL" value={data.gsis_mpl} negative />
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
                    {data.internal_org_savings > 0 && (
                        <Row
                            label="Org Savings & Share Capital"
                            value={data.internal_org_savings}
                            negative
                        />
                    )}
                    {data.internal_org_second > 0 && (
                        <Row
                            label="Org Dues"
                            value={data.internal_org_second}
                            negative
                        />
                    )}
                    {(data.internal_org_loans ?? 0) > 0 && (
                        <Row
                            label="Org Loan"
                            value={data.internal_org_loans}
                            negative
                        />
                    )}
                    {data.other_deductions_total > 0 && (
                        <Row
                            label="Org Loans / Other Deductions"
                            value={data.other_deductions_total}
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
                        <p
                            style={{
                                fontSize: 10,
                                fontStyle: 'italic',
                                margin: 0,
                            }}
                        >
                            No loan deductions
                        </p>
                    )}
                    {totalLoans > 0 && (
                        <div style={subtotalRow}>
                            <span style={{ fontSize: 10, fontWeight: 'bold' }}>
                                Subtotal
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                -&#8369;{peso(totalLoans)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Net Pay Summary ── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 32px',
                    borderBottom: '2px solid #000',
                    backgroundColor: '#f0f0f0',
                    fontFamily: "'Times New Roman', Times, serif",
                }}
            >
                <div>
                    <p
                        style={{
                            fontSize: 9,
                            fontWeight: 'bold',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                        }}
                    >
                        Total Deductions
                    </p>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            margin: '3px 0 0',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        -&#8369;{peso(totalDeductions)}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p
                        style={{
                            fontSize: 9,
                            fontWeight: 'bold',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                        }}
                    >
                        Net Pay
                    </p>
                    <p
                        style={{
                            fontSize: 24,
                            fontWeight: 'bold',
                            margin: '3px 0 0',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        &#8369;{peso(data.net_pay)}
                    </p>
                </div>
            </div>

            {/* ── Signatures + Footer ── */}
            <div
                style={{
                    padding: '16px 32px 20px',
                    fontFamily: "'Times New Roman', Times, serif",
                }}
            >
                {/* <div className="mb-3 flex items-center justify-center gap-1.5 rounded border border-dashed border-gray-400 px-3 py-1 text-[9px] text-gray-600 print:hidden">
                    Print on{' '}
                    <strong className="mx-0.5">
                        Short Bond Paper (8.5&Prime; &times; 11&Prime;)
                    </strong>{' '}
                    &mdash; Portrait orientation
                </div> */}
                <div style={{ display: 'flex', gap: 40, marginTop: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div
                            style={{
                                borderBottom: '1px solid #000',
                                height: 36,
                                marginBottom: 8,
                            }}
                        />
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                margin: 0,
                            }}
                        >
                            {data.hr_officer !== '—'
                                ? data.hr_officer
                                : '________________________________'}
                        </p>
                        <p style={{ fontSize: 9, margin: '2px 0 0' }}>
                            Prepared by: HR Officer
                        </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div
                            style={{
                                borderBottom: '1px solid #000',
                                height: 36,
                                marginBottom: 8,
                            }}
                        />
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                margin: 0,
                            }}
                        >
                            ________________________________
                        </p>
                        <p style={{ fontSize: 9, margin: '2px 0 0' }}>
                            Received by: Employee
                        </p>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #ccc',
                        marginTop: 14,
                        paddingTop: 6,
                        fontSize: 8,
                    }}
                >
                    <span>Posted: {data.posted_date}</span>
                    <span>Metro Kidapawan Water District — Payroll System</span>
                    <span>{data.employment_classification} Employee</span>
                </div>
            </div>
        </div>
    );
}
