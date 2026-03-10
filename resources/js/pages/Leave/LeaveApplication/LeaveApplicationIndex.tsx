import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table/data-table';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';

import { getColumns } from './components/columns';
import type { LeaveFiling } from './data/schema';
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
    employee_id: number;
    employee_name: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    department_name?: string;
    position_name?: string;
    monthly_salary?: string;
    vl_total_earned?: number | string;
    vl_balance?: number | string;
    sl_total_earned?: number | string;
    sl_balance?: number | string;
}



interface LeaveType {
    leave_type_id: number;
    leave_type_name: string;
}

type Props = {
    leave_applications: LeaveFiling[];
    employees: Employee[];
    leave_types: LeaveType[];
    total_applications: number;
    total_pending: number;
    total_approved: number;
    total_disapproved: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeWorkingDays(start: string, end: string): number {
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

function todayLabel() {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toDisplay(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${m}/${d}/${y}`;
}

// ─── FieldError (from attachment 1) ──────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {message}
        </p>
    );
}

// ─── Date Picker (shadcn Popover + Calendar) ──────────────────────────────────

function DateInput({ value, onChange, placeholder = 'mm/dd/yyyy', disabled = false }: {
    value: string; onChange: (isoValue: string) => void;
    placeholder?: string; disabled?: boolean;
}) {
    // value is stored as yyyy-mm-dd; display as mm/dd/yyyy
    const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const selected = parsed && isValid(parsed) ? parsed : undefined;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-left',
                        'focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
                        !selected && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    {selected ? format(selected, 'MM/dd/yyyy') : placeholder}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={day => onChange(day ? format(day, 'yyyy-MM-dd') : '')}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Square Checkbox ──────────────────────────────────────────────────────────

function SqCheck({ checked, onChange, label, law, disabled = false }: {
    checked: boolean; onChange: () => void;
    label: string; law?: string; disabled?: boolean;
}) {
    return (
        <label
            className={`flex items-start gap-2 py-0.5 select-none
                ${disabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}`}
            onClick={onChange}
        >
            <span className={`mt-px w-3 h-3 shrink-0 border flex items-center justify-center rounded-sm
                transition-colors ${checked ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                {checked && (
                    <svg className="w-2 h-2 text-primary-foreground" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            <span className="text-xs leading-snug text-foreground">
                {label}
                {law && <span className="text-muted-foreground text-[10px]"> ({law})</span>}
            </span>
        </label>
    );
}

// ─── Typography helpers ───────────────────────────────────────────────────────

const SH     = ({ children }: { children: React.ReactNode }) => <p className="text-xs font-semibold text-foreground mb-2">{children}</p>;
const Sub    = ({ children }: { children: React.ReactNode }) => <p className="text-xs font-medium text-muted-foreground mb-1.5">{children}</p>;
const Italic = ({ children }: { children: React.ReactNode }) => <p className="text-[10.5px] italic text-muted-foreground mb-1">{children}</p>;

// ─── Officer Signature Block ──────────────────────────────────────────────────

function OfficerBlock({ label, value, onChange, employees }: {
    label: string; value: string; onChange: (v: string) => void; employees: Employee[];
}) {
    const selected = employees.find(o => String(o.employee_id) === value);
    const displayName = (emp: Employee) => emp.last_name
        ? `${emp.last_name}, ${emp.first_name ?? ''} ${emp.middle_name ?? ''}`.trim()
        : emp.employee_name;

    return (
        <div className="flex flex-col items-center mt-6">
            <div className="w-56">
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-7 text-xs border-0 border-b border-border rounded-none px-0 shadow-none bg-transparent focus:ring-0 justify-center">
                        <SelectValue placeholder={`Select ${label}…`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 text-xs">
                        {employees.map(o => (
                            <SelectItem key={o.employee_id} value={String(o.employee_id)}>
                                {displayName(o)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <p className="text-[10px] italic text-muted-foreground">({label})</p>
        </div>
    );
}

// ─── Instructions Gate ────────────────────────────────────────────────────────

const INSTRUCTIONS = [
    { n: 1,  t: 'Vacation leave*',                                    b: 'It shall be filed five (5) days in advance, whenever possible. Vacation leave within the Philippines or abroad shall be indicated for purposes of securing travel authority.' },
    { n: 2,  t: 'Mandatory/Forced leave',                             b: 'Annual five-day vacation leave shall be forfeited if not taken during the year. Availment of one (1) day or more VL shall be considered for complying the mandatory/forced leave.' },
    { n: 3,  t: 'Sick leave*',                                        b: "Filed immediately upon employee's return. If filed in advance or exceeding five (5) days, accompanied by a medical certificate or affidavit." },
    { n: 4,  t: 'Maternity leave* – 105 days',                        b: "Proof of pregnancy e.g. ultrasound, doctor's certificate. Accomplished CS Form No. 6a if needed." },
    { n: 5,  t: 'Paternity leave – 7 days',                           b: "Proof of child's delivery e.g. birth certificate, medical certificate and marriage contract." },
    { n: 6,  t: 'Special Privilege leave – 3 days',                   b: 'Filed/approved at least one (1) week prior to availment. Indicate if within the Philippines or abroad.' },
    { n: 7,  t: 'Solo Parent leave – 7 days',                         b: 'Filed in advance or whenever possible five (5) days before going on such leave with updated Solo Parent ID.' },
    { n: 8,  t: 'Study leave* – up to 6 months',                      b: "Shall meet the agency's internal requirements. Contract between the agency head and the employee concerned." },
    { n: 9,  t: 'VAWC leave – 10 days',                               b: 'File in advance or immediately upon return. Requires Barangay Protection Order, TPO/PPO, or certification from Punong Barangay/Prosecutor.' },
    { n: 10, t: 'Rehabilitation leave* – up to 6 months',             b: 'Within one (1) week from the accident. Requires police report, medical certificate, and concurrence of a government physician.' },
    { n: 11, t: 'Special leave benefits for women* – up to 2 months', b: 'File at least five (5) days prior to scheduled gynecological surgery. Medical certificate from attending surgeon required.' },
    { n: 12, t: 'Special Emergency (Calamity) leave – up to 5 days',  b: 'Maximum five (5) straight working days or staggered within thirty (30) days of the calamity. Enjoyed once a year only.' },
    { n: 13, t: 'Monetization of leave credits',                      b: 'Application for monetization of 50% or more of accumulated leave credits with letter request stating valid reasons.' },
    { n: 14, t: 'Terminal leave*',                                     b: "Proof of employee's resignation, retirement, or separation from the service." },
    { n: 15, t: 'Adoption Leave',                                      b: 'Filed with an authenticated copy of the Pre-Adoptive Placement Authority issued by the DSWD.' },
];

function InstructionsGate({ onAcknowledge }: { onAcknowledge: () => void }) {
    const [checked, setChecked] = useState(false);
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3 border-b border-secondary">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Application for any type of leave shall be made on this Form and to be{' '}
                    <span className="font-semibold text-foreground underline">accomplished at least in duplicate</span>{' '}
                    with documentary requirements, as follows:
                </p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {INSTRUCTIONS.map(({ n, t, b }) => (
                        <div key={n} className="flex gap-2 text-xs">
                            <span className="font-semibold text-foreground w-5 shrink-0">{n}.</span>
                            <div>
                                <p className="font-semibold text-foreground mb-0.5">{t}</p>
                                <p className="text-muted-foreground leading-relaxed">{b}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-4 pt-4 border-t border-secondary">
                    * For leave of absence for thirty (30) calendar days or more and terminal leave, application shall be accompanied by a clearance from money, property and work-related accountabilities (CSC MC No. 2, s. 1985).
                </p>
            </div>
            <div className="border-t border-secondary bg-muted/30 px-5 py-3 shrink-0">
                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={v => setChecked(!!v)} className="mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                        I have read and understood the Instructions and Requirements for filing a Leave Application under Civil Service Form No. 6 (Revised 2020).
                    </span>
                </label>
                <div className="mt-3 flex justify-end">
                    <Button size="sm" disabled={!checked} onClick={onAcknowledge}>
                        Proceed to Application →
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Form Data ────────────────────────────────────────────────────────────────

interface FormData {
    employee_id: string;
    office_department: string;
    position: string;
    salary: string;
    leave_type_id: string;
    leave_type_availed: string;
    is_others: boolean;
    others_text: string;
    loc_type: 'ph' | 'abroad' | '';
    loc_ph_text: string;
    loc_abroad_text: string;
    sick_type: 'hospital' | 'outpatient' | '';
    sick_hospital_text: string;
    sick_outpatient_text: string;
    illness_women: string;
    study_purpose: string;
    start_date: string;
    end_date: string;
    is_requested: boolean;
    is_with_pay: boolean;
    recommendation_officer: string;
    certifying_officer: string;
    status: string;
    for_disapproval_reason: string;
    approval_officer: string;
    approved_with_pay: string;
    approved_without_pay: string;
    approved_others: string;
    disapproved_reason: string;
}

// ─── Leave Form ───────────────────────────────────────────────────────────────

function LeaveForm({
    data, setData, errors, employees, leave_types,
    processing, onSubmit, onClose, isEdit,
}: {
    data: FormData;
    setData: (keyOrData: keyof FormData | Partial<FormData>, value?: any) => void;
    errors: Partial<Record<keyof FormData, string>>;
    employees: Employee[];
    leave_types: LeaveType[];
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    isEdit: boolean;
}) {
    const selectedEmp = employees.find(e => String(e.employee_id) === data.employee_id);
    const workDays    = computeWorkingDays(data.start_date, data.end_date);
    const selectedName = data.is_others ? data.others_text : data.leave_type_availed;
    const isSickLeave = /^sick leave$/i.test(selectedName.trim());
    const isVLLeave   = /vacation|mandatory|forced|special privilege/i.test(selectedName);
    const deductCol: 'vl' | 'sl' | 'none' = isSickLeave ? 'sl' : (isVLLeave ? 'vl' : 'none');
    const vlEarned  = parseFloat(String(selectedEmp?.vl_total_earned ?? 0)) || 0;
    const slEarned  = parseFloat(String(selectedEmp?.sl_total_earned ?? 0)) || 0;
    const vlBal     = parseFloat(String(selectedEmp?.vl_balance      ?? 0)) || 0;
    const slBal     = parseFloat(String(selectedEmp?.sl_balance      ?? 0)) || 0;
    const showLoc   = /vacation|special privilege/i.test(selectedName);
    const showSick  = /sick|rehabilitation/i.test(selectedName);
    const showWomen = /women/i.test(selectedName);
    const showStudy = /study/i.test(selectedName);

    useEffect(() => {
        if (workDays <= 0) { setData('approved_with_pay', ''); setData('approved_without_pay', ''); return; }
        const balance    = isSickLeave ? slBal : vlBal;
        const withPay    = Math.min(workDays, Math.max(0, balance));
        const withoutPay = Math.max(0, workDays - withPay);
        setData('approved_with_pay',    withPay > 0    ? String(withPay)    : '');
        setData('approved_without_pay', withoutPay > 0 ? String(withoutPay) : '');
    }, [workDays, data.employee_id, data.leave_type_id, data.is_others, data.others_text]);

    function pickLeaveType(lt: LeaveType) {
        setData({
            ...data,
            leave_type_id:      String(lt.leave_type_id),
            leave_type_availed: lt.leave_type_name,
            is_others:          false,
            others_text:        '',
            loc_type: '' as const, loc_ph_text: '', loc_abroad_text: '',
            sick_type: '' as const, sick_hospital_text: '', sick_outpatient_text: '',
            illness_women: '', study_purpose: '',
        });
    }

    function toggleOthers() {
        const turningOn = !data.is_others;
        setData({
            ...data,
            is_others:          turningOn,
            leave_type_id:      turningOn ? '' : data.leave_type_id,
            leave_type_availed: turningOn ? '' : data.leave_type_availed,
            others_text:        '',
        });
    }

    function handleEmployeeChange(empId: string) {
        const emp = employees.find(e => String(e.employee_id) === empId);
        setData({
            ...data,
            employee_id:       empId,
            office_department: emp?.department_name ?? '',
            position:          emp?.position_name   ?? '',
            salary:            emp?.monthly_salary  ?? '',
        });
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                <p className="text-xs text-muted-foreground">
                    All fields with <span className="text-destructive">*</span> are required.
                </p>

                {/* ══ EMPLOYEE DETAILS ══════════════════════════════════════════ */}
                <div>
                    <SH>Employee Details</SH>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                        <div>
                            <label className="text-xs font-medium">
                                Employee Name <span className="text-destructive">*</span>
                            </label>
                            <Select value={data.employee_id || ''} onValueChange={handleEmployeeChange}>
                                <SelectTrigger className="text-sm mt-1 w-full">
                                    <SelectValue placeholder="Select employee…" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64 text-xs">
                                    {employees.map(emp => (
                                        <SelectItem key={emp.employee_id} value={String(emp.employee_id)}>
                                            {emp.last_name
                                                ? `${emp.last_name}, ${emp.first_name ?? ''} ${emp.middle_name ?? ''}`.trim()
                                                : emp.employee_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.employee_id} />
                        </div>

                        <div>
                            <label className="text-xs font-medium">
                                Office/Department <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.office_department}
                                onChange={e => setData('office_department', e.target.value)}
                                placeholder="Department name"
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1
                                    placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <FieldError message={errors.office_department} />
                        </div>

                        <div>
                            <label className="text-xs font-medium">
                                Position <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.position}
                                onChange={e => setData('position', e.target.value)}
                                placeholder="Job position"
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1
                                    placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <FieldError message={errors.position} />
                        </div>

                        <div>
                            <label className="text-xs font-medium">
                                Salary <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.salary}
                                onChange={e => setData('salary', e.target.value)}
                                placeholder="Monthly salary"
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1
                                    placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <FieldError message={errors.salary} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-secondary" />

                {/* ══ DETAILS OF APPLICATION ════════════════════════════════════ */}
                <div>
                    <SH>Details of Application</SH>

                    {/* 6.A */}
                    <Sub>6.A Type of leave to be availed of</Sub>
                    <div className="space-y-0.5 mb-4">
                        {leave_types.map(lt => (
                            <SqCheck
                                key={lt.leave_type_id}
                                checked={!data.is_others && data.leave_type_id === String(lt.leave_type_id)}
                                onChange={() => pickLeaveType(lt)}
                                label={lt.leave_type_name}
                            />
                        ))}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed border-secondary">
                            <SqCheck checked={data.is_others} onChange={toggleOthers} label="Others:" />
                            <div className="flex-1">
                                <input
                                    value={data.is_others ? data.others_text : ''}
                                    onChange={e => setData('others_text', e.target.value)}
                                    disabled={!data.is_others}
                                    placeholder="Specify…"
                                    className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                                        placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                        disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <FieldError message={errors.leave_type_availed} />
                    </div>

                    {/* 6.B */}
                    <Sub>6.B Details of leave</Sub>

                    {/* Vacation/SPL */}
                    <div className="mb-3">
                        <Italic>In case of Vacation/Special Privilege Leave:</Italic>
                        <div className="space-y-1.5 pl-3">
                            <div className="flex items-center gap-3">
                                <SqCheck
                                    checked={data.loc_type === 'ph'}
                                    onChange={() => setData({ ...data, loc_type: data.loc_type === 'ph' ? '' as const : 'ph' as const, loc_abroad_text: '' })}
                                    label="Within the Philippines"
                                    disabled={!showLoc}
                                />
                                <div className="flex-1">
                                    <input
                                        value={data.loc_ph_text}
                                        onChange={e => setData('loc_ph_text', e.target.value)}
                                        disabled={!showLoc || data.loc_type !== 'ph'}
                                        placeholder="Specify location…"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                                            placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <SqCheck
                                    checked={data.loc_type === 'abroad'}
                                    onChange={() => setData({ ...data, loc_type: data.loc_type === 'abroad' ? '' as const : 'abroad' as const, loc_ph_text: '' })}
                                    label="Abroad (Specify)"
                                    disabled={!showLoc}
                                />
                                <div className="flex-1">
                                    <input
                                        value={data.loc_abroad_text}
                                        onChange={e => setData('loc_abroad_text', e.target.value)}
                                        disabled={!showLoc || data.loc_type !== 'abroad'}
                                        placeholder="Specify country/destination…"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                                            placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sick */}
                    <div className="mb-3">
                        <Italic>In case of Sick Leave:</Italic>
                        <div className="space-y-1.5 pl-3">
                            <div className="flex items-center gap-3">
                                <SqCheck
                                    checked={data.sick_type === 'hospital'}
                                    onChange={() => setData({ ...data, sick_type: data.sick_type === 'hospital' ? '' as const : 'hospital' as const, sick_outpatient_text: '' })}
                                    label="In Hospital (Specify Illness)"
                                    disabled={!showSick}
                                />
                                <div className="flex-1">
                                    <input
                                        value={data.sick_hospital_text}
                                        onChange={e => setData('sick_hospital_text', e.target.value)}
                                        disabled={!showSick || data.sick_type !== 'hospital'}
                                        placeholder="Specify illness…"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                                            placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <SqCheck
                                    checked={data.sick_type === 'outpatient'}
                                    onChange={() => setData({ ...data, sick_type: data.sick_type === 'outpatient' ? '' as const : 'outpatient' as const, sick_hospital_text: '' })}
                                    label="Out Patient (Specify Illness)"
                                    disabled={!showSick}
                                />
                                <div className="flex-1">
                                    <input
                                        value={data.sick_outpatient_text}
                                        onChange={e => setData('sick_outpatient_text', e.target.value)}
                                        disabled={!showSick || data.sick_type !== 'outpatient'}
                                        placeholder="Specify illness…"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                                            placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Women */}
                    <div className="mb-3">
                        <Italic>In case of Special Leave Benefits for Women:</Italic>
                        <div className="pl-3 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0 w-24">(Specify Illness)</span>
                            <input
                                value={data.illness_women}
                                onChange={e => setData('illness_women', e.target.value)}
                                disabled={!showWomen}
                                placeholder="Specify…"
                                className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm
                                    placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Study */}
                    <div className="mb-3">
                        <Italic>In case of Study Leave:</Italic>
                        <div className="space-y-0.5 pl-3">
                            {["Completion of Master's Degree", "BAR/Board Examination Review"].map(opt => (
                                <SqCheck
                                    key={opt}
                                    checked={data.study_purpose === opt}
                                    onChange={() => setData('study_purpose', data.study_purpose === opt ? '' : opt)}
                                    label={opt}
                                    disabled={!showStudy}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Other purpose */}
                    <div className="mb-4">
                        <Italic>Other purpose:</Italic>
                        <div className="space-y-0.5 pl-3">
                            {['Monetization of Leave Credits', 'Terminal Leave'].map(opt => {
                                const lt = leave_types.find(t => t.leave_type_name === opt);
                                return (
                                    <SqCheck
                                        key={opt}
                                        checked={!data.is_others && data.leave_type_availed === opt}
                                        onChange={() => lt
                                            ? pickLeaveType(lt)
                                            : setData({ ...data, leave_type_id: '', leave_type_availed: opt, is_others: false })}
                                        label={opt}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* 6.C */}
                    <Sub>6.C Number of working days applied for (inclusive dates)</Sub>
                    <section className="grid grid-cols-2 gap-5 mb-1">
                        <div>
                            <label className="text-xs font-medium">
                                Start Date <span className="text-destructive">*</span>
                            </label>
                            <div className="mt-1">
                                <DateInput value={data.start_date} onChange={v => setData('start_date', v)} />
                            </div>
                            <FieldError message={errors.start_date} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">
                                End Date <span className="text-destructive">*</span>
                            </label>
                            <div className="mt-1">
                                <DateInput value={data.end_date} onChange={v => setData('end_date', v)} />
                            </div>
                            <FieldError message={errors.end_date} />
                        </div>
                    </section>
                    {workDays > 0 && (
                        <p className="text-xs text-foreground mt-1">
                            <span className="font-semibold">{workDays}</span> working day{workDays !== 1 ? 's' : ''}
                            <span className="text-muted-foreground ml-1">(Mon–Fri)</span>
                        </p>
                    )}

                    {/* 6.D */}
                    <div className="mt-4">
                        <Sub>6.D Commutation</Sub>
                        <div className="space-y-1">
                            <SqCheck checked={!data.is_requested} onChange={() => setData('is_requested', false)} label="Not Requested" />
                            <SqCheck checked={data.is_requested}  onChange={() => setData('is_requested', true)}  label="Requested" />
                        </div>
                        <div className="flex flex-col items-center mt-6">
                            <div className="border-b border-border w-48 mb-0.5" />
                            <p className="text-[10px] italic text-muted-foreground">(Signature of Applicant)</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-secondary" />

                {/* ══ DETAILS OF ACTION ════════════════════════════════════════ */}
                <div>
                    <SH>Details of Action on Application</SH>

                    {/* 7.A */}
                    <Sub>7.A Certification of Leave Credits</Sub>
                    <div className="border border-secondary rounded-md mb-2 text-xs overflow-hidden">
                        <div className="px-3 py-1.5 border-b border-secondary text-muted-foreground bg-muted/20">
                            As of <span className="font-medium ml-1 text-foreground">{todayLabel()}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-secondary font-semibold text-muted-foreground bg-muted/30">
                            <div className="px-3 py-1 border-r border-secondary" />
                            <div className="px-3 py-1 border-r border-secondary text-center">Vacation Leave</div>
                            <div className="px-3 py-1 text-center">Sick Leave</div>
                        </div>
                        <div className="grid grid-cols-3 border-b border-secondary text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Total Earned</div>
                            <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                {selectedEmp ? vlEarned.toFixed(3) : '—'}
                            </div>
                            <div className="px-3 py-1.5 text-center font-medium">
                                {selectedEmp ? slEarned.toFixed(3) : '—'}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 border-b border-secondary text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Less this application</div>
                            <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                {deductCol === 'vl' && workDays > 0 ? workDays : '—'}
                            </div>
                            <div className="px-3 py-1.5 text-center font-medium">
                                {deductCol === 'sl' && workDays > 0 ? workDays : '—'}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Balance</div>
                            <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                {selectedEmp
                                    ? deductCol === 'vl' && workDays > 0
                                        ? <span className={(vlEarned - workDays) < 0 ? 'text-destructive' : ''}>{(vlEarned - workDays).toFixed(3)}</span>
                                        : <span>{vlEarned.toFixed(3)}</span>
                                    : '—'}
                            </div>
                            <div className="px-3 py-1.5 text-center font-medium">
                                {selectedEmp
                                    ? deductCol === 'sl' && workDays > 0
                                        ? <span className={(slEarned - workDays) < 0 ? 'text-destructive' : ''}>{(slEarned - workDays).toFixed(3)}</span>
                                        : <span>{slEarned.toFixed(3)}</span>
                                    : '—'}
                            </div>
                        </div>
                    </div>
                    <OfficerBlock label="Authorized Officer" value={data.certifying_officer} onChange={v => setData('certifying_officer', v)} employees={employees} />

                    {/* 7.B */}
                    <div className="mt-6">
                        <Sub>7.B Recommendation</Sub>
                        <div className="space-y-0.5">
                            <SqCheck
                                checked={data.status === 'For Approval'}
                                onChange={() => setData('status', data.status === 'For Approval' ? 'Pending' : 'For Approval')}
                                label="For approval"
                            />
                            <SqCheck
                                checked={data.status === 'For Disapproval'}
                                onChange={() => setData('status', data.status === 'For Disapproval' ? 'Pending' : 'For Disapproval')}
                                label="For disapproval due to"
                            />
                        </div>
                        {data.status === 'For Disapproval' && (
                            <div className="mt-2 pl-4">
                                <textarea
                                    value={data.for_disapproval_reason}
                                    onChange={e => setData('for_disapproval_reason', e.target.value)}
                                    placeholder="State the reason…"
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                                        placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                />
                            </div>
                        )}
                        <OfficerBlock label="Authorized Officer" value={data.recommendation_officer} onChange={v => setData('recommendation_officer', v)} employees={employees} />
                    </div>

                    {/* 7.C */}
                    <div className="mt-6">
                        <Sub>7.C Approved For:</Sub>
                        <div className="grid grid-cols-3 gap-4 text-xs text-foreground">
                            {[
                                { field: 'approved_with_pay'    as const, label: 'days with pay' },
                                { field: 'approved_without_pay' as const, label: 'days without pay' },
                                { field: 'approved_others'      as const, label: 'others (Specify)' },
                            ].map(({ field, label }) => (
                                <div key={field} className="flex flex-col gap-1">
                                    <input
                                        value={(data as any)[field]}
                                        onChange={e => setData(field, e.target.value)}
                                        placeholder=""
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center
                                            placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                    <span className="text-center text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 7.D */}
                    <div className="mt-5">
                        <Sub>7.D Disapproved Due To:</Sub>
                        <textarea
                            value={data.disapproved_reason}
                            onChange={e => setData('disapproved_reason', e.target.value)}
                            placeholder="State the reason for disapproval…"
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                                placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>

                    <OfficerBlock label="Authorized Official" value={data.approval_officer} onChange={v => setData('approval_officer', v)} employees={employees} />
                </div>
            </div>

            {/* Footer — matches attachment 1's DialogFooter pattern */}
            <DialogFooter className="px-5 py-4 border-t bg-muted/30 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={processing}>
                    {processing ? 'Saving…' : isEdit ? 'Update Application' : 'File Leave Application'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ─── Leave Modal ──────────────────────────────────────────────────────────────

function LeaveModal({ open, editingApp, employees, leave_types, onClose }: {
    open: boolean; editingApp: LeaveFiling | null;
    employees: Employee[];
    leave_types: LeaveType[]; onClose: () => void;
}) {
    const isEdit = !!editingApp;
    const detail = (editingApp as any)?.detail;
    const [acknowledged, setAcknowledged] = useState(isEdit);

    function restoreLocType(): 'ph' | 'abroad' | '' {
        if (!detail?.leave_location) return '';
        return detail.leave_location.startsWith('Abroad:') ? 'abroad' : 'ph';
    }
    function restoreSickType(): 'hospital' | 'outpatient' | '' {
        if (!detail?.illness_details) return '';
        if (detail.illness_details.startsWith('In Hospital:')) return 'hospital';
        if (detail.illness_details.startsWith('Out Patient:')) return 'outpatient';
        return '';
    }

    const { data, setData, post, put, processing, errors, reset } = useForm<FormData>({
        employee_id:          editingApp?.employee_id ? String(editingApp.employee_id) : '',
        office_department:    (editingApp as any)?.office_department ?? '',
        position:             (editingApp as any)?.position ?? '',
        salary:               (editingApp as any)?.salary ?? '',
        leave_type_id:        editingApp?.leave_type_id ? String(editingApp.leave_type_id) : '',
        leave_type_availed:   editingApp?.leave_type_availed ?? '',
        is_others:            false,
        others_text:          '',
        loc_type:             restoreLocType(),
        loc_ph_text:          !detail?.leave_location?.startsWith('Abroad:') ? (detail?.leave_location ?? '') : '',
        loc_abroad_text:      detail?.leave_location?.startsWith('Abroad:') ? detail.leave_location.replace('Abroad: ', '') : '',
        sick_type:            restoreSickType(),
        sick_hospital_text:   detail?.illness_details?.startsWith('In Hospital:') ? detail.illness_details.replace('In Hospital: ', '') : '',
        sick_outpatient_text: detail?.illness_details?.startsWith('Out Patient:') ? detail.illness_details.replace('Out Patient: ', '') : '',
        illness_women:        detail?.illness_details?.startsWith('Women:') ? detail.illness_details.replace('Women: ', '') : '',
        study_purpose:        detail?.study_leave_purpose ?? '',
        start_date:           editingApp?.start_date ?? '',
        end_date:             editingApp?.end_date ?? '',
        is_requested:         editingApp?.is_requested ?? false,
        is_with_pay:          editingApp?.is_with_pay ?? true,
        recommendation_officer: editingApp?.recommendation_officer ? String(editingApp.recommendation_officer) : '',
        certifying_officer:     (editingApp as any)?.certifying_officer ? String((editingApp as any).certifying_officer) : '',
        status:               editingApp?.status ?? 'Pending',
        for_disapproval_reason: editingApp?.for_disapproval_reason ?? '',
        approval_officer:     editingApp?.approval_officer ? String(editingApp.approval_officer) : '',
        approved_with_pay:    '',
        approved_without_pay: '',
        approved_others:      '',
        disapproved_reason:   editingApp?.disapproved_reason ?? '',
    });

    function buildPayload() {
        const availed = data.is_others ? data.others_text : data.leave_type_availed;
        let leave_location: string | null = null;
        if (data.loc_type === 'ph')     leave_location = data.loc_ph_text;
        if (data.loc_type === 'abroad') leave_location = `Abroad: ${data.loc_abroad_text}`;
        let illness_details: string | null = null;
        if (data.sick_type === 'hospital')   illness_details = `In Hospital: ${data.sick_hospital_text}`;
        if (data.sick_type === 'outpatient') illness_details = `Out Patient: ${data.sick_outpatient_text}`;
        if (data.illness_women)              illness_details = `Women: ${data.illness_women}`;
        const parts: string[] = [];
        if (data.approved_with_pay)    parts.push(`${data.approved_with_pay} days with pay`);
        if (data.approved_without_pay) parts.push(`${data.approved_without_pay} days without pay`);
        if (data.approved_others)      parts.push(data.approved_others);
        return {
            employee_id:            data.employee_id,
            office_department:      data.office_department,
            position:               data.position,
            salary:                 data.salary,
            leave_type_id:          data.leave_type_id || null,
            leave_type_availed:     availed,
            start_date:             data.start_date,
            end_date:               data.end_date,
            is_requested:           data.is_requested,
            is_with_pay:            !!data.approved_with_pay,
            recommendation_officer: data.recommendation_officer || null,
            certifying_officer:     data.certifying_officer || null,
            approval_officer:       data.approval_officer || null,
            status:                 data.status,
            for_disapproval_reason: data.for_disapproval_reason,
            approved_for_specifics: parts.join(' / ') || null,
            disapproved_reason:     data.disapproved_reason,
            leave_location,
            illness_details,
            study_leave_purpose:    data.study_purpose,
        };
    }

    function handleClose() { reset(); setAcknowledged(isEdit); onClose(); }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.employee_id)                           { toast.error('Please select an employee.'); return; }
        if (!data.is_others && !data.leave_type_availed) { toast.error('Please select a leave type.'); return; }
        if (data.is_others && !data.others_text.trim())  { toast.error('Please specify the leave type.'); return; }
        if (!data.start_date || !data.end_date)          { toast.error('Please fill in the inclusive dates.'); return; }
        if (new Date(data.end_date) < new Date(data.start_date)) { toast.error('End date cannot be before start date.'); return; }
        const opts = {
            data: buildPayload(),
            onSuccess: () => { toast.success(isEdit ? 'Updated.' : 'Filed successfully.'); handleClose(); },
            onError:   () => toast.error('Please check the form and try again.'),
        };
        isEdit
            ? put(route('leave.leave-application.update', editingApp!.leave_application_id), opts)
            : post(route('leave.leave-application.store'), opts);
    }

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
            {/* Max width & height match attachment 1's modal style */}
            <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                    <DialogTitle className="text-sm font-semibold">
                        APPLICATION FOR LEAVE
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {!acknowledged
                            ? 'Instructions & Requirements · Please read before proceeding'
                            : 'Civil Service Form No. 6 · Revised 2020 · ANNEX A'}
                    </p>
                </DialogHeader>

                {!acknowledged ? (
                    <InstructionsGate onAcknowledge={() => setAcknowledged(true)} />
                ) : (
                    <LeaveForm
                        data={data}
                        setData={setData as any}
                        errors={errors}
                        employees={employees}
                        leave_types={leave_types}
                        processing={processing}
                        onSubmit={handleSubmit}
                        onClose={handleClose}
                        isEdit={isEdit}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Mobile Detail Modal (ported from attachment 1) ───────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-secondary last:border-0">
            <span className="text-xs text-muted-foreground shrink-0">{label}</span>
            <span className="text-xs text-right">{value}</span>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        'Pending':         'bg-slate-100 text-slate-700 border-slate-200',
        'For Approval':    'bg-green-100 text-green-700 border-green-200',
        'For Disapproval': 'bg-orange-100 text-orange-700 border-orange-200',
        'Approved':        'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Disapproved':     'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] ?? ''}`}>
            {status}
        </span>
    );
}

interface MobileDetailModalProps {
    app: LeaveFiling | null;
    onClose: () => void;
    onEdit: (app: LeaveFiling) => void;
    onDeleted: () => void;
}

function MobileDetailModal({ app, onClose, onEdit, onDeleted }: MobileDetailModalProps) {
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    if (!app) return null;

    function handleDelete() {
        router.delete(route('leave.leave-application.destroy', app!.leave_application_id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Leave application deleted successfully.');
                setConfirmOpen(false);
                onDeleted();
            },
            onError: () => toast.error('Failed to delete leave application.'),
        });
    }

    return (
        <>
            <Dialog open={!!app} onOpenChange={o => !o && onClose()}>
                <DialogContent className="p-0 gap-0 max-w-sm max-h-[85vh] flex flex-col">
                    <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                        <DialogTitle className="text-sm font-semibold pr-6 flex items-center gap-2">
                            Leave Application
                            <StatusPill status={app.status} />
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-5 py-4 overflow-y-auto flex-1 space-y-1">
                        <DetailRow
                            label="Employee"
                            value={(app as any).employee?.employee_name ?? `#${app.employee_id}`}
                        />
                        <DetailRow
                            label="Leave Type"
                            value={app.leave_type_availed ?? '—'}
                        />
                        <DetailRow
                            label="Start Date"
                            value={app.start_date ? toDisplay(app.start_date) : '—'}
                        />
                        <DetailRow
                            label="End Date"
                            value={app.end_date ? toDisplay(app.end_date) : '—'}
                        />
                        <DetailRow
                            label="Commutation"
                            value={app.is_requested ? 'Requested' : 'Not Requested'}
                        />
                        <DetailRow
                            label="Status"
                            value={<StatusPill status={app.status} />}
                        />
                    </div>

                    <DialogFooter className="px-5 py-4 bg-muted/30 shrink-0 flex-row justify-between gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => { onClose(); onEdit(app); }}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this leave application?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the leave application for{' '}
                            <strong>{app.leave_type_availed ?? 'this leave type'}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Desktop Details Dialog ───────────────────────────────────────────────────

function DetailsDialog({ app, onClose }: { app: LeaveFiling | null; onClose: () => void }) {
    if (!app) return null;
    return (
        <Dialog open={!!app} onOpenChange={o => { if (!o) onClose(); }}>
            <DialogContent className="p-0 gap-0 sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                    <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        Leave Application
                        <StatusPill status={app.status} />
                    </DialogTitle>
                </DialogHeader>
                <div className="px-5 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
                    {[
                        { l: 'Employee',    v: (app as any).employee?.employee_name ?? `#${app.employee_id}` },
                        { l: 'Leave Type',  v: app.leave_type_availed ?? '—' },
                        { l: 'Start Date',  v: app.start_date ? toDisplay(app.start_date) : '—' },
                        { l: 'End Date',    v: app.end_date   ? toDisplay(app.end_date)   : '—' },
                        { l: 'Commutation', v: app.is_requested ? 'Requested' : 'Not Requested' },
                        { l: 'Status',      v: <StatusPill status={app.status} /> },
                    ].map(({ l, v }) => (
                        <DetailRow key={l} label={l} value={v} />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Filing', href: route('leave.leave-application.index') },
];

export default function LeaveFilingIndex({
    leave_applications = [],
    employees = [],
    leave_types = [],
    total_applications = 0,
    total_pending = 0,
    total_approved = 0,
    total_disapproved = 0,
}: Props) {
    const isMobile = useIsMobile();

    const [modalOpen,  setModalOpen]  = useState(false);
    const [editingApp, setEditingApp] = useState<LeaveFiling | null>(null);
    const [detailApp,  setDetailApp]  = useState<LeaveFiling | null>(null);

    function openCreate() { setEditingApp(null); setModalOpen(true); }
    function openEdit(app: LeaveFiling) { setEditingApp(app); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setEditingApp(null); }

    function handleRowClick(row: any) {
        setDetailApp(row.original);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Filing" />
            <section className="w-full p-6">
                <section className="max-w-300 grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
                    <StatCard title="Total Applications" value={total_applications} description="All leave applications"   icon={<CalendarDays className="size-4" />} />
                    <StatCard title="Pending"            value={total_pending}      description="Awaiting action"          icon={<Clock className="size-4" />} />
                    <StatCard title="Approved"           value={total_approved}     description="Approved applications"    icon={<CheckCircle className="size-4" />} />
                    <StatCard title="Disapproved"        value={total_disapproved}  description="Disapproved applications" icon={<XCircle className="size-4" />} />
                </section>

                <section className="bg-card p-6 rounded-lg border border-secondary">
                    <DataTable
                        columns={getColumns({ onEdit: openEdit })}
                        data={leave_applications}
                        getRowId={row => String(row.leave_application_id)}
                        onRowClick={handleRowClick}
                        searchColumnId="employee_name"
                        searchPlaceholder="Search by employee name…"
                        filters={[
                            {
                                columnId: 'leave_type_availed',
                                title: 'Leave Type',
                                options: leave_types.map(lt => ({ value: lt.leave_type_name, label: lt.leave_type_name })),
                            },
                            {
                                columnId: 'status',
                                title: 'Status',
                                options: [
                                    { value: 'Pending',         label: 'Pending' },
                                    { value: 'For Approval',    label: 'For Approval' },
                                    { value: 'For Disapproval', label: 'For Disapproval' },
                                    { value: 'Approved',        label: 'Approved' },
                                    { value: 'Disapproved',     label: 'Disapproved' },
                                ],
                            },
                        ]}
                        addButton={{ label: 'File Leave', onClick: openCreate }}
                        // bulkDelete={{
                        //     route: route('leave.leave-application.bulk-destroy'),
                        //     entityName: 'Leave Application',
                        //     getId: (row) => (row as LeaveFiling).leave_application_id,
                        // }}
                    />
                </section>
            </section>

            {/* Mobile detail modal */}
            {isMobile ? (
                <MobileDetailModal
                    app={detailApp}
                    onClose={() => setDetailApp(null)}
                    onEdit={openEdit}
                    onDeleted={() => setDetailApp(null)}
                />
            ) : (
                <DetailsDialog app={detailApp} onClose={() => setDetailApp(null)} />
            )}

            <LeaveModal
                key={editingApp?.leave_application_id ?? 'create'}
                open={modalOpen}
                editingApp={editingApp}
                employees={employees}
                leave_types={leave_types}
                onClose={closeModal}
            />
        </AppLayout>
    );
}