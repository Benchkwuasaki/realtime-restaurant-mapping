import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2, Plus } from 'lucide-react';
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

import { format, parse, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';

import { getColumns } from './components/columns';
import type { ActionMode } from './components/columns';
import type { LeaveFiling } from './data/schema';
import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';



//  Types 

interface Employee {
    employee_id: number;
    employee_name: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    sex?: number;
    department_name?: string;
    position_name?: string;
    monthly_salary?: string;
    vl_total_earned?: number | string;
    vl_balance?: number | string;
    sl_total_earned?: number | string;
    sl_balance?: number | string;
}

interface LeaveEntitlement {
    leave_entitlement_id: number;
    leave_type_id: number;
    leave_type_name: string;
    leave_entitlement_description?: string | null;
    years_of_service: number;
    days_entitled: number;
    is_paid: boolean;
    eligible_sex: 'All' | 'Male' | 'Female' | null;
}

type Props = {
    leave_applications: LeaveFiling[];
    employees: Employee[];
    leave_entitlements: LeaveEntitlement[];
    total_applications: number;
    total_pending: number;
    total_approved: number;
    total_disapproved: number;
    auth_employee_id?: number | null;
    hr_admin_employee_ids?: number[];
    dto_employee_ids?: number[];
};

//  Helpers 


/**
 * Compute number of working days between two dates
 * Weekends (Saturday and Sunday) are not counted
 */
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


/**
 * Returns today's date label for display
 */
function todayLabel() {
    return new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}


/**
 * Add working days to a start date
 * Skips weekends
 */
function addWorkingDays(startIso: string, workingDays: number): string {

    // split YYYY-MM-DD
    const [y, m, d] = startIso.split('-').map(Number);

    // month - 1 because JS months start at 0
    const cur = new Date(y, m - 1, d);
    let counted = 0;

    // loop until required working days are counted
    while (counted < workingDays) {
        const day = cur.getDay();

        // count weekdays only
        if (day !== 0 && day !== 6) counted++;

        // move forward if we still need more days
        if (counted < workingDays) cur.setDate(cur.getDate() + 1);
    }
    return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
}


/**
 * Check if leave type uses accrual credits
 * (vacation, sick, mandatory/forced, special privilege)
 */
function isAccrualLeave(name: string): boolean {
    return /vacation|sick|mandatory|forced|special privilege/i.test(name);
}


/**
 * Convert date to MM/DD/YYYY format
 */
function toDisplay(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');

    // if format is not valid, return original
    if (!y || !m || !d) return iso;
    return `${m}/${d}/${y}`;
}


/**
 * Show validation error under a field
 */
function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {message}
        </p>
    );
}


/**
 * Reusable date input with calendar popover
 * Uses ISO format internally (yyyy-MM-dd)
 */
function DateInput({
    value, onChange, placeholder = 'mm/dd/yyyy', disabled = false,
}: {
    value: string; onChange: (isoValue: string) => void;
    placeholder?: string; disabled?: boolean;
}) {
    // convert ISO string into date object
    const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

    // ensure date is valid before passing to calendar
    const selected = parsed && isValid(parsed) ? parsed : undefined;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start font-normal shadow-none',

                        // show muted color if no date selected
                        !selected && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />

                    {/* show formatted date or placeholder */}
                    {selected ? format(selected, 'MM/dd/yyyy') : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}

                    // convert calendar date back to ISO format
                    onSelect={day => onChange(day ? format(day, 'yyyy-MM-dd') : '')}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// function SqCheck({
//     checked, onChange, label, law, disabled = false,
// }: {
//     checked: boolean; onChange: () => void; label: string; law?: string; disabled?: boolean;
// }) {
//     return (
//         <label
//             className={`flex items-start gap-2 py-0.5 select-none
//                 ${disabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}`}
//             onClick={onChange}
//         >
//             <span
//                 className={`mt-px w-3 h-3 shrink-0 border flex items-center justify-center rounded-sm
//                     transition-colors ${checked ? 'bg-primary border-primary' : 'border-input bg-background'}`}
//             >
//                 {checked && (
//                     <svg className="w-2 h-2 text-primary-foreground" viewBox="0 0 10 8" fill="none">
//                         <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8"
//                             strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                 )}
//             </span>
//             <span className="text-xs leading-snug text-foreground">
//                 {label}
//                 {law && <span className="text-muted-foreground text-[10px]"> ({law})</span>}
//             </span>
//         </label>
//     );
// }


/**
 * checkbox used in leave options
 */
function SqCheck({
    checked, onChange, label, law, disabled = false,
}: {
    checked: boolean; onChange: () => void; label: string; law?: string; disabled?: boolean;
}) {
    return (
        <label
            className={`flex items-start gap-2 py-0.5 select-none
                ${disabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}`}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={() => onChange()}
                disabled={disabled}

            />
            <span className="text-xs leading-snug text-foreground">
                {label}
                {law && (
                    <span className="text-muted-foreground text-[10px]"> ({law})</span>
                )}
            </span>
        </label>
    );
}

// // Read-only square checkbox (for view modal)
// function ROCheck({ checked, label }: { checked: boolean; label: string }) {
//     return (
//         <div className="flex items-start gap-2 py-0.5">
//             <span className={`mt-px w-3 h-3 shrink-0 border flex items-center justify-center rounded-sm
//                 ${checked ? 'bg-primary border-primary' : 'border-input bg-muted/20'}`}>
//                 {checked && (
//                     <svg className="w-2 h-2 text-primary-foreground" viewBox="0 0 10 8" fill="none">
//                         <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8"
//                             strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                 )}
//             </span>
//             <span className="text-xs leading-snug text-foreground">{label}</span>
//         </div>
//     );
// }


/**
 * Read-only checkbox used in view mode
 */
function ROCheck({ checked, label }: { checked: boolean; label: string }) {
    return (
        <div className="flex items-start gap-2 py-0.5">
            <Checkbox
                checked={checked}
                className="pointer-events-none"
            />
            <span className="text-xs leading-snug text-foreground">{label}</span>
        </div>
    );
}


// Section header
const SH = ({ children }: { children: React.ReactNode }) =>
    <p className="text-xs font-semibold text-foreground mb-2">{children}</p>;

// Section header
const Sub = ({ children }: { children: React.ReactNode }) =>
    <p className="text-xs font-medium text-muted-foreground mb-1.5">{children}</p>;

// Small italic helper text
const Italic = ({ children }: { children: React.ReactNode }) =>
    <p className="text-[10.5px] italic text-muted-foreground mb-1">{children}</p>;


/**
 * OfficerBlock
 *
 * Reusable UI block for selecting an officer (Authorized Officer / Authorized Official).
 * Displays an EmployeeCombobox and optional validation error.
 */
function OfficerBlock({
    label, value, onChange, employees, error,
}: {
    label: string; value: string; onChange: (v: string) => void;
    employees: Employee[]; error?: string;
}) {

    /**
     * Formats the employee display name as:
     * Lastname, Firstname Middlename
     *
     * Falls back to employee_name if structured name fields are missing.
     */
    const displayName = (emp: Employee) => emp.last_name
        ? `${emp.last_name}, ${emp.first_name ?? ''} ${emp.middle_name ?? ''}`.trim()
        : emp.employee_name;
    return (
        <div className="flex flex-col items-center mt-6">
            <div className="w-56">
                <EmployeeCombobox
                    value={value}
                    onChange={onChange}
                    employees={employees}
                    placeholder={`Select ${label}…`}
                />
                <FieldError message={error} />
            </div>
            <p className="text-[10px] italic text-muted-foreground">({label})</p>
        </div>
    );
}

/**
 * List of instructions and documentary requirements
 * shown before the user proceeds to the Leave Application form.
 *
 * These correspond to the official CSC Form No. 6 instructions.
 */
const INSTRUCTIONS = [
    { n: 1, t: 'Vacation leave*', b: 'It shall be filed five (5) days in advance, whenever possible. Vacation leave within the Philippines or abroad shall be indicated for purposes of securing travel authority.' },
    { n: 2, t: 'Mandatory/Forced leave', b: 'Annual five-day vacation leave shall be forfeited if not taken during the year. Availment of one (1) day or more VL shall be considered for complying the mandatory/forced leave.' },
    { n: 3, t: 'Sick leave*', b: "Filed immediately upon employee's return. If filed in advance or exceeding five (5) days, accompanied by a medical certificate or affidavit." },
    { n: 4, t: 'Maternity leave* – 105 days', b: "Proof of pregnancy e.g. ultrasound, doctor's certificate. Accomplished CS Form No. 6a if needed." },
    { n: 5, t: 'Paternity leave – 7 days', b: "Proof of child's delivery e.g. birth certificate, medical certificate and marriage contract." },
    { n: 6, t: 'Special Privilege leave – 3 days', b: 'Filed/approved at least one (1) week prior to availment. Indicate if within the Philippines or abroad.' },
    { n: 7, t: 'Solo Parent leave – 7 days', b: 'Filed in advance or whenever possible five (5) days before going on such leave with updated Solo Parent ID.' },
    { n: 8, t: 'Study leave* – up to 6 months', b: "Shall meet the agency's internal requirements. Contract between the agency head and the employee concerned." },
    { n: 9, t: 'VAWC leave – 10 days', b: 'File in advance or immediately upon return. Requires Barangay Protection Order, TPO/PPO, or certification from Punong Barangay/Prosecutor.' },
    { n: 10, t: 'Rehabilitation leave* – up to 6 months', b: 'Within one (1) week from the accident. Requires police report, medical certificate, and concurrence of a government physician.' },
    { n: 11, t: 'Special leave benefits for women* – up to 2 months', b: 'File at least five (5) days prior to scheduled gynecological surgery. Medical certificate from attending surgeon required.' },
    { n: 12, t: 'Special Emergency (Calamity) leave – up to 5 days', b: 'Maximum five (5) straight working days or staggered within thirty (30) days of the calamity. Enjoyed once a year only.' },
    { n: 13, t: 'Monetization of leave credits', b: 'Application for monetization of 50% or more of accumulated leave credits with letter request stating valid reasons.' },
    { n: 14, t: 'Terminal leave*', b: "Proof of employee's resignation, retirement, or separation from the service." },
    { n: 15, t: 'Adoption Leave', b: 'Filed with an authenticated copy of the Pre-Adoptive Placement Authority issued by the DSWD.' },
];


/**
 * InstructionsGate
 *
 * Modal screen shown before accessing the leave form.
 * Forces the user to acknowledge that they read the instructions
 * before proceeding with the application.
 */
function InstructionsGate({ onAcknowledge }: { onAcknowledge: () => void }) {

    // Tracks whether the user checked the acknowledgment checkbox
    const [checked, setChecked] = useState(false);
    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* Header explanation */}
            <div className="px-5 py-3 border-b border-secondary">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Application for any type of leave shall be made on this Form and to be{' '}
                    <span className="font-semibold text-foreground underline">
                        accomplished at least in duplicate
                    </span>{' '}
                    with documentary requirements, as follows:
                </p>
            </div>

            {/* Scrollable instructions list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">

                    {/* Render instructions dynamically */}
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

                {/* Footnote from CSC guidelines */}
                <p className="text-[10px] text-muted-foreground italic mt-4 pt-4 border-t border-secondary">
                    * For leave of absence for thirty (30) calendar days or more and terminal leave, application
                    shall be accompanied by a clearance from money, property and work-related accountabilities
                    (CSC MC No. 2, s. 1985).
                </p>
            </div>

            {/* Acknowledgment section */}
            <div className="border-t border-secondary bg-muted/30 px-5 py-3 shrink-0">
                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                        checked={checked}
                        onCheckedChange={v => setChecked(!!v)}
                        className="mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                        I have read and understood the Instructions and Requirements for filing a Leave
                        Application under Civil Service Form No. 6 (Revised 2020).
                    </span>
                </label>
                <div className="mt-3 flex justify-end">
                    <Button size="sm" disabled={!checked} onClick={() => checked && onAcknowledge()}>
                        Proceed to Application →
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Form Data 
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
    other_purpose: string;
    monetization_vl_days: string;
    monetization_sl_days: string;
    start_date: string;
    end_date: string;
    is_requested: boolean;
    is_with_pay: boolean;
    recommendation_officer: string;
    status: string;
    for_disapproval_reason: string;
    approval_officer: string;
    approved_with_pay: string;
    approved_without_pay: string;
    approved_others: string;
    disapproved_reason: string;
}

function useFormValid(data: FormData): boolean {
    return useMemo(() => {

        /** Basic required fields */
        if (!data.employee_id) return false;
        if (!data.office_department.trim()) return false;
        if (!data.position.trim()) return false;
        if (!data.salary.trim()) return false;

        /**
        * Validate leave type selection
        */
        if (!data.other_purpose) {
            if (!data.is_others && !data.leave_type_availed) return false;
            if (data.is_others && !data.others_text.trim()) return false;
        }

        // Resolve actual leave type name
        const availed = data.is_others ? data.others_text : data.leave_type_availed;


        /**
        * Date validation
        */
        if (!data.other_purpose) {
            if (!data.start_date || !data.end_date) return false;

            // End date cannot be before start date
            if (new Date(data.end_date) < new Date(data.start_date)) return false;

            /**
            * Apply policy limits for specific leave types
            * SPL capped at 3 days, Mandatory/Forced capped at 5 days
            */
            const wd = computeWorkingDays(data.start_date, data.end_date);
            if (/special privilege/i.test(availed ?? '') && wd > 3) return false;
            if (/mandatory|forced/i.test(availed ?? '') && wd > 5) return false;
        }

        /**
        * Monetization validation
        */
        if (data.other_purpose === 'Monetization of Leave Credits') {
            const vlDays = parseFloat(data.monetization_vl_days) || 0;
            const slDays = parseFloat(data.monetization_sl_days) || 0;
            if (vlDays < 0 || slDays < 0) return false;

            // CSC rule: minimum of 10 leave credits to monetize
            if (vlDays + slDays < 10) return false;
        }

        /**
        * Determine which additional sections must be filled
        */
        const showLoc = /vacation|special privilege/i.test(availed);
        const showSick = /sick|rehabilitation/i.test(availed);
        const showWomen = /women/i.test(availed);

        /**
        * Vacation / SPL location requirement
        */
        if (showLoc) {
            if (!data.loc_type) return false;
            if (data.loc_type === 'ph' && !data.loc_ph_text.trim()) return false;
            if (data.loc_type === 'abroad' && !data.loc_abroad_text.trim()) return false;
        }

        /**
         * Sick leave illness requirement
         */
        if (showSick) {
            if (!data.sick_type) return false;
            if (data.sick_type === 'hospital' && !data.sick_hospital_text.trim()) return false;
            if (data.sick_type === 'outpatient' && !data.sick_outpatient_text.trim()) return false;
        }

        /**
         * Women leave illness description
         */
        if (showWomen && !data.illness_women.trim()) return false;

        /**
        * Officer approvals
        */
        if (!data.recommendation_officer) return false;
        if (!data.approval_officer) return false;

        return true;
    }, [data]);
}

/**
 * Returns the formatted full name of an employee.
 * Uses structured name fields when available.
 * Falls back to employee_name if last_name is missing.
 */
function getFullName(e: Employee) {
    return e.last_name
        ? `${e.first_name ?? ''} ${e.middle_name ?? ''} ${e.last_name}`.trim()
        : e.employee_name;
}

/**
 * EmployeeCombobox
 *
 * Searchable dropdown for selecting an employee.
 * Uses a Popover + Command pattern for searchable lists.
 */
function EmployeeCombobox({
    id, placeholder = 'Select employee…', value, onChange, employees,
}: {
    id?: string; placeholder?: string; value: string;
    onChange: (value: string) => void; employees: Employee[];
}) {
    // Controls popover open state
    const [open, setOpen] = useState(false);

    // Find currently selected employee
    const selected = employees.find(e => String(e.employee_id) === value);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-sm mt-1 rounded-md border border-input bg-background px-3 py-1.5 shadow-none hover:bg-background focus:ring-1 focus:ring-ring focus:outline-none"
                >
                    {/* Display selected employee name or placeholder */}
                    <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                        {selected ? getFullName(selected) : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                    /**
                         * Custom search filter
                         * Matches typed search text against employee name
                         */

                    filter={(itemValue, search) =>
                        itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                    }>
                    <CommandInput placeholder="Search employee…" className="text-sm" />
                    <CommandList className="max-h-52 overflow-y-auto">
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                            {employees.map(emp => {
                                const fullName = getFullName(emp);
                                const empId = String(emp.employee_id);
                                return (
                                    <CommandItem
                                        key={empId}
                                        value={fullName}

                                        /**
                                             * Toggle selection:
                                             * selecting the same employee again clears it
                                             */
                                        onSelect={() => {
                                            onChange(value === empId ? '' : empId);
                                            setOpen(false);
                                        }}
                                        className="text-sm"
                                    >

                                        {/* Show check icon when selected */}
                                        <Check className={cn('mr-2 h-4 w-4', value === empId ? 'opacity-100' : 'opacity-0')} />
                                        {fullName}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

//  Leave Form 

function LeaveForm({
    data, setData, errors, employees, leave_entitlements,
    processing, onSubmit, onClose, isEdit, auth_employee_id = null,
    hr_admin_employee_ids = [], singleHrAdmin = false,
    dto_employees_in_dept = [], singleDto = false,
}: {
    data: FormData;
    setData: (keyOrData: keyof FormData | Partial<FormData>, value?: any) => void;
    errors: Partial<Record<keyof FormData, string>>;
    employees: Employee[];
    leave_entitlements: LeaveEntitlement[];
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    isEdit: boolean;
    auth_employee_id?: number | null;
    hr_admin_employee_ids?: number[];
    singleHrAdmin?: boolean;
    dto_employees_in_dept?: Employee[];
    singleDto?: boolean;
}) {
    const isFormValid = useFormValid(data);
    const selectedEmp = employees.find(e => String(e.employee_id) === data.employee_id);
    const isMale = selectedEmp ? Number(selectedEmp.sex) === 0 : false;
    const isFemale = selectedEmp ? Number(selectedEmp.sex) === 1 : false;
    const workDays = computeWorkingDays(data.start_date, data.end_date);
    const selectedName = data.is_others ? data.others_text : data.leave_type_availed;
    const isSickLeave = /^sick leave$/i.test(selectedName.trim());
    const isVLLeave = /vacation|mandatory|forced|special privilege/i.test(selectedName);
    const deductCol: 'vl' | 'sl' | 'none' = isSickLeave ? 'sl' : (isVLLeave ? 'vl' : 'none');
    const vlEarned = parseFloat(String(selectedEmp?.vl_total_earned ?? 0)) || 0;
    const slEarned = parseFloat(String(selectedEmp?.sl_total_earned ?? 0)) || 0;
    const vlBal = parseFloat(String(selectedEmp?.vl_balance ?? 0)) || 0;
    const slBal = parseFloat(String(selectedEmp?.sl_balance ?? 0)) || 0;
    const isMonetization = data.other_purpose === 'Monetization of Leave Credits';
    const isTerminalLeave = data.other_purpose === 'Terminal Leave';
    const isOtherPurpose = isMonetization || isTerminalLeave;
    const totalBalance = vlBal + slBal;
    const qualifiesForMonetization = totalBalance >= 15;
    const isSPL = /special privilege/i.test(selectedName);
    const isMandatory = /mandatory|forced/i.test(selectedName);
    const splMaxDays = 3;
    const mandatoryMaxDays = 5;
    const withPayDays = deductCol === 'sl'
        ? Math.min(workDays, Math.floor(Math.max(0, slBal)))
        : Math.min(workDays, Math.floor(Math.max(0, vlBal)));
    const showLoc = /vacation|special privilege/i.test(selectedName);
    const showSick = /sick/i.test(selectedName) && !/rehabilitation/i.test(selectedName);
    const showWomen = /women/i.test(selectedName);
    const showStudy = /study/i.test(selectedName);


    // Resolve the entitlement for the currently selected leave type 
    // Finds the matching entitlement row so we can read days_entitled.
    const selectedEntitlement = useMemo(() => {
        if (!data.leave_type_id || data.is_others) return null;
        return leave_entitlements.find(
            e => String(e.leave_type_id) === data.leave_type_id
        ) ?? null;
    }, [data.leave_type_id, data.is_others, leave_entitlements]);

    // VL/SL types use the with-pay / without-pay split against acquired credits.
    // Everything else puts days_entitled straight into approved_others.
    const isVLSLType = isSickLeave || isVLLeave;

    useEffect(() => {
        if (isOtherPurpose) return;

        // Non-VL/SL: days_entitled → approved_others 
        if (!isVLSLType && selectedEntitlement) {
            const days = String(selectedEntitlement.days_entitled);
            setData('approved_with_pay', selectedEntitlement.is_paid ? days : '');
            setData('approved_without_pay', '');
            setData('approved_others', days);
            return;
        }

        //  VL/SL: split applied days against acquired balance 
        if (workDays <= 0) {
            setData('approved_with_pay', '');
            setData('approved_without_pay', '');
            return;
        }
        const balance = isSickLeave ? slBal : vlBal;
        let cappedWorkDays = workDays;
        if (isSPL) cappedWorkDays = Math.min(workDays, splMaxDays);
        if (isMandatory) cappedWorkDays = Math.min(workDays, mandatoryMaxDays);
        const withPay = Math.min(cappedWorkDays, Math.floor(Math.max(0, balance)));
        const withoutPay = Math.max(0, cappedWorkDays - withPay);
        setData('approved_with_pay', withPay > 0 ? String(withPay) : '');
        setData('approved_without_pay', withoutPay > 0 ? String(withoutPay) : '');
    }, [workDays, data.employee_id, data.leave_type_id, data.is_others, data.others_text]);

    useEffect(() => {
        if (!data.start_date || !selectedEntitlement || data.is_others) return; // skip if no start date, no entitlement, or custom leave
        if (isAccrualLeave(selectedEntitlement.leave_type_name)) return;        // skip accrual types (VL, SL, Mandatory, SPL)
        if (selectedEntitlement.days_entitled <= 0) return;                     // skip if no entitled days

        const autoEnd = addWorkingDays(data.start_date, selectedEntitlement.days_entitled); // compute end date excluding weekends
        setData('end_date', autoEnd);                                                        // auto-fill end date
    }, [data.start_date, data.leave_type_id]);


    function pickLeaveType(lt: LeaveEntitlement) {
        setData({
            ...data,
            leave_type_id: String(lt.leave_type_id),
            leave_type_availed: lt.leave_type_name,
            is_others: false, others_text: '',
            loc_type: '' as const, loc_ph_text: '', loc_abroad_text: '',
            sick_type: '' as const, sick_hospital_text: '', sick_outpatient_text: '',
            illness_women: '', study_purpose: '',
            monetization_vl_days: '', monetization_sl_days: '',
            approved_with_pay: '', approved_without_pay: '', approved_others: '',
        });
    }

    function toggleOthers() {
        const turningOn = !data.is_others;
        setData({
            ...data,
            is_others: turningOn,
            leave_type_id: turningOn ? '' : data.leave_type_id,
            leave_type_availed: turningOn ? '' : data.leave_type_availed,
            others_text: '',
        });
    }

    function handleEmployeeChange(empId: string) {
        const emp = employees.find(e => String(e.employee_id) === empId);
        const newIsMale = emp ? Number(emp.sex) === 0 : false;
        const newIsFemale = emp ? Number(emp.sex) === 1 : false;
        const selectedEnt = leave_entitlements.find(e => String(e.leave_type_id) === data.leave_type_id);
        const shouldClear =
            (newIsMale && selectedEnt?.eligible_sex === 'Female') ||
            (newIsFemale && selectedEnt?.eligible_sex === 'Male');
        setData({
            ...data,
            employee_id: empId,
            office_department: emp?.department_name ?? '',
            position: emp?.position_name ?? '',
            salary: emp?.monthly_salary ? emp.monthly_salary.replace(/,/g, '') : '',
            leave_type_id: shouldClear ? '' : data.leave_type_id,
            leave_type_availed: shouldClear ? '' : data.leave_type_availed,
        });
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <p className="text-xs text-muted-foreground">
                    All fields with <span className="text-destructive">*</span> are required.
                </p>

                {Object.keys(errors).length > 0 && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive space-y-0.5">
                        <p className="font-semibold mb-1 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Please fix the following before submitting:
                        </p>
                        {Object.entries(errors).map(([k, v]) => (
                            <p key={k} className="pl-5">• {v}</p>
                        ))}
                    </div>
                )}

                {/* EMPLOYEE DETAILS */}
                <div>
                    <SH>Employee Details</SH>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                        <div>
                            <label className="text-xs font-medium">
                                Employee Name <span className="text-destructive">*</span>
                            </label>
                            {isEdit || !!auth_employee_id ? (
                                <div className="w-full rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm mt-1 text-foreground">
                                    {employees.find(e => String(e.employee_id) === data.employee_id)
                                        ? getFullName(employees.find(e => String(e.employee_id) === data.employee_id)!)
                                        : '—'}
                                </div>
                            ) : (
                                <EmployeeCombobox
                                    value={data.employee_id || ''}
                                    onChange={handleEmployeeChange}
                                    employees={employees}
                                />
                            )}
                            <FieldError message={errors.employee_id} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">
                                Office/Department <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={data.office_department}
                                onChange={e => setData('office_department', e.target.value)}
                                placeholder="Department name"
                                readOnly={isEdit || !!auth_employee_id}
                                className={cn('mt-1', isEdit && 'bg-muted/40 cursor-default')}
                            />
                            <FieldError message={errors.office_department} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">
                                Position <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={data.position}
                                onChange={e => setData('position', e.target.value)}
                                placeholder="Job position"
                                readOnly={isEdit || !!auth_employee_id}
                                className={cn('mt-1', isEdit && 'bg-muted/40 cursor-default')}
                            />
                            <FieldError message={errors.position} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">
                                Salary <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={data.salary}
                                onChange={e => setData('salary', e.target.value)}
                                placeholder="Monthly salary"
                                readOnly={isEdit || !!auth_employee_id}
                                className={cn('mt-1', isEdit && 'bg-muted/40 cursor-default')}
                            />
                            <FieldError message={errors.salary} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-secondary" />

                {/* DETAILS OF APPLICATION */}
                <div>
                    <SH>Details of Application</SH>

                    <Sub>6.A Type of leave to be availed of</Sub>
                    <div className="space-y-0.5 mb-4">
                        {Array.from(
                            new Map(leave_entitlements.map(e => [e.leave_type_id, e])).values()
                        ).map(lt => {
                            const isSPLType = /special privilege/i.test(lt.leave_type_name);
                            const isMandatoryType = /mandatory|forced/i.test(lt.leave_type_name);
                            const disabledForMale = isMale && lt.eligible_sex === 'Female';
                            const disabledForFemale = isFemale && lt.eligible_sex === 'Male';
                            const disabledLowBalance = (isSPLType || isMandatoryType) && vlEarned < 10;
                            const isDisabled = isOtherPurpose || disabledForMale || disabledForFemale || disabledLowBalance;
                            return (
                                <SqCheck
                                    key={lt.leave_type_id}
                                    checked={!isOtherPurpose && !data.is_others && data.leave_type_id === String(lt.leave_type_id)}
                                    onChange={() => !isDisabled && pickLeaveType(lt)}
                                    label={lt.leave_type_name}
                                    law={
                                        !isAccrualLeave(lt.leave_type_name) && lt.days_entitled
                                            ? `${lt.days_entitled} day${lt.days_entitled !== 1 ? 's' : ''}`
                                            : undefined
                                    }
                                    disabled={isDisabled}
                                />
                            );
                        })}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed border-secondary">
                            <SqCheck checked={data.is_others} onChange={toggleOthers} label="Others:" disabled={isOtherPurpose} />
                            <div className="flex-1">
                                <Input
                                    value={data.is_others ? data.others_text : ''}
                                    onChange={e => setData('others_text', e.target.value)}
                                    disabled={!data.is_others}
                                    placeholder="Specify…"
                                />
                            </div>
                        </div>
                        <FieldError message={errors.leave_type_availed} />
                    </div>

                    <Sub>6.B Details of leave</Sub>

                    {/* Vacation / SPL */}
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
                                    <Input
                                        value={data.loc_ph_text}
                                        onChange={e => setData('loc_ph_text', e.target.value)}
                                        disabled={!showLoc || data.loc_type !== 'ph'}
                                        placeholder="Specify location…"
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
                                    <Input
                                        value={data.loc_abroad_text}
                                        onChange={e => setData('loc_abroad_text', e.target.value)}
                                        disabled={!showLoc || data.loc_type !== 'abroad'}
                                        placeholder="Specify country/destination…"
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
                                    <Input
                                        value={data.sick_hospital_text}
                                        onChange={e => setData('sick_hospital_text', e.target.value)}
                                        disabled={!showSick || data.sick_type !== 'hospital'}
                                        placeholder="Specify illness…"
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
                                    <Input
                                        value={data.sick_outpatient_text}
                                        onChange={e => setData('sick_outpatient_text', e.target.value)}
                                        disabled={!showSick || data.sick_type !== 'outpatient'}
                                        placeholder="Specify illness…"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Women */}
                    <div className="mb-3">
                        <Italic>In case of Special Leave Benefits for Women:</Italic>
                        <div className="pl-3 flex items-center gap-2">
                            <span className={`text-xs shrink-0 w-24 ${showWomen ? 'text-foreground' : 'text-muted-foreground'}`}>
                                (Specify Illness)
                            </span>
                            <Input
                                value={data.illness_women}
                                onChange={e => setData('illness_women', e.target.value)}
                                disabled={!showWomen}
                                placeholder="Specify…"
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
                                const isMonetizationOpt = opt === 'Monetization of Leave Credits';
                                const notQualified = isMonetizationOpt && !!data.employee_id && !qualifiesForMonetization;
                                return (
                                    <div key={opt}>
                                        <SqCheck
                                            checked={data.other_purpose === opt}
                                            onChange={() => !notQualified && setData({
                                                ...data,
                                                other_purpose: data.other_purpose === opt ? '' : opt,
                                                leave_type_id: '', leave_type_availed: '',
                                                is_others: false, others_text: '',
                                                monetization_vl_days: '', monetization_sl_days: '',
                                            })}
                                            label={opt}
                                            disabled={notQualified}
                                        />
                                        {notQualified && (
                                            <p className="text-[10px] text-destructive pl-5">
                                                Not qualified — requires at least 15 total leave credits (current: {totalBalance.toFixed(3)})
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 6.C */}
                    <Sub>6.C Number of working days applied for (inclusive dates)</Sub>
                    {isOtherPurpose ? (
                        <p className="text-xs text-muted-foreground italic mb-1">
                            Not applicable for {data.other_purpose}.
                        </p>
                    ) : (
                        <>
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
                                <div className="mt-1 space-y-0.5">
                                    <p className="text-xs text-foreground">
                                        <span className="font-semibold">{workDays}</span> working day{workDays !== 1 ? 's' : ''}
                                        <span className="text-muted-foreground ml-1">(Mon–Fri)</span>
                                    </p>
                                    {isSPL && workDays > 3 && (
                                        <p className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            Special Privilege Leave cannot exceed 3 working days.
                                        </p>
                                    )}
                                    {isMandatory && workDays > 5 && (
                                        <p className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            Mandatory/Forced Leave cannot exceed 5 working days.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* 6.D */}
                    <div className="mt-4">
                        <Sub>6.D Commutation</Sub>
                        <div className="space-y-1">
                            <SqCheck checked={!data.is_requested} onChange={() => setData('is_requested', false)} label="Not Requested" />
                            <SqCheck checked={data.is_requested} onChange={() => setData('is_requested', true)} label="Requested" />
                        </div>
                        <div className="flex flex-col items-center mt-6">
                            <div className="border-b border-border w-48 mb-0.5" />
                            <p className="text-[10px] italic text-muted-foreground">(Signature of Applicant)</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-secondary" />

                {/* DETAILS OF ACTION */}
                <div>
                    <SH>Details of Action on Application</SH>

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
                        <section className="grid grid-cols-3 border-b border-secondary text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Total Earned</div>
                            <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                {selectedEmp ? vlEarned.toFixed(2) : '—'}
                            </div>
                            <div className="px-3 py-1.5 text-center font-medium">
                                {selectedEmp ? slEarned.toFixed(2) : '—'}
                            </div>
                        </section>
                        <section className="grid grid-cols-3 border-b border-secondary text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Less this application</div>
                            {isMonetization ? (
                                <>
                                    <div className="px-2 py-1 border-r border-secondary flex flex-col gap-0.5">
                                        <Input
                                            value={data.monetization_vl_days}
                                            onChange={e => setData('monetization_vl_days', e.target.value)}
                                            placeholder="VL days"
                                            className="text-center"
                                        />
                                        {data.monetization_vl_days && parseFloat(data.monetization_vl_days) > vlBal && (
                                            <p className="text-[10px] text-destructive text-center">Exceeds VL balance ({vlBal.toFixed(2)})</p>
                                        )}
                                    </div>
                                    <div className="px-2 py-1 flex flex-col gap-0.5">
                                        <Input
                                            value={data.monetization_sl_days}
                                            onChange={e => setData('monetization_sl_days', e.target.value)}
                                            placeholder="SL days"
                                            className="text-center"
                                        />
                                        {data.monetization_sl_days && parseFloat(data.monetization_sl_days) > slBal && (
                                            <p className="text-[10px] text-destructive text-center">Exceeds SL balance ({slBal.toFixed(2)})</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                        {deductCol === 'vl' && workDays > 0 ? withPayDays : '—'}
                                    </div>
                                    <div className="px-3 py-1.5 text-center font-medium">
                                        {deductCol === 'sl' && workDays > 0 ? withPayDays : '—'}
                                    </div>
                                </>
                            )}
                        </section>
                        <section className="grid grid-cols-3 text-foreground">
                            <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Balance</div>
                            <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">
                                {selectedEmp
                                    ? isMonetization
                                        ? <span className={(vlBal - (parseFloat(data.monetization_vl_days) || 0)) < 0 ? 'text-destructive' : ''}>
                                            {(vlBal - (parseFloat(data.monetization_vl_days) || 0)).toFixed(3)}
                                        </span>
                                        : deductCol === 'vl' && workDays > 0
                                            ? <span className={(vlEarned - withPayDays) < 0 ? 'text-destructive' : ''}>{(vlEarned - withPayDays).toFixed(2)}</span>
                                            : <span>{vlEarned.toFixed(3)}</span>
                                    : '—'}
                            </div>
                            <div className="px-3 py-1.5 text-center font-medium">
                                {selectedEmp
                                    ? isMonetization
                                        ? <span className={(slBal - (parseFloat(data.monetization_sl_days) || 0)) < 0 ? 'text-destructive' : ''}>
                                            {(slBal - (parseFloat(data.monetization_sl_days) || 0)).toFixed(3)}
                                        </span>
                                        : deductCol === 'sl' && workDays > 0
                                            ? <span className={(slEarned - withPayDays) < 0 ? 'text-destructive' : ''}>{(slEarned - withPayDays).toFixed(2)}</span>
                                            : <span>{slEarned.toFixed(3)}</span>
                                    : '—'}
                            </div>
                        </section>
                    </div>

                    {/* Authorized Officer */}
                    {singleDto ? (
                        <div className="flex flex-col items-center mt-6">
                            <div className="w-56 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-foreground text-center">
                                {employees.find(e => String(e.employee_id) === data.recommendation_officer)
                                    ? getFullName(employees.find(e => String(e.employee_id) === data.recommendation_officer)!)
                                    : '—'}
                            </div>
                            <p className="text-[10px] italic text-muted-foreground">(Authorized Officer)</p>
                        </div>
                    ) : (
                        <OfficerBlock
                            label="Authorized Officer"
                            value={data.recommendation_officer}
                            onChange={v => setData('recommendation_officer', v)}
                            employees={dto_employees_in_dept.length > 0 ? dto_employees_in_dept : employees}
                            error={errors.recommendation_officer}
                        />
                    )}

                    {/* 7.C */}
                    {!isOtherPurpose && data.status !== 'Pending' && (
                        <div className="mt-6">
                            <Sub>7.C Approved For:</Sub>
                            <div className="border border-secondary rounded-md text-xs overflow-hidden">
                                {/* days with pay — always shown */}
                                <div className={cn(
                                    'grid grid-cols-[1fr_auto] items-center px-3 py-2',
                                    (data.approved_without_pay || data.approved_others) && 'border-b border-secondary',
                                )}>
                                    <span className="italic text-muted-foreground">Days with pay</span>
                                    <span className="font-semibold tabular-nums text-right min-w-20">
                                        {data.approved_with_pay || '—'}
                                    </span>
                                </div>

                                {/* days without pay — only when set */}
                                {data.approved_without_pay && (
                                    <div className={cn(
                                        'grid grid-cols-[1fr_auto] items-center px-3 py-2',
                                        data.approved_others && 'border-b border-secondary',
                                    )}>
                                        <span className="italic text-muted-foreground">Days without pay</span>
                                        <span className="font-semibold tabular-nums text-right min-w-20">
                                            {data.approved_without_pay}
                                        </span>
                                    </div>
                                )}

                                {/* others — only when set */}
                                {data.approved_others && (
                                    <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2">
                                        <span className="italic text-muted-foreground">Others (Specify)</span>
                                        <span className="font-semibold tabular-nums text-right min-w-20">
                                            {data.approved_others}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Authorized Official */}
                    {!['Pending', 'For Approval', 'For Disapproval'].includes(data.status) && (
                        singleHrAdmin ? (
                            <div className="flex flex-col items-center mt-6">
                                <div className="w-56 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-foreground text-center">
                                    {employees.find(e => String(e.employee_id) === data.approval_officer)
                                        ? getFullName(employees.find(e => String(e.employee_id) === data.approval_officer)!)
                                        : '—'}
                                </div>
                                <p className="text-[10px] italic text-muted-foreground">(Authorized Official)</p>
                            </div>
                        ) : (
                            <OfficerBlock
                                label="Authorized Official"
                                value={data.approval_officer}
                                onChange={v => setData('approval_officer', v)}
                                employees={employees.filter(e => hr_admin_employee_ids.includes(e.employee_id))}
                                error={errors.approval_officer}
                            />
                        )
                    )}
                </div>
            </div>

            <DialogFooter className="px-5 py-4 border-t bg-muted/30 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    size="sm"
                    disabled={processing || !isFormValid}
                    title={!isFormValid ? 'Please complete all required fields before submitting' : undefined}
                >
                    {processing ? 'Saving…' : isEdit ? 'Update Application' : 'File Leave Application'}
                </Button>
            </DialogFooter>
        </form>
    );
}

//  Leave Modal (create / edit)

function LeaveModal({
    open, editingApp, employees, leave_entitlements, onClose, auth_employee_id, hr_admin_employee_ids = [], dto_employee_ids = [],
}: {
    open: boolean; editingApp: LeaveFiling | null;
    employees: Employee[]; leave_entitlements: LeaveEntitlement[]; onClose: () => void;
    auth_employee_id?: number | null;
    hr_admin_employee_ids?: number[];
    dto_employee_ids?: number[];
}) {
    const isEdit = !!editingApp;
    const detail = (editingApp as any)?.detail;
    const [acknowledged, setAcknowledged] = useState(isEdit);
    const [serverErrors, setServerErrors] = useState<Partial<Record<string, string>>>({});
    const [processing, setProcessing] = useState(false);

    const singleHrAdmin = hr_admin_employee_ids.length === 1;

    const defaultEmpId = !isEdit && auth_employee_id ? String(auth_employee_id) : '';
    const defaultEmp = employees.find(e => String(e.employee_id) === defaultEmpId);

    const filingEmp = defaultEmp
        ?? (editingApp ? employees.find(e => String(e.employee_id) === String(editingApp.employee_id)) : undefined)

    const dtoEmployeesInDept = employees.filter(e =>
        dto_employee_ids.includes(e.employee_id) &&
        !!filingEmp?.department_name &&
        e.department_name === filingEmp.department_name
    );
    const singleDto = dtoEmployeesInDept.length === 1;

    function restoreLocType(): 'ph' | 'abroad' | '' {
        return (detail?.leave_location_type as 'ph' | 'abroad') ?? '';
    }
    function restoreSickType(): 'hospital' | 'outpatient' | '' {
        return (detail?.sick_type as 'hospital' | 'outpatient') ?? '';
    }

    const { data, setData, reset, clearErrors } = useForm<FormData>({
        employee_id: editingApp?.employee_id ? String(editingApp.employee_id) : defaultEmpId,
        office_department: (editingApp as any)?.office_department ?? defaultEmp?.department_name ?? '',
        position: (editingApp as any)?.position ?? defaultEmp?.position_name ?? '',
        salary: (editingApp as any)?.salary ?? (defaultEmp?.monthly_salary ? defaultEmp.monthly_salary.replace(/,/g, '') : ''),
        leave_type_id: editingApp?.leave_type_id ? String(editingApp.leave_type_id) : '',
        leave_type_availed: editingApp?.leave_type_availed ?? '',
        is_others: editingApp
            ? (!editingApp.leave_type_id && !!editingApp.leave_type_availed && !detail?.other_purpose)
            : false,
        others_text: editingApp
            ? (!editingApp.leave_type_id && !!editingApp.leave_type_availed && !detail?.other_purpose
                ? editingApp.leave_type_availed : '')
            : '',
        loc_type: restoreLocType(),
        sick_type: restoreSickType(),
        loc_ph_text: detail?.leave_location_type === 'ph' ? (detail?.leave_location ?? '') : '',
        loc_abroad_text: detail?.leave_location_type === 'abroad' ? (detail?.leave_location ?? '') : '',
        sick_hospital_text: detail?.sick_type === 'hospital' ? (detail?.sick_details ?? '') : '',
        sick_outpatient_text: detail?.sick_type === 'outpatient' ? (detail?.sick_details ?? '') : '',
        illness_women: detail?.women_illness ?? '',
        study_purpose: detail?.study_purpose ?? '',
        other_purpose: detail?.other_purpose ?? '',
        monetization_vl_days: detail?.monetization_vl_days ? String(detail.monetization_vl_days) : '',
        monetization_sl_days: detail?.monetization_sl_days ? String(detail.monetization_sl_days) : '',
        start_date: editingApp?.start_date ?? '',
        end_date: editingApp?.end_date ?? '',
        is_requested: editingApp?.is_requested ?? false,
        is_with_pay: editingApp?.is_with_pay ?? true,
        recommendation_officer: editingApp?.recommendation_officer
            ? String(editingApp.recommendation_officer)
            : singleDto ? String(dtoEmployeesInDept[0].employee_id) : '',
        status: editingApp?.status ?? 'Pending',
        for_disapproval_reason: editingApp?.for_disapproval_reason ?? '',
        approval_officer: editingApp?.approval_officer
            ? String(editingApp.approval_officer)
            : singleHrAdmin ? String(hr_admin_employee_ids[0]) : '',
        approved_with_pay: editingApp ? String((editingApp as any).approved_with_pay ?? '') : '',
        approved_without_pay: editingApp ? String((editingApp as any).approved_without_pay ?? '') : '',
        approved_others: (editingApp as any)?.approved_others ?? '',
        disapproved_reason: editingApp?.disapproved_reason ?? '',
    });

    function buildPayload() {
        const availed = data.is_others ? data.others_text : data.leave_type_availed;
        return {
            employee_id: data.employee_id,
            office_department: data.office_department,
            position: data.position,
            salary: data.salary,
            leave_type_id: data.leave_type_id || null,
            leave_type_availed: data.other_purpose ? data.other_purpose : availed,
            start_date: data.other_purpose ? null : data.start_date,
            end_date: data.other_purpose ? null : data.end_date,
            is_requested: data.is_requested,
            is_with_pay: !!data.approved_with_pay,
            recommendation_officer: data.recommendation_officer || null,
            approval_officer: data.approval_officer || null,
            status: data.status,
            for_disapproval_reason: data.for_disapproval_reason,
            approved_with_pay: data.approved_with_pay || null,
            approved_without_pay: data.approved_without_pay || null,
            approved_others: data.approved_others || null,
            disapproved_reason: data.disapproved_reason,
            leave_location_type: data.loc_type || null,
            leave_location: data.loc_type === 'ph' ? data.loc_ph_text
                : data.loc_type === 'abroad' ? data.loc_abroad_text
                    : null,
            sick_type: data.sick_type || null,
            sick_details: data.sick_type === 'hospital' ? data.sick_hospital_text
                : data.sick_type === 'outpatient' ? data.sick_outpatient_text
                    : null,
            women_illness: data.illness_women || null,
            study_purpose: data.study_purpose || null,
            other_purpose: data.other_purpose || null,
            monetization_vl_days: data.other_purpose === 'Monetization of Leave Credits' ? (data.monetization_vl_days || null) : null,
            monetization_sl_days: data.other_purpose === 'Monetization of Leave Credits' ? (data.monetization_sl_days || null) : null,
        };
    }

    function handleClose() {
        reset(); setServerErrors({}); setProcessing(false);
        setAcknowledged(isEdit); onClose(); clearErrors();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = buildPayload();
        setProcessing(true); setServerErrors({});

        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Leave application updated successfully.' : 'Leave application filed successfully.');
                handleClose();
            },
            onError: (errs: Record<string, string>) => {
                setServerErrors(errs); setProcessing(false);
                const fieldKeys = new Set(Object.keys(errs));
                const knownFields = new Set([
                    'employee_id', 'office_department', 'position', 'salary',
                    'leave_type_id', 'leave_type_availed', 'start_date', 'end_date',
                    'recommendation_officer', 'approval_officer',
                    'monetization_vl_days', 'monetization_sl_days',
                    'leave_location_type', 'leave_location', 'sick_type', 'sick_details',
                    'women_illness', 'study_purpose', 'other_purpose',
                    'status', 'for_disapproval_reason', 'disapproved_reason',
                    'approved_with_pay', 'approved_without_pay', 'approved_others',
                ]);
                const hasNonFieldError = [...fieldKeys].some(k => !knownFields.has(k));
                if (hasNonFieldError) toast.error('An unexpected error occurred. Please try again.');
            },
        };

        isEdit
            ? router.put(route('leave.leave-application.update', editingApp!.leave_application_id), payload, opts)
            : router.post(route('leave.leave-application.store'), payload, opts);
    }

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
            <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                    <DialogTitle className="text-sm font-semibold">APPLICATION FOR LEAVE</DialogTitle>
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
                        data={data} setData={setData as any}
                        errors={serverErrors} employees={employees}
                        leave_entitlements={leave_entitlements} processing={processing}
                        onSubmit={handleSubmit} onClose={handleClose}
                        isEdit={isEdit}
                        auth_employee_id={auth_employee_id}
                        hr_admin_employee_ids={hr_admin_employee_ids}
                        singleHrAdmin={singleHrAdmin}
                        dto_employees_in_dept={dtoEmployeesInDept}
                        singleDto={singleDto}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

//  Applied Leave View Modal 
//
// Shared read-only (+ action) modal for all 5 views:
//   view               → full read-only, no action button
//   recommend-approval → green "Recommend for approval" button
//   recommend-disapproval → greyed top, active 7.B, red button
//   approve            → 7.C shown, green "Approve" button
//   disapprove         → greyed top, 7.B greyed, active 7.D, red button

function AppliedLeaveViewModal({
    app, mode, employees, hr_admin_employee_ids = [], onClose,
}: {
    app: LeaveFiling | null;
    mode: ActionMode;
    employees: Employee[];
    hr_admin_employee_ids?: number[];
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    const [selectedApprovalOfficer, setSelectedApprovalOfficer] = useState(
        app?.approval_officer
            ? String(app.approval_officer)
            : hr_admin_employee_ids.length > 0 ? String(hr_admin_employee_ids[0]) : ''
    );
    const [processing, setProcessing] = useState(false);

    // Pre-fill reason with existing DB value when opening action modes
    useEffect(() => {
        if (mode === 'recommend-disapproval') {
            setReason(app?.for_disapproval_reason ?? '');
        } else if (mode === 'disapprove') {
            setReason(app?.disapproved_reason ?? '');
        } else {
            setReason('');
        }
        setSelectedApprovalOfficer(
            app?.approval_officer
                ? String(app.approval_officer)
                : hr_admin_employee_ids.length > 0 ? String(hr_admin_employee_ids[0]) : ''
        );
        setProcessing(false);
    }, [app?.leave_application_id, mode]);

    if (!app) return null;

    const detail = (app as any).detail;
    const appEmp = employees.find(e => String(e.employee_id) === String(app.employee_id));

    // Opacity logic
    const isTopFaded = mode === 'recommend-disapproval' || mode === 'disapprove';

    // Leave credits
    const vlEarned = parseFloat(String(appEmp?.vl_total_earned ?? 0)) || 0;
    const slEarned = parseFloat(String(appEmp?.sl_total_earned ?? 0)) || 0;
    const vlBal = parseFloat(String(appEmp?.vl_balance ?? 0)) || 0;
    const slBal = parseFloat(String(appEmp?.sl_balance ?? 0)) || 0;

    // Leave type classification
    const leaveName = app.leave_type_availed ?? '';
    const isSickLeave = /^sick leave$/i.test(leaveName.trim());
    const isVLLeave = /vacation|mandatory|forced|special privilege/i.test(leaveName);
    const deductCol: 'vl' | 'sl' | 'none' = isSickLeave ? 'sl' : (isVLLeave ? 'vl' : 'none');

    const workDays = app.start_date && app.end_date
        ? computeWorkingDays(app.start_date, app.end_date) : 0;

    // Saved approved values
    const approvedWithPay = String((app as any).approved_with_pay ?? '');
    const approvedWithoutPay = String((app as any).approved_without_pay ?? '');
    const approvedOthers = String((app as any).approved_others ?? '');

    // Detail fields
    const locType = detail?.leave_location_type as 'ph' | 'abroad' | undefined;
    const locText = detail?.leave_location ?? '';
    const sickType = detail?.sick_type as 'hospital' | 'outpatient' | undefined;
    const sickDetails = detail?.sick_details ?? '';
    const womenIllness = detail?.women_illness ?? '';
    const studyPurpose = detail?.study_purpose ?? '';
    const otherPurpose = detail?.other_purpose ?? '';

    const isMonetization = otherPurpose === 'Monetization of Leave Credits';

    // "Less this application" display values
    const monetizationVlDays = parseFloat(String(detail?.monetization_vl_days ?? 0)) || 0;
    const monetizationSlDays = parseFloat(String(detail?.monetization_sl_days ?? 0)) || 0;

    const lessVL = isMonetization
        ? (monetizationVlDays > 0 ? String(monetizationVlDays) : '—')
        : deductCol === 'vl' && workDays > 0
            ? (approvedWithPay || String(workDays)) : '—';
    const lessSL = isMonetization
        ? (monetizationSlDays > 0 ? String(monetizationSlDays) : '—')
        : deductCol === 'sl' && workDays > 0
            ? (approvedWithPay || String(workDays)) : '—';
    const balVL = appEmp
        ? isMonetization
            ? (vlBal - monetizationVlDays).toFixed(3)
            : deductCol === 'vl' && workDays > 0
                ? (vlEarned - (parseFloat(approvedWithPay) || workDays)).toFixed(2)
                : vlEarned.toFixed(3)
        : '—';
    const balSL = appEmp
        ? isMonetization
            ? (slBal - monetizationSlDays).toFixed(3)
            : deductCol === 'sl' && workDays > 0
                ? (slEarned - (parseFloat(approvedWithPay) || workDays)).toFixed(2)
                : slEarned.toFixed(3)
        : '—';



    const isTerminalLeave = otherPurpose === 'Terminal Leave';

    // Resolve officer names for display
    const recOfficerName = employees.find(e => String(e.employee_id) === String(app.recommendation_officer))
        ? getFullName(employees.find(e => String(e.employee_id) === String(app.recommendation_officer))!)
        : null;
    const appOfficerName = employees.find(e => String(e.employee_id) === String(app.approval_officer))
        ? getFullName(employees.find(e => String(e.employee_id) === String(app.approval_officer))!)
        : null;

    // Section visibility
    const isPending = app.status === 'Pending';
    const show7BReadOnly = !isPending && (mode === 'view' || mode === 'disapprove');
    const show7BActive = mode === 'recommend-disapproval';
    const show7C = !isMonetization && !isTerminalLeave;
    const show7DReadOnly = mode === 'view';
    const show7DActive = mode === 'disapprove';

    // Button config 
    const buttonConfig: Record<Exclude<ActionMode, 'view'>, { label: string; variant: 'default' | 'destructive' }> = {
        'recommend-approval': { label: 'Recommend for approval', variant: 'default' },
        'recommend-disapproval': { label: 'Recommend for disapproval', variant: 'destructive' },
        'approve': { label: 'Approve', variant: 'default' },
        'disapprove': { label: 'Disapproval', variant: 'destructive' },
    };

    function handleAction() {
        if (!app) return;
        setProcessing(true);

        const detail = (app as any).detail;

        // Build the same full payload the edit form sends — just override the
        // status-related fields that each action mode cares about.
        const base = {
            employee_id: String(app.employee_id),
            office_department: (app as any).office_department ?? null,
            position: (app as any).position ?? null,
            salary: (app as any).salary ?? null,
            leave_type_id: app.leave_type_id ?? null,
            leave_type_availed: app.leave_type_availed ?? null,
            start_date: app.start_date ?? null,
            end_date: app.end_date ?? null,
            is_requested: app.is_requested ?? false,
            is_with_pay: app.is_with_pay ?? false,
            recommendation_officer: app.recommendation_officer ? String(app.recommendation_officer) : null,
            approval_officer: ['approve', 'disapprove'].includes(mode)
                ? (selectedApprovalOfficer || null)
                : (app.approval_officer ? String(app.approval_officer) : null),
            approved_with_pay: (app as any).approved_with_pay ?? null,
            approved_without_pay: (app as any).approved_without_pay ?? null,
            approved_others: (app as any).approved_others ?? null,
            // keep existing reasons unless this action overrides them
            for_disapproval_reason: app.for_disapproval_reason ?? null,
            disapproved_reason: app.disapproved_reason ?? null,
            // 6.B detail fields — pass through unchanged
            leave_location_type: detail?.leave_location_type ?? null,
            leave_location: detail?.leave_location ?? null,
            sick_type: detail?.sick_type ?? null,
            sick_details: detail?.sick_details ?? null,
            women_illness: detail?.women_illness ?? null,
            study_purpose: detail?.study_purpose ?? null,
            other_purpose: detail?.other_purpose ?? null,
            monetization_vl_days: detail?.monetization_vl_days ?? null,
            monetization_sl_days: detail?.monetization_sl_days ?? null,
        };

        // Per-mode overrides — only change what each action actually touches
        const overrides: Record<Exclude<ActionMode, 'view'>, object> = {
            'recommend-approval': { status: 'For Approval' },
            'recommend-disapproval': { status: 'For Disapproval', for_disapproval_reason: reason },
            'approve': { status: 'Approved' },
            'disapprove': { status: 'Disapproved', disapproved_reason: reason },
        };

        const successMsgs: Record<Exclude<ActionMode, 'view'>, string> = {
            'recommend-approval': 'Recommended for approval.',
            'recommend-disapproval': 'Marked for disapproval.',
            'approve': 'Leave application approved.',
            'disapprove': 'Leave application disapproved.',
        };

        const payload = { ...base, ...overrides[mode as Exclude<ActionMode, 'view'>] };

        router.put(
            route('leave.leave-application.update', app.leave_application_id),
            payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(successMsgs[mode as Exclude<ActionMode, 'view'>]);
                    setProcessing(false);
                    onClose();
                },
                onError: () => {
                    toast.error('Failed to update. Please try again.');
                    setProcessing(false);
                },
            },
        );
    }

    const needsReason = mode === 'recommend-disapproval' || mode === 'disapprove';
    const canSubmit = !processing && (!needsReason || reason.trim().length > 0);

    return (
        <Dialog open={!!app} onOpenChange={o => { if (!o) onClose(); }}>
            <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-secondary shrink-0">
                    <DialogTitle className="text-base font-bold">Applied Leave</DialogTitle>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* ── Employee Details ── */}
                    <div className={cn('transition-opacity', isTopFaded && 'opacity-40 pointer-events-none select-none')}>
                        <SH>Employee Details</SH>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Employee Name</p>
                                <p className="font-medium text-xs">{(app as any).employee?.employee_name ?? `#${app.employee_id}`}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Office/Department</p>
                                <p className="font-medium text-xs">{(app as any).office_department ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Position</p>
                                <p className="font-medium text-xs">{(app as any).position ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
                                <p className="font-medium text-xs">{(app as any).salary ?? '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-secondary" />

                    {/* ── Details of Application ── */}
                    <div className={cn('transition-opacity', isTopFaded && 'opacity-40 pointer-events-none select-none')}>
                        <SH>Details of Application</SH>

                        {/* 6.A */}
                        <Sub>6.A Type of leave availed</Sub>
                        <div className="space-y-0.5 mb-3">
                            {leaveName && <ROCheck checked label={leaveName} />}
                        </div>

                        {/* 6.B */}
                        <Sub>6.B Details of leave</Sub>

                        {(locType || /vacation|special privilege/i.test(leaveName)) && (
                            <div className="mb-2">
                                <Italic>In case of Vacation/Special Privilege Leave:</Italic>
                                {locType && (
                                    <div className="pl-3">
                                        <ROCheck
                                            checked
                                            label={`${locType === 'ph' ? 'Within the Philippines' : 'Abroad'}${locText ? ` — ${locText}` : ''}`}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {(sickType || (/sick/i.test(leaveName) && !/rehabilitation/i.test(leaveName))) && (
                            <div className="mb-2">
                                <Italic>In case of Sick Leave:</Italic>
                                {sickType && (
                                    <div className="pl-3">
                                        <ROCheck
                                            checked
                                            label={`${sickType === 'hospital' ? 'In Hospital' : 'Out Patient'}${sickDetails ? ` — ${sickDetails}` : ''}`}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {womenIllness && (
                            <div className="mb-2">
                                <Italic>In case of Special Leave Benefits for Women:</Italic>
                                <p className="pl-3 text-xs">{womenIllness}</p>
                            </div>
                        )}

                        {/* 6.C */}
                        <Sub>6.C Number of working days applied for (inclusive dates)</Sub>
                        {otherPurpose ? (
                            <p className="text-xs text-muted-foreground italic mb-2">
                                Not applicable for {otherPurpose}.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                    <div className="rounded-md border border-input bg-muted/30 px-3 py-1.5 text-xs text-foreground">
                                        {app.start_date ? toDisplay(app.start_date) : '—'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                                    <div className="rounded-md border border-input bg-muted/30 px-3 py-1.5 text-xs text-foreground">
                                        {app.end_date ? toDisplay(app.end_date) : '—'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6.D */}
                        <Sub>6.D Commutation</Sub>
                        <div className="space-y-0.5">
                            <ROCheck checked={!app.is_requested} label="Not Requested" />
                            <ROCheck checked={!!app.is_requested} label="Requested" />
                        </div>

                        <div className="flex flex-col items-center mt-6 mb-1">
                            <div className="border-b border-border w-48 mb-0.5" />
                            <p className="text-[10px] italic text-muted-foreground">(Signature of Applicant)</p>
                        </div>
                    </div>

                    <div className="border-t border-secondary" />

                    {/* Details of Action on Application */}
                    <div>
                        <SH>Details of Action on Application</SH>

                        {/* 7.A Credits table */}
                        <div className={cn('transition-opacity', isTopFaded && 'opacity-40 pointer-events-none select-none')}>
                            <Sub>7.A Certification of Leave Credits</Sub>
                            <div className="border border-secondary rounded-md text-xs overflow-hidden mb-2">
                                <div className="px-3 py-1.5 border-b border-secondary bg-muted/20 text-muted-foreground">
                                    As of{' '}
                                    <span className="font-semibold text-foreground ml-1">{todayLabel()}</span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-secondary font-semibold text-muted-foreground bg-muted/30">
                                    <div className="px-3 py-1 border-r border-secondary" />
                                    <div className="px-3 py-1 border-r border-secondary text-center">Vacation Leave</div>
                                    <div className="px-3 py-1 text-center">Sick Leave</div>
                                </div>
                                <div className="grid grid-cols-3 border-b border-secondary">
                                    <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Total Earned</div>
                                    <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">{appEmp ? vlEarned.toFixed(2) : '—'}</div>
                                    <div className="px-3 py-1.5 text-center font-medium">{appEmp ? slEarned.toFixed(2) : '—'}</div>
                                </div>
                                <div className="grid grid-cols-3 border-b border-secondary">
                                    <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Less this application</div>
                                    <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">{lessVL}</div>
                                    <div className="px-3 py-1.5 text-center font-medium">{lessSL}</div>
                                </div>
                                <div className="grid grid-cols-3">
                                    <div className="px-3 py-1.5 italic text-muted-foreground border-r border-secondary">Balance</div>
                                    <div className="px-3 py-1.5 border-r border-secondary text-center font-medium">{balVL}</div>
                                    <div className="px-3 py-1.5 text-center font-medium">{balSL}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center mt-5 mb-4">
                                <div className="w-48 mb-0.5" />
                                {recOfficerName && (
                                    <p className="text-xs font-medium text-foreground mt-1">{recOfficerName}</p>
                                )}
                                <p className="text-[10px] italic text-muted-foreground border-t border-border w-48 pt-1 text-center">(Authorized Officer)</p>
                            </div>
                        </div>

                        {/* 7.B — read-only (view / disapprove) */}
                        {show7BReadOnly && (
                            <div className={cn(
                                'transition-opacity',
                                mode === 'disapprove' && 'opacity-40 pointer-events-none select-none',
                            )}>
                                <Sub>7.B Recommendation</Sub>
                                <div className="space-y-1 mb-3">
                                    {!app.for_disapproval_reason && (
                                        <ROCheck checked label="For approval" />
                                    )}
                                    {!!app.for_disapproval_reason && (
                                        <ROCheck checked label="For disapproval due to" />
                                    )}
                                    {app.for_disapproval_reason && (
                                        <div className="mt-1.5 rounded-md border border-secondary  px-3 py-2 text-xs text-muted-foreground">
                                            {app.for_disapproval_reason}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-center mt-5 mb-4">
                                    <div className="w-48 mb-0.5" />
                                    {recOfficerName && (
                                        <p className="text-xs font-medium text-foreground mt-1">{recOfficerName}</p>
                                    )}
                                    <p className="text-[10px] italic text-muted-foreground border-t border-border w-48 pt-1 text-center">(Authorized Officer)</p>
                                </div>
                            </div>
                        )}

                        {/* 7.B — active (recommend-disapproval) */}
                        {show7BActive && (
                            <div>
                                <Sub>7.B Recommendation</Sub>
                                <div className="space-y-1 mb-2">
                                    <div className="flex items-start gap-2 py-0.5">
                                        <span className="mt-px w-3 h-3 shrink-0 border border-primary bg-primary flex items-center justify-center rounded-sm">
                                            <svg className="w-2 h-2 text-primary-foreground" viewBox="0 0 10 8" fill="none">
                                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8"
                                                    strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <span className="text-xs italic font-medium leading-snug text-foreground">
                                            For disapproval due to
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-5 mb-3">
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="State the reason for disapproval…"
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                                            placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1
                                            focus:ring-ring resize-none"
                                    />
                                </div>
                                <div className="flex flex-col items-center mt-5 mb-4">
                                    <div className="w-48 mb-0.5" />
                                    {recOfficerName && (
                                        <p className="text-xs font-medium text-foreground mt-1">{recOfficerName}</p>
                                    )}
                                    <p className="text-[10px] italic text-muted-foreground border-t border-border w-48 pt-1 text-center">(Authorized Officer)</p>
                                </div>
                            </div>
                        )}

                        {/* 7.C Approved For — shown when status is Approved/Disapproved or when user clicks approve/disapprove.
    All rows always shown with 0 as fallback. */}
                        {show7C && (
                            ['Approved', 'Disapproved'].includes(app.status) ||
                            ['approve', 'disapprove'].includes(mode)
                        ) && (
                                <div className={cn(
                                    'transition-opacity mb-3',
                                    (mode === 'recommend-disapproval' || mode === 'disapprove')
                                    && 'opacity-40 pointer-events-none select-none',
                                )}>
                                    <Sub>7.C Approved for:</Sub>
                                    <div className="border border-secondary rounded-md text-xs overflow-hidden">
                                        <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2 border-b border-secondary">
                                            <span className="italic text-muted-foreground">Days with pay</span>
                                            <span className="font-semibold tabular-nums text-right min-w-20">
                                                {approvedWithPay || '0'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2 border-b border-secondary">
                                            <span className="italic text-muted-foreground">Days without pay</span>
                                            <span className="font-semibold tabular-nums text-right min-w-20">
                                                {approvedWithoutPay || '0'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2">
                                            <span className="italic text-muted-foreground">Others (Specify)</span>
                                            <span className="font-semibold tabular-nums text-right min-w-20">
                                                {approvedOthers || '0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* 7.D Disapproved Due To — read-only (view), only when there's a value */}
                        {show7DReadOnly && app.disapproved_reason && (
                            <div className="mb-4">
                                <Sub>7.D Disapproved Due To:</Sub>
                                <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-xs text-foreground min-h-15">
                                    {app.disapproved_reason}
                                </div>
                            </div>
                        )}

                        {/* 7.D Disapproved Due To — active (disapprove) */}
                        {show7DActive && (
                            <div className="mb-4">
                                <Sub>7.D Disapproved Due To:</Sub>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="State the reason for disapproval…"
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                                        placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1
                                        focus:ring-ring resize-none"
                                />
                            </div>
                        )}


                        {/* Authorized Official footer — shown when Approved/Disapproved, or when user is acting approve/disapprove on a For Approval/Disapproval application.
    Editable when user clicks approve/disapprove so they can reselect if needed. */}
                        {(!['Pending', 'For Approval', 'For Disapproval'].includes(app.status) ||
                            (['For Approval', 'For Disapproval'].includes(app.status) && ['approve', 'disapprove'].includes(mode))
                        ) && (
                                <div className="flex flex-col items-center mt-5">
                                    {['approve', 'disapprove'].includes(mode) ? (
                                        <div className="w-56">
                                            <EmployeeCombobox
                                                value={selectedApprovalOfficer || (app.approval_officer ? String(app.approval_officer) : '')}
                                                onChange={setSelectedApprovalOfficer}
                                                employees={employees.filter(e => hr_admin_employee_ids.includes(e.employee_id))}
                                                placeholder="Select Authorized Official…"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-48 mb-0.5" />
                                            {appOfficerName && (
                                                <p className="text-xs font-medium text-foreground mt-1">{appOfficerName}</p>
                                            )}
                                        </>
                                    )}
                                    <p className="text-[10px] italic text-muted-foreground border-t border-border w-48 pt-1 text-center">(Authorized Official)</p>
                                </div>
                            )}
                    </div>
                </div>

                {/* Action button (hidden for view mode) */}
                {mode !== 'view' && (
                    <div className="shrink-0 px-5 py-3 border-t border-secondary flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={buttonConfig[mode as Exclude<ActionMode, 'view'>].variant}
                            disabled={!canSubmit}
                            onClick={handleAction}
                            className="flex-1"
                        >
                            {processing ? 'Saving…' : buttonConfig[mode as Exclude<ActionMode, 'view'>].label}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Mobile Detail Modal 

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-secondary last:border-0">
            <span className="text-xs text-muted-foreground shrink-0">{label}</span>
            <span className="text-xs text-right">{value}</span>
        </div>
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
                setConfirmOpen(false); onDeleted();
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
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-5 py-4 overflow-y-auto flex-1 space-y-1">
                        <DetailRow label="Employee" value={(app as any).employee?.employee_name ?? `#${app.employee_id}`} />
                        <DetailRow label="Leave Type" value={app.leave_type_availed ?? '—'} />
                        <DetailRow label="Start Date" value={app.start_date ? toDisplay(app.start_date) : '—'} />
                        <DetailRow label="End Date" value={app.end_date ? toDisplay(app.end_date) : '—'} />
                        <DetailRow label="Commutation" value={app.is_requested ? 'Requested' : 'Not Requested'} />
                        <DetailRow label="Status" value={app.status} />
                    </div>
                    <DialogFooter className="px-5 py-4 bg-muted/30 shrink-0 flex-row justify-between gap-2">
                        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmOpen(true)}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => { onClose(); onEdit(app); }}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
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

// Page 

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Filing', href: route('leave.leave-application.index') },
];

export default function LeaveFilingIndex({
    leave_applications = [],
    employees = [],
    leave_entitlements = [],
    total_applications = 0,
    total_pending = 0,
    total_approved = 0,
    total_disapproved = 0,
    auth_employee_id = null,
    hr_admin_employee_ids = [],
    dto_employee_ids = [],

}: Props) {
    const isMobile = useIsMobile();

    // Create / Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<LeaveFiling | null>(null);

    // Applied Leave view / action modal
    const [viewApp, setViewApp] = useState<LeaveFiling | null>(null);
    const [viewMode, setViewMode] = useState<ActionMode>('view');

    const STATUS_ORDER: Record<string, number> = {
        'Pending': 0,
        'For Approval': 1,
        'For Disapproval': 2,
        'Approved': 3,
        'Disapproved': 4,
    };

    const { auth } = usePage<{ auth: { user: { roles: string[] } } }>().props;
    const roles: string[] = auth?.user?.roles ?? [];
    const hasRole = (role: string) => roles.includes(role);

    const isHrAdmin = hasRole('hr_admin');
    const isDto = hasRole('document_tracking_operator') && !hasRole('hr_admin') && !hasRole('super_admin');
    console.log({ roles, isHrAdmin, isDto });

    const HR_ADMIN_STATUSES = ['For Approval', 'For Disapproval', 'Approved', 'Disapproved'];



    const DTO_STATUSES = ['Pending', 'Approved', 'Disapproved'];

    const sortedApplications = useMemo(() => {
        let filtered = [...leave_applications];

        if (isHrAdmin) {
            filtered = filtered.filter(a =>
                ['For Approval', 'For Disapproval', 'Approved', 'Disapproved'].includes(a.status)
            );
            // } else if (isDto) {
            //     filtered = filtered.filter(a =>
            //         ['Pending', 'Approved', 'Disapproved'].includes(a.status)
            //     );
        }

        return filtered.sort((a, b) => {
            const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
            if (statusDiff !== 0) return statusDiff;
            // Within same status: latest filed first
            return new Date(b.date_of_filing ?? 0).getTime() - new Date(a.date_of_filing ?? 0).getTime();
        });
    }, [leave_applications, isHrAdmin, isDto]);


    function openCreate() { setEditingApp(null); setModalOpen(true); }
    function openEdit(app: LeaveFiling) { setEditingApp(app); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setEditingApp(null); }

    function openViewModal(app: LeaveFiling, mode: ActionMode = 'view') {
        setViewApp(app);
        setViewMode(mode);
    }
    function closeViewModal() { setViewApp(null); setViewMode('view'); }

    // Row click → view
    function handleRowClick(row: any) {
        openViewModal(row.original, 'view');
    }

    // Kebab action callback (lifted from columns)
    function handleAction(app: LeaveFiling, mode: ActionMode) {
        openViewModal(app, mode);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Filing" />
            <section className="w-full p-6">
                <section className="max-w-300 grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
                    <StatCard title="Total Applications" value={total_applications} description="All leave applications" icon={<CalendarDays className="size-4" />} />
                    <StatCard title="Pending" value={total_pending} description="Awaiting action" icon={<Clock className="size-4" />} />
                    <StatCard title="Approved" value={total_approved} description="Approved applications" icon={<CheckCircle className="size-4" />} />
                    <StatCard title="Disapproved" value={total_disapproved} description="Disapproved applications" icon={<XCircle className="size-4" />} />
                </section>

                <section className="bg-card p-6 rounded-lg border border-secondary">
                    <DataTable
                        columns={getColumns({ onEdit: openEdit, onAction: handleAction })}
                        // data={leave_applications}
                        data={sortedApplications}
                        getRowId={row => String(row.leave_application_id)}
                        onRowClick={handleRowClick}
                        searchColumnId="employee_name"
                        searchPlaceholder="Search by employee name…"
                        filters={[
                            {
                                columnId: 'leave_type_availed',
                                title: 'Leave Type',
                                options: Array.from(
                                    new Map(
                                        leave_entitlements.map(e => [e.leave_type_name, e])
                                    ).values()
                                ).map(e => ({
                                    value: e.leave_type_name,
                                    label: e.leave_type_name,
                                })),
                            },
                            {
                                columnId: 'status',
                                title: 'Status',
                                options: [
                                    { value: 'Pending', label: 'Pending' },
                                    { value: 'For Approval', label: 'For Approval' },
                                    { value: 'For Disapproval', label: 'For Disapproval' },
                                    { value: 'Approved', label: 'Approved' },
                                    { value: 'Disapproved', label: 'Disapproved' },
                                ],
                            },
                        ]}
                        addButton={{ label: 'File Leave', onClick: openCreate }}
                    />
                </section>
            </section>

            {/* Applied Leave View / Action Modal */}
            <AppliedLeaveViewModal
                key={`${viewApp?.leave_application_id}-${viewMode}`}
                app={viewApp}
                mode={viewMode}
                employees={employees}
                hr_admin_employee_ids={hr_admin_employee_ids}
                onClose={closeViewModal}
            />

            {/* Create / Edit modal */}
            <LeaveModal
                key={editingApp?.leave_application_id ?? 'create'}
                open={modalOpen}
                editingApp={editingApp}
                employees={employees}
                leave_entitlements={leave_entitlements}
                onClose={closeModal}
                auth_employee_id={auth_employee_id}
                hr_admin_employee_ids={hr_admin_employee_ids}
                dto_employee_ids={dto_employee_ids}
            />
        </AppLayout>
    );
}