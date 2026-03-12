// Payroll Processing Index.tsx
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Download,
    PlayCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Plus,
    AlertCircle,
    CalendarIcon,
    Users,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Loader2,
    X,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { route } from 'ziggy-js';
import Heading from '@/components/heading';
import {
    createLoadEmployeeColumns,
    finalizedColumns,
} from '@/components/Payroll/PayrollProcessing/components/columns';
import {
    type PayrollEmployee,
    type FinalizedEmployee,
} from '@/components/Payroll/PayrollProcessing/data/types';
import { peso } from '@/components/Payroll/PayrollProcessing/data/utils';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Stepper } from '@/components/ui/stepper';
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
import AppLayout from '@/layouts/app-layout';

// Where is the attendance data??
// Check for PayrollProcessingController if it was extracted from there
// Employee and FinalizedEmployee Classifications are imported from ./types
// peso formatter is imported from ./utils

interface ComputedRecord {
    employee_id: number;
    employee_name: string;
    basic_pay: number;
    pera: number;
    rice_allowance: number;
    uniform_allowance: number;
    /** Overtime pay added to gross (computed from total_overtime_hours × hourly rate × 1.25) */
    overtime_pay: number;
    /** Half-day count (separate from absent_days — deducted at 0.5 × daily rate) */
    half_days: number;
    /** Half-day deduction = half_days × daily_rate × 0.5 */
    half_day_deduction: number;
    /** Personal slip minutes (chargeable — deducted at per-minute rate) */
    personal_slip_minutes: number;
    /** Personal slip deduction = personal_slip_minutes × per-minute rate */
    personal_slip_deduction: number;
    /** Official slip minutes (display only — no deduction) */
    official_slip_minutes: number;
    gross_pay: number;
    gsis_premium: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
    /** Full-day absents only (HALF_DAY is tracked separately in half_days) */
    absent_days: number;
    absent_deduction: number;
    late_minutes: number;
    late_deduction: number;
    /** Undertime minutes from updated attendance system */
    undertime_minutes: number;
    /** Undertime deduction = undertime_minutes × per-minute rate */
    undertime_deduction: number;
    /** Total days actually worked within the payroll period */
    total_work_days: number;
    /** Total hours worked (sum of daily total_hours_worked from attendance records) */
    total_hours_worked: number;
    /** Total overtime hours (sum of overtime_minutes ÷ 60) */
    total_overtime_hours: number;

    gsis_mpl: number;
    gsis_emergency: number;
    pag_ibig_mpl: number;
    ama_y2k_union: number; // org dues + org loans (2nd cut-off) + NS&ND/Misc
    water_bill: number;
    // Savings + Share_Capital — deducted on BOTH cut-offs
    internal_org_savings: number;
    // Dues only — 2nd cut-off only (from InternalOrgDeduction)
    internal_org_second: number;
    // Loans only — 2nd cut-off only (from loans table)
    internal_org_loans: number;
    internal_org_deductions: number; // total of savings + dues + loans
    other_deductions: number;
    // Per-item breakdown for org dues (no loans here anymore)
    internal_org_items: Array<{
        id: number;
        org_name: string;
        description: string;
        amount: number;
    }>;
    other_deduction_items: Array<{
        id: number;
        category: string;
        description: string;
        amount: number;
        type: 'water_bill' | 'other';
    }>;
    total_deductions: number;
    net_pay: number;
    floor_check_passed: boolean;
    floor_cut_amount: number;
    status: string;
}

interface FloorRules {
    minimum_take_home_pay: number;
    salary_threshold: number;
}

interface Props {
    auth: { user: { name?: string; first_name?: string; last_name?: string } };
    periods: any[];
    employmentClassifications: { id: number; name: string }[];
    employees: PayrollEmployee[];
    computedRecords?: ComputedRecord[];
    processedPeriodId?: number;
    processingErrors?: string[];
    floorRules?: FloorRules;
}

const breadcrumbs = [
    { title: 'Payroll', href: '/payroll' },
    { title: 'Processing', href: '/payroll/processing' },
];

function computeWorkingDaysBetween(from: Date, to: Date): number {
    let count = 0;
    const current = new Date(from);
    while (current <= to) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
}

export default function Index({
    auth,
    periods,
    employmentClassifications,
    employees,
    computedRecords: incomingComputedRecords = [],
    processedPeriodId: incomingProcessedPeriodId,
    processingErrors: incomingProcessingErrors = [],
    floorRules,
}: Props) {
    const NET_PAY_THRESHOLD = floorRules?.minimum_take_home_pay ?? 0;
    const [currentStep, setCurrentStep] = useState(1);

    // ── Step 1 state ───────────────────────────────────────────────────────────
    const [payrollMonth, setPayrollMonth] = useState<Date | undefined>(
        undefined,
    );
    const [cutoffType, setCutoffType] = useState<'first' | 'second' | ''>('');
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);
    const [monthPickerYear, setMonthPickerYear] = useState(
        new Date().getFullYear(),
    );
    const [employeeClassification, setEmployeeClassification] = useState('');
    const [workingDays, setWorkingDays] = useState('');
    const [isTypingCustom, setIsTypingCustom] = useState(false);
    const [customDaysInput, setCustomDaysInput] = useState('');
    const [extraDayOptions, setExtraDayOptions] = useState<number[]>([]);
    const [payDate, setPayDate] = useState<Date | undefined>(undefined);

    // ── Derived payroll period dates from month + cut-off ──────────────────────
    const { startDate, endDate, payrollPeriodLabel } = useMemo(() => {
        if (!payrollMonth || !cutoffType) {
            return {
                startDate: undefined,
                endDate: undefined,
                payrollPeriodLabel: '',
            };
        }
        const year = payrollMonth.getFullYear();
        const month = payrollMonth.getMonth();
        if (cutoffType === 'first') {
            const s = new Date(year, month, 1);
            const e = new Date(year, month, 15);
            return {
                startDate: s,
                endDate: e,
                payrollPeriodLabel: `${format(s, 'MMMM d')} – ${format(e, 'MMMM d, yyyy')}`,
            };
        } else {
            const s = new Date(year, month, 16);
            const e = new Date(year, month + 1, 0); // last day of month
            return {
                startDate: s,
                endDate: e,
                payrollPeriodLabel: `${format(s, 'MMMM d')} – ${format(e, 'MMMM d, yyyy')}`,
            };
        }
    }, [payrollMonth, cutoffType]);
    
    const defaultHrName =
        auth.user.name ??
        (auth.user.first_name || auth.user.last_name
            ? `${auth.user.first_name ?? ''} ${auth.user.last_name ?? ''}`.trim()
            : '');
    const [hrOfficerName, setHrOfficerName] = useState(defaultHrName);
    const [validationError, setValidationError] = useState('');
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
    const [duplicateCheckError, setDuplicateCheckError] = useState<
        string | null
    >(null);

    // ── Step 2 state ───────────────────────────────────────────────────────────
    const [includedEmployeeIds, setIncludedEmployeeIds] = useState<number[]>(
        [],
    );
    /**
     * Per-employee attendance metrics sourced from attendance_records +
     * whereabout_slips via the payroll.attendance-summary endpoint.
     *
     * absent_days           — full-day absents only (integer)
     * half_days             — HALF_DAY records (deducted at 0.5 × daily rate)
     * late_minutes          — SUM for attended days
     * undertime_minutes     — pure undertime on PRESENT days (personal slip excl.)
     * personal_slip_minutes — personal+returned slip minutes (chargeable)
     * official_slip_minutes — official slip minutes (reference only, no deduction)
     * total_work_days       — PRESENT + 0.5×HALF_DAY
     * total_hours_worked    — sum(work_minutes) / 60
     *
     * All values are pre-filled from the API but remain fully editable by HR.
     */
    const [attendance, setAttendance] = useState<
        Record<
            number,
            {
                absent_days: number;
                half_days: number;
                late_minutes: number;
                undertime_minutes: number;
                personal_slip_minutes: number;
                official_slip_minutes: number;
                total_work_days: number;
                total_hours_worked: number;
                /** Total work hours — mirrors total_hours_worked for AttendanceRecord compatibility */
                total_work_hours: number;
                /** Total overtime hours (sum of overtime_minutes ÷ 60) */
                total_overtime_hours: number;
            }
        >
    >({});
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
    const [attendanceSource, setAttendanceSource] = useState<'manual' | 'auto'>(
        'manual',
    );

    // ── Step 3 state ───────────────────────────────────────────────────────────
    const [hasComputed, setHasComputed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [computedRecords, setComputedRecords] = useState<ComputedRecord[]>(
        [],
    );
    const [processedPeriodId, setProcessedPeriodId] = useState<number | null>(
        null,
    );
    const [processingErrors, setProcessingErrors] = useState<string[]>([]);

    // ── Step 4 state ───────────────────────────────────────────────────────────
    const [reviewedIds, setReviewedIds] = useState<number[]>([]);
    const [floorWaivers, setFloorWaivers] = useState<Record<number, string[]>>(
        {},
    );
    // itemWaivers[employeeId] = array of namespaced deduction entry keys waived this period
    // Keys are prefixed by source table: 'org:{id}' for internal_org_items, 'water:{id}' for other_deduction_items
    // This prevents ID collisions between items from different DB tables.
    const [itemWaivers, setItemWaivers] = useState<Record<number, string[]>>(
        {},
    );

    // ── Step 5 state ───────────────────────────────────────────────────────────
    const [isFinalized, setIsFinalized] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [selectedBreakdownId, setSelectedBreakdownId] = useState<
        number | null
    >(null);

    useEffect(() => {
        if (incomingProcessedPeriodId && incomingComputedRecords.length > 0) {
            setComputedRecords(incomingComputedRecords);
            setProcessedPeriodId(incomingProcessedPeriodId);
            setProcessingErrors(incomingProcessingErrors);
            setHasComputed(true);
        }
    }, [incomingProcessedPeriodId, incomingComputedRecords, incomingProcessingErrors]);

    const filteredEmployees = useMemo(
        () =>
            employeeClassification
                ? employees.filter(
                      (e) =>
                          e.employment_classification ===
                          employeeClassification,
                  )
                : employees,
        [employees, employeeClassification],
    );

    useEffect(() => {
        setIncludedEmployeeIds(filteredEmployees.map((e) => e.id));
        const init: Record<
            number,
            {
                absent_days: number;
                half_days: number;
                late_minutes: number;
                undertime_minutes: number;
                personal_slip_minutes: number;
                official_slip_minutes: number;
                total_work_days: number;
                total_hours_worked: number;
                total_work_hours: number;
                total_overtime_hours: number;
            }
        > = {};
        filteredEmployees.forEach((e) => {
            init[e.id] = {
                absent_days: 0,
                half_days: 0,
                late_minutes: 0,
                undertime_minutes: 0,
                personal_slip_minutes: 0,
                official_slip_minutes: 0,
                total_work_days: 0,
                total_hours_worked: 0,
                total_work_hours: 0,
                total_overtime_hours: 0,
            };
        });
        setAttendance(init);
    }, [filteredEmployees]);

    useEffect(() => {
        if (currentStep === 2) {
            fetchAttendanceSummary();
        }
    }, [currentStep]);

    useEffect(() => {
        // Reset both flags whenever inputs change
        setDuplicateCheckError(null);
        if (!startDate || !endDate || !employeeClassification) {
            setIsDuplicate(false);
            return;
        }

        // Use a direct URL instead of Ziggy so this never fails due to a stale
        // Ziggy route manifest. The path must match web.php:
        //   Route::get('/payroll/check-duplicate', ...) ->name('payroll.check-duplicate')
        const checkUrl = '/payroll/check-duplicate';

        let cancelled = false;
        setIsDuplicateChecking(true);
        setIsDuplicate(false);

        axios
            .get(checkUrl, {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    employee_type: employeeClassification,
                },
            })
            .then(({ data }) => {
                if (!cancelled) setIsDuplicate(data.duplicate === true);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Duplicate check error:', err);
                    const status = err?.response?.status;
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        'Unknown error';
                    let errMsg = `Duplicate check failed: ${msg}.`;
                    if (status === 404) {
                        errMsg =
                            'Duplicate check endpoint not found (404). Run: php artisan route:clear && php artisan optimize';
                    }
                    // Do NOT set isDuplicate=true — that would show a false
                    // "Duplicate Payroll Detected" banner. Use a separate error state.
                    setDuplicateCheckError(errMsg);
                }
            })
            .finally(() => {
                if (!cancelled) setIsDuplicateChecking(false);
            });

        return () => {
            cancelled = true;
        };
    }, [startDate, endDate, employeeClassification]);

    const includedEmployees = useMemo(
        () =>
            filteredEmployees.filter((e) => includedEmployeeIds.includes(e.id)),
        [filteredEmployees, includedEmployeeIds],
    );

    const employeesWithStatus = useMemo(() => {
        if (hasComputed && computedRecords.length > 0) {
            return computedRecords
                .filter((r) => includedEmployeeIds.includes(r.employee_id))
                .map((r) => ({
                    id: r.employee_id,
                    name: r.employee_name,
                    basicPay: r.basic_pay,
                    allowances: r.pera + r.rice_allowance + r.uniform_allowance,
                    grossPay: r.gross_pay,
                    gsis: r.gsis_premium,
                    philhealth: r.philhealth,
                    pagibig: r.pag_ibig,
                    tax: r.withholding_tax,
                    overtimePay: r.overtime_pay ?? 0,
                    halfDays: r.half_days ?? 0,
                    halfDayDeduction: r.half_day_deduction ?? 0,
                    undertimeMinutes: r.undertime_minutes ?? 0,
                    undertimeDeduction: r.undertime_deduction ?? 0,
                    personalSlipMinutes: r.personal_slip_minutes ?? 0,
                    personalSlipDeduction: r.personal_slip_deduction ?? 0,
                    officialSlipMinutes: r.official_slip_minutes ?? 0,
                    totalWorkDays: r.total_work_days ?? 0,
                    totalHoursWorked: r.total_hours_worked ?? 0,
                    totalOvertimeHours: r.total_overtime_hours ?? 0,
                    otherDeductions:
                        r.gsis_mpl +
                        r.gsis_emergency +
                        r.pag_ibig_mpl +
                        r.ama_y2k_union +
                        r.water_bill +
                        r.absent_deduction +
                        (r.half_day_deduction ?? 0) +
                        r.late_deduction +
                        (r.undertime_deduction ?? 0) +
                        (r.personal_slip_deduction ?? 0) +
                        (r.internal_org_savings ?? 0),
                    internalOrgSavings: r.internal_org_savings ?? 0,
                    internalOrgSecond: r.internal_org_second ?? 0,
                    internalOrgLoans: r.internal_org_loans ?? 0,
                    internalOrgDeductions: r.internal_org_deductions ?? 0,
                    otherDeductionsMisc: r.other_deductions ?? 0,
                    attendanceDeduction:
                        (r.absent_deduction ?? 0) +
                        (r.half_day_deduction ?? 0) +
                        (r.late_deduction ?? 0) +
                        (r.undertime_deduction ?? 0) +
                        (r.personal_slip_deduction ?? 0),
                    absentDays: r.absent_days ?? 0,
                    absentDeduction: r.absent_deduction ?? 0,
                    lateMinutes: r.late_minutes ?? 0,
                    lateDeduction: r.late_deduction ?? 0,
                    totalDeductions: r.total_deductions,
                    netPay: r.net_pay,
                    floorPassed: r.floor_check_passed,
                    floorCutAmount: r.floor_cut_amount ?? 0,
                    status: r.net_pay >= NET_PAY_THRESHOLD ? 'ok' : 'low',
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }

        return includedEmployees
            .map((e) => ({
                id: e.id,
                name: e.name,
                basicPay: e.basic_pay,
                allowances: 0,
                grossPay: e.basic_pay,
                gsis: 0,
                philhealth: 0,
                pagibig: 0,
                tax: 0,
                overtimePay: 0,
                halfDays: 0,
                halfDayDeduction: 0,
                undertimeMinutes: 0,
                undertimeDeduction: 0,
                personalSlipMinutes: 0,
                personalSlipDeduction: 0,
                officialSlipMinutes: 0,
                totalWorkDays: 0,
                totalHoursWorked: 0,
                totalOvertimeHours: 0,
                otherDeductions: 0,
                internalOrgSavings: 0,
                internalOrgSecond: 0,
                internalOrgLoans: 0,
                internalOrgDeductions: 0,
                otherDeductionsMisc: 0,
                attendanceDeduction: 0,
                absentDays: 0,
                absentDeduction: 0,
                lateMinutes: 0,
                lateDeduction: 0,
                totalDeductions: 0,
                netPay: e.basic_pay,
                floorPassed: true,
                floorCutAmount: 0,
                status: e.basic_pay >= NET_PAY_THRESHOLD ? 'ok' : 'low',
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [hasComputed, computedRecords, includedEmployees, includedEmployeeIds, NET_PAY_THRESHOLD]);

    const flaggedEmployees = employeesWithStatus.filter(
        (e) => e.status === 'low',
    );
    const okEmployees = employeesWithStatus.filter((e) => e.status === 'ok');

    // Step 4: Flagged Employees below Threshold
    const originallyFlaggedEmployees = useMemo(() => {
        const flaggedIds = new Set(
            computedRecords
                .filter((r) => r.net_pay < NET_PAY_THRESHOLD)
                .map((r) => r.employee_id),
        );
        return employeesWithStatus.filter((e) => flaggedIds.has(e.id));
    }, [computedRecords, employeesWithStatus, NET_PAY_THRESHOLD]);
    
    const originallyPassedCount =
        employeesWithStatus.length - originallyFlaggedEmployees.length;
    const totalGross = employeesWithStatus.reduce((s, e) => s + e.grossPay, 0);
    const totalDeductions = employeesWithStatus.reduce(
        (s, e) => s + e.totalDeductions,
        0,
    );
    const totalNetPay = employeesWithStatus.reduce((s, e) => s + e.netPay, 0);

    // ── Step 5: waiver-adjusted view (reflects Step 4 decisions) ──────────────
    // employeesWithStatus intentionally uses raw values so Step 3 is never
    // affected by waivers. Step 5 needs a separate adjusted projection.
    const finalizedEmployeesWithStatus = useMemo(() => {
        return employeesWithStatus.map((e) => {
            const raw = computedRecords.find((r) => r.employee_id === e.id);
            if (!raw) return e;

            const waived = floorWaivers[e.id] ?? [];
            const waivedItems = itemWaivers[e.id] ?? [];

            const columnWaivedAmt = waived.reduce(
                (sum, k) => sum + ((raw as any)[k] ?? 0),
                0,
            );

            const amaGroupWaived = waived.includes('ama_y2k_union');
            const waterGroupWaived = waived.includes('water_bill');

            const allItems = [
                ...(raw.internal_org_items ?? []).map((i) => ({
                    ...i,
                    colKey: 'ama_y2k_union' as const,
                    itemKey: `org:${i.id}`,
                })),
                ...(raw.other_deduction_items ?? []).map((i) => ({
                    ...i,
                    colKey: (i.type === 'water_bill'
                        ? 'water_bill'
                        : 'ama_y2k_union') as string,
                    itemKey: `${i.type === 'water_bill' ? 'water' : 'org'}:${i.id}`,
                })),
            ];

            const itemWaivedAmt = allItems
                .filter((item) => {
                    if (item.colKey === 'ama_y2k_union' && amaGroupWaived)
                        return false;
                    if (item.colKey === 'water_bill' && waterGroupWaived)
                        return false;
                    return waivedItems.includes(item.itemKey);
                })
                .reduce((sum, item) => sum + item.amount, 0);

            const waivedAmt = columnWaivedAmt + itemWaivedAmt;
            const adjustedNet = raw.net_pay + waivedAmt;
            return {
                ...e,
                totalDeductions: raw.total_deductions - waivedAmt,
                netPay: adjustedNet,
                status: adjustedNet >= NET_PAY_THRESHOLD ? 'ok' : 'low',
            };
        });
    }, [employeesWithStatus, floorWaivers, itemWaivers, computedRecords, NET_PAY_THRESHOLD]);
    
    const finalizedTotalDeductions = finalizedEmployeesWithStatus.reduce(
        (s, e) => s + e.totalDeductions,
        0,
    );
    const finalizedTotalNetPay = finalizedEmployeesWithStatus.reduce(
        (s, e) => s + e.netPay,
        0,
    );

    const computedDays =
        startDate && endDate
            ? computeWorkingDaysBetween(startDate, endDate)
            : null;

    const baseDayOptions = computedDays
        ? Array.from({ length: 4 }, (_, i) => computedDays - (3 - i)).filter(
              (d) => d > 0,
          )
        : [];

    const allDayOptions = computedDays
        ? [...new Set([...baseDayOptions, ...extraDayOptions])].sort(
              (a, b) => a - b,
          )
        : [];

    const getMissingStep1Fields = () => {
        const missing = [];
        if (!payrollMonth) missing.push('Payroll Month');
        if (!cutoffType) missing.push('Cut-off');
        if (!employeeClassification) missing.push('Employee Classification');
        if (!workingDays || workingDays === 'custom')
            missing.push('Working Days');
        if (!payDate) missing.push('Pay Date');
        return missing;
    };

    const missingStep1Fields = getMissingStep1Fields();
    // Also block when a duplicate exists or the check is still in flight.
    const canProceedStep1 =
        missingStep1Fields.length === 0 &&
        !isDuplicate &&
        !isDuplicateChecking &&
        !duplicateCheckError;

    const handlePayrollMonthSelect = (year: number, monthIndex: number) => {
        setPayrollMonth(new Date(year, monthIndex, 1));
        setMonthPickerOpen(false);
        setWorkingDays('');
        setExtraDayOptions([]);
        setIsDuplicate(false);
        setValidationError('');
    };

    const handleCutoffChange = (value: 'first' | 'second') => {
        setCutoffType(value);
        setWorkingDays('');
        setExtraDayOptions([]);
        setIsDuplicate(false);
        setValidationError('');
    };

    const handleWorkingDaysChange = (value: string) => {
        if (value === 'custom') {
            setIsTypingCustom(true);
            setWorkingDays('');
            setCustomDaysInput('');
        } else {
            setIsTypingCustom(false);
            setWorkingDays(value);
        }
        setValidationError('');
    };

    const commitCustomDays = () => {
        const parsed = parseInt(customDaysInput, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= (computedDays ?? 15)) {
            if (!allDayOptions.includes(parsed)) {
                setExtraDayOptions((prev) => [...prev, parsed]);
            }
            setWorkingDays(String(parsed));
        }
        setIsTypingCustom(false);
        setCustomDaysInput('');
    };

    const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') commitCustomDays();
        if (e.key === 'Escape') {
            setIsTypingCustom(false);
            setCustomDaysInput('');
        }
    };

    const handleNextStep1 = async () => {
        // Guard: all fields must be filled first.
        if (missingStep1Fields.length > 0) {
            setValidationError(
                'Please complete all required fields before continuing.',
            );
            return;
        }

        // Hard gate: re-verify duplicate right now, regardless of the async
        // useEffect state. This ensures the check always runs at Step 1 even
        // if the useEffect result was stale or the route was slow to resolve.
        if (startDate && endDate && employeeClassification) {
            setIsDuplicateChecking(true);
            setIsDuplicate(false);
            try {
                // Direct URL — avoids Ziggy manifest staleness issues
                const checkUrl = '/payroll/check-duplicate';
                const { data } = await axios.get(checkUrl, {
                    params: {
                        start_date: format(startDate, 'yyyy-MM-dd'),
                        end_date: format(endDate, 'yyyy-MM-dd'),
                        employee_type: employeeClassification,
                    },
                });
                if (data.duplicate === true) {
                    setIsDuplicate(true);
                    setIsDuplicateChecking(false);
                    // Stop here — do NOT advance to Step 2.
                    return;
                }
            } catch (err: any) {
                console.error('Step 1 duplicate re-check failed:', err);
                const httpStatus = err?.response?.status;
                const serverMsg = err?.response?.data?.message;

                let userMsg =
                    'Duplicate check failed and could not be verified. Cannot proceed.';
                if (httpStatus === 404) {
                    userMsg =
                        'Duplicate check endpoint not found (404). Run: php artisan route:clear && php artisan optimize';
                } else if (httpStatus) {
                    userMsg = `Duplicate check failed (HTTP ${httpStatus}${serverMsg ? ': ' + serverMsg : ''}). Cannot proceed.`;
                } else if (err?.message) {
                    userMsg = `Duplicate check error: ${err.message}. Cannot proceed.`;
                }

                // Do NOT set isDuplicate=true on errors — that shows a false
                // "Duplicate Payroll Detected" banner. Use a distinct error state.
                setDuplicateCheckError(userMsg);
                setIsDuplicateChecking(false);
                return; // Hard stop — do NOT advance to Step 2.
            } finally {
                setIsDuplicateChecking(false);
            }
        }

        setValidationError('');
        setAttendanceSource('manual');
        setCurrentStep(2);
    };

    /**
     * Fetch attendance metrics from the updated attendance system for the
     * selected payroll date range.
     *
     * Fetches pre-computed attendance metrics for all employees in the period
     * from attendance_records + whereabout_slips.
     *
     * Fields returned per employee:
     *   - absent_days           — full-day absents only
     *   - half_days             — HALF_DAY records (NEW)
     *   - late_minutes          — sum for attended days
     *   - undertime_minutes     — pure undertime on PRESENT days (NEW)
     *   - personal_slip_minutes — chargeable personal slips (NEW)
     *   - official_slip_minutes — reference only, no deduction (NEW)
     *   - total_work_days       — PRESENT + 0.5×HALF_DAY
     *   - total_hours_worked    — sum(work_minutes) / 60
     *
     * All values pre-fill the Step 2 inputs but remain fully editable
     * so HR can correct any discrepancies before computing payroll.
     */
    const fetchAttendanceSummary = async () => {
        if (!startDate || !endDate) return;
        setIsLoadingAttendance(true);
        setValidationError('');
        try {
            const { data } = await axios.get(
                route('payroll.attendance-summary'),
                {
                    params: {
                        start_date: format(startDate, 'yyyy-MM-dd'),
                        end_date: format(endDate, 'yyyy-MM-dd'),
                        employee_type: employeeClassification || undefined,
                    },
                },
            );
            if (Array.isArray(data) && data.length > 0) {
                setAttendance((prev) => {
                    const next = { ...prev };
                    data.forEach(
                        ({
                            employee_id,
                            absent_days,
                            half_days,
                            late_minutes,
                            undertime_minutes,
                            personal_slip_minutes,
                            official_slip_minutes,
                            total_work_days,
                            total_hours_worked,
                        }: {
                            employee_id: number;
                            absent_days: number;
                            half_days?: number;
                            late_minutes: number;
                            undertime_minutes?: number;
                            personal_slip_minutes?: number;
                            official_slip_minutes?: number;
                            total_work_days?: number;
                            total_hours_worked?: number;
                        }) => {
                            next[employee_id] = {
                                absent_days: absent_days ?? 0,
                                half_days: half_days ?? 0,
                                late_minutes: late_minutes ?? 0,
                                undertime_minutes: undertime_minutes ?? 0,
                                personal_slip_minutes:
                                    personal_slip_minutes ?? 0,
                                official_slip_minutes:
                                    official_slip_minutes ?? 0,
                                total_work_days: Math.round(
                                    total_work_days ?? 0,
                                ),
                                total_hours_worked: total_hours_worked ?? 0,
                                total_work_hours: total_hours_worked ?? 0,
                                total_overtime_hours: 0,
                            };
                        },
                    );
                    return next;
                });
                setAttendanceSource('auto');
            } else {
                setAttendanceSource('manual');
            }
        } catch (err: any) {
            console.error('Attendance fetch error:', err);
            let msg =
                'Could not load attendance data. Please enter values manually.';

            if (err?.response?.status === 404) {
                msg =
                    'Attendance endpoint not found. Please check that the route is registered in web.php';
            } else if (err?.response?.status === 500) {
                msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    'Server error while fetching attendance data. Check logs for details.';
            } else if (err?.response?.status === 422) {
                msg =
                    'Validation error: ' +
                    (err?.response?.data?.message ||
                        'Invalid date range or parameters');
            } else if (err?.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err?.response?.data?.error) {
                msg = err.response.data.error;
            } else if (err?.message) {
                msg = err.message;
            }

            setValidationError(msg);
            setAttendanceSource('manual');
        } finally {
            setIsLoadingAttendance(false);
        }
    };

    const setEmployeeIncluded = (id: number, include: boolean) => {
        setIncludedEmployeeIds((prev) =>
            include
                ? prev.includes(id)
                    ? prev
                    : [...prev, id]
                : prev.filter((x) => x !== id),
        );
    };

    const setAllIncluded = (include: boolean) => {
        setIncludedEmployeeIds(
            include ? filteredEmployees.map((e) => e.id) : [],
        );
    };

    const updateAttendance = (
        employeeId: number,
        field:
            | 'absent_days'
            | 'half_days'
            | 'late_minutes'
            | 'undertime_minutes'
            | 'personal_slip_minutes'
            | 'official_slip_minutes'
            | 'total_work_days'
            | 'total_work_hours'
            | 'total_overtime_hours',
        value: string,
    ) => {
        setAttendance((prev) => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: Math.max(0, parseInt(value) || 0),
            },
        }));
    };

    const updateAttendanceFloat = (
        employeeId: number,
        field: 'total_overtime_hours' | 'total_hours_worked',
        value: string,
    ) => {
        setAttendance((prev) => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: Math.max(0, parseFloat(value) || 0),
            },
        }));
    };

    const handleNextStep2 = () => {
        if (includedEmployeeIds.length === 0) {
            setValidationError('Please include at least one employee.');
            return;
        }
        setValidationError('');
        setHasComputed(false);
        setCurrentStep(3);
    };

    // ── Step 3 helpers ─────────────────────────────────────────────────────────

    const handleCompute = async () => {
        if (!startDate || !endDate) return;
        setIsProcessing(true);
        setValidationError('');

        try {
            const { data } = await axios.post(route('payroll.process-new'), {
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                employee_type: employeeClassification || null,
                hr_officer_name: hrOfficerName || null,
                // Pass all attendance fields from the updated attendance system.
                // New fields (undertime_minutes, total_overtime_hours, etc.) default
                // to 0 when the employee has no entry in the attendance map.
                attendance: includedEmployeeIds.map((id) => ({
                    employee_id: id,
                    absent_days: Math.max(0, attendance[id]?.absent_days ?? 0),
                    half_days: Math.max(0, attendance[id]?.half_days ?? 0),
                    late_minutes: Math.max(
                        0,
                        attendance[id]?.late_minutes ?? 0,
                    ),
                    undertime_minutes: Math.max(
                        0,
                        attendance[id]?.undertime_minutes ?? 0,
                    ),
                    personal_slip_minutes: Math.max(
                        0,
                        attendance[id]?.personal_slip_minutes ?? 0,
                    ),
                    official_slip_minutes: Math.max(
                        0,
                        attendance[id]?.official_slip_minutes ?? 0,
                    ),
                    total_work_days: Math.round(
                        Math.max(0, attendance[id]?.total_work_days ?? 0),
                    ),
                    total_hours_worked: Math.max(
                        0,
                        attendance[id]?.total_hours_worked ?? 0,
                    ),
                })),
            });

            if (data.computedRecords?.length > 0) {
                setComputedRecords(data.computedRecords);
                setHasComputed(true);
                setProcessingErrors(data.processingErrors ?? []);
                setFloorWaivers({});
                setItemWaivers({});
            } else {
                const errMsg = data.processingErrors?.length
                    ? data.processingErrors[0]
                    : 'No records returned. Ensure employees are loaded and try again.';
                setValidationError(errMsg);
            }
        } catch (err: any) {
            const errors = err?.response?.data?.errors;
            const msg = errors
                ? (Object.values(errors)[0] as string[])[0]
                : 'Payroll processing failed. Please try again.';
            setValidationError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStep3 = () => {
        if (!hasComputed) {
            setValidationError('Please run payroll computation first.');
            return;
        }
        setValidationError('');
        setReviewedIds([]);
        const initWaivers: Record<number, string[]> = {};
        const initItemWaivers: Record<number, string[]> = {};
        flaggedEmployees.forEach((e) => {
            initWaivers[e.id] = [];
            initItemWaivers[e.id] = [];
        });
        setFloorWaivers(initWaivers);
        setItemWaivers(initItemWaivers);
        setCurrentStep(4);
    };

    // Hardcoded. Please base it from the database and remove this later on.
    const WAIVABLE_DEDUCTIONS = [
        {
            key: 'gsis_mpl',
            label: 'GSIS MPL',
            group: "Priority 2 — Gov't Loans",
        },
        {
            key: 'gsis_emergency',
            label: 'GSIS Emergency Loan',
            group: "Priority 2 — Gov't Loans",
        },
        {
            key: 'pag_ibig_mpl',
            label: 'Pag-IBIG MPL',
            group: "Priority 2 — Gov't Loans",
        },
        {
            key: 'internal_org_savings',
            label: 'Org Savings / Share Capital',
            group: 'Priority 3 — Org Savings (both cut-offs)',
        },
        {
            key: 'ama_y2k_union',
            label: 'AMA / Y2K / Union / Org Dues & Loans',
            group: 'Priority 4 — Org Dues & Loans',
        },
        {
            key: 'water_bill',
            label: 'Water Bill',
            group: 'Priority 5 — Miscellaneous',
        },
    ] as const;

    const LOCKED_DEDUCTIONS = [
        { key: 'gsis_premium', label: "GSIS Premium (Gov't Contribution)" },
        { key: 'philhealth', label: "PhilHealth (Gov't Contribution)" },
        { key: 'pag_ibig', label: "Pag-IBIG (Gov't Contribution)" },
        { key: 'withholding_tax', label: 'Withholding Tax' },
        { key: 'absent_deduction', label: 'Absent Deduction' },
        { key: 'late_deduction', label: 'Late Deduction' },
    ] as const;

    const toggleWaiver = (employeeId: number, key: string) => {
        setFloorWaivers((prev) => {
            const current = prev[employeeId] ?? [];
            const updated = current.includes(key)
                ? current.filter((k) => k !== key)
                : [...current, key];
            return { ...prev, [employeeId]: updated };
        });
    };

    const toggleItemWaiver = (employeeId: number, itemKey: string) => {
        setItemWaivers((prev) => {
            const current = prev[employeeId] ?? [];
            const updated = current.includes(itemKey)
                ? current.filter((k) => k !== itemKey)
                : [...current, itemKey];
            return { ...prev, [employeeId]: updated };
        });
    };

    // Please check for hardcoded variables. Must base from the database not hardcoded
    const getAdjustedNetPay = (employeeId: number): number => {
        const raw = computedRecords.find((r) => r.employee_id === employeeId);
        if (!raw) return 0;

        const waived = floorWaivers[employeeId] ?? [];
        const waivedItems = itemWaivers[employeeId] ?? [];

        // Column-level waivers (flat amounts from raw record)
        const columnWaivedAmt = WAIVABLE_DEDUCTIONS.filter((d) =>
            waived.includes(d.key),
        ).reduce((sum, d) => sum + ((raw as any)[d.key] ?? 0), 0);

        const amaGroupWaived = waived.includes('ama_y2k_union');
        const waterGroupWaived = waived.includes('water_bill');

        const allItems = [
            ...(raw.internal_org_items ?? []).map((i) => ({
                ...i,
                colKey: 'ama_y2k_union' as const,
                itemKey: `org:${i.id}`,
            })),
            ...(raw.other_deduction_items ?? []).map((i) => ({
                ...i,
                colKey: (i.type === 'water_bill'
                    ? 'water_bill'
                    : 'ama_y2k_union') as string,
                itemKey: `${i.type === 'water_bill' ? 'water' : 'org'}:${i.id}`,
            })),
        ];

        const itemWaivedAmt = allItems
            .filter((item) => {
                if (item.colKey === 'ama_y2k_union' && amaGroupWaived)
                    return false;
                if (item.colKey === 'water_bill' && waterGroupWaived)
                    return false;
                return waivedItems.includes(item.itemKey);
            })
            .reduce((sum, item) => sum + item.amount, 0);

        return raw.net_pay + columnWaivedAmt + itemWaivedAmt;
    };

    const allFlaggedResolved =
        originallyFlaggedEmployees.length === 0 ||
        originallyFlaggedEmployees.every(
            (e) => getAdjustedNetPay(e.id) >= NET_PAY_THRESHOLD,
        );

    const handleNextStep4 = () => {
        const unresolved = originallyFlaggedEmployees.filter(
            (e) => getAdjustedNetPay(e.id) < NET_PAY_THRESHOLD,
        );
        if (unresolved.length > 0) {
            setValidationError(
                `${unresolved.length} employee(s) still have net pay below ₱${NET_PAY_THRESHOLD.toLocaleString()}. Please waive additional deductions to proceed.`,
            );
            return;
        }
        setValidationError('');
        setCurrentStep(5);
    };

    // ── Step 5 helpers ─────────────────────────────────────────────────────────

    const handleFinalize = async () => {
        if (!startDate || !endDate) return;
        setIsFinalizing(true);
        setValidationError('');

        try {
            const records = computedRecords.map((r) => ({
                employee_id: r.employee_id,
                basic_pay: r.basic_pay,
                pera: r.pera,
                rice_allowance: r.rice_allowance,
                uniform_allowance: r.uniform_allowance,
                gsis_premium: r.gsis_premium,
                philhealth: r.philhealth,
                pag_ibig: r.pag_ibig,
                withholding_tax: r.withholding_tax,
                absent_days: r.absent_days,
                absent_deduction: r.absent_deduction,
                half_days: r.half_days ?? 0,
                half_day_deduction: r.half_day_deduction ?? 0,
                late_minutes: r.late_minutes,
                late_deduction: r.late_deduction,
                undertime_minutes: r.undertime_minutes ?? 0,
                undertime_deduction: r.undertime_deduction ?? 0,
                personal_slip_minutes: r.personal_slip_minutes ?? 0,
                personal_slip_deduction: r.personal_slip_deduction ?? 0,
                official_slip_minutes: r.official_slip_minutes ?? 0,
                total_work_days: r.total_work_days ?? 0,
                total_hours_worked: r.total_hours_worked ?? 0,
                total_overtime_hours: r.total_overtime_hours ?? 0,
                overtime_pay: r.overtime_pay ?? 0,
                // ── Loan / deduction fields ─────────────────────────────────
                gsis_mpl: r.gsis_mpl,
                gsis_emergency: r.gsis_emergency,
                pag_ibig_mpl: r.pag_ibig_mpl,
                ama_y2k_union: r.ama_y2k_union,
                water_bill: r.water_bill,
                internal_org_savings: r.internal_org_savings ?? 0,
                internal_org_second: r.internal_org_second ?? 0,
                internal_org_loans: r.internal_org_loans ?? 0,
                waived: floorWaivers[r.employee_id] ?? [],
                waived_item_ids: (itemWaivers[r.employee_id] ?? []).map((k) =>
                    parseInt(k.split(':')[1]),
                ),
            }));

            const { data } = await axios.post(route('payroll.finalize'), {
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                employee_type: employeeClassification || null,
                hr_officer_name: hrOfficerName || null,
                records,
            });

            setProcessedPeriodId(data.processedPeriodId);
            setProcessingErrors(data.processingErrors ?? []);
            setIsFinalized(true);
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ??
                err?.response?.data?.message ??
                'Finalization failed. Please try again.';
            setValidationError(msg);
        } finally {
            setIsFinalizing(false);
        }
    };

    const goBack = () => {
        setValidationError('');
        setCurrentStep((s) => Math.max(1, s - 1));
    };

    const steps = [
        { title: 'Selected Period', description: 'Step 1', icon: CalendarIcon },
        { title: 'Load Employees', description: 'Step 2', icon: Users },
        { title: 'Compute', description: 'Step 3', icon: PlayCircle },
        { title: 'Floor Check', description: 'Step 4', icon: AlertTriangle },
        { title: 'Post and Finalize', description: 'Step 5', icon: FileText },
    ];

    // ── Step 5 columns ─────────────────────────────────────────────────────────
    // Imported static export from ./components/columns — no local state deps.
    // Use `finalizedColumns` directly in the DataTable below.

    // ── Step 2 columns ─────────────────────────────────────────────────────────
    // Built via factory: closes over includedEmployeeIds, attendance, and the
    // three setter callbacks. useMemo ensures columns only rebuild when those
    // slices actually change — avoids unnecessary DataTable re-renders.
    //
    // NOTE: We do NOT use DataTable's built-in TanStack row selection here
    // because the "included" state is external and must survive filter changes.

    const loadEmployeeColumns = useMemo(
        () =>
            createLoadEmployeeColumns({
                includedEmployeeIds,
                filteredEmployees,
                attendance,
                setAllIncluded,
                setEmployeeIncluded,
                updateAttendance,
                updateAttendanceFloat,
            }),
        [includedEmployeeIds, filteredEmployees, attendance],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Processing" />

            <div className="flex flex-1 flex-col gap-8 p-8">
                <Heading title="Payroll Processing" />

                {validationError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                )}

                {processingErrors.length > 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Some employees had errors</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-1 space-y-0.5 text-xs">
                                {processingErrors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <Stepper
                    steps={steps}
                    currentStep={currentStep - 1}
                    onStepChange={() => {}}
                />

                {/* STEP 1 — Period Setup */}
                {currentStep === 1 && (
                    <Card>
                        <CardContent className="pt-6">
                            <Heading
                                title="Payroll Period Setup"
                                description="Configure the payroll period, Employee Classification, working days, and pay date before proceeding."
                            />

                            <div className="grid grid-cols-1 items-end gap-x-6 gap-y-8 md:grid-cols-4">
                                {/* Payroll Month */}
                                <Field>
                                    <FieldLabel>Payroll Month</FieldLabel>
                                    <Popover
                                        open={monthPickerOpen}
                                        onOpenChange={setMonthPickerOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${!payrollMonth ? 'text-muted-foreground' : ''} ${!payrollMonth && validationError ? 'border-destructive' : ''}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                                {payrollMonth
                                                    ? format(
                                                          payrollMonth,
                                                          'MMMM yyyy',
                                                      )
                                                    : 'Select month'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-72 p-3"
                                            align="start"
                                        >
                                            {/* Year navigation */}
                                            <div className="mb-3 flex items-center justify-between">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setMonthPickerYear(
                                                            (y) => y - 1,
                                                        )
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-sm font-semibold">
                                                    {monthPickerYear}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setMonthPickerYear(
                                                            (y) => y + 1,
                                                        )
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {/* Month grid */}
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[
                                                    'Jan',
                                                    'Feb',
                                                    'Mar',
                                                    'Apr',
                                                    'May',
                                                    'Jun',
                                                    'Jul',
                                                    'Aug',
                                                    'Sep',
                                                    'Oct',
                                                    'Nov',
                                                    'Dec',
                                                ].map((name, idx) => {
                                                    const isSelected =
                                                        payrollMonth &&
                                                        payrollMonth.getFullYear() ===
                                                            monthPickerYear &&
                                                        payrollMonth.getMonth() ===
                                                            idx;
                                                    return (
                                                        <Button
                                                            key={name}
                                                            variant={
                                                                isSelected
                                                                    ? 'default'
                                                                    : 'ghost'
                                                            }
                                                            size="sm"
                                                            className="h-9 text-xs"
                                                            onClick={() =>
                                                                handlePayrollMonthSelect(
                                                                    monthPickerYear,
                                                                    idx,
                                                                )
                                                            }
                                                        >
                                                            {name}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </Field>

                                {/* Cut-off Type */}
                                <Field>
                                    <FieldLabel>Cut-off</FieldLabel>
                                    <Select
                                        value={cutoffType}
                                        onValueChange={(v) =>
                                            handleCutoffChange(
                                                v as 'first' | 'second',
                                            )
                                        }
                                        disabled={!payrollMonth}
                                    >
                                        <SelectTrigger
                                            className={`w-full ${!cutoffType && validationError ? 'border-destructive' : ''}`}
                                        >
                                            <SelectValue
                                                placeholder={
                                                    !payrollMonth
                                                        ? 'Select month first'
                                                        : 'Select cut-off'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="first">
                                                First Cut-off (Day 1 – 15)
                                            </SelectItem>
                                            <SelectItem value="second">
                                                Second Cut-off (Day 16 – End of
                                                Month)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                {/* Computed Payroll Period (read-only) */}
                                <Field>
                                    <FieldLabel>Payroll Period</FieldLabel>
                                    <FieldDescription>
                                        Auto-computed from month &amp; cut-off
                                    </FieldDescription>
                                    <Input
                                        readOnly
                                        value={payrollPeriodLabel}
                                        placeholder="—"
                                        className="cursor-default bg-muted/40 text-sm font-medium"
                                    />
                                </Field>

                                {/* Employee Classification */}
                                <Field>
                                    <FieldLabel>
                                        Employee Classification
                                    </FieldLabel>
                                    <Select
                                        value={employeeClassification}
                                        onValueChange={(v) => {
                                            setEmployeeClassification(v);
                                            setValidationError('');
                                        }}
                                    >
                                        <SelectTrigger
                                            className={`w-full ${(!employeeClassification && validationError) || isDuplicate ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                        >
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employmentClassifications.map(
                                                (c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.name}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                {/* Working Days */}
                                <Field>
                                    <FieldLabel>
                                        Working days this period
                                    </FieldLabel>
                                    {computedDays && (
                                        <FieldDescription>
                                            Maximum {computedDays} working days
                                            in this range
                                        </FieldDescription>
                                    )}
                                    {isTypingCustom ? (
                                        <Input
                                            type="number"
                                            min={1}
                                            max={computedDays ?? 15}
                                            placeholder={`Enter days (1–${computedDays ?? 15}), press Enter`}
                                            value={customDaysInput}
                                            onChange={(e) =>
                                                setCustomDaysInput(
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={commitCustomDays}
                                            onKeyDown={handleCustomKeyDown}
                                            className="h-10 w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <Select
                                            value={workingDays}
                                            onValueChange={
                                                handleWorkingDaysChange
                                            }
                                            disabled={!computedDays}
                                        >
                                            <SelectTrigger
                                                className={`w-full ${!workingDays && validationError ? 'border-red-400' : ''}`}
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        !computedDays
                                                            ? 'Select period first'
                                                            : 'Select days'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allDayOptions.map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={String(day)}
                                                    >
                                                        {day} days
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom">
                                                    <span className="flex items-center gap-1.5">
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Custom days
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </Field>

                                <Field>
                                    <FieldLabel>Pay Date</FieldLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${!payDate ? 'text-muted-foreground' : ''} ${!payDate && validationError ? 'border-destructive' : ''}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {payDate
                                                    ? format(
                                                          payDate,
                                                          'MM/dd/yyyy',
                                                      )
                                                    : 'mm/dd/yyyy'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={payDate}
                                                onSelect={(
                                                    date: Date | undefined,
                                                ) => {
                                                    setPayDate(date);
                                                    setValidationError('');
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </Field>

                                <Field>
                                    <FieldLabel>HR Officer Name</FieldLabel>
                                    <FieldDescription>
                                        Optional — appears on printed payslips
                                    </FieldDescription>
                                    <InputGroup className="w-full">
                                        <InputGroupInput
                                            placeholder="e.g. Maria Santos"
                                            value={hrOfficerName}
                                            onChange={(e) =>
                                                setHrOfficerName(e.target.value)
                                            }
                                        />
                                    </InputGroup>
                                </Field>
                            </div>

                            {/* Summary card. Need adjusting*/}
                            {canProceedStep1 && (
                                <div className="mt-8 animate-in duration-300 fade-in slide-in-from-bottom-2">
                                    <Card>
                                        <CardContent className="px-6 py-4">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                {/* Left — period + type */}
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {payrollPeriodLabel}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                employeeClassification
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator
                                                    orientation="vertical"
                                                    className="hidden h-8 sm:block"
                                                />

                                                {/* Right — stats row */}
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Working Days
                                                        </p>
                                                        <p className="font-semibold tabular-nums">
                                                            {workingDays}
                                                        </p>
                                                    </div>
                                                    <Separator
                                                        orientation="vertical"
                                                        className="h-6"
                                                    />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Pay Date
                                                        </p>
                                                        <p className="font-semibold tabular-nums">
                                                            {format(
                                                                payDate!,
                                                                'MMM dd, yyyy',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Separator
                                                        orientation="vertical"
                                                        className="h-6"
                                                    />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Employees
                                                        </p>
                                                        <p className="font-semibold tabular-nums">
                                                            {
                                                                filteredEmployees.length
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Duplicate payroll alert */}
                            {isDuplicateChecking && (
                                <div className="mt-6">
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertTitle>
                                            Checking payroll records…
                                        </AlertTitle>
                                        <AlertDescription>
                                            Verifying whether this period has
                                            already been processed.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {isDuplicate &&
                                !isDuplicateChecking &&
                                !duplicateCheckError && (
                                    <div className="mt-6 flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                        <div>
                                            <p className="font-semibold text-red-800">
                                                Duplicate Payroll Detected
                                            </p>
                                            <p className="mt-1 text-sm text-red-700">
                                                A payroll run for{' '}
                                                <span className="font-semibold">
                                                    &ldquo;
                                                    {employeeClassification}
                                                    &rdquo;
                                                </span>{' '}
                                                already exists for the period{' '}
                                                <span className="font-semibold">
                                                    {payrollPeriodLabel}
                                                </span>
                                                . Please select a different
                                                Employment Type or review the
                                                existing payroll record.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {duplicateCheckError && !isDuplicateChecking && (
                                <div className="mt-6 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                    <div>
                                        <p className="font-semibold text-amber-800">
                                            Duplicate Check Unavailable
                                        </p>
                                        <p className="mt-1 text-sm text-amber-700">
                                            {duplicateCheckError}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end border-t pt-6">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    onClick={handleNextStep1}
                                                    disabled={!canProceedStep1}
                                                >
                                                    {isDuplicateChecking && (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    Next: Load Employees
                                                    <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        {!canProceedStep1 && (
                                            <TooltipContent
                                                side="top"
                                                className="max-w-xs"
                                            >
                                                {duplicateCheckError ? (
                                                    <p className="text-xs">
                                                        Duplicate check failed.
                                                        Cannot proceed safely.
                                                    </p>
                                                ) : isDuplicate ? (
                                                    <p className="text-xs">
                                                        This payroll period has
                                                        already been processed.
                                                    </p>
                                                ) : isDuplicateChecking ? (
                                                    <p className="text-xs">
                                                        Checking for existing
                                                        records…
                                                    </p>
                                                ) : (
                                                    <p className="text-xs">
                                                        Missing:{' '}
                                                        <span className="font-semibold">
                                                            {missingStep1Fields.join(
                                                                ', ',
                                                            )}
                                                        </span>
                                                    </p>
                                                )}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* STEP 2 — Load Employees + Attendance */}
                {currentStep === 2 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-4 flex items-start justify-between">
                                <Heading
                                    variant="small"
                                    title="Load Employees"
                                    description="Review employees and enter attendance. Uncheck any to exclude them."
                                />
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {employeeClassification}
                                    </Badge>
                                    <Badge variant="outline">
                                        {includedEmployeeIds.length} /{' '}
                                        {filteredEmployees.length} selected
                                    </Badge>
                                </div>
                            </div>

                            <div className="mb-4">
                                {isLoadingAttendance ? (
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertDescription className="flex items-center justify-between">
                                            <span>
                                                Loading attendance data…
                                            </span>
                                        </AlertDescription>
                                    </Alert>
                                ) : attendanceSource === 'auto' ? (
                                    <Alert>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription className="flex items-center justify-between">
                                            <span>
                                                Attendance data pre-filled from
                                                updated attendance records
                                                (absences, late, undertime,
                                                overtime).{' '}
                                                <span className="text-muted-foreground">
                                                    Values are editable.
                                                </span>
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={fetchAttendanceSummary}
                                                disabled={isLoadingAttendance}
                                                className="ml-4 shrink-0 gap-1.5 text-xs"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Reload from Attendance
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="flex items-center justify-between">
                                            <span>
                                                Enter absent days &amp; late
                                                minutes manually, or reload from
                                                the attendance system.
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={fetchAttendanceSummary}
                                                disabled={isLoadingAttendance}
                                                className="ml-4 shrink-0 gap-1.5 text-xs"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Reload from Attendance
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {filteredEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                                    <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No active {employeeClassification}{' '}
                                        employees found.
                                    </p>
                                </div>
                            ) : (
                                <DataTable
                                    columns={loadEmployeeColumns}
                                    data={filteredEmployees}
                                    getRowId={(row) => String(row.id)}
                                    searchColumnId="name"
                                    searchPlaceholder="Search employee..."
                                    defaultPageSize={25}
                                />
                            )}

                            <div className="mt-6 flex justify-between border-t pt-6">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                                    Back
                                </Button>
                                <Button onClick={handleNextStep2}>
                                    Load & Continue to Compute
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* STEP 3 — Compute                                            */}
                {/* ════════════════════════════════════════════════════════════ */}
                {/*
                 * WHY THIS STEP DOES NOT USE THE SHARED <DataTable> COMPONENT
                 * ─────────────────────────────────────────────────────────────
                 * The shared DataTable renders a single flat header row.
                 * This step requires a two-row grouped header:
                 *
                 *   Row 1 (group labels):  #  | Employee | ── Earnings ──── | ──────────────── Deductions ──────────────── | Net Pay | Remarks
                 *   Row 2 (sub-columns):             | Basic Pay | Allowances | Gross | Absent | Late | Undertime | Personal Slip | Official Slip | GSIS | PH | PI | Tax | Org | Other | Total |
                 *
                 * These groups use colSpan/rowSpan with distinct background
                 * colour bands (blue for Earnings, red for Deductions, green
                 * for Net Pay) that are critical for readability of the
                 * payroll ledger.
                 *
                 * TanStack Table supports column grouping via parent column
                 * definitions, but the shared DataTable component would need
                 * to be enhanced to iterate multiple header groups and apply
                 * the colour-band styling — a non-trivial change that risks
                 * breaking other tables that use it.
                 *
                 * Additionally, Step 3 has a custom <tfoot> totals row that
                 * is page-aware (sums only the current page slice), which
                 * DataTable also does not currently support.
                 *
                 * Decision: keep the native <table> here and revisit if/when
                 * DataTable is extended to support grouped headers and footer
                 * aggregation rows.
                 */}
                {currentStep === 3 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6 flex items-center justify-between">
                                <Heading
                                    variant="small"
                                    title="Employee Computation"
                                    description={
                                        hasComputed
                                            ? 'Payroll computed. Review results before proceeding to Floor Check.'
                                            : 'Click "Run Payroll" to compute deductions and net pay for all included employees.'
                                    }
                                />
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {employeeClassification}
                                    </Badge>
                                    <Badge variant="outline">
                                        {includedEmployeeIds.length} employees
                                    </Badge>
                                    <Button
                                        size="sm"
                                        onClick={handleCompute}
                                        disabled={isProcessing}
                                        variant={
                                            hasComputed
                                                ? 'secondary'
                                                : 'default'
                                        }
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : hasComputed ? (
                                            <>
                                                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                                Recompute All
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                                                Run Payroll
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {!hasComputed ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                                    <PlayCircle className="mb-3 h-12 w-12 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No computation yet
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/70">
                                        Click "Run Payroll" above to calculate
                                        net pay for {includedEmployeeIds.length}{' '}
                                        employees.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <DataTable
                                        columns={computedColumns}
                                        data={employeesWithStatus}
                                        getRowId={(row) => String(row.id)}
                                        searchColumnId="name"
                                        searchPlaceholder="Search employee..."
                                        filters={[
                                            {
                                                columnId: 'status',
                                                title: 'Status',
                                                options: [
                                                    { label: 'OK', value: 'ok' },
                                                    { label: 'Low', value: 'low' },
                                                ],
                                            },
                                        ]}
                                        defaultPageSize={10}
                                        striped
                                        headerGroups={computedHeaderGroups}
                                        footerRow={(rows) => [
                                            <td key="label" colSpan={2} className="border-r px-3 py-2.5 text-left text-xs tracking-wide text-slate-500 uppercase">
                                                Page Totals ({rows.length} employees)
                                            </td>,
                                            <td key="basicPay" className="border-r px-3 py-2.5 text-right tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.basicPay, 0))}
                                            </td>,
                                            <td key="allowances" className="border-r px-3 py-2.5 text-right tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.allowances, 0))}
                                            </td>,
                                            <td key="grossPay" className="border-r px-3 py-2.5 text-right text-blue-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.grossPay, 0))}
                                            </td>,
                                            <td key="absent" className="border-r px-3 py-2.5 text-right text-orange-600 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.absentDeduction, 0))}
                                            </td>,
                                            <td key="tardy" className="border-r px-3 py-2.5 text-right text-orange-600 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.lateDeduction, 0))}
                                            </td>,
                                            <td key="gsis" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.gsis, 0))}
                                            </td>,
                                            <td key="philhealth" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.philhealth, 0))}
                                            </td>,
                                            <td key="pagibig" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.pagibig, 0))}
                                            </td>,
                                            <td key="tax" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.tax, 0))}
                                            </td>,
                                            <td key="orgSavings" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.internalOrgSavings, 0))}
                                            </td>,
                                            <td key="orgDues" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.internalOrgSecond, 0))}
                                            </td>,
                                            <td key="orgLoans" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.internalOrgLoans, 0))}
                                            </td>,
                                            <td key="otherDed" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.otherDeductionsMisc, 0))}
                                            </td>,
                                            <td key="totalDed" className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.totalDeductions, 0))}
                                            </td>,
                                            <td key="netPay" className="border-r px-3 py-2.5 text-right text-green-700 tabular-nums">
                                                {peso(rows.reduce((s, r) => s + r.original.netPay, 0))}
                                            </td>,
                                            <td key="remarks" className="px-3 py-2.5" />,
                                        ]}
                                    />

                                    {flaggedEmployees.length > 0 && (
                                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                            <p className="text-sm text-amber-800">
                                                <span className="font-semibold">
                                                    {flaggedEmployees.length}{' '}
                                                    employee(s)
                                                </span>{' '}
                                                have a net pay below ₱
                                                {NET_PAY_THRESHOLD.toLocaleString()}
                                                . You will review them in the
                                                Floor Check step.
                                            </p>
                                        </div>
                                    )}

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        <span className="font-medium">
                                            Note:
                                        </span>{' '}
                                        Basic Pay shown is the semi-monthly
                                        amount (half of the monthly salary
                                        rate). GSIS, PhilHealth, Pag-IBIG, and
                                        withholding tax are computed based on
                                        the full monthly salary and are deducted
                                        on both cut-offs.
                                    </p>
                                </>
                            )}

                            <div className="mt-6 flex justify-between border-t pt-6">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNextStep3}
                                    disabled={!hasComputed}
                                >
                                    Next: Floor Check
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* STEP 4 — Floor Check */}
                {currentStep === 4 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6 flex items-start justify-between">
                                <Heading
                                    variant="small"
                                    title="Floor Check"
                                    description={`Employees below the ₱${NET_PAY_THRESHOLD.toLocaleString()} minimum take-home are listed below. Uncheck deductions to waive them for this period — waived amounts will carry forward to the next payroll automatically.`}
                                />
                                <div className="ml-4 flex shrink-0 items-center gap-2">
                                    <Badge variant="destructive">
                                        {originallyFlaggedEmployees.length}{' '}
                                        flagged
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                                    >
                                        {originallyPassedCount} passed
                                    </Badge>
                                </div>
                            </div>

                            {originallyFlaggedEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                                    <CheckCircle2 className="mb-3 h-12 w-12 text-green-500/60" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        All employees passed the floor check!
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/70">
                                        All {employeesWithStatus.length}{' '}
                                        employees have net pay above ₱
                                        {NET_PAY_THRESHOLD.toLocaleString()}.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {originallyFlaggedEmployees.map(
                                        (employee, index) => {
                                            const raw = computedRecords.find(
                                                (r) =>
                                                    r.employee_id ===
                                                    employee.id,
                                            );
                                            if (!raw) return null;
                                            const waived =
                                                floorWaivers[employee.id] ?? [];
                                            const waivedItems =
                                                itemWaivers[employee.id] ?? [];
                                            const adjustedNet =
                                                getAdjustedNetPay(employee.id);
                                            const isResolved =
                                                adjustedNet >=
                                                NET_PAY_THRESHOLD;
                                            const shortfall =
                                                NET_PAY_THRESHOLD - adjustedNet;

                                            return (
                                                <div
                                                    key={employee.id}
                                                    className={`rounded-lg border-2 p-5 transition-colors ${isResolved ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}
                                                >
                                                    {/* Employee header */}
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        employee.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Gross Pay:{' '}
                                                                    {peso(
                                                                        employee.grossPay,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Adjusted
                                                                        Net Pay
                                                                    </p>
                                                                    <p
                                                                        className={`text-lg font-bold ${isResolved ? 'text-green-700' : 'text-red-600'}`}
                                                                    >
                                                                        {peso(
                                                                            adjustedNet,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                                                                >
                                                                    {isResolved ? (
                                                                        <>
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                                            Resolved
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <AlertTriangle className="h-3.5 w-3.5" />{' '}
                                                                            Short
                                                                            by{' '}
                                                                            {peso(
                                                                                shortfall,
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Deductions table */}
                                                    <div className="overflow-hidden rounded-lg border bg-white">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                                    <th className="w-8 px-3 py-2 text-left">
                                                                        Deduct
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left">
                                                                        Deduction
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left">
                                                                        Group
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right">
                                                                        Amount
                                                                    </th>
                                                                    <th className="px-3 py-2 text-center">
                                                                        Status
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {/* Locked — Gov't contributions */}
                                                                {LOCKED_DEDUCTIONS.map(
                                                                    (d) => {
                                                                        const amt =
                                                                            (
                                                                                raw as any
                                                                            )[
                                                                                d
                                                                                    .key
                                                                            ] ??
                                                                            0;
                                                                        if (
                                                                            amt ===
                                                                            0
                                                                        )
                                                                            return null;
                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    d.key
                                                                                }
                                                                                className="border-b bg-slate-50/50 text-slate-400"
                                                                            >
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <span className="text-slate-300">
                                                                                        {/* LOCK ICON HERE */}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-xs">
                                                                                    {
                                                                                        d.label
                                                                                    }
                                                                                </td>
                                                                                <td className="px-3 py-2 text-xs text-slate-400">
                                                                                    Never
                                                                                    waived
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right text-xs tabular-nums">
                                                                                    {peso(
                                                                                        amt,
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                                                                                        Locked
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    },
                                                                )}
                                                                {/* Waivable deductions
                                                                     CONVENTION: checked = deducting, unchecked = waived (carry forward)
                                                                     This applies to EVERY checkbox in this table — group rows and item rows alike.
                                                                */}
                                                                {WAIVABLE_DEDUCTIONS.map(
                                                                    (d) => {
                                                                        const amt =
                                                                            (
                                                                                raw as any
                                                                            )[
                                                                                d
                                                                                    .key
                                                                            ] ??
                                                                            0;
                                                                        if (
                                                                            amt ===
                                                                            0
                                                                        )
                                                                            return null;
                                                                        // isWaived = true means the entire group column is being skipped this period
                                                                        const isWaived =
                                                                            waived.includes(
                                                                                d.key,
                                                                            );

                                                                        // ── internal_org_savings: simple waivable row (no sub-items) ─────────
                                                                        if (
                                                                            d.key ===
                                                                            'internal_org_savings'
                                                                        ) {
                                                                            return (
                                                                                <tr
                                                                                    key={
                                                                                        d.key
                                                                                    }
                                                                                    className={`border-b transition-colors ${isWaived ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50'}`}
                                                                                >
                                                                                    <td className="px-3 py-2.5 text-center">
                                                                                        <Checkbox
                                                                                            checked={
                                                                                                !isWaived
                                                                                            }
                                                                                            onCheckedChange={() =>
                                                                                                toggleWaiver(
                                                                                                    employee.id,
                                                                                                    d.key,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </td>
                                                                                    <td
                                                                                        className={`px-3 py-2.5 font-medium ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                    >
                                                                                        {
                                                                                            d.label
                                                                                        }
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                                                        {
                                                                                            d.group
                                                                                        }
                                                                                    </td>
                                                                                    <td
                                                                                        className={`px-3 py-2.5 text-right font-medium tabular-nums ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                    >
                                                                                        {peso(
                                                                                            amt,
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-center">
                                                                                        {isWaived ? (
                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                ↩
                                                                                                Carry
                                                                                                fwd
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                Deducting
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        }

                                                                        // ── ama_y2k_union: group header + per-item sub-rows ──────────────────
                                                                        if (
                                                                            d.key ===
                                                                            'ama_y2k_union'
                                                                        ) {
                                                                            const orgItems =
                                                                                raw.internal_org_items ??
                                                                                [];
                                                                            const otherItems =
                                                                                (
                                                                                    raw.other_deduction_items ??
                                                                                    []
                                                                                ).filter(
                                                                                    (
                                                                                        i,
                                                                                    ) =>
                                                                                        i.type ===
                                                                                        'other',
                                                                                );
                                                                            const allAmaItems =
                                                                                [
                                                                                    ...orgItems.map(
                                                                                        (
                                                                                            i,
                                                                                        ) =>
                                                                                            `org:${i.id}`,
                                                                                    ),
                                                                                    ...otherItems.map(
                                                                                        (
                                                                                            i,
                                                                                        ) =>
                                                                                            `org:${i.id}`,
                                                                                    ),
                                                                                ];

                                                                            // How many items are individually waived (only relevant when group is active)
                                                                            const individuallyWaivedCount =
                                                                                isWaived
                                                                                    ? 0
                                                                                    : allAmaItems.filter(
                                                                                          (
                                                                                              id,
                                                                                          ) =>
                                                                                              waivedItems.includes(
                                                                                                  id,
                                                                                              ),
                                                                                      )
                                                                                          .length;
                                                                            // Indeterminate: group is active but some (not all) items are individually waived
                                                                            const isIndeterminate =
                                                                                !isWaived &&
                                                                                individuallyWaivedCount >
                                                                                    0 &&
                                                                                individuallyWaivedCount <
                                                                                    allAmaItems.length;

                                                                            return (
                                                                                <React.Fragment
                                                                                    key={
                                                                                        d.key
                                                                                    }
                                                                                >
                                                                                    {/* Group row */}
                                                                                    <tr
                                                                                        className={`border-b transition-colors ${isWaived ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50'}`}
                                                                                    >
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                            <Checkbox
                                                                                                checked={
                                                                                                    !isWaived &&
                                                                                                    individuallyWaivedCount ===
                                                                                                        0
                                                                                                }
                                                                                                // @ts-ignore — shadcn Checkbox supports data-state="indeterminate" via ref but typed as boolean; cast is safe here
                                                                                                data-state={
                                                                                                    isIndeterminate
                                                                                                        ? 'indeterminate'
                                                                                                        : undefined
                                                                                                }
                                                                                                className={
                                                                                                    isIndeterminate
                                                                                                        ? 'opacity-60'
                                                                                                        : ''
                                                                                                }
                                                                                                onCheckedChange={() => {
                                                                                                    // Clear ALL item-level waivers for this group so state stays consistent
                                                                                                    setItemWaivers(
                                                                                                        (
                                                                                                            prev,
                                                                                                        ) => ({
                                                                                                            ...prev,
                                                                                                            [employee.id]:
                                                                                                                (
                                                                                                                    prev[
                                                                                                                        employee
                                                                                                                            .id
                                                                                                                    ] ??
                                                                                                                    []
                                                                                                                ).filter(
                                                                                                                    (
                                                                                                                        id,
                                                                                                                    ) =>
                                                                                                                        !allAmaItems.includes(
                                                                                                                            id,
                                                                                                                        ),
                                                                                                                ),
                                                                                                        }),
                                                                                                    );
                                                                                                    toggleWaiver(
                                                                                                        employee.id,
                                                                                                        d.key,
                                                                                                    );
                                                                                                }}
                                                                                            />
                                                                                        </td>
                                                                                        <td
                                                                                            className={`px-3 py-2.5 font-medium ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                        >
                                                                                            Org
                                                                                            Loans
                                                                                            &amp;
                                                                                            Dues
                                                                                            {isIndeterminate && (
                                                                                                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-600">
                                                                                                    {
                                                                                                        individuallyWaivedCount
                                                                                                    }{' '}
                                                                                                    item
                                                                                                    {individuallyWaivedCount >
                                                                                                    1
                                                                                                        ? 's'
                                                                                                        : ''}{' '}
                                                                                                    waived
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                                                            {
                                                                                                d.group
                                                                                            }
                                                                                        </td>
                                                                                        <td
                                                                                            className={`px-3 py-2.5 text-right font-medium tabular-nums ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                        >
                                                                                            {peso(
                                                                                                amt,
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                            {isWaived ? (
                                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                    ↩
                                                                                                    Carry
                                                                                                    all
                                                                                                </span>
                                                                                            ) : isIndeterminate ? (
                                                                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                                                                                    Partial
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                    Deducting
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>

                                                                                    {/* Internal org item sub-rows */}
                                                                                    {orgItems.map(
                                                                                        (
                                                                                            item,
                                                                                        ) => {
                                                                                            // checked = deducting (not waived)
                                                                                            // When group is waived: all items are effectively waived — show unchecked + disabled
                                                                                            const itemWaived =
                                                                                                isWaived ||
                                                                                                waivedItems.includes(
                                                                                                    `org:${item.id}`,
                                                                                                );
                                                                                            return (
                                                                                                <tr
                                                                                                    key={`iorg-${item.id}`}
                                                                                                    className={`border-b transition-colors ${itemWaived ? 'bg-amber-50/30' : 'bg-slate-50/60'}`}
                                                                                                >
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        <Checkbox
                                                                                                            checked={
                                                                                                                !itemWaived
                                                                                                            }
                                                                                                            disabled={
                                                                                                                isWaived
                                                                                                            }
                                                                                                            onCheckedChange={() =>
                                                                                                                toggleItemWaiver(
                                                                                                                    employee.id,
                                                                                                                    `org:${item.id}`,
                                                                                                                )
                                                                                                            }
                                                                                                            className="h-3.5 w-3.5 disabled:opacity-30"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5">
                                                                                                        <span className="flex items-center gap-1.5 text-xs">
                                                                                                            <span className="text-slate-300">
                                                                                                                ↳
                                                                                                            </span>
                                                                                                            <span
                                                                                                                className={
                                                                                                                    itemWaived
                                                                                                                        ? 'text-slate-400 line-through'
                                                                                                                        : 'text-slate-600'
                                                                                                                }
                                                                                                            >
                                                                                                                {item.description ||
                                                                                                                    item.org_name}
                                                                                                            </span>
                                                                                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                                                                                                                {
                                                                                                                    item.org_name
                                                                                                                }
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-xs text-slate-400">
                                                                                                        Org
                                                                                                        Dues
                                                                                                        &amp;
                                                                                                        Loans
                                                                                                    </td>
                                                                                                    <td
                                                                                                        className={`px-3 py-1.5 text-right text-xs tabular-nums ${itemWaived ? 'text-slate-300 line-through' : 'text-slate-500'}`}
                                                                                                    >
                                                                                                        {peso(
                                                                                                            item.amount,
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        {isWaived ? (
                                                                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                                                                                                                Group
                                                                                                            </span>
                                                                                                        ) : itemWaived ? (
                                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                                ↩
                                                                                                                Carry
                                                                                                                fwd
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                                Deducting
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        },
                                                                                    )}

                                                                                    {/* NS&ND / Misc item sub-rows */}
                                                                                    {otherItems.map(
                                                                                        (
                                                                                            item,
                                                                                        ) => {
                                                                                            const itemWaived =
                                                                                                isWaived ||
                                                                                                waivedItems.includes(
                                                                                                    `org:${item.id}`,
                                                                                                );
                                                                                            return (
                                                                                                <tr
                                                                                                    key={`od-${item.id}`}
                                                                                                    className={`border-b transition-colors ${itemWaived ? 'bg-amber-50/30' : 'bg-slate-50/60'}`}
                                                                                                >
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        <Checkbox
                                                                                                            checked={
                                                                                                                !itemWaived
                                                                                                            }
                                                                                                            disabled={
                                                                                                                isWaived
                                                                                                            }
                                                                                                            onCheckedChange={() =>
                                                                                                                toggleItemWaiver(
                                                                                                                    employee.id,
                                                                                                                    `org:${item.id}`,
                                                                                                                )
                                                                                                            }
                                                                                                            className="h-3.5 w-3.5 disabled:opacity-30"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5">
                                                                                                        <span className="flex items-center gap-1.5 text-xs">
                                                                                                            <span className="text-slate-300">
                                                                                                                ↳
                                                                                                            </span>
                                                                                                            <span
                                                                                                                className={
                                                                                                                    itemWaived
                                                                                                                        ? 'text-slate-400 line-through'
                                                                                                                        : 'text-slate-600'
                                                                                                                }
                                                                                                            >
                                                                                                                {item.description ||
                                                                                                                    item.category}
                                                                                                            </span>
                                                                                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                                                                                                                {
                                                                                                                    item.category
                                                                                                                }
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-xs text-slate-400">
                                                                                                        Other
                                                                                                        Deductions
                                                                                                    </td>
                                                                                                    <td
                                                                                                        className={`px-3 py-1.5 text-right text-xs tabular-nums ${itemWaived ? 'text-slate-300 line-through' : 'text-slate-500'}`}
                                                                                                    >
                                                                                                        {peso(
                                                                                                            item.amount,
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        {isWaived ? (
                                                                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                                                                                                                Group
                                                                                                            </span>
                                                                                                        ) : itemWaived ? (
                                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                                ↩
                                                                                                                Carry
                                                                                                                fwd
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                                Deducting
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        }

                                                                        // ── water_bill: group header + per-item sub-rows ─────────────────────
                                                                        if (
                                                                            d.key ===
                                                                            'water_bill'
                                                                        ) {
                                                                            const waterItems =
                                                                                (
                                                                                    raw.other_deduction_items ??
                                                                                    []
                                                                                ).filter(
                                                                                    (
                                                                                        i,
                                                                                    ) =>
                                                                                        i.type ===
                                                                                        'water_bill',
                                                                                );
                                                                            const allWaterIds =
                                                                                waterItems.map(
                                                                                    (
                                                                                        i,
                                                                                    ) =>
                                                                                        `water:${i.id}`,
                                                                                );
                                                                            const individuallyWaivedCount =
                                                                                isWaived
                                                                                    ? 0
                                                                                    : allWaterIds.filter(
                                                                                          (
                                                                                              id,
                                                                                          ) =>
                                                                                              waivedItems.includes(
                                                                                                  id,
                                                                                              ),
                                                                                      )
                                                                                          .length;
                                                                            const isIndeterminate =
                                                                                !isWaived &&
                                                                                individuallyWaivedCount >
                                                                                    0 &&
                                                                                individuallyWaivedCount <
                                                                                    allWaterIds.length;

                                                                            return (
                                                                                <React.Fragment
                                                                                    key={
                                                                                        d.key
                                                                                    }
                                                                                >
                                                                                    {/* Group row */}
                                                                                    <tr
                                                                                        className={`border-b transition-colors ${isWaived ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50'}`}
                                                                                    >
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                            <Checkbox
                                                                                                checked={
                                                                                                    !isWaived &&
                                                                                                    individuallyWaivedCount ===
                                                                                                        0
                                                                                                }
                                                                                                className={
                                                                                                    isIndeterminate
                                                                                                        ? 'opacity-60'
                                                                                                        : ''
                                                                                                }
                                                                                                onCheckedChange={() => {
                                                                                                    setItemWaivers(
                                                                                                        (
                                                                                                            prev,
                                                                                                        ) => ({
                                                                                                            ...prev,
                                                                                                            [employee.id]:
                                                                                                                (
                                                                                                                    prev[
                                                                                                                        employee
                                                                                                                            .id
                                                                                                                    ] ??
                                                                                                                    []
                                                                                                                ).filter(
                                                                                                                    (
                                                                                                                        id,
                                                                                                                    ) =>
                                                                                                                        !allWaterIds.includes(
                                                                                                                            id,
                                                                                                                        ),
                                                                                                                ),
                                                                                                        }),
                                                                                                    );
                                                                                                    toggleWaiver(
                                                                                                        employee.id,
                                                                                                        d.key,
                                                                                                    );
                                                                                                }}
                                                                                            />
                                                                                        </td>
                                                                                        <td
                                                                                            className={`px-3 py-2.5 font-medium ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                        >
                                                                                            {
                                                                                                d.label
                                                                                            }
                                                                                            {isIndeterminate && (
                                                                                                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-600">
                                                                                                    {
                                                                                                        individuallyWaivedCount
                                                                                                    }{' '}
                                                                                                    item
                                                                                                    {individuallyWaivedCount >
                                                                                                    1
                                                                                                        ? 's'
                                                                                                        : ''}{' '}
                                                                                                    waived
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                                                            {
                                                                                                d.group
                                                                                            }
                                                                                        </td>
                                                                                        <td
                                                                                            className={`px-3 py-2.5 text-right font-medium tabular-nums ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                        >
                                                                                            {peso(
                                                                                                amt,
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                            {isWaived ? (
                                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                    ↩
                                                                                                    Carry
                                                                                                    all
                                                                                                </span>
                                                                                            ) : isIndeterminate ? (
                                                                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                                                                                    Partial
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                    Deducting
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                    {/* Water bill item sub-rows */}
                                                                                    {waterItems.map(
                                                                                        (
                                                                                            item,
                                                                                        ) => {
                                                                                            const itemWaived =
                                                                                                isWaived ||
                                                                                                waivedItems.includes(
                                                                                                    `water:${item.id}`,
                                                                                                );
                                                                                            return (
                                                                                                <tr
                                                                                                    key={`wb-${item.id}`}
                                                                                                    className={`border-b transition-colors ${itemWaived ? 'bg-amber-50/30' : 'bg-slate-50/60'}`}
                                                                                                >
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        <Checkbox
                                                                                                            checked={
                                                                                                                !itemWaived
                                                                                                            }
                                                                                                            disabled={
                                                                                                                isWaived
                                                                                                            }
                                                                                                            onCheckedChange={() =>
                                                                                                                toggleItemWaiver(
                                                                                                                    employee.id,
                                                                                                                    `water:${item.id}`,
                                                                                                                )
                                                                                                            }
                                                                                                            className="h-3.5 w-3.5 disabled:opacity-30"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5">
                                                                                                        <span className="flex items-center gap-1.5 text-xs">
                                                                                                            <span className="text-slate-300">
                                                                                                                ↳
                                                                                                            </span>
                                                                                                            <span
                                                                                                                className={
                                                                                                                    itemWaived
                                                                                                                        ? 'text-slate-400 line-through'
                                                                                                                        : 'text-slate-600'
                                                                                                                }
                                                                                                            >
                                                                                                                {item.description ||
                                                                                                                    item.category}
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-xs text-slate-400">
                                                                                                        Water
                                                                                                        Bill
                                                                                                    </td>
                                                                                                    <td
                                                                                                        className={`px-3 py-1.5 text-right text-xs tabular-nums ${itemWaived ? 'text-slate-300 line-through' : 'text-slate-500'}`}
                                                                                                    >
                                                                                                        {peso(
                                                                                                            item.amount,
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-1.5 text-center">
                                                                                                        {isWaived ? (
                                                                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                                                                                                                Group
                                                                                                            </span>
                                                                                                        ) : itemWaived ? (
                                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                                                ↩
                                                                                                                Carry
                                                                                                                fwd
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                                                Deducting
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        }

                                                                        // ── GSIS MPL, GSIS Emergency, Pag-IBIG MPL — simple group-only rows ──
                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    d.key
                                                                                }
                                                                                className={`border-b transition-colors ${isWaived ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50'}`}
                                                                            >
                                                                                <td className="px-3 py-2.5 text-center">
                                                                                    <Checkbox
                                                                                        checked={
                                                                                            !isWaived
                                                                                        }
                                                                                        onCheckedChange={() =>
                                                                                            toggleWaiver(
                                                                                                employee.id,
                                                                                                d.key,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </td>
                                                                                <td
                                                                                    className={`px-3 py-2.5 font-medium ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                >
                                                                                    {
                                                                                        d.label
                                                                                    }
                                                                                </td>
                                                                                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                                                    {
                                                                                        d.group
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    className={`px-3 py-2.5 text-right font-medium tabular-nums ${isWaived ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                                >
                                                                                    {peso(
                                                                                        amt,
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5 text-center">
                                                                                    {isWaived ? (
                                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                            ↩
                                                                                            Carry
                                                                                            forward
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                            Deducting
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    },
                                                                )}
                                                            </tbody>
                                                            {/* Per-employee summary row */}
                                                            <tfoot>
                                                                <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm font-semibold">
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="px-3 py-2.5 text-slate-600"
                                                                    >
                                                                        Effective
                                                                        Net Pay
                                                                        after
                                                                        adjustments
                                                                    </td>
                                                                    <td
                                                                        className={`px-3 py-2.5 text-right tabular-nums ${isResolved ? 'text-green-700' : 'text-red-600'}`}
                                                                    >
                                                                        {peso(
                                                                            adjustedNet,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        {isResolved ? (
                                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                                                ✓
                                                                                OK
                                                                            </span>
                                                                        ) : (
                                                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                                                                Below
                                                                                threshold
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>

                                                    {isResolved &&
                                                        waived.length > 0 && (
                                                            <p className="mt-2 text-xs text-amber-700">
                                                                <span className="font-semibold">
                                                                    Note:
                                                                </span>{' '}
                                                                {waived.length}{' '}
                                                                deduction(s)
                                                                will carry
                                                                forward to the
                                                                next payroll
                                                                period
                                                                automatically.
                                                            </p>
                                                        )}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex justify-between border-t pt-6">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNextStep4}
                                    disabled={
                                        !allFlaggedResolved &&
                                        originallyFlaggedEmployees.length > 0
                                    }
                                >
                                    Next: Post and Finalize
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* STEP 5 — Post and Finalize */}
                {currentStep === 5 && (
                    <Card>
                        <CardContent className="pt-6">
                            <Heading
                                title="Post and Finalize"
                                description="Review the payroll summary below. Once finalized, this payroll run will be posted and locked."
                            />

                            {isFinalized ? (
                                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-green-200 bg-green-50 py-16 text-center dark:bg-green-950/20">
                                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                                    <div className="space-y-1">
                                        <p className="text-xl font-semibold text-green-800 dark:text-green-200">
                                            Payroll Posted!
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Period #{processedPeriodId} has been
                                            posted successfully.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Payroll Period
                                                </p>
                                                <p className="font-medium">
                                                    {payrollPeriodLabel || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Employee Classification
                                                </p>
                                                <p className="font-medium">
                                                    {employeeClassification}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Working Days
                                                </p>
                                                <p className="font-medium">
                                                    {workingDays} days
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Pay Date
                                                </p>
                                                <p className="font-medium">
                                                    {payDate
                                                        ? format(
                                                              payDate,
                                                              'MMM dd, yyyy',
                                                          )
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6 grid grid-cols-4 gap-4">
                                        <Card className="text-center">
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold">
                                                    {employeesWithStatus.length}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total Employees
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="text-center">
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-primary">
                                                    {peso(totalGross)}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total Gross Pay
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="text-center">
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-destructive">
                                                    {peso(
                                                        finalizedTotalDeductions,
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total Deductions
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-green-200 bg-green-50 text-center dark:bg-green-950/20">
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                    {peso(finalizedTotalNetPay)}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total Net Pay
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Summary table */}
                                    <DataTable
                                        columns={finalizedColumns}
                                        data={finalizedEmployeesWithStatus}
                                        getRowId={(row) => String(row.id)}
                                        onRowClick={(row) =>
                                            setSelectedBreakdownId(
                                                row.original.id,
                                            )
                                        }
                                        searchColumnId="name"
                                        searchPlaceholder="Search employee..."
                                        filters={[
                                            {
                                                columnId: 'status',
                                                title: 'Status',
                                                options: [
                                                    {
                                                        label: 'OK',
                                                        value: 'ok',
                                                    },
                                                    {
                                                        label: 'Low',
                                                        value: 'low',
                                                    },
                                                ],
                                            },
                                        ]}
                                        defaultPageSize={25}
                                    />
                                </>
                            )}

                            <div className="mt-6 flex justify-between border-t pt-6">
                                {!isFinalized ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={goBack}
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleFinalize}
                                            disabled={isFinalizing}
                                        >
                                            {isFinalizing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Finalize & Post Payroll
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex w-full justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                (window.location.href = route(
                                                    'payroll-register.index',
                                                ))
                                            }
                                        >
                                            View in Payroll Register
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                (window.location.href =
                                                    route('payroll.index'))
                                            }
                                        >
                                            Do Another Payroll Processing
                                            <ChevronRight />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* Step 5: Employee Breakdown Modal */}
            {(() => {
                const raw =
                    selectedBreakdownId !== null
                        ? (computedRecords.find(
                              (r) => r.employee_id === selectedBreakdownId,
                          ) ?? null)
                        : null;
                const empStatus =
                    selectedBreakdownId !== null
                        ? (finalizedEmployeesWithStatus.find(
                              (e) => e.id === selectedBreakdownId,
                          ) ?? null)
                        : null;

                if (!raw || !empStatus) return null;

                const waived = floorWaivers[raw.employee_id] ?? [];
                const waivedItems = itemWaivers[raw.employee_id] ?? [];

                // Build the effective (post-waiver) deduction amounts
                // For ama_y2k_union: group waiver zeros everything; otherwise subtract individual items
                const amaGroupWaived = waived.includes('ama_y2k_union');
                const waterGroupWaived = waived.includes('water_bill');

                const allOrgItems = [
                    ...(raw.internal_org_items ?? []),
                    ...(raw.other_deduction_items ?? []).filter(
                        (i) => i.type === 'other',
                    ),
                ];
                const allWaterItems = (raw.other_deduction_items ?? []).filter(
                    (i) => i.type === 'water_bill',
                );

                const orgItemsWithStatus = allOrgItems.map((item) => ({
                    ...item,
                    waived:
                        amaGroupWaived ||
                        waivedItems.includes(`org:${item.id}`),
                }));
                const waterItemsWithStatus = allWaterItems.map((item) => ({
                    ...item,
                    waived:
                        waterGroupWaived ||
                        waivedItems.includes(`water:${item.id}`),
                }));

                const effectiveOrgTotal = orgItemsWithStatus.reduce(
                    (s, i) => s + (i.waived ? 0 : i.amount),
                    0,
                );
                const effectiveWaterTotal = waterItemsWithStatus.reduce(
                    (s, i) => s + (i.waived ? 0 : i.amount),
                    0,
                );

                const grossPay =
                    raw.basic_pay +
                    raw.pera +
                    raw.rice_allowance +
                    raw.uniform_allowance +
                    (raw.overtime_pay ?? 0);
                const totalDeductions = empStatus.totalDeductions;
                const netPay = empStatus.netPay;

                const RowLine = ({
                    label,
                    amount,
                    muted = false,
                    waived: w = false,
                }: {
                    label: string;
                    amount: number;
                    muted?: boolean;
                    waived?: boolean;
                }) => (
                    <div className="flex items-center justify-between py-1.5">
                        <span
                            className={`text-sm ${muted || w ? 'text-muted-foreground' : 'text-foreground'} ${w ? 'line-through' : ''}`}
                        >
                            {label}
                        </span>
                        <span
                            className={`text-sm font-medium tabular-nums ${w ? 'text-muted-foreground line-through' : muted ? 'text-muted-foreground' : ''}`}
                        >
                            {peso(amount)}
                        </span>
                    </div>
                );

                return (
                    <Dialog
                        open={selectedBreakdownId !== null}
                        onOpenChange={(open) =>
                            !open && setSelectedBreakdownId(null)
                        }
                    >
                        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b px-6 pt-5 pb-4">
                                <div>
                                    <DialogTitle className="text-base font-semibold">
                                        {raw.employee_name}
                                    </DialogTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {payrollPeriodLabel || '—'}
                                        {' · '}
                                        {employeeClassification || 'All Types'}
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={
                                        empStatus.status === 'ok'
                                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                            : 'bg-red-100 text-red-600 hover:bg-red-100'
                                    }
                                >
                                    {empStatus.status === 'ok'
                                        ? 'Passed'
                                        : 'Below threshold'}
                                </Badge>
                            </div>

                            <div className="grid max-h-[65vh] grid-cols-2 divide-x overflow-y-auto">
                                <div className="px-5 py-4">
                                    <p className="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        Earnings
                                    </p>

                                    <RowLine
                                        label="Basic Pay"
                                        amount={raw.basic_pay}
                                    />
                                    {raw.pera > 0 && (
                                        <RowLine
                                            label="PERA"
                                            amount={raw.pera}
                                        />
                                    )}
                                    {raw.rice_allowance > 0 && (
                                        <RowLine
                                            label="Rice Subsidy"
                                            amount={raw.rice_allowance}
                                        />
                                    )}
                                    {raw.uniform_allowance > 0 && (
                                        <RowLine
                                            label="Uniform / Clothing"
                                            amount={raw.uniform_allowance}
                                        />
                                    )}
                                    {/* NEW: Overtime Pay */}
                                    {(raw.overtime_pay ?? 0) > 0 && (
                                        <RowLine
                                            label={`Overtime Pay (${(raw.total_overtime_hours ?? 0).toFixed(2)} hrs)`}
                                            amount={raw.overtime_pay ?? 0}
                                        />
                                    )}

                                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                                        <span className="text-sm font-semibold">
                                            Gross Pay
                                        </span>
                                        <span className="text-sm font-bold text-blue-600 tabular-nums">
                                            {peso(grossPay)}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-5 py-4">
                                    <p className="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        Deductions
                                    </p>

                                    <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                        Statutory
                                    </p>
                                    <RowLine
                                        label="GSIS Premium"
                                        amount={raw.gsis_premium}
                                    />
                                    <RowLine
                                        label="PhilHealth"
                                        amount={raw.philhealth}
                                    />
                                    <RowLine
                                        label="Pag-IBIG"
                                        amount={raw.pag_ibig}
                                    />
                                    <RowLine
                                        label="Withholding Tax"
                                        amount={raw.withholding_tax}
                                    />

                                    {/* Attendance deductions */}
                                    {(raw.absent_days > 0 ||
                                        (raw.half_days ?? 0) > 0 ||
                                        raw.late_minutes > 0 ||
                                        (raw.undertime_minutes ?? 0) > 0 ||
                                        (raw.personal_slip_minutes ?? 0) >
                                            0) && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Attendance
                                            </p>
                                            {raw.absent_days > 0 && (
                                                <RowLine
                                                    label={`Absent (${raw.absent_days} day${raw.absent_days > 1 ? 's' : ''})`}
                                                    amount={
                                                        raw.absent_deduction
                                                    }
                                                />
                                            )}
                                            {(raw.half_days ?? 0) > 0 && (
                                                <RowLine
                                                    label={`Half-Day (${raw.half_days} day${(raw.half_days ?? 0) !== 1 ? 's' : ''})`}
                                                    amount={
                                                        raw.half_day_deduction ??
                                                        0
                                                    }
                                                />
                                            )}
                                            {raw.late_minutes > 0 && (
                                                <RowLine
                                                    label={`Late (${raw.late_minutes} min)`}
                                                    amount={raw.late_deduction}
                                                />
                                            )}
                                            {(raw.undertime_minutes ?? 0) >
                                                0 && (
                                                <RowLine
                                                    label={`Undertime (${raw.undertime_minutes ?? 0} min)`}
                                                    amount={
                                                        raw.undertime_deduction ??
                                                        0
                                                    }
                                                />
                                            )}
                                            {(raw.personal_slip_minutes ?? 0) >
                                                0 && (
                                                <RowLine
                                                    label={`Personal Slip (${raw.personal_slip_minutes ?? 0} min)`}
                                                    amount={
                                                        raw.personal_slip_deduction ??
                                                        0
                                                    }
                                                />
                                            )}
                                            {(raw.official_slip_minutes ?? 0) >
                                                0 && (
                                                <RowLine
                                                    label={`Official Slip (${raw.official_slip_minutes ?? 0} min — authorized, no deduction)`}
                                                    amount={0}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Gov't Loans */}
                                    {(raw.gsis_mpl > 0 ||
                                        raw.gsis_emergency > 0 ||
                                        raw.pag_ibig_mpl > 0) && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Gov't Loans
                                            </p>
                                            {raw.gsis_mpl > 0 && (
                                                <RowLine
                                                    label="GSIS MPL"
                                                    amount={raw.gsis_mpl}
                                                    waived={waived.includes(
                                                        'gsis_mpl',
                                                    )}
                                                />
                                            )}
                                            {raw.gsis_emergency > 0 && (
                                                <RowLine
                                                    label="GSIS Emergency"
                                                    amount={raw.gsis_emergency}
                                                    waived={waived.includes(
                                                        'gsis_emergency',
                                                    )}
                                                />
                                            )}
                                            {raw.pag_ibig_mpl > 0 && (
                                                <RowLine
                                                    label="Pag-IBIG MPL"
                                                    amount={raw.pag_ibig_mpl}
                                                    waived={waived.includes(
                                                        'pag_ibig_mpl',
                                                    )}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Org Savings / Share Capital (both cut-offs) */}
                                    {(raw.internal_org_savings ?? 0) > 0 && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Org Savings
                                            </p>
                                            <RowLine
                                                label="Savings / Share Capital"
                                                amount={
                                                    raw.internal_org_savings
                                                }
                                                waived={waived.includes(
                                                    'internal_org_savings',
                                                )}
                                            />
                                        </>
                                    )}

                                    {/* Org Savings & Dues */}
                                    {orgItemsWithStatus.length > 0 && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Org Savings &amp; Dues
                                            </p>
                                            {orgItemsWithStatus.map((item) => (
                                                <div
                                                    key={`bk-org-${item.id}`}
                                                    className="flex items-start justify-between gap-2 py-1.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p
                                                            className={`truncate text-sm leading-tight ${item.waived ? 'text-muted-foreground line-through' : ''}`}
                                                        >
                                                            {item.description ||
                                                                ('org_name' in
                                                                item
                                                                    ? (
                                                                          item as any
                                                                      ).org_name
                                                                    : item.category)}
                                                        </p>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {'org_name' in item
                                                                ? (item as any)
                                                                      .org_name
                                                                : item.category}
                                                            {item.waived && (
                                                                <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                                                                    ↩
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 text-sm font-medium tabular-nums ${item.waived ? 'text-muted-foreground line-through' : ''}`}
                                                    >
                                                        {peso(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Water Bill */}
                                    {waterItemsWithStatus.length > 0 && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Water Bill
                                            </p>
                                            {waterItemsWithStatus.map(
                                                (item) => (
                                                    <div
                                                        key={`bk-wb-${item.id}`}
                                                        className="flex items-start justify-between gap-2 py-1.5"
                                                    >
                                                        <p
                                                            className={`text-sm ${item.waived ? 'text-muted-foreground line-through' : ''}`}
                                                        >
                                                            {item.description ||
                                                                item.category}
                                                            {item.waived && (
                                                                <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                                                                    ↩
                                                                </span>
                                                            )}
                                                        </p>
                                                        <span
                                                            className={`shrink-0 text-sm font-medium tabular-nums ${item.waived ? 'text-muted-foreground line-through' : ''}`}
                                                        >
                                                            {peso(item.amount)}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </>
                                    )}

                                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                                        <span className="text-sm font-semibold">
                                            Total Deductions
                                        </span>
                                        <span className="text-sm font-bold text-red-600 tabular-nums">
                                            −{peso(totalDeductions)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center justify-between border-t px-6 py-4 ${empStatus.status === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                                <div>
                                    <p className="text-sm font-semibold">
                                        Net Pay
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Gross Pay − Total Deductions
                                    </p>
                                </div>
                                <span
                                    className={`text-2xl font-bold tabular-nums ${empStatus.status === 'ok' ? 'text-green-700' : 'text-red-600'}`}
                                >
                                    {peso(netPay)}
                                </span>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            })()}
        </AppLayout>
    );
}
