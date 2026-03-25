import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Employee {
    employee_id: number;
    employee_name: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    department_name?: string;
    position_name?: string;
}

interface LeaveApp {
    leave_application_id: number;
    employee_id: number;
    leave_type_availed?: string | null;
    office_department?: string | null;
    position?: string | null;
    salary?: string | null;
    date_of_filing?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_requested?: boolean;
    approved_with_pay?: string | number | null;
    approved_without_pay?: string | number | null;
    approved_others?: string | null;
    status: string;
    for_disapproval_reason?: string | null;
    disapproved_reason?: string | null;
    recommendation_officer?: number | null;
    approval_officer?: number | null;
    detail?: {
        leave_location_type?: 'ph' | 'abroad' | null;
        leave_location?: string | null;
        sick_type?: 'hospital' | 'outpatient' | null;
        sick_details?: string | null;
        women_illness?: string | null;
        study_purpose?: string | null;
        other_purpose?: string | null;
        monetization_vl_days?: number | null;
        monetization_sl_days?: number | null;
    } | null;
}

interface Props {
    app: LeaveApp;
    employees: Employee[];
    vl_earned: number;
    sl_earned: number;
    vl_balance: number;
    sl_balance: number;
}

// Display as "Mar 19, 2026" instead of "03/19/2026"
function toDisplay(iso?: string | null): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeWorkingDays(start?: string | null, end?: string | null): number {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    if (e < s) return 0;
    let n = 0;
    const cur = new Date(s);
    while (cur <= e) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) n++;
        cur.setDate(cur.getDate() + 1);
    }
    return n;
}

function getFullName(e: Employee): string {
    return e.last_name
        ? `${e.first_name ?? ''} ${e.middle_name ?? ''} ${e.last_name}`.trim()
        : e.employee_name;
}

function splitByChars(text: string, charsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (test.length <= charsPerLine) {
            current = test;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export default function LeaveApplicationPrint({
    app, employees, vl_earned, sl_earned, vl_balance, sl_balance,
}: Props) {

    useEffect(() => {
        const timer = setTimeout(() => window.print(), 800);
        return () => clearTimeout(timer);
    }, []);

    const detail = app.detail;
    const leaveName = app.leave_type_availed ?? '';
    const otherPurpose = detail?.other_purpose ?? '';
    const isOtherPurposeLeave = /monetization of leave credits|terminal leave/i.test(leaveName) || /monetization of leave credits|terminal leave/i.test(otherPurpose);
    const isMonetization = otherPurpose === 'Monetization of Leave Credits' || leaveName === 'Monetization of Leave Credits';
    const isTerminalLeave = otherPurpose === 'Terminal Leave' || leaveName === 'Terminal Leave';
    const isVL = /vacation|mandatory|forced|special privilege/i.test(leaveName);
    const isSL = /^sick leave$/i.test(leaveName.trim());

    const emp = employees.find(e => String(e.employee_id) === String(app.employee_id));
    const recOfficer = employees.find(e => String(e.employee_id) === String(app.recommendation_officer));
    const appOfficer = employees.find(e => String(e.employee_id) === String(app.approval_officer));

    const approvedWithPay = String(app.approved_with_pay ?? '');
    const approvedWithoutPay = String(app.approved_without_pay ?? '');
    const approvedOthers = String(app.approved_others ?? '');

    const lessVL = isMonetization ? (detail?.monetization_vl_days ?? 0) : isVL ? (approvedWithPay || 0) : 0;
    const lessSL = isMonetization ? (detail?.monetization_sl_days ?? 0) : isSL ? (approvedWithPay || 0) : 0;
    const balVL = (vl_earned - Number(lessVL)).toFixed(2);
    const balSL = (sl_earned - Number(lessSL)).toFixed(2);

    const workDays = computeWorkingDays(app.start_date, app.end_date);




    return (
        <>


            <Head title="Leave Application — Print" />
            <style>{`
                * { box-sizing: border-box; }
                @page { 
                    size: A4 portrait; 
                    margin: 2.54cm 1.88cm 2.54cm 2.73cm;
                }
                @page :first {
                    margin: 2.54cm 1.88cm 2.54cm 2.73cm;
                }
                html, body { margin: 0; padding: 0; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
                    .no-print { display: none !important; }
                    nav, header, aside, footer { display: none !important; }
                }
                @media screen {
                    html, body, #app, main, [data-page] { 
                        background: #e5e5e5 !important; 
                        padding: 0 !important;
                    }
                    .print-root {
                        width: 210mm;
                        min-height: 297mm;
                        margin: 10mm auto;
                        padding: 2.54cm 1.88cm 2.54cm 2.73cm;
                        background: #fff;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    }
                    .page-break {
                        display: block;
                        width: 210mm;
                        margin: 0 auto;
                        padding-top: 2.54cm;
                        padding-bottom: 2.54cm;
                        background: #fff;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        margin-top: 10mm;
                    }
                }

               .lined-text {
                    width: 100%;
                    font-size: 7px;
                    font-family: Arial, sans-serif;
                    line-height: 16px;
                    background-attachment: local;
                    background-image: repeating-linear-gradient(
                        to bottom,
                        transparent,
                        transparent 15px,
                        rgba(0,0,0,0.5) 15px,
                        rgba(0,0,0,0.5) 15.5px
                    );
                    background-size: 100% 16px;
                    word-break: break-word;
                    min-height: 32px;
                }

                .lined-text-outpatient {
                    width: 100%;
                    font-size: 7px;
                    font-family: Arial, sans-serif;
                    line-height: 16px;
                    background-attachment: local;
                    background-image: 
                        linear-gradient(transparent 15px, rgba(0,0,0,0.5) 15px, rgba(0,0,0,0.5) 15.5px, transparent 15.5px),
                        repeating-linear-gradient(
                            to bottom,
                            transparent,
                            transparent 15px,
                            rgba(0,0,0,0.5) 15px,
                            rgba(0,0,0,0.5) 15.5px
                        );
                    background-position: 155px 0px, 0px 16px;
                    background-size: calc(100% - 155px) 16px, 100% 16px;
                    background-repeat: no-repeat, repeat-y;
                    word-break: break-word;
                    min-height: 32px;
                }
            `}</style>

            {/* Print / Close buttons — hidden on actual print */}
            <div className="no-print" style={{ padding: '16px 16px', display: 'flex', gap: 8, width: '100%', justifyContent: 'center', marginTop: 20 }}>

                <Button type="button" variant="outline" size="sm" onClick={() => window.close()}>
                    Cancel
                </Button>
                <Button type="button" variant="default" size="sm" onClick={() => window.print()}>
                    <Printer /> Print
                </Button>
            </div>

            <div className="print-root" style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: '#000', letterSpacing: '-0.3px' }}>

                {/* PAGE 1 */}

                {/* Top meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 8, fontStyle: 'italic', fontWeight: 'bold' }}>
                        <div>Civil Service Form No. 6</div>
                        <div>Revised 2020</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 'bold' }}>ANNEX A</div>
                </div>

                {/* Agency header */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>

                    {/* logo */}
                    <img src="/logo.svg" alt="Logo" style={{ width: '1.58cm', height: '1.58cm', objectFit: 'contain', marginLeft: 100 }} />

                    {/* Centered absolutely so it aligns with APPLICATION FOR LEAVE */}
                    <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: '-0.3px' }}>Republic of the Philippines</div>
                        <div style={{ fontSize: 9, fontStyle: 'italic', fontWeight: 'bold', maxWidth: 250, margin: '0 auto', textAlign: 'center', lineHeight: 1.4, letterSpacing: '-0.3px' }}>
                            Philippine Council for Industry, Energy and Emerging Technology Research and Development
                        </div>
                        <div style={{ fontSize: 9, fontStyle: 'italic', maxWidth: 250, margin: '0 auto', textAlign: 'center', lineHeight: 1.4, fontWeight: 'bold', letterSpacing: '-0.3px' }}>
                            Brgy. Lanao, National Highway, Kidapawan City, North Cotabato 9400, Philippines
                        </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* stamp area */}
                    <div style={{ border: '1px dashed #b8b8b8', width: 100, height: 30, marginRight: 30 }} />
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 20 }}>
                    APPLICATION FOR LEAVE
                </div>

                {/* ── Main form table ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <colgroup>
                        <col style={{ width: '55%' }} />
                        <col style={{ width: '45%' }} />
                    </colgroup>
                    <tbody>


                        {/* Row: Office/Dept + Name */}
                        <tr>
                            <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>

                                    {/* 1. Office/Department */}
                                    <div style={{ width: '28%', paddingRight: 16 }}>
                                        <div style={{ fontSize: 8, marginBottom: 4 }}>1.&nbsp;&nbsp;OFFICE/DEPARTMENT</div>
                                        <div style={{ fontSize: 8, paddingBottom: 1 }}>
                                            {app.office_department ?? ''}
                                        </div>
                                    </div>

                                    {/* 2. NAME */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                                        <div style={{ fontSize: 8, whiteSpace: 'nowrap', marginRight: 6 }}>
                                            2.&nbsp;&nbsp;NAME :
                                        </div>
                                        <div style={{ display: 'flex', flex: 1, gap: 12 }}>
                                            {([
                                                [emp?.last_name ?? '', '(Last)'],
                                                [emp?.first_name ?? '', '(First)'],
                                                [emp?.middle_name ?? '', '(Middle)'],
                                            ] as [string, string][]).map(([val, label]) => (
                                                <div key={label} style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 8, marginBottom: 4 }}>{label}</div>
                                                    <div style={{ fontSize: 8, paddingBottom: 1 }}>
                                                        {val}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </td>
                        </tr>
                        {/* Row: Date/Position/Salary */}
                        <tr>
                            <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
                                    <span style={{ fontSize: 8, whiteSpace: 'nowrap', marginRight: 4 }}>3.&nbsp;&nbsp;DATE OF FILING</span>
                                    <div style={{ borderBottom: '0.4px solid #000', flex: '0 0 130px', marginRight: 24, fontSize: 8 }}>
                                        {app.date_of_filing ? new Date(app.date_of_filing).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    </div>
                                    <span style={{ fontSize: 8, whiteSpace: 'nowrap', marginRight: 4 }}>4.&nbsp;&nbsp;POSITION</span>
                                    <div style={{ borderBottom: '0.4px solid #000', flex: '1 1 0', marginRight: 24, fontSize: 8 }}>
                                        {app.position ?? ''}
                                    </div>
                                    <span style={{ fontSize: 8, whiteSpace: 'nowrap', marginRight: 4 }}>5.&nbsp;&nbsp;SALARY</span>
                                    <div style={{ borderBottom: '0.4px solid #000', flex: '0 0 100px', fontSize: 8 }}>
                                        {app.salary ?? ''}
                                    </div>
                                </div>
                            </td>
                        </tr>

                        {/* Section 6 header */}
                        <tr>
                            <td colSpan={2} style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: 9, padding: '3px 0' }}>
                                6.&nbsp;&nbsp;DETAILS OF APPLICATION
                            </td>
                        </tr>

                        {/* 6A + 6B */}
                        <tr>
                            {/* 6A */}
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top', width: '55%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>

                                    {/* Leave type list */}
                                    <div>
                                        <div style={{ fontSize: 8, marginBottom: 6 }}>6.A TYPE OF LEAVE TO BE AVAILED OF</div>
                                        {[
                                            ['Vacation Leave', '(Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /^vacation leave$/i.test(leaveName)],
                                            ['Mandatory/Forced Leave', '(Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /mandatory|forced/i.test(leaveName)],
                                            ['Sick Leave', '(Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /^sick leave$/i.test(leaveName)],
                                            ['Maternity Leave', '(R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)', /maternity/i.test(leaveName)],
                                            ['Paternity Leave', '(R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)', /paternity/i.test(leaveName)],
                                            ['Special Privilege Leave', '(Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /special privilege/i.test(leaveName)],
                                            ['Solo Parent Leave', '(RA No. 8972 / CSC MC No. 8, s. 2004)', /solo parent/i.test(leaveName)],
                                            ['Study Leave', '(Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /^study leave$/i.test(leaveName)],
                                            ['10-Day VAWC Leave', '(RA No. 9262 / CSC MC No. 15, s. 2005)', /vawc/i.test(leaveName)],
                                            ['Rehabilitation Privilege', '(Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)', /rehabilitation/i.test(leaveName)],
                                            ['Special Leave Benefits for Women', '(RA No. 9710 / CSC MC No. 25, s. 2010)', /women/i.test(leaveName)],
                                            ['Special Emergency (Calamity) Leave', '(CSC MC No. 2, s. 2012, as amended)', /calamity|emergency/i.test(leaveName)],
                                            ['Adoption Leave', '(R.A. No. 8552)', /adoption/i.test(leaveName)],
                                        ].map(([name, citation, checked]) => (
                                            <div key={String(name)} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                                                <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #000', marginRight: 5, marginTop: 1, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '10px', fontSize: 9, fontWeight: 'bold' }}>
                                                    {checked ? '✓' : ''}
                                                </span>
                                                <span style={{ lineHeight: 1.4, letterSpacing: '0.3px' }}>
                                                    <span style={{ fontSize: 8 }}>{String(name)} </span>
                                                    <span style={{ fontSize: 7 }}>{String(citation)}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Others — always at the bottom */}
                                    <div style={{ fontSize: 8, marginTop: 30 }}>
                                        <div style={{ fontStyle: 'italic' }}>Others:</div>
                                        <div style={{ borderBottom: '0.4px solid #000', width: '80%', minHeight: 12 }}>
                                            {!otherPurpose && !/vacation|mandatory|forced|sick|maternity|paternity|special privilege|solo parent|study|vawc|rehabilitation|women|calamity|emergency|adoption/i.test(leaveName) ? leaveName : ''}
                                        </div>
                                    </div>

                                </div>
                            </td>

                            {/* 6B */}
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top', width: '45%' }}>
                                <div style={{ fontSize: 8, marginBottom: 5 }}>6.B DETAILS OF LEAVE</div>

                                {/* Vacation / Special Privilege Leave */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontStyle: 'italic', fontSize: 8, marginBottom: 3 }}>In case of Vacation/Special Privilege Leave:</div>

                                    {/* Within the Philippines */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 6, fontSize: 7.5 }}>
                                        <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                            {!isOtherPurposeLeave && isVL && detail?.leave_location_type === 'ph' ? '✓' : ''}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>Within the Philippines</span>
                                        <span style={{ borderBottom: '0.4px solid #000', flex: 1, display: 'inline-block' }}>{detail?.leave_location_type === 'ph' ? detail?.leave_location ?? '' : ''}</span>
                                    </div>

                                    {/* Abroad */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 7.5 }}>
                                        <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                            {!isOtherPurposeLeave && isVL && detail?.leave_location_type === 'abroad' ? '✓' : ''}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>Abroad (Specify)</span>
                                        <span style={{ borderBottom: '0.4px solid #000', flex: 1, display: 'inline-block' }}>{detail?.leave_location_type === 'abroad' ? detail?.leave_location ?? '' : ''}</span>
                                    </div>
                                </div>

                                {/* Sick Leave */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontStyle: 'italic', fontSize: 8, marginBottom: 3 }}>In case of Sick Leave:</div>

                                    {/* In Hospital */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 6, fontSize: 7.5 }}>
                                        <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                            {!isOtherPurposeLeave && isSL && detail?.sick_type === 'hospital' ? '✓' : ''}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>In Hospital (Specify Illness)</span>
                                        <span style={{ borderBottom: '0.4px solid #000', flex: 1, display: 'inline-block' }}>{detail?.sick_type === 'hospital' ? detail?.sick_details ?? '' : ''}</span>
                                    </div>


                                    {/* Out Patient */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 7.5, marginBottom: 2 }}>
                                        <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                            {!isOtherPurposeLeave && isSL && detail?.sick_type === 'outpatient' ? '✓' : ''}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>Out Patient (Specify Illness)</span>
                                        <div style={{ borderBottom: '0.4px solid #000', flex: 1, minWidth: 0, minHeight: 10, fontSize: 8, paddingBottom: 2 }}>
                                            {(() => {
                                                const text = detail?.sick_type === 'outpatient' ? detail?.sick_details ?? '' : '';
                                                return splitByChars(text, 35)[0] ?? '';
                                            })()}
                                        </div>
                                    </div>
                                    {/* Line 2 — all remaining */}
                                    <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 10, fontSize: 7.5, paddingBottom: 2, marginBottom: 6 }}>
                                        {(() => {
                                            const text = detail?.sick_type === 'outpatient' ? detail?.sick_details ?? '' : '';
                                            const line1 = splitByChars(text, 35)[0] ?? '';
                                            return text.slice(line1.length).trim();
                                        })()}
                                    </div>

                                </div>
                                {/* Special Leave Benefits for Women */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontStyle: 'italic', fontSize: 8, marginBottom: 3 }}>In case of Special Leave Benefits for Women:</div>

                                    {/* Specify Illness — line 1 */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 8, marginBottom: 2 }}>
                                        <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>(Specify Illness)</span>
                                        <div style={{ borderBottom: '0.4px solid #000', flex: 1, minWidth: 0, minHeight: 10, fontSize: 7.5, paddingBottom: 2 }}>
                                            {(() => {
                                                const text = detail?.women_illness ?? '';
                                                return splitByChars(text, 50)[0] ?? '';
                                            })()}
                                        </div>
                                    </div>
                                    {/* Line 2 — all remaining */}
                                    <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 10, fontSize: 7.5, paddingBottom: 2, marginBottom: 6 }}>
                                        {(() => {
                                            const text = detail?.women_illness ?? '';
                                            const line1 = splitByChars(text, 50)[0] ?? '';
                                            return text.slice(line1.length).trim();
                                        })()}
                                    </div>
                                </div>



                                {/* Study Leave */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontStyle: 'italic', fontSize: 8, marginBottom: 3 }}>In case of Study Leave:</div>

                                    {/* Completion of Master's Degree */}
                                    {/* BAR/Board Examination Review */}
                                    {["Completion of Master's Degree", 'BAR/Board Examination Review'].map(opt => (
                                        <div key={opt} style={{ display: 'flex', alignItems: 'center', marginBottom: 3, fontSize: 7.5 }}>
                                            <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                                {detail?.study_purpose === opt ? '✓' : ''}
                                            </span>
                                            <span>{opt}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Other Purpose */}
                                <div>
                                    <div style={{ fontStyle: 'italic', fontSize: 7.5, marginBottom: 3 }}>Other purpose:</div>

                                    {/* Monetization of Leave Credits / Terminal Leave */}
                                    {([['Monetization of Leave Credits', isMonetization], ['Terminal Leave', isTerminalLeave]] as [string, boolean][]).map(([label, checked]) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: 3, fontSize: 8 }}>
                                            <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                                {checked ? '✓' : ''}
                                            </span>
                                            <span>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>

                        {/* 6C + 6D */}
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: 8, marginBottom: 5 }}>6.C NUMBER OF WORKING DAYS APPLIED FOR</div>

                                <>
                                    <div style={{ borderBottom: '0.4px solid #000', fontSize: 7.5, minHeight: 16, marginBottom: 4, marginLeft: 12, width: 150 }}>
                                        {workDays > 0 ? `${workDays} working day${workDays !== 1 ? 's' : ''}` : '\u00A0'}
                                    </div>
                                    <div style={{ fontSize: 7.5, marginBottom: 3, marginLeft: 12 }}>INCLUSIVE DATES</div>
                                    <div style={{ borderBottom: '0.4px solid #000', fontSize: 8, minHeight: 16, marginLeft: 12, width: 150 }}>
                                        {app.start_date && app.end_date ? `${toDisplay(app.start_date)} – ${toDisplay(app.end_date)}` : '\u00A0'}
                                    </div>
                                </>

                            </td>
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: 8, marginBottom: 5 }}>6.D COMMUTATION</div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontSize: 8 }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 7.5, fontWeight: 'bold' }}>
                                        {!app.is_requested ? '✓' : ''}
                                    </span>
                                    <span>Not Requested</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 8 }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 7.5, fontWeight: 'bold' }}>
                                        {!!app.is_requested ? '✓' : ''}
                                    </span>
                                    <span>Requested</span>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: 15 }}>
                                    <div style={{ borderBottom: '0.4px solid #000', width: '80%', margin: '0 auto 3px' }} />
                                    <div style={{ fontSize: 8, fontStyle: 'italic' }}>(Signature of Applicant)</div>
                                </div>
                            </td>
                        </tr>

                        {/* Section 7 header */}
                        <tr>
                            <td colSpan={2} style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: 9, padding: '3px 0' }}>
                                7.&nbsp;&nbsp;DETAILS OF ACTION ON APPLICATION
                            </td>
                        </tr>

                        {/* 7A + 7B */}
                        <tr>
                            {/* 7A */}
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top', width: '55%' }}>
                                <div style={{ fontSize: 8, marginBottom: 4 }}>7.A CERTIFICATION OF LEAVE CREDITS</div>
                                <div style={{ textAlign: 'center', fontSize: 8, marginBottom: 6 }}>
                                    As of <span style={{ borderBottom: '0.4px solid #000', display: 'inline-block', minWidth: 100 }}>
                                        {(isVL || isSL || isMonetization || isTerminalLeave)
                                            ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                            : ''}
                                    </span>
                                </div>

                                <table style={{ width: '85%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 8, padding: 12, marginLeft: 25 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #000', padding: '2px 4px', width: '36%', fontStyle: 'italic', textAlign: 'center' }}></th>
                                            <th style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center', fontStyle: 'italic', fontWeight: 'normal' }}>Vacation Leave</th>
                                            <th style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center', fontStyle: 'italic', fontWeight: 'normal' }}>Sick Leave</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', fontStyle: 'italic' }}>Total Earned</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isVL || isMonetization || isTerminalLeave) ? vl_earned.toFixed(2) : ''}</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isSL || isMonetization || isTerminalLeave) ? sl_earned.toFixed(2) : ''}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', fontStyle: 'italic' }}>Less this application</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isVL || isMonetization || isTerminalLeave) && Number(lessVL) > 0 ? Number(lessVL).toFixed(2) : ''}</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isSL || isMonetization || isTerminalLeave) && Number(lessSL) > 0 ? Number(lessSL).toFixed(2) : ''}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', fontStyle: 'italic' }}>Balance</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isVL || isMonetization || isTerminalLeave) ? balVL : ''}</td>
                                            <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{(isSL || isMonetization || isTerminalLeave) ? balSL : ''}</td>
                                        </tr>
                                    </tbody>
                                </table>


                                <div style={{ textAlign: 'center', marginTop: 25 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 8, textTransform: 'uppercase', marginBottom: 2 }}>{recOfficer ? getFullName(recOfficer) : ''}</div>
                                    <div style={{ borderTop: '0.4px solid #000', width: '70%', margin: '0 auto 2px' }} />
                                    <div style={{ fontSize: 8, fontStyle: 'italic' }}>(Authorized Officer)</div>
                                </div>
                            </td>

                            {/* 7B — Recommendation*/}
                            <td style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top', width: '45%' }}>
                                <div style={{ fontSize: 8, marginBottom: 5 }}>7.B RECOMMENDATION</div>

                                {/* for approval */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4, fontSize: 8 }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, marginTop: 1, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                        {!app.for_disapproval_reason && app.status !== 'Disapproved' ? '✓' : ''}
                                    </span>
                                    <span>For approval</span>
                                </div>

                                {/* for disapproval */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4, fontSize: 8 }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid #000', marginRight: 4, marginTop: 1, flexShrink: 0, background: '#fff', textAlign: 'center', lineHeight: '8px', fontSize: 8, fontWeight: 'bold' }}>
                                        {!!app.for_disapproval_reason || app.status === 'Disapproved' ? '✓' : ''}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        {/* Line 1 */}
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <span style={{ whiteSpace: 'nowrap', marginRight: 4 }}>For disapproval due to</span>
                                            <div style={{ borderBottom: '0.4px solid #000', flex: 1, minWidth: 0, minHeight: 10, fontSize: 7, paddingBottom: 2 }}>
                                                {(() => {
                                                    const text = app.for_disapproval_reason ?? '';
                                                    return splitByChars(text, 45)[0] ?? '';
                                                })()}
                                            </div>
                                        </div>
                                        {/* Line 2 */}
                                        <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 10, fontSize: 7, paddingBottom: 2, marginTop: 6 }}>
                                            {(() => {
                                                const text = app.for_disapproval_reason ?? '';
                                                const line1 = splitByChars(text, 45)[0] ?? '';
                                                const remaining = text.slice(line1.length).trim();
                                                return splitByChars(remaining, 70)[0] ?? '';
                                            })()}
                                        </div>
                                        {/* Line 3 */}
                                        <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 10, fontSize: 7, paddingBottom: 2, marginTop: 6 }}>
                                            {(() => {
                                                const text = app.for_disapproval_reason ?? '';
                                                const line1 = splitByChars(text, 45)[0] ?? '';
                                                const remaining = text.slice(line1.length).trim();
                                                const line2 = splitByChars(remaining, 70)[0] ?? '';
                                                const remaining2 = remaining.slice(line2.length).trim();
                                                return splitByChars(remaining2, 70)[0] ?? '';
                                            })()}
                                        </div>
                                        {/* Line 4 — all remaining */}
                                        <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 10, fontSize: 7, paddingBottom: 2, marginTop: 6 }}>
                                            {(() => {
                                                const text = app.for_disapproval_reason ?? '';
                                                const line1 = splitByChars(text, 45)[0] ?? '';
                                                const remaining = text.slice(line1.length).trim();
                                                const line2 = splitByChars(remaining, 70)[0] ?? '';
                                                const remaining2 = remaining.slice(line2.length).trim();
                                                const line3 = splitByChars(remaining2, 70)[0] ?? '';
                                                return remaining2.slice(line3.length).trim();
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: 25 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 8, textTransform: 'uppercase', marginBottom: 2 }}>{recOfficer ? getFullName(recOfficer) : ''}</div>
                                    <div style={{ borderTop: '0.4px solid #000', width: '80%', margin: '0 auto 2px' }} />
                                    <div style={{ fontSize: 8, fontStyle: 'italic' }}>(Authorized Officer)</div>
                                </div>
                            </td>
                        </tr>

                        {/* 7C + 7D + Authorized Official — all in one borderless row */}
                        <tr>
                            <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 5px', verticalAlign: 'top' }}>

                                {/* 7C and 7D side by side */}
                                <div style={{ display: 'flex', gap: 0 }}>

                                    {/* 7C — Approved For */}
                                    <div style={{ width: '55%', paddingRight: 8 }}>
                                        <div style={{ fontSize: 8, marginBottom: 6 }}>7.C APPROVED FOR:</div>
                                        {([
                                            [approvedWithPay, 'days with pay'],
                                            [approvedWithoutPay, 'days without pay'],
                                            [approvedOthers, isMonetization ? 'others (Specify: Monetization of Leave Credits)' : isTerminalLeave ? 'others (Specify: Terminal Leave)' : 'others (Specify)'],
                                        ] as [string, string][]).map(([val, label]) => (
                                            <div key={label} style={{ display: 'flex', alignItems: 'flex-end', fontSize: 8, marginLeft: 12, marginBottom: 4, minHeight: 12 }}>
                                                <span style={{ borderBottom: '0.4px solid #000', minWidth: 40, display: 'inline-block', textAlign: 'center', marginRight: 6 }}>
                                                    {app.status !== 'Disapproved' && val ? Math.round(Number(val)) : ''}
                                                </span>
                                                <span>{label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 7D — Disapproved Due To */}
                                    <div style={{ width: '45%', paddingLeft: 8 }}>
                                        <div style={{ fontSize: 8, marginBottom: 6 }}>7.D DISAPPROVED DUE TO:</div>
                                        {(() => {
                                            const lines = splitByChars(app.disapproved_reason ?? '', 55);
                                            while (lines.length < 3) lines.push('');
                                            return (
                                                <>
                                                    {/* Line 1 */}
                                                    <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 12, fontSize: 8, marginBottom: 4 }}>
                                                        {lines[0]}
                                                    </div>
                                                    {/* Line 2 */}
                                                    <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 12, fontSize: 8, marginBottom: 4 }}>
                                                        {lines[1]}
                                                    </div>
                                                    {/* Line 3 */}
                                                    <div style={{ borderBottom: '0.4px solid #000', width: '100%', minHeight: 12, fontSize: 8 }}>
                                                        {lines[2]}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                </div>

                                {/* Authorized Official — centered at the bottom */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 25 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 9, textTransform: 'uppercase', marginBottom: 3 }}>
                                        {appOfficer ? getFullName(appOfficer) : ''}
                                    </div>
                                    <div style={{ borderTop: '0.4px solid #000', width: '40%', marginBottom: 3 }} />
                                    <div style={{ fontSize: 8, fontStyle: 'italic' }}>(Authorized Official)</div>
                                </div>

                            </td>
                        </tr>
                    </tbody>
                </table>

            </div>




            {/* PAGE 2: Instructions */}
            <div className="print-root" style={{ fontFamily: 'Arial, sans-serif', fontSize: 8.5, color: '#000', marginTop: 10, marginBottom: 50, letterSpacing: '-0.3px' }}>
                <div style={{ pageBreakBefore: 'always', breakBefore: 'page', display: 'block', marginTop: 0 }}>
                    <table style={{ width: '100%', fontFamily: 'Arial, sans-serif', fontSize: 8.5 }}>
                        <tbody>

                            {/* Header */}
                            <tr>
                                <td colSpan={2} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: 12, border: '1px solid #000' }}>
                                    INSTRUCTIONS AND REQUIREMENTS
                                </td>
                            </tr>

                            {/* Two columns */}
                            <tr>
                                {/* LEFT */}
                                <td style={{ padding: '4px 10px 10px 10px', verticalAlign: 'top', width: '50%', fontSize: 8.5, textAlign: 'justify' }}>

                                    {/* Intro Text */}
                                    <p style={{ marginBottom: 6, fontSize: 8.5 }}>
                                        Application for any type of leave shall be made on this Form and to be{' '}
                                        <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>accomplished at least in duplicate</span>{' '}
                                        with documentary requirements, as follows:
                                    </p>

                                    {/* 1. Vacation leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>1.&nbsp;&nbsp;Vacation leave*</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>It shall be filed five (5) days in advance, whenever possible, of the effective date of such leave. Vacation leave within in the Philippines or abroad shall be indicated in the form for purposes of securing travel authority and completing clearance from money and work accountabilities.</span>
                                    </p>

                                    {/* 2. Mandatory/Forced leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>2.&nbsp;&nbsp;Mandatory/Forced leave</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>Annual five-day vacation leave shall be forfeited if not taken during the year. In case the scheduled leave has been cancelled in the exigency of the service by the head of agency, it shall no longer be deducted from the accumulated vacation leave. Availment of one (1) day or more Vacation Leave (VL) shall be considered for complying the mandatory/forced leave subject to the conditions under Section 25, Rule XVI of the Omnibus Rules Implementing E.O. No. 292.</span>
                                    </p>

                                    {/* 3. Sick leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>3.&nbsp;&nbsp;Sick leave*</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>It shall be filed immediately upon employee's return from such leave.</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>If filed in advance or exceeding five (5) days, application shall be accompanied by a <span style={{ textDecoration: 'underline' }}>medical certificate</span>. In case medical consultation was not availed of, an <span style={{ textDecoration: 'underline' }}>affidavit</span> should be executed by an applicant.</span></div>
                                        </div>
                                    </div>

                                    {/* 4. Maternity leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>4.&nbsp;&nbsp;Maternity leave* – 105 days</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Proof of pregnancy e.g. ultrasound, doctor's certificate on the expected date of delivery</span></div>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Accomplished Notice of Allocation of Maternity Leave Credits (CS Form No. 6a), if needed</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>Seconded female employees shall enjoy maternity leave with full pay in the recipient agency.</span></div>
                                        </div>
                                    </div>

                                    {/* 5. Paternity leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>5.&nbsp;&nbsp;Paternity leave – 7 days</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>Proof of child's delivery e.g. birth certificate, medical certificate and marriage contract</span>
                                    </p>

                                    {/* 6. Special Privilege leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>6.&nbsp;&nbsp;Special Privilege leave – 3 days</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>It shall be filed/approved for at least one (1) week prior to availment, except on emergency cases. Special privilege leave within the Philippines or abroad shall be indicated in the form for purposes of securing travel authority and completing clearance from money and work accountabilities.</span>
                                    </p>

                                    {/* 7. Solo Parent leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>7.&nbsp;&nbsp;Solo Parent leave – 7 days</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>It shall be filed in advance or whenever possible five (5) days before going on such leave with updated Solo Parent Identification Card.</span>
                                    </p>

                                    {/* 8. Study leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>8.&nbsp;&nbsp;Study leave* – up to 6 months</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Shall meet the agency's internal requirements, if any;</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>Contract between the agency head or authorized representative and the employee concerned.</span></div>
                                        </div>
                                    </div>

                                    {/* 9. VAWC leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>9.&nbsp;&nbsp;VAWC leave – 10 days</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>It shall be filed in advance or immediately upon the woman employee's return from such leave.</span></div>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>It shall be accompanied by any of the following supporting documents:</span></div>
                                            <div style={{ paddingLeft: 14 }}>
                                                <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>a.</span><span>Barangay Protection Order (BPO) obtained from the barangay;</span></div>
                                                <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>b.</span><span>Temporary/Permanent Protection Order (TPO/PPO) obtained from the court;</span></div>
                                                <div style={{ display: 'flex', gap: 4 }}><span>c.</span><span>If the protection order is not yet issued by the barangay or the court, a certification issued by the Punong Barangay/Kagawad or Prosecutor or the Clerk of Court that the application for the BPO,</span></div>
                                            </div>
                                        </div>
                                    </div>

                                </td>

                                {/* RIGHT */}
                                <td style={{ padding: '4px 10px 10px 10px', verticalAlign: 'top', width: '50%', fontSize: 8.5, textAlign: 'justify' }}>

                                    {/* 9. VAWC leave — continuation from left column */}
                                    <div style={{ marginBottom: 6 }}>
                                        <div style={{ paddingLeft: 28 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                                                <span>TPO or PPO has been filed with the said office shall be sufficient to support the application for the ten-day leave; or</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <span>d.</span>
                                                <span>In the absence of the BPO/TPO/PPO or the certification, a police report specifying the details of the occurrence of violence on the victim and a medical certificate may be considered, at the discretion of the immediate supervisor of the woman employee concerned.</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 10. Rehabilitation leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>10.&nbsp;&nbsp;Rehabilitation leave* – up to 6 months</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Application shall be made within one (1) week from the time of the accident except when a longer period is warranted.</span></div>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Letter request supported by relevant reports such as the police report, if any,</span></div>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>Medical certificate on the nature of the injuries, the course of treatment involved, and the need to undergo rest, recuperation, and rehabilitation, as the case may be.</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>Written concurrence of a government physician should be obtained relative to the recommendation for rehabilitation if the attending physician is a private practitioner, particularly on the duration of the period of rehabilitation.</span></div>
                                        </div>
                                    </div>

                                    {/* 11. Special leave benefits for women */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>11.&nbsp;&nbsp;Special leave benefits for women* – up to 2 months</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>The application may be filed in advance, that is, at least five (5) days prior to the scheduled date of the gynecological surgery that will be undergone by the employee. In case of emergency, the application for special leave shall be filed immediately upon employee's return but during confinement the agency shall be notified of said surgery.</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>The application shall be accompanied by a medical certificate filled out by the proper medical authorities, e.g. the attending surgeon accompanied by a clinical summary reflecting the gynecological disorder which shall be addressed or was addressed by the said surgery; the histopathological report; the operative technique used for the surgery; the duration of the surgery including the perioperative period (period of confinement around surgery); as well as the employees estimated period of recuperation for the same.</span></div>
                                        </div>
                                    </div>

                                    {/* 12. Special Emergency (Calamity) leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>12.&nbsp;&nbsp;Special Emergency (Calamity) leave – up to 5 days</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}><span>•</span><span>The special emergency leave can be applied for a maximum of five (5) straight working days or staggered basis within thirty (30) days from the actual occurrence of the natural calamity/disaster. Said privilege shall be enjoyed once a year, not in every instance of calamity or disaster.</span></div>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>The head of office shall take full responsibility for the grant of special emergency leave and verification of the employee's eligibility to be granted thereof. Said verification shall include: validation of place of residence based on latest available records of the affected employee; verification that the place of residence is covered in the declaration of calamity area by the proper government agency; and such other proofs as may be necessary.</span></div>
                                        </div>
                                    </div>

                                    {/* 13. Monetization of leave credits */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>13.&nbsp;&nbsp;Monetization of leave credits</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>Application for monetization of fifty percent (50%) or more of the accumulated leave credits shall be accompanied by letter request to the head of the agency stating the valid and justifiable reasons.</span>
                                    </p>

                                    {/* 14. Terminal leave */}
                                    <p style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>14.&nbsp;&nbsp;Terminal leave*</span><br />
                                        <span style={{ paddingLeft: 14, display: 'block', marginTop: 2 }}>Proof of employee's resignation or retirement or separation from the service.</span>
                                    </p>

                                    {/* 15. Adoption Leave */}
                                    <div style={{ marginBottom: 6 }}>
                                        <span style={{ fontWeight: 'bold' }}>15.&nbsp;&nbsp;Adoption Leave</span>
                                        <div style={{ paddingLeft: 14, marginTop: 2 }}>
                                            <div style={{ display: 'flex', gap: 4 }}><span>•</span><span>Application for adoption leave shall be filed with an authenticated copy of the Pre-Adoptive Placement Authority issued by the Department of Social Welfare and Development (DSWD).</span></div>
                                        </div>
                                    </div>

                                </td>
                            </tr>

                            {/* Footnote */}
                            <tr>
                                <td colSpan={2} style={{ padding: '4px 10px', fontSize: 8.5 }}>
                                    <div style={{ borderTop: '0.5px solid #000', width: 180, marginBottom: 5 }} />
                                    * For leave of absence for thirty (30) calendar days or more and terminal leave, application shall be accompanied by a{' '}
                                    <span style={{ textDecoration: 'underline' }}>clearance from money, property and work-related accountabilities</span>{' '}
                                    (pursuant to CSC Memorandum Circular No. 2, s. 1985).
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}