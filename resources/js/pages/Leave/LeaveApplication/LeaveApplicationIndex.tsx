import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table/data-table';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

import { getColumns } from './components/columns';
import type { LeaveFiling } from './data/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

// CS Form No. 6 — Section 6.A (left column, radio list)
const LEAVE_TYPES_6A = [
    'Vacation Leave',
    'Mandatory/Forced Leave',
    'Sick Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Special Privilege Leave',
    'Solo Parent Leave',
    'Study Leave',
    '10-Day VAWC Leave',
    'Rehabilitation Privilege',
    'Special Leave Benefits for Women',
    'Special Emergency (Calamity) Leave',
    'Adoption Leave',
] as const;

// CS Form No. 6 — Section 6.B "Other purpose" (bottom of right column)
const LEAVE_TYPES_OTHER = [
    'Monetization of Leave Credits',
    'Terminal Leave',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
    employee_id: number;
    employee_name: string;
}

interface LeaveType {
    leave_type_id: number;
    leave_type_name: string;
}

type Props = {
    leave_applications: LeaveFiling[];
    employees:          Employee[];
    leave_types:        LeaveType[];
    total_applications: number;
    total_pending:      number;
    total_approved:     number;
    total_disapproved:  number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Filing', href: route('leave.leave-application.index') },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-[10px] text-destructive mt-0.5">{message}</p>;
}

/** Thin bordered cell label, matches form header style */
function CellLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 leading-none">
            {children}
        </p>
    );
}

/** Employee combobox — reused three times */
function EmployeeCombobox({
    employees,
    value,
    onChange,
    placeholder = 'Select employee',
    className = '',
}: {
    employees: Employee[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <Combobox
            items={employees}
            itemToStringValue={(e) => e.employee_name}
            value={employees.find((e) => String(e.employee_id) === value) ?? null}
            onValueChange={(e) => onChange(e ? String(e.employee_id) : '')}
        >
            <ComboboxInput placeholder={placeholder} showClear className={className} />
            <ComboboxContent>
                <ComboboxEmpty>No employees found.</ComboboxEmpty>
                <ComboboxList>
                    {(emp) => (
                        <ComboboxItem key={emp.employee_id} value={emp}>
                            {emp.employee_name}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

// ─── Details Dialog (read-only) ───────────────────────────────────────────────

function DetailsDialog({ app, onClose }: { app: LeaveFiling | null; onClose: () => void }) {
    if (!app) return null;
    const detail = (app as any).detail;
    return (
        <Dialog open={!!app} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        Leave Application Details
                    </DialogTitle>
                </DialogHeader>
                <div className="px-5 py-4 space-y-4 max-h-[500px] overflow-y-auto text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Employee</p>
                            <p className="font-medium">{(app as any).employee?.employee_name ?? `#${app.employee_id}`}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Date Filed</p>
                            <p>{app.date_of_filing}</p>
                        </div>
                    </div>
                    <div className="border-t border-border pt-3 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">6. Details of Application</p>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Leave Type Availed</p>
                            <p>{app.leave_type_availed ?? '—'}</p>
                        </div>
                        {detail && (detail.leave_location || detail.illness_details || detail.study_leave_purpose) && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Details of Leave</p>
                                {detail.leave_location      && <p>{detail.leave_location}</p>}
                                {detail.illness_details     && <p>{detail.illness_details}</p>}
                                {detail.study_leave_purpose && <p>{detail.study_leave_purpose}</p>}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Inclusive Dates</p>
                                <p>{app.start_date} — {app.end_date}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Pay</p>
                                <Badge variant="outline" className="text-xs">{app.is_with_pay ? 'With Pay' : 'Without Pay'}</Badge>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Commutation</p>
                            <p>{app.is_requested ? 'Requested' : 'Not Requested'}</p>
                        </div>
                    </div>
                    <div className="border-t border-border pt-3 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">7. Details of Action</p>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Recommendation</p>
                            {app.status === 'For Approval'    && <p className="text-green-700">For approval</p>}
                            {app.status === 'For Disapproval' && <p className="text-orange-700">For disapproval — {app.for_disapproval_reason ?? '—'}</p>}
                            {!['For Approval','For Disapproval','Approved','Disapproved'].includes(app.status) && <p className="text-muted-foreground">Pending</p>}
                        </div>
                        {app.approved_for_specifics && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Approved For</p>
                                <p className="text-green-700">{app.approved_for_specifics}</p>
                            </div>
                        )}
                        {app.disapproved_reason && (
                            <div>
                                <p className="text-xs text-destructive mb-0.5">Disapproved Due To</p>
                                <p className="text-muted-foreground">{app.disapproved_reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Leave Application Modal (CS Form No. 6 layout) ──────────────────────────

interface LeaveModalProps {
    open:       boolean;
    editingApp: LeaveFiling | null;
    employees:  Employee[];
    leave_types: LeaveType[];
    onClose:    () => void;
}

function LeaveModal({ open, editingApp, employees, leave_types, onClose }: LeaveModalProps) {
    const isEdit = !!editingApp;
    const detail = (editingApp as any)?.detail;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        // Header fields
        employee_id:        editingApp?.employee_id ? String(editingApp.employee_id) : '',
        office_department:  (editingApp as any)?.office_department  ?? '',
        date_of_filing:     editingApp?.date_of_filing ?? new Date().toISOString().slice(0, 10),
        position:           (editingApp as any)?.position ?? '',
        salary:             (editingApp as any)?.salary   ?? '',

        // 6.A
        leave_type_id:      editingApp?.leave_type_id ? String(editingApp.leave_type_id) : '',
        leave_type_availed: editingApp?.leave_type_availed ?? '',

        // 6.B — conditional detail
        leave_in_ph:            detail?.leave_location?.startsWith('Abroad:') ? '' : (detail?.leave_location ?? ''),
        leave_abroad:           detail?.leave_location?.startsWith('Abroad:') ? detail.leave_location.replace('Abroad: ', '') : '',
        illness_in_hospital:    detail?.illness_details?.startsWith('In Hospital:') ? detail.illness_details.replace('In Hospital: ', '') : '',
        illness_out_patient:    detail?.illness_details?.startsWith('Out Patient:') ? detail.illness_details.replace('Out Patient: ', '') : '',
        illness_women:          detail?.illness_details?.startsWith('Women:') ? detail.illness_details.replace('Women: ', '') : '',
        study_leave_purpose:    detail?.study_leave_purpose ?? '',

        // 6.C
        start_date: editingApp?.start_date ?? '',
        end_date:   editingApp?.end_date   ?? '',
        is_with_pay: editingApp?.is_with_pay ?? true,

        // 6.D
        is_requested: editingApp?.is_requested ?? false,

        // 7 — Officers
        recommendation_officer: editingApp?.recommendation_officer ? String(editingApp.recommendation_officer) : '',
        approval_officer:       editingApp?.approval_officer       ? String(editingApp.approval_officer)       : '',

        // 7.B
        status:                 editingApp?.status ?? 'Pending',
        for_disapproval_reason: editingApp?.for_disapproval_reason ?? '',

        // 7.C
        approved_for_specifics: editingApp?.approved_for_specifics ?? '',

        // 7.D
        disapproved_reason: editingApp?.disapproved_reason ?? '',
    });

    // 6.B visibility
    const showLocation = ['Vacation Leave', 'Mandatory/Forced Leave', 'Special Privilege Leave'].includes(data.leave_type_availed);
    const showSick     = ['Sick Leave', 'Rehabilitation Privilege'].includes(data.leave_type_availed);
    const showWomen    = data.leave_type_availed === 'Special Leave Benefits for Women';
    const showStudy    = data.leave_type_availed === 'Study Leave';

    function pickLeave(lt: string) {
        setData('leave_type_availed', lt);
        // clear all detail fields when type changes
        setData('leave_in_ph', '');
        setData('leave_abroad', '');
        setData('illness_in_hospital', '');
        setData('illness_out_patient', '');
        setData('illness_women', '');
        setData('study_leave_purpose', '');
    }

    function buildDetailFields() {
        // Collapse detail sub-fields back into the three DB columns
        let leave_location   = '';
        let illness_details  = '';
        const study_leave_purpose = data.study_leave_purpose;

        if (data.leave_abroad)         leave_location  = `Abroad: ${data.leave_abroad}`;
        else if (data.leave_in_ph)     leave_location  = data.leave_in_ph;

        if (data.illness_in_hospital)  illness_details = `In Hospital: ${data.illness_in_hospital}`;
        else if (data.illness_out_patient) illness_details = `Out Patient: ${data.illness_out_patient}`;
        else if (data.illness_women)   illness_details = `Women: ${data.illness_women}`;

        return { leave_location, illness_details, study_leave_purpose };
    }

    function handleClose() { reset(); onClose(); }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const detailFields = buildDetailFields();
        
        // Update form data with detail fields before submitting
        Object.entries(detailFields).forEach(([key, value]) => {
            setData(key as any, value as any);
        });

        if (isEdit) {
            put(route('leave.leave-application.update', editingApp!.leave_application_id), {
                onSuccess: () => { toast.success('Leave application updated.'); handleClose(); },
                onError:   () => toast.error('Failed to update leave application.'),
            });
        } else {
            post(route('leave.leave-application.store'), {
                onSuccess: () => { toast.success('Leave application filed.'); handleClose(); },
                onError:   () => toast.error('Failed to file leave application.'),
            });
        }
    }

    // ── Shared radio item styles ──
    const radioItem = 'flex items-start gap-1.5 cursor-pointer text-[11px] leading-tight py-0.5 px-1 rounded hover:bg-muted/60';
    const radioItemDisabled = 'flex items-start gap-1.5 cursor-pointer text-[11px] leading-tight py-0.5 px-1 rounded opacity-40';

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="p-0 gap-0 sm:max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">

                {/* Dialog Header */}
                <DialogHeader className="px-5 py-3 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {isEdit ? 'Edit Leave Application' : 'File Leave Application'}
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                            Civil Service Form No. 6 — Revised 2020
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto flex-1 px-5 py-4">

                        {/* ══════════════════════════════════════════════════════
                            HEADER — Fields 1–5
                        ══════════════════════════════════════════════════════ */}
                        <div className="border border-border rounded-md overflow-hidden mb-0">

                            {/* Row 1: Office/Dept | Name */}
                            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                                <div className="px-3 py-2">
                                    <CellLabel>1. Office / Department</CellLabel>
                                    <Input
                                        value={data.office_department}
                                        onChange={(e) => setData('office_department', e.target.value)}
                                        placeholder="e.g. Administrative Division"
                                        className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
                                    />
                                </div>
                                <div className="px-3 py-2">
                                    <CellLabel>2. Name (Last, First, Middle) <span className="text-destructive">*</span></CellLabel>
                                    <EmployeeCombobox
                                        employees={employees}
                                        value={data.employee_id}
                                        onChange={(v) => setData('employee_id', v)}
                                        placeholder="Search employee..."
                                        className="h-7 text-xs border-0 shadow-none focus-visible:ring-0"
                                    />
                                    <FieldError message={errors.employee_id} />
                                </div>
                            </div>

                            {/* Row 2: Date of Filing | Position | Salary */}
                            <div className="grid grid-cols-3 divide-x divide-border">
                                <div className="px-3 py-2">
                                    <CellLabel>3. Date of Filing <span className="text-destructive">*</span></CellLabel>
                                    <Input
                                        type="date"
                                        value={data.date_of_filing}
                                        onChange={(e) => setData('date_of_filing', e.target.value)}
                                        className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
                                    />
                                    <FieldError message={errors.date_of_filing} />
                                </div>
                                <div className="px-3 py-2">
                                    <CellLabel>4. Position</CellLabel>
                                    <Input
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        placeholder="Position title"
                                        className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
                                    />
                                </div>
                                <div className="px-3 py-2">
                                    <CellLabel>5. Salary</CellLabel>
                                    <Input
                                        value={data.salary}
                                        onChange={(e) => setData('salary', e.target.value)}
                                        placeholder="Monthly salary"
                                        className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ══════════════════════════════════════════════════════
                            SECTION 6 — Details of Application
                        ══════════════════════════════════════════════════════ */}
                        <div className="border-x border-b border-border">
                            <div className="bg-muted/50 border-b border-border py-1">
                                <p className="text-[11px] font-bold text-center uppercase tracking-widest">
                                    6. Details of Application
                                </p>
                            </div>

                            {/* 6.A | 6.B */}
                            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

                                {/* ── 6.A — Type of Leave ── */}
                                <div className="px-3 py-2">
                                    <CellLabel>
                                        6.A Type of Leave to be Availed of{' '}
                                        <span className="text-destructive">*</span>
                                    </CellLabel>
                                    <div className="mt-1 space-y-0.5">
                                        {LEAVE_TYPES_6A.map((lt) => (
                                            <label key={lt} className={radioItem}>
                                                <input
                                                    type="radio"
                                                    name="leave_type_availed"
                                                    value={lt}
                                                    checked={data.leave_type_availed === lt}
                                                    onChange={() => pickLeave(lt)}
                                                    className="mt-0.5 accent-primary shrink-0"
                                                />
                                                <span>{lt}</span>
                                            </label>
                                        ))}
                                        <div className="mt-2 pt-2 border-t border-dashed border-border">
                                            <p className="text-[10px] text-muted-foreground mb-1 italic">Others:</p>
                                            <Input
                                                value={
                                                    !LEAVE_TYPES_6A.includes(data.leave_type_availed as any) &&
                                                    !LEAVE_TYPES_OTHER.includes(data.leave_type_availed as any)
                                                        ? data.leave_type_availed
                                                        : ''
                                                }
                                                onChange={(e) => setData('leave_type_availed', e.target.value)}
                                                placeholder="Specify other leave type"
                                                className="h-6 text-[11px]"
                                            />
                                        </div>
                                    </div>
                                    <FieldError message={errors.leave_type_availed} />
                                </div>

                                {/* ── 6.B — Details of Leave ── */}
                                <div className="px-3 py-2 space-y-3">
                                    <CellLabel>6.B Details of Leave</CellLabel>

                                    {/* Vacation / Special Privilege Leave */}
                                    <div>
                                        <p className="text-[10px] italic text-muted-foreground mb-1">
                                            In case of Vacation/Special Privilege Leave:
                                        </p>
                                        <div className="space-y-1.5">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">Within the Philippines</p>
                                                <Input
                                                    value={data.leave_in_ph}
                                                    onChange={(e) => { setData('leave_in_ph', e.target.value); setData('leave_abroad', ''); }}
                                                    disabled={!showLocation}
                                                    placeholder={showLocation ? 'Specify location' : ''}
                                                    className="h-6 text-[11px]"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">Abroad (Specify)</p>
                                                <Input
                                                    value={data.leave_abroad}
                                                    onChange={(e) => { setData('leave_abroad', e.target.value); setData('leave_in_ph', ''); }}
                                                    disabled={!showLocation}
                                                    placeholder={showLocation ? 'Country / city' : ''}
                                                    className="h-6 text-[11px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sick Leave */}
                                    <div>
                                        <p className="text-[10px] italic text-muted-foreground mb-1">
                                            In case of Sick Leave:
                                        </p>
                                        <div className="space-y-1.5">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">In Hospital (Specify Illness)</p>
                                                <Input
                                                    value={data.illness_in_hospital}
                                                    onChange={(e) => { setData('illness_in_hospital', e.target.value); setData('illness_out_patient', ''); }}
                                                    disabled={!showSick}
                                                    placeholder={showSick ? 'Specify illness' : ''}
                                                    className="h-6 text-[11px]"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">Out Patient (Specify Illness)</p>
                                                <Input
                                                    value={data.illness_out_patient}
                                                    onChange={(e) => { setData('illness_out_patient', e.target.value); setData('illness_in_hospital', ''); }}
                                                    disabled={!showSick}
                                                    placeholder={showSick ? 'Specify illness' : ''}
                                                    className="h-6 text-[11px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Special Leave Benefits for Women */}
                                    <div>
                                        <p className="text-[10px] italic text-muted-foreground mb-1">
                                            In case of Special Leave Benefits for Women:
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">(Specify Illness)</p>
                                        <Input
                                            value={data.illness_women}
                                            onChange={(e) => setData('illness_women', e.target.value)}
                                            disabled={!showWomen}
                                            placeholder={showWomen ? 'Specify illness' : ''}
                                            className="h-6 text-[11px]"
                                        />
                                    </div>

                                    {/* Study Leave */}
                                    <div>
                                        <p className="text-[10px] italic text-muted-foreground mb-1">
                                            In case of Study Leave:
                                        </p>
                                        <div className="space-y-0.5">
                                            {["Completion of Master's Degree", 'BAR/Board Examination Review'].map((opt) => (
                                                <label key={opt} className={showStudy ? radioItem : radioItemDisabled}>
                                                    <input
                                                        type="radio"
                                                        name="study_leave_purpose"
                                                        value={opt}
                                                        checked={data.study_leave_purpose === opt}
                                                        onChange={() => setData('study_leave_purpose', opt)}
                                                        disabled={!showStudy}
                                                        className="mt-0.5 accent-primary shrink-0"
                                                    />
                                                    <span>{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Other Purpose */}
                                    <div>
                                        <p className="text-[10px] italic text-muted-foreground mb-1">Other purpose:</p>
                                        <div className="space-y-0.5">
                                            {LEAVE_TYPES_OTHER.map((lt) => (
                                                <label key={lt} className={radioItem}>
                                                    <input
                                                        type="radio"
                                                        name="leave_type_availed"
                                                        value={lt}
                                                        checked={data.leave_type_availed === lt}
                                                        onChange={() => pickLeave(lt)}
                                                        className="mt-0.5 accent-primary shrink-0"
                                                    />
                                                    <span>{lt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 6.C | 6.D */}
                            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

                                {/* ── 6.C — Number of Working Days / Inclusive Dates ── */}
                                <div className="px-3 py-2 space-y-2">
                                    <CellLabel>
                                        6.C Number of Working Days Applied For{' '}
                                        <span className="text-destructive">*</span>
                                    </CellLabel>
                                    <p className="text-[10px] text-muted-foreground -mt-1">Inclusive Dates</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">Start Date</p>
                                            <Input
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                className="h-7 text-xs"
                                            />
                                            <FieldError message={errors.start_date} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">End Date</p>
                                            <Input
                                                type="date"
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                                className="h-7 text-xs"
                                            />
                                            <FieldError message={errors.end_date} />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer text-[11px] mt-1">
                                        <Checkbox
                                            checked={data.is_with_pay}
                                            onCheckedChange={(v) => setData('is_with_pay', !!v)}
                                        />
                                        With Pay
                                    </label>
                                </div>

                                {/* ── 6.D — Commutation ── */}
                                <div className="px-3 py-2">
                                    <CellLabel>6.D Commutation</CellLabel>
                                    <RadioGroup
                                        value={data.is_requested ? 'requested' : 'not_requested'}
                                        onValueChange={(v) => setData('is_requested', v === 'requested')}
                                        className="mt-2 space-y-2"
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                                            <RadioGroupItem value="not_requested" id="comm_no" />
                                            Not Requested
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                                            <RadioGroupItem value="requested" id="comm_yes" />
                                            Requested
                                        </label>
                                    </RadioGroup>
                                </div>
                            </div>
                        </div>

                        {/* ══════════════════════════════════════════════════════
                            SECTION 7 — Details of Action on Application
                        ══════════════════════════════════════════════════════ */}
                        <div className="border-x border-b border-border rounded-b-md overflow-hidden">
                            <div className="bg-muted/50 border-b border-border py-1">
                                <p className="text-[11px] font-bold text-center uppercase tracking-widest">
                                    7. Details of Action on Application
                                </p>
                            </div>

                            {/* 7.A | 7.B */}
                            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

                                {/* ── 7.A — Certification of Leave Credits ── */}
                                <div className="px-3 py-2 space-y-2">
                                    <CellLabel>7.A Certification of Leave Credits</CellLabel>
                                    {/* Read-only display — filled by HR */}
                                    <div className="border border-dashed border-border rounded p-2">
                                        <p className="text-[10px] text-muted-foreground mb-1">As of: _______________</p>
                                        <table className="w-full text-[10px] text-muted-foreground border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="text-left font-normal pb-0.5 w-1/2"></th>
                                                    <th className="text-center font-semibold pb-0.5">Vacation Leave</th>
                                                    <th className="text-center font-semibold pb-0.5">Sick Leave</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['Total Earned', 'Less this application', 'Balance'].map((r) => (
                                                    <tr key={r} className="border-t border-border/40">
                                                        <td className="py-0.5 italic">{r}</td>
                                                        <td className="text-center py-0.5">—</td>
                                                        <td className="text-center py-0.5">—</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p className="text-[9px] text-muted-foreground mt-1 text-center italic">(Authorized Officer)</p>
                                    </div>

                                    {/* Recommending Officer */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-1">
                                            Recommending Officer <span className="text-destructive">*</span>
                                        </p>
                                        <EmployeeCombobox
                                            employees={employees}
                                            value={data.recommendation_officer}
                                            onChange={(v) => setData('recommendation_officer', v)}
                                            placeholder="Select recommending officer"
                                            className="text-xs"
                                        />
                                        <FieldError message={errors.recommendation_officer} />
                                    </div>
                                </div>

                                {/* ── 7.B — Recommendation ── */}
                                <div className="px-3 py-2 space-y-2">
                                    <CellLabel>7.B Recommendation</CellLabel>
                                    <RadioGroup
                                        value={
                                            data.status === 'For Approval'    ? 'for_approval'    :
                                            data.status === 'For Disapproval' ? 'for_disapproval' :
                                            'pending'
                                        }
                                        onValueChange={(v) => {
                                            if (v === 'for_approval')    setData('status', 'For Approval');
                                            if (v === 'for_disapproval') setData('status', 'For Disapproval');
                                            if (v === 'pending')         setData('status', 'Pending');
                                        }}
                                        className="space-y-2"
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                                            <RadioGroupItem value="pending" id="rec_pending" />
                                            Pending
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                                            <RadioGroupItem value="for_approval" id="rec_approve" />
                                            For approval
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                                            <RadioGroupItem value="for_disapproval" id="rec_disapprove" />
                                            For disapproval due to:
                                        </label>
                                    </RadioGroup>
                                    {data.status === 'For Disapproval' && (
                                        <Textarea
                                            value={data.for_disapproval_reason}
                                            onChange={(e) => setData('for_disapproval_reason', e.target.value)}
                                            placeholder="State the reason..."
                                            rows={3}
                                            className="text-xs resize-none mt-1"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 7.C | 7.D */}
                            <div className="grid grid-cols-2 divide-x divide-border">

                                {/* ── 7.C — Approved For ── */}
                                <div className="px-3 py-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <CellLabel>7.C Approved For:</CellLabel>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
                                            <Checkbox
                                                checked={data.status === 'Approved'}
                                                onCheckedChange={(v) => setData('status', v ? 'Approved' : 'Pending')}
                                            />
                                            Mark Approved
                                        </label>
                                    </div>
                                    <div className="space-y-1 text-[11px] text-muted-foreground">
                                        <p>_____ days with pay</p>
                                        <p>_____ days without pay</p>
                                        <p>_____ others (Specify)</p>
                                    </div>
                                    {data.status === 'Approved' && (
                                        <Input
                                            value={data.approved_for_specifics}
                                            onChange={(e) => setData('approved_for_specifics', e.target.value)}
                                            placeholder="e.g. 5 days with pay"
                                            className="h-7 text-xs"
                                        />
                                    )}
                                    {/* Approving Officer lives under 7.C per the form */}
                                    <div className="pt-2 border-t border-dashed border-border mt-2">
                                        <p className="text-[10px] text-muted-foreground mb-1">
                                            Approving Officer <span className="text-destructive">*</span>
                                        </p>
                                        <EmployeeCombobox
                                            employees={employees}
                                            value={data.approval_officer}
                                            onChange={(v) => setData('approval_officer', v)}
                                            placeholder="Select approving officer"
                                            className="text-xs"
                                        />
                                        <FieldError message={errors.approval_officer} />
                                        <p className="text-[9px] text-muted-foreground mt-1 text-center italic">(Authorized Official)</p>
                                    </div>
                                </div>

                                {/* ── 7.D — Disapproved Due To ── */}
                                <div className="px-3 py-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <CellLabel>7.D Disapproved Due To:</CellLabel>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
                                            <Checkbox
                                                checked={data.status === 'Disapproved'}
                                                onCheckedChange={(v) => setData('status', v ? 'Disapproved' : 'Pending')}
                                            />
                                            Mark Disapproved
                                        </label>
                                    </div>
                                    {data.status === 'Disapproved' ? (
                                        <Textarea
                                            value={data.disapproved_reason}
                                            onChange={(e) => setData('disapproved_reason', e.target.value)}
                                            placeholder="State the reason for disapproval..."
                                            rows={5}
                                            className="text-xs resize-none"
                                        />
                                    ) : (
                                        <div className="space-y-2 text-[11px] text-muted-foreground">
                                            <p className="border-b border-border pb-1">___________________________________</p>
                                            <p className="border-b border-border pb-1">___________________________________</p>
                                            <p className="border-b border-border pb-1">___________________________________</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30 shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? 'Saving...' : isEdit ? 'Update' : 'File Leave'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaveFilingIndex({
    leave_applications = [],
    employees          = [],
    leave_types        = [],
    total_applications = 0,
    total_pending      = 0,
    total_approved     = 0,
    total_disapproved  = 0,
}: Props) {
    const [modalOpen,  setModalOpen]  = useState(false);
    const [editingApp, setEditingApp] = useState<LeaveFiling | null>(null);
    const [detailApp,  setDetailApp]  = useState<LeaveFiling | null>(null);

    function openCreate() { setEditingApp(null); setModalOpen(false); }
    function openEdit(app: LeaveFiling) { setEditingApp(app); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setEditingApp(null); }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Filing" />

            <section className="w-full p-6">

                {/* Stat Cards */}
                <section className="max-w-300 grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
                    <StatCard
                        title="Total Applications"
                        value={total_applications}
                        description="All leave applications"
                        icon={<CalendarDays className="size-4" />}
                    />
                    <StatCard
                        title="Pending"
                        value={total_pending}
                        description="Awaiting action"
                        icon={<Clock className="size-4" />}
                    />
                    <StatCard
                        title="Approved"
                        value={total_approved}
                        description="Approved applications"
                        icon={<CheckCircle className="size-4" />}
                    />
                    <StatCard
                        title="Disapproved"
                        value={total_disapproved}
                        description="Disapproved applications"
                        icon={<XCircle className="size-4" />}
                    />
                </section>

                {/* Table */}
                <section className="bg-card p-6 rounded-lg border border-secondary">
                    <DataTable
                        columns={getColumns({ onEdit: openEdit })}
                        data={leave_applications}
                        getRowId={(row) => String(row.leave_application_id)}
                        // onRowClick={(row) => setDetailApp(row.original)}
                        searchColumnId="employee_name"
                        searchPlaceholder="Search by employee..."
                        filters={[
                            {
                                columnId: 'leave_type_availed',
                                title: 'Leave Type',
                                options: Array.from(
                                    new Set(leave_applications.map((a) => a.leave_type_availed).filter(Boolean))
                                ).map((v) => ({ value: v as string, label: v as string })),
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
                    />
                </section>
            </section>

            <DetailsDialog app={detailApp} onClose={() => setDetailApp(null)} />

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