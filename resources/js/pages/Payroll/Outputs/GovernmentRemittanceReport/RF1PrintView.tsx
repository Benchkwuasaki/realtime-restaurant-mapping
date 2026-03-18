// resources/js/components/Payroll/pages/GovernmentRemittance/RF1PrintView.tsx

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RF1Employee {
    id: number;
    philhealth_number?: string; // 12-digit PIN
    last_name: string;
    first_name: string;
    middle_name?: string;
    name_ext?: string; // SR./JR.
    date_of_birth?: string; // mm-dd-yyyy
    sex?: string; // M or F
    monthly_salary_bracket: number;
    employee_share: number; // PS
    employer_share: number; // ES
    employee_status?: string; // blank=active, S=Separated, NE=No Earnings, NH=Newly Hired
    effectivity_date?: string; // for NH status
}

export interface RF1EmployerInfo {
    philhealth_number?: string; // 12 digits
    employer_tin?: string; // 9 digits
    employer_name: string;
    mailing_address: string;
    telephone?: string;
    email?: string;
    employer_type?: 'private' | 'government' | 'household';
}

interface RF1PrintViewProps {
    employees: RF1Employee[];
    employerInfo: RF1EmployerInfo;
    applicablePeriod: string; // e.g. "March 2026"
    reportType?: 'regular' | 'addition' | 'deduction';
    preparedBy?: string;
    preparedDate?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function nf(val: number): string {
    if (!val) return '';
    return val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Individual bordered digit boxes for PhilHealth No. / TIN */
function DigitBoxes({ value = '', count }: { value?: string; count: number }) {
    const raw = (value ?? '').replace(/\D/g, '');
    const digits = raw.padEnd(count, ' ').slice(0, count).split('');

    return (
        <div style={{ display: 'inline-flex', gap: '1px', marginLeft: '4px' }}>
            {digits.map((d, i) => (
                <span
                    key={i}
                    style={{
                        display: 'inline-block',
                        width: '13px',
                        height: '15px',
                        border: '1px solid #444',
                        textAlign: 'center',
                        fontSize: '8px',
                        lineHeight: '15px',
                        fontFamily: 'monospace',
                        backgroundColor: '#fff',
                    }}
                >
                    {d.trim()}
                </span>
            ))}
        </div>
    );
}

/** Checkbox with label */
function Checkbox({ checked, label }: { checked: boolean; label: string }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '3px',
            }}
        >
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '11px',
                    height: '11px',
                    border: '1.5px solid #444',
                    fontSize: '9px',
                    lineHeight: 1,
                    flexShrink: 0,
                }}
            >
                {checked ? '✓' : ''}
            </span>
            <span
                style={{
                    fontSize: '7.5px',
                    fontWeight: checked ? 'bold' : 'normal',
                }}
            >
                {label}
            </span>
        </div>
    );
}

/** Numbered section badge */
function SectionBadge({ num }: { num: number }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '13px',
                height: '13px',
                border: '1px solid #444',
                fontSize: '7.5px',
                fontWeight: 'bold',
                lineHeight: 1,
                flexShrink: 0,
            }}
        >
            {num}
        </span>
    );
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const BORDER = '0.75px solid #555';

const headerCellBase: React.CSSProperties = {
    border: BORDER,
    padding: '2px 3px',
    textAlign: 'center',
    fontSize: '6.5px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: '#f0f0f0',
    verticalAlign: 'middle',
    lineHeight: 1.3,
};

const dataCellBase: React.CSSProperties = {
    border: BORDER,
    padding: '1px 3px',
    fontSize: '7.5px',
    verticalAlign: 'middle',
    backgroundColor: '#fff',
    lineHeight: 1.3,
};

// ── Single RF-1 Page ──────────────────────────────────────────────────────────

interface RF1PageProps {
    employees: RF1Employee[];
    employerInfo: RF1EmployerInfo;
    applicablePeriod: string;
    reportType: 'regular' | 'addition' | 'deduction';
    preparedBy: string;
    isLastPage: boolean;
    pageSubtotalPS: number;
    pageSubtotalES: number;
    grandTotalPS: number;
    grandTotalES: number;
    isFirstPage: boolean;
}

function RF1Page({
    employees,
    employerInfo,
    applicablePeriod,
    reportType,
    preparedBy,
    isLastPage,
    pageSubtotalPS,
    pageSubtotalES,
    grandTotalPS,
    grandTotalES,
    isFirstPage,
}: RF1PageProps) {
    // Pad rows to exactly 10
    const rows: (RF1Employee | null)[] = [...employees];
    const nothingFollowsIdx = rows.length; // index after last real employee
    while (rows.length < ROWS_PER_PAGE) rows.push(null);

    const outerBox: React.CSSProperties = {
        border: '1px solid #333',
    };

    const sectionRow: React.CSSProperties = {
        borderTop: 'none',
        padding: '4px 6px',
    };

    const labelSm: React.CSSProperties = {
        fontSize: '7.5px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    };

    const underlineField = (
        value?: string,
        minWidth = '160px',
    ): React.CSSProperties => ({
        display: 'inline-block',
        borderBottom: '1px solid #444',
        minWidth,
        fontSize: '8px',
        paddingLeft: '4px',
        paddingBottom: '1px',
        verticalAlign: 'bottom',
    });

    return (
        <div
            style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '8px',
                color: '#000',
                backgroundColor: '#fff',
                width: '100%',
            }}
        >
            {/* ── Document header ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', ...outerBox, marginBottom: '-1px' }}>
                {/* Branding block */}
                <div
                    style={{
                        flex: '0 0 auto',
                        width: '220px',
                        borderRight: '1px solid #333',
                        padding: '5px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            border: '2px solid #00703c',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '7px',
                                fontWeight: 'bold',
                                color: '#00703c',
                                textAlign: 'center',
                                lineHeight: 1.1,
                            }}
                        >
                            Phil
                            <br />
                            Health
                        </span>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: '28px',
                                fontWeight: 'bold',
                                fontStyle: 'italic',
                                color: '#1a1a1a',
                                lineHeight: 1,
                            }}
                        >
                            RF-1
                        </div>
                        <div
                            style={{
                                fontSize: '6px',
                                color: '#555',
                                marginTop: '2px',
                            }}
                        >
                            Revised February 2014
                        </div>
                    </div>
                </div>

                {/* Center: title */}
                <div
                    style={{
                        flex: 2,
                        borderRight: '1px solid #333',
                        padding: '5px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: '7px',
                            color: '#555',
                            marginBottom: '1px',
                        }}
                    >
                        Republic of the Philippines
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
                        PHILIPPINE HEALTH INSURANCE CORPORATION
                    </div>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            margin: '2px 0',
                        }}
                    >
                        Employer's Remittance Report
                    </div>
                    <div style={{ fontSize: '6.5px', color: '#555' }}>
                        Healthline 441-7444 &nbsp;·&nbsp; www.philhealth.gov.ph
                        &nbsp;·&nbsp; actioncenter@philhealth.gov.ph
                    </div>
                </div>

                {/* Right: FOR PHILHEALTH USE */}
                <div
                    style={{
                        flex: '0 0 auto',
                        width: '180px',
                        padding: '5px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            borderBottom: '1px solid #999',
                            paddingBottom: '3px',
                            marginBottom: '4px',
                        }}
                    >
                        FOR PHILHEALTH USE
                    </div>
                    <div
                        style={{
                            fontSize: '6.5px',
                            color: '#555',
                            marginBottom: '2px',
                        }}
                    >
                        Date Received:{' '}
                        <span
                            style={{
                                borderBottom: '1px solid #aaa',
                                display: 'inline-block',
                                minWidth: '70px',
                            }}
                        >
                            &nbsp;
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: '6.5px',
                            color: '#555',
                            marginBottom: '2px',
                        }}
                    >
                        Action Taken:{' '}
                        <span
                            style={{
                                borderBottom: '1px solid #aaa',
                                display: 'inline-block',
                                minWidth: '70px',
                            }}
                        >
                            &nbsp;
                        </span>
                    </div>
                    <div style={{ fontSize: '6.5px', color: '#555' }}>
                        By:{' '}
                        <span
                            style={{
                                borderBottom: '1px solid #aaa',
                                display: 'inline-block',
                                minWidth: '100px',
                            }}
                        >
                            &nbsp;
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: '6px',
                            color: '#888',
                            textAlign: 'right',
                            marginTop: '1px',
                        }}
                    >
                        Signature Over Printed Name
                    </div>
                </div>
            </div>

            {/* ── Section 1: PhilHealth No. + TIN ─────────────────────────── */}
            <div
                style={{
                    ...outerBox,
                    ...sectionRow,
                    borderTop: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <SectionBadge num={1} />
                    <span style={labelSm}>PhilHealth No.</span>
                    <DigitBoxes
                        value={employerInfo.philhealth_number}
                        count={12}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <span style={labelSm}>Employer TIN</span>
                    <DigitBoxes value={employerInfo.employer_tin} count={9} />
                </div>
            </div>

            {/* ── Section 2: Employer Details ──────────────────────────────── */}
            <div style={{ ...outerBox, borderTop: 'none', padding: '4px 6px' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'flex-start',
                    }}
                >
                    <SectionBadge num={2} />
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                gap: '6px',
                                marginBottom: '3px',
                                alignItems: 'baseline',
                            }}
                        >
                            <span style={labelSm}>Complete Employer Name:</span>
                            <span
                                style={underlineField(
                                    employerInfo.employer_name,
                                    '260px',
                                )}
                            >
                                {employerInfo.employer_name}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '6px',
                                marginBottom: '3px',
                                alignItems: 'baseline',
                            }}
                        >
                            <span style={labelSm}>
                                Complete Mailing Address:
                            </span>
                            <span
                                style={underlineField(
                                    employerInfo.mailing_address,
                                    '260px',
                                )}
                            >
                                {employerInfo.mailing_address}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '24px',
                                alignItems: 'baseline',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'baseline',
                                }}
                            >
                                <span style={labelSm}>Telephone No.:</span>
                                <span
                                    style={underlineField(
                                        employerInfo.telephone,
                                        '100px',
                                    )}
                                >
                                    {employerInfo.telephone}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'baseline',
                                }}
                            >
                                <span style={labelSm}>Email Address:</span>
                                <span
                                    style={underlineField(
                                        employerInfo.email,
                                        '150px',
                                    )}
                                >
                                    {employerInfo.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sections 3 / 4 / 5 ───────────────────────────────────────── */}
            <div style={{ ...outerBox, borderTop: 'none', display: 'flex' }}>
                {/* Section 3: Employer Type */}
                <div
                    style={{
                        flex: 1,
                        borderRight: '1px solid #333',
                        padding: '4px 8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '4px',
                        }}
                    >
                        <SectionBadge num={3} />
                        <span style={labelSm}>Employer Type</span>
                    </div>
                    <Checkbox
                        checked={employerInfo.employer_type === 'private'}
                        label="PRIVATE"
                    />
                    <Checkbox
                        checked={
                            employerInfo.employer_type === 'government' ||
                            !employerInfo.employer_type
                        }
                        label="GOVERNMENT"
                    />
                    <Checkbox
                        checked={employerInfo.employer_type === 'household'}
                        label="HOUSEHOLD"
                    />
                </div>

                {/* Section 4: Report Type */}
                <div
                    style={{
                        flex: 2,
                        borderRight: '1px solid #333',
                        padding: '4px 8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '4px',
                        }}
                    >
                        <SectionBadge num={4} />
                        <span style={labelSm}>Report Type</span>
                    </div>
                    <Checkbox
                        checked={reportType === 'regular'}
                        label="REGULAR RF-1"
                    />
                    <Checkbox
                        checked={reportType === 'addition'}
                        label="ADDITION TO PREVIOUS RF-1"
                    />
                    <Checkbox
                        checked={reportType === 'deduction'}
                        label="DEDUCTION TO PREVIOUS RF-1"
                    />
                </div>

                {/* Section 5: Applicable Period */}
                <div style={{ flex: 1, padding: '4px 8px' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '4px',
                        }}
                    >
                        <SectionBadge num={5} />
                        <span style={labelSm}>Applicable Period</span>
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            borderBottom: '1.5px solid #333',
                            paddingBottom: '3px',
                            letterSpacing: '0.3px',
                        }}
                    >
                        {applicablePeriod}
                    </div>
                </div>
            </div>

            {/* ── Employee Table ────────────────────────────────────────────── */}
            <div style={{ ...outerBox, borderTop: 'none' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                    }}
                >
                    <colgroup>
                        <col style={{ width: '2.5%' }} /> {/* # */}
                        <col style={{ width: '9%' }} /> {/* PIN */}
                        <col style={{ width: '10%' }} /> {/* Last Name */}
                        <col style={{ width: '9%' }} /> {/* First Name */}
                        <col style={{ width: '4%' }} /> {/* Name Ext */}
                        <col style={{ width: '8%' }} /> {/* Middle Name */}
                        <col style={{ width: '6.5%' }} /> {/* DOB */}
                        <col style={{ width: '3%' }} /> {/* Sex */}
                        <col style={{ width: '8%' }} /> {/* MSB */}
                        <col style={{ width: '7.5%' }} /> {/* PS */}
                        <col style={{ width: '7.5%' }} /> {/* ES */}
                        <col style={{ width: '13%' }} /> {/* Status */}
                    </colgroup>
                    <thead>
                        {/* Header Row 1 — main group labels */}
                        <tr>
                            <th rowSpan={3} style={headerCellBase}>
                                #
                            </th>

                            {/* [6] PIN */}
                            <th rowSpan={3} style={{ ...headerCellBase }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                    }}
                                >
                                    <SectionBadge num={6} />
                                    <span>PhilHealth</span>
                                    <span>Identification</span>
                                    <span>Number (PIN)</span>
                                </div>
                            </th>

                            {/* [7] Employees Information */}
                            <th
                                colSpan={6}
                                style={{ ...headerCellBase, fontSize: '7px' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <SectionBadge num={7} />
                                    <span>Employees Information</span>
                                    <span
                                        style={{
                                            fontSize: '6px',
                                            fontWeight: 'normal',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        &nbsp;
                                        <SectionBadge num={8} />
                                        &nbsp;Fill out this portion only if
                                        declared employee/s has not yet been
                                        issued his/her PIN
                                    </span>
                                </div>
                            </th>

                            {/* [9] NHIP Premium Contribution — spans MSB + PS + ES */}
                            <th
                                colSpan={3}
                                style={{ ...headerCellBase, fontSize: '7px' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <SectionBadge num={9} />
                                    <span>NHIP Premium Contribution</span>
                                </div>
                            </th>

                            {/* [11] Employee Status */}
                            <th
                                rowSpan={3}
                                style={{ ...headerCellBase, fontSize: '6px' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                    }}
                                >
                                    <SectionBadge num={11} />
                                    <span>Employee Status</span>
                                </div>
                            </th>
                        </tr>

                        {/* Header Row 2 — column names */}
                        <tr>
                            <th
                                rowSpan={2}
                                style={{
                                    ...headerCellBase,
                                    textAlign: 'left',
                                    paddingLeft: '4px',
                                }}
                            >
                                Last Name
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    ...headerCellBase,
                                    textAlign: 'left',
                                    paddingLeft: '4px',
                                }}
                            >
                                First Name
                            </th>
                            <th rowSpan={2} style={{ ...headerCellBase }}>
                                Name Ext.
                                <br />
                                <span
                                    style={{
                                        fontSize: '6px',
                                        fontWeight: 'normal',
                                        textTransform: 'none',
                                    }}
                                >
                                    (SR./JR.)
                                </span>
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    ...headerCellBase,
                                    textAlign: 'left',
                                    paddingLeft: '4px',
                                }}
                            >
                                Middle Name
                            </th>
                            <th rowSpan={2} style={{ ...headerCellBase }}>
                                Date of Birth
                                <br />
                                <span
                                    style={{
                                        fontSize: '6px',
                                        fontWeight: 'normal',
                                        textTransform: 'none',
                                    }}
                                >
                                    (mm-dd-yyyy)
                                </span>
                            </th>
                            <th rowSpan={2} style={{ ...headerCellBase }}>
                                Sex
                                <br />
                                <span
                                    style={{
                                        fontSize: '6px',
                                        fontWeight: 'normal',
                                        textTransform: 'none',
                                    }}
                                >
                                    (M/F)
                                </span>
                            </th>
                            <th rowSpan={2} style={{ ...headerCellBase }}>
                                Monthly Salary Bracket
                            </th>

                            {/* [10] spans PS + ES */}
                            <th
                                colSpan={2}
                                style={{ ...headerCellBase, fontSize: '6px' }}
                            >
                                <SectionBadge num={10} />
                            </th>
                        </tr>

                        {/* Header Row 3 — PS / ES */}
                        <tr>
                            <th style={{ ...headerCellBase, fontSize: '8px' }}>
                                PS
                            </th>
                            <th style={{ ...headerCellBase, fontSize: '8px' }}>
                                ES
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((emp, idx) => {
                            const isNothingFollows =
                                isLastPage && idx === nothingFollowsIdx && !emp;
                            return (
                                <tr key={idx} style={{ height: '17px' }}>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'center',
                                            color: '#666',
                                            fontSize: '7px',
                                        }}
                                    >
                                        {idx + 1}.
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            fontFamily: 'monospace',
                                            fontSize: '7px',
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {emp?.philhealth_number ?? ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textTransform: 'uppercase',
                                            fontWeight: emp ? '600' : 'normal',
                                        }}
                                    >
                                        {isNothingFollows ? (
                                            <span
                                                style={{
                                                    fontSize: '6.5px',
                                                    fontStyle: 'italic',
                                                    color: '#666',
                                                }}
                                            >
                                                — NOTHING FOLLOWS —
                                            </span>
                                        ) : (
                                            (emp?.last_name ?? '')
                                        )}
                                    </td>
                                    <td style={dataCellBase}>
                                        {emp?.first_name ?? ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {emp?.name_ext ?? ''}
                                    </td>
                                    <td style={dataCellBase}>
                                        {emp?.middle_name ?? ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'center',
                                            fontSize: '7px',
                                        }}
                                    >
                                        {emp?.date_of_birth ?? ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {emp?.sex ?? ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {emp
                                            ? nf(emp.monthly_salary_bracket)
                                            : ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {emp ? nf(emp.employee_share) : ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {emp ? nf(emp.employer_share) : ''}
                                    </td>
                                    <td
                                        style={{
                                            ...dataCellBase,
                                            textAlign: 'center',
                                            fontSize: '7px',
                                        }}
                                    >
                                        {emp?.employee_status
                                            ? `${emp.employee_status}${emp.effectivity_date ? ` / ${emp.effectivity_date}` : ''}`
                                            : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Sections 12 / 13 / 14 / 15 ──────────────────────────────── */}
            <div
                style={{
                    ...outerBox,
                    borderTop: 'none',
                    display: 'flex',
                    minHeight: '80px',
                }}
            >
                {/* Section 12: Employee count per page */}
                <div
                    style={{
                        flex: '0 0 auto',
                        width: '90px',
                        borderRight: '1px solid #333',
                        padding: '4px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '3px',
                            marginBottom: '3px',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <SectionBadge num={12} />
                    </div>
                    <div
                        style={{
                            fontSize: '6.5px',
                            textAlign: 'center',
                            color: '#555',
                            fontStyle: 'italic',
                            lineHeight: 1.3,
                        }}
                    >
                        Indicate Total Number of employees per page
                    </div>
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            borderBottom: '1.5px solid #333',
                            width: '100%',
                            textAlign: 'center',
                            marginTop: '6px',
                            paddingBottom: '2px',
                        }}
                    >
                        {employees.length}
                    </div>
                </div>

                {/* Section 13: Acknowledgement Receipt */}
                <div
                    style={{
                        flex: 2,
                        borderRight: '1px solid #333',
                        padding: '4px 6px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '5px',
                            alignItems: 'center',
                        }}
                    >
                        <SectionBadge num={13} />
                        <span
                            style={{
                                fontSize: '7px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            Acknowledgement Receipt (PAR/POR/Transaction
                            Reference No.)
                        </span>
                    </div>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '6.5px',
                        }}
                    >
                        <thead>
                            <tr>
                                {[
                                    'Applicable Period',
                                    'Remitted Amount',
                                    'Acknowledgement Receipt',
                                    'Transaction Date',
                                    'No. of Employees',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            border: '0.5px solid #888',
                                            padding: '2px 4px',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f0f0f0',
                                            textTransform: 'uppercase',
                                            fontSize: '6px',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ height: '22px' }}>
                                <td
                                    style={{
                                        border: '0.5px solid #888',
                                        padding: '2px 4px',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                    }}
                                >
                                    {applicablePeriod}
                                </td>
                                <td style={{ border: '0.5px solid #888' }}></td>
                                <td style={{ border: '0.5px solid #888' }}></td>
                                <td style={{ border: '0.5px solid #888' }}></td>
                                <td
                                    style={{
                                        border: '0.5px solid #888',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                    }}
                                >
                                    {employees.length}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 14: Subtotal + Grand Total */}
                <div
                    style={{
                        flex: '0 0 auto',
                        width: '160px',
                        borderRight: '1px solid #333',
                        padding: '4px 6px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '3px',
                            marginBottom: '5px',
                            alignItems: 'center',
                        }}
                    >
                        <SectionBadge num={14} />
                    </div>

                    {/* Subtotal — every page */}
                    <div style={{ marginBottom: '6px' }}>
                        <div
                            style={{
                                fontSize: '6.5px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            Subtotal (PS + ES)
                        </div>
                        <div
                            style={{
                                fontSize: '6px',
                                color: '#666',
                                fontStyle: 'italic',
                                marginBottom: '2px',
                            }}
                        >
                            (To be accomplished on every page)
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #333',
                                paddingBottom: '1px',
                                fontSize: '7.5px',
                                fontWeight: 'bold',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            <span style={{ fontSize: '6.5px', color: '#555' }}>
                                PS: {nf(pageSubtotalPS)}
                            </span>
                            <span>
                                Total: {nf(pageSubtotalPS + pageSubtotalES)}
                            </span>
                        </div>
                    </div>

                    {/* Grand Total — every page per RF-1 instructions */}
                    <div>
                        <div
                            style={{
                                fontSize: '6.5px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            Grand Total (PS + ES)
                        </div>
                        <div
                            style={{
                                fontSize: '6px',
                                color: '#666',
                                fontStyle: 'italic',
                                marginBottom: '2px',
                            }}
                        >
                            (To be accomplished on every page)
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: '1.5px solid #333',
                                paddingBottom: '1px',
                                fontSize: '7.5px',
                                fontWeight: 'bold',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            <span style={{ fontSize: '6.5px', color: '#555' }}>
                                PS: {nf(grandTotalPS)}
                            </span>
                            <span>
                                Total: {nf(grandTotalPS + grandTotalES)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 15: Prepared By */}
                <div
                    style={{
                        flex: '0 0 auto',
                        width: '150px',
                        padding: '4px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '4px',
                            alignItems: 'center',
                        }}
                    >
                        <SectionBadge num={15} />
                        <span
                            style={{
                                fontSize: '7.5px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            Prepared By:
                        </span>
                    </div>

                    {/* Signature line */}
                    <div style={{ flex: 1 }} />
                    <div
                        style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            minHeight: '14px',
                        }}
                    >
                        {preparedBy}
                    </div>
                    <div
                        style={{
                            borderBottom: '1px solid #333',
                            marginBottom: '2px',
                        }}
                    />
                    <div
                        style={{
                            fontSize: '6.5px',
                            textAlign: 'center',
                            color: '#555',
                            marginBottom: '8px',
                        }}
                    >
                        Signature Over Printed Name
                    </div>

                    {/* Designation line */}
                    <div
                        style={{
                            borderBottom: '1px solid #333',
                            marginBottom: '2px',
                        }}
                    />
                    <div
                        style={{
                            fontSize: '6.5px',
                            textAlign: 'center',
                            color: '#555',
                            marginBottom: '8px',
                        }}
                    >
                        Official Designation
                    </div>

                    {/* Date line */}
                    <div
                        style={{
                            borderBottom: '1px solid #333',
                            marginBottom: '2px',
                        }}
                    />
                    <div
                        style={{
                            fontSize: '6.5px',
                            textAlign: 'center',
                            color: '#555',
                        }}
                    >
                        Date
                    </div>
                </div>
            </div>

            {/* ── Section 16: Certification ────────────────────────────────── */}
            <div style={{ ...outerBox, borderTop: 'none', padding: '4px 6px' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '6px',
                        alignItems: 'flex-start',
                    }}
                >
                    <SectionBadge num={16} />
                    <span
                        style={{
                            fontSize: '7px',
                            fontStyle: 'italic',
                            textTransform: 'uppercase',
                            lineHeight: 1.4,
                        }}
                    >
                        Under the penalty of the law, I hereby attest that the
                        above information provided herein are true and correct.
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '16px',
                        gap: '20px',
                    }}
                >
                    {[
                        { label: 'Signature over printed name', width: '35%' },
                        { label: 'Official Designation', width: '35%' },
                        { label: 'Date', width: '20%' },
                    ].map(({ label, width }) => (
                        <div key={label} style={{ width, textAlign: 'center' }}>
                            <div
                                style={{
                                    borderBottom: '1px solid #333',
                                    height: '22px',
                                }}
                            />
                            <div
                                style={{
                                    fontSize: '6.5px',
                                    color: '#555',
                                    marginTop: '2px',
                                }}
                            >
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer note ──────────────────────────────────────────────── */}
            <div
                style={{
                    fontSize: '6.5px',
                    color: '#777',
                    textAlign: 'center',
                    marginTop: '3px',
                    fontStyle: 'italic',
                }}
            >
                PLEASE READ INSTRUCTIONS (FOR EACH NUMBERED BOX) AT THE BACK
                BEFORE ACCOMPLISHING THIS FORM &nbsp;·&nbsp; Revised February
                2014
            </div>
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function RF1PrintView({
    employees,
    employerInfo,
    applicablePeriod,
    reportType = 'regular',
    preparedBy = '',
}: RF1PrintViewProps) {
    // Split into pages of 10
    const pages: RF1Employee[][] = [];
    for (let i = 0; i < Math.max(employees.length, 1); i += ROWS_PER_PAGE) {
        pages.push(employees.slice(i, i + ROWS_PER_PAGE));
    }

    const grandTotalPS = employees.reduce(
        (s, e) => s + (e.employee_share || 0),
        0,
    );
    const grandTotalES = employees.reduce(
        (s, e) => s + (e.employer_share || 0),
        0,
    );

    return (
        <div id="rf1-form-container">
            {pages.map((pageEmps, i) => {
                const pagePS = pageEmps.reduce(
                    (s, e) => s + (e.employee_share || 0),
                    0,
                );
                const pageES = pageEmps.reduce(
                    (s, e) => s + (e.employer_share || 0),
                    0,
                );

                return (
                    <div
                        key={i}
                        style={{
                            pageBreakAfter:
                                i < pages.length - 1 ? 'always' : 'avoid',
                            breakAfter: i < pages.length - 1 ? 'page' : 'avoid',
                            marginBottom: i < pages.length - 1 ? '40px' : 0,
                        }}
                    >
                        <RF1Page
                            employees={pageEmps}
                            employerInfo={employerInfo}
                            applicablePeriod={applicablePeriod}
                            reportType={reportType}
                            preparedBy={preparedBy}
                            isLastPage={i === pages.length - 1}
                            isFirstPage={i === 0}
                            pageSubtotalPS={pagePS}
                            pageSubtotalES={pageES}
                            grandTotalPS={grandTotalPS}
                            grandTotalES={grandTotalES}
                        />
                    </div>
                );
            })}
        </div>
    );
}
