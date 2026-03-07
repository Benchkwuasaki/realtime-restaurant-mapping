// Payroll Processing Index.tsx

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Download,
    PlayCircle,
    ChevronLeft,
    ChevronRight,
    Check,
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
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';

// Where is the attendance data??
// Check for PayrollProcessingController if it was extracted from there
interface Employee {
    id: number;
    name: string;
    position: string;
    employment_classification: string;
    salary_grade: number | null;
    salary_step: number | null;
    monthly_salary: number;
    basic_pay: number;
}

interface ComputedRecord {
    employee_id: number;
    employee_name: string;
    basic_pay: number;
    pera: number;
    rice_allowance: number;
    uniform_allowance: number;
    gross_pay: number;
    gsis_premium: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
    absent_days: number;
    absent_deduction: number;
    late_minutes: number;
    late_deduction: number;

    // Hardcoded organizational names. Please fix or remove if not needed
    // Always base on the daabase
    gsis_mpl: number;
    gsis_emergency: number;
    pag_ibig_mpl: number;
    ama_y2k_union: number;
    water_bill: number;
    internal_org_deductions: number;
    other_deductions: number;
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

interface Props {
    auth: { user: { name?: string; first_name?: string; last_name?: string } };
    periods: any[];
    employmentClassifications: { id: number; name: string }[];
    employees: Employee[];
    computedRecords?: ComputedRecord[];
    processedPeriodId?: number;
    processingErrors?: string[];
}

const breadcrumbs = [
    { title: 'Payroll', href: '/payroll' },
    { title: 'Processing', href: '/payroll/processing' },
];

// Base on the Floor Rules on Payroll Deduction Settings not hardcoded.
const NET_PAY_THRESHOLD = 3000;

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

function peso(amount: number) {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Index({
    auth,
    periods,
    employmentClassifications,
    employees,
    computedRecords: incomingComputedRecords = [],
    processedPeriodId: incomingProcessedPeriodId,
    processingErrors: incomingProcessingErrors = [],
}: Props) {
    const [currentStep, setCurrentStep] = useState(1);

    // ── Step 1 state ───────────────────────────────────────────────────────────
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );
    const [employeeType, setEmployeeType] = useState('');
    const [workingDays, setWorkingDays] = useState('');
    const [isTypingCustom, setIsTypingCustom] = useState(false);
    const [customDaysInput, setCustomDaysInput] = useState('');
    const [extraDayOptions, setExtraDayOptions] = useState<number[]>([]);
    const [payDate, setPayDate] = useState<Date | undefined>(undefined);
    const defaultHrName =
        auth.user.name ??
        (auth.user.first_name || auth.user.last_name
            ? `${auth.user.first_name ?? ''} ${auth.user.last_name ?? ''}`.trim()
            : '');
    const [hrOfficerName, setHrOfficerName] = useState(defaultHrName);
    const [validationError, setValidationError] = useState('');

    // ── Step 2 state ───────────────────────────────────────────────────────────
    const [includedEmployeeIds, setIncludedEmployeeIds] = useState<number[]>(
        [],
    );
    const [attendance, setAttendance] = useState<
        Record<number, { absent_days: number; late_minutes: number }>
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

    // ── Step 3 pagination ──────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // ── Step 4 state ───────────────────────────────────────────────────────────
    const [reviewedIds, setReviewedIds] = useState<number[]>([]);
    // floorWaivers[employeeId] = array of column keys waived as a group this period
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
            setCurrentPage(1);
        }
    }, [incomingProcessedPeriodId]);

    const filteredEmployees = useMemo(
        () =>
            employeeType
                ? employees.filter(
                      (e) => e.employment_classification === employeeType,
                  )
                : employees,
        [employees, employeeType],
    );

    useEffect(() => {
        setIncludedEmployeeIds(filteredEmployees.map((e) => e.id));
        const init: Record<
            number,
            { absent_days: number; late_minutes: number }
        > = {};
        filteredEmployees.forEach((e) => {
            init[e.id] = { absent_days: 0, late_minutes: 0 };
        });
        setAttendance(init);
    }, [filteredEmployees]);

    useEffect(() => {
        if (currentStep === 2) {
            fetchAttendanceSummary();
        }
    }, [currentStep]);

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
                    otherDeductions:
                        r.gsis_mpl +
                        r.gsis_emergency +
                        r.pag_ibig_mpl +
                        r.ama_y2k_union +
                        r.water_bill +
                        r.absent_deduction +
                        r.late_deduction,
                    internalOrgDeductions: r.internal_org_deductions ?? 0,
                    otherDeductionsMisc: r.other_deductions ?? 0,
                    attendanceDeduction:
                        (r.absent_deduction ?? 0) + (r.late_deduction ?? 0),
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
                otherDeductions: 0,
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
    }, [hasComputed, computedRecords, includedEmployees, includedEmployeeIds]);

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
    }, [computedRecords, employeesWithStatus]);
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
    }, [employeesWithStatus, floorWaivers, itemWaivers, computedRecords]);
    const finalizedTotalDeductions = finalizedEmployeesWithStatus.reduce(
        (s, e) => s + e.totalDeductions,
        0,
    );
    const finalizedTotalNetPay = finalizedEmployeesWithStatus.reduce(
        (s, e) => s + e.netPay,
        0,
    );

    const totalPages = Math.ceil(employeesWithStatus.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentEmployees = employeesWithStatus.slice(startIndex, endIndex);

    const computedDays =
        dateRange?.from && dateRange?.to
            ? computeWorkingDaysBetween(dateRange.from, dateRange.to)
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
        if (!dateRange?.from || !dateRange?.to) missing.push('Payroll Period');
        if (!employeeType) missing.push('Employee Type');
        if (!workingDays || workingDays === 'custom')
            missing.push('Working Days');
        if (!payDate) missing.push('Pay Date');
        return missing;
    };

    const missingStep1Fields = getMissingStep1Fields();
    const canProceedStep1 = missingStep1Fields.length === 0;

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setWorkingDays('');
        setIsTypingCustom(false);
        setCustomDaysInput('');
        setExtraDayOptions([]);
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

    const handleNextStep1 = () => {
        if (!canProceedStep1) {
            setValidationError(
                'Please complete all required fields before continuing.',
            );
            return;
        }
        setValidationError('');
        setAttendanceSource('manual');
        setCurrentStep(2);
    };

    /**
     * Fetch absent days + late minutes from the attendance system for the
     * selected date range. Results pre-fill the Step 2 inputs but remain
     * fully editable so HR can make manual corrections.
     */
    const fetchAttendanceSummary = async () => {
        if (!dateRange?.from || !dateRange?.to) return;
        setIsLoadingAttendance(true);
        setValidationError('');
        try {
            const { data } = await axios.get(
                route('payroll.attendance-summary'),
                {
                    params: {
                        start_date: format(dateRange.from, 'yyyy-MM-dd'),
                        end_date: format(dateRange.to, 'yyyy-MM-dd'),
                        employee_type: employeeType || undefined,
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
                            late_minutes,
                        }: {
                            employee_id: number;
                            absent_days: number;
                            late_minutes: number;
                        }) => {
                            next[employee_id] = {
                                absent_days: absent_days ?? 0,
                                late_minutes: late_minutes ?? 0,
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
        field: 'absent_days' | 'late_minutes',
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

    const handleNextStep2 = () => {
        if (includedEmployeeIds.length === 0) {
            setValidationError('Please include at least one employee.');
            return;
        }
        setValidationError('');
        setHasComputed(false);
        setCurrentPage(1);
        setCurrentStep(3);
    };

    // ── Step 3 helpers ─────────────────────────────────────────────────────────

    const handleCompute = async () => {
        if (!dateRange?.from || !dateRange?.to) return;
        setIsProcessing(true);
        setValidationError('');

        try {
            const { data } = await axios.post(route('payroll.process-new'), {
                start_date: format(dateRange.from, 'yyyy-MM-dd'),
                end_date: format(dateRange.to, 'yyyy-MM-dd'),
                employee_type: employeeType || null,
                hr_officer_name: hrOfficerName || null,
                attendance: includedEmployeeIds.map((id) => ({
                    employee_id: id,
                    absent_days: Math.max(0, attendance[id]?.absent_days ?? 0),
                    late_minutes: Math.max(
                        0,
                        attendance[id]?.late_minutes ?? 0,
                    ),
                })),
            });

            if (data.computedRecords?.length > 0) {
                setComputedRecords(data.computedRecords);
                setHasComputed(true);
                setCurrentPage(1);
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
        const initItemWaivers: Record<number, number[]> = {};
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
            key: 'ama_y2k_union',
            label: 'AMA / Y2K / Union / Org Dues',
            group: 'Priority 3–4 — Org Loans & Dues',
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
        if (!dateRange?.from || !dateRange?.to) return;
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
                late_minutes: r.late_minutes,
                late_deduction: r.late_deduction,
                gsis_mpl: r.gsis_mpl,
                gsis_emergency: r.gsis_emergency,
                pag_ibig_mpl: r.pag_ibig_mpl,
                ama_y2k_union: r.ama_y2k_union,
                water_bill: r.water_bill,
                waived: floorWaivers[r.employee_id] ?? [],
                waived_item_ids: (itemWaivers[r.employee_id] ?? []).map((k) =>
                    parseInt(k.split(':')[1]),
                ),
            }));

            const { data } = await axios.post(route('payroll.finalize'), {
                start_date: format(dateRange.from, 'yyyy-MM-dd'),
                end_date: format(dateRange.to, 'yyyy-MM-dd'),
                employee_type: employeeType || null,
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

    // ── Navigation ─────────────────────────────────────────────────────────────

    const goBack = () => {
        setValidationError('');
        setCurrentStep((s) => Math.max(1, s - 1));
    };
    const goToPage = (page: number) => setCurrentPage(page);

    // ── Wizard step config ─────────────────────────────────────────────────────

    const steps = [
        { label: 'Selected Period', icon: CalendarIcon },
        { label: 'Load Employees', icon: Users },
        { label: 'Compute', icon: PlayCircle },
        { label: 'Floor Check', icon: AlertTriangle },
        { label: 'Post and Finalize', icon: FileText },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Processing" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Payroll Processing
                    </h1>
                </div>

                {validationError && (
                    <Alert
                        variant="destructive"
                        className="border-red-400 bg-red-50 text-red-800"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                )}

                {/* Processing errors from backend */}
                {processingErrors.length > 0 && (
                    <Alert className="border-amber-400 bg-amber-50 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <p className="mb-1 font-semibold">
                                Some employees had errors:
                            </p>
                            <ul className="space-y-0.5 text-xs">
                                {processingErrors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Step indicator ── */}
                <div className="flex items-stretch overflow-hidden rounded-xl border border-muted/30">
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        return (
                            <div
                                key={index}
                                className={`flex flex-1 items-center gap-3 px-5 py-4 transition-colors ${isCompleted ? 'bg-green-500/15' : ''} ${isCurrent ? 'bg-blue-500/15' : ''} ${!isCompleted && !isCurrent ? 'bg-muted/10' : ''}`}
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isCompleted ? 'bg-green-500 text-white' : ''} ${isCurrent ? 'bg-blue-600 text-white' : ''} ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}`}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        stepNumber
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className={`text-xs font-medium ${isCompleted ? 'text-green-400' : ''} ${isCurrent ? 'text-blue-400' : ''} ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}`}
                                    >
                                        Step {stepNumber}
                                    </span>
                                    <span
                                        className={`text-sm font-semibold ${isCompleted ? 'text-green-300' : ''} ${isCurrent ? 'text-blue-300' : ''} ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ════════════════════════════════════════════════════════════ */}
                {/* STEP 1 — Period Setup                                       */}
                {/* ════════════════════════════════════════════════════════════ */}
                {currentStep === 1 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">
                                    Payroll Period Setup
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Configure the payroll period, employee type,
                                    working days, and pay date before
                                    proceeding.
                                </p>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium">
                                        Payroll Period
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${!dateRange?.from ? 'text-muted-foreground' : ''} ${(!dateRange?.from || !dateRange?.to) && validationError ? 'border-red-400' : ''}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <span className="truncate">
                                                            {format(
                                                                dateRange.from,
                                                                'MMM dd, y',
                                                            )}{' '}
                                                            –{' '}
                                                            {format(
                                                                dateRange.to,
                                                                'MMM dd, y',
                                                            )}
                                                        </span>
                                                    ) : (
                                                        format(
                                                            dateRange.from,
                                                            'MMM dd, y',
                                                        )
                                                    )
                                                ) : (
                                                    <span>
                                                        Pick a date range
                                                    </span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={handleDateRangeChange}
                                                numberOfMonths={2}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium">
                                        Employee Type
                                    </Label>
                                    <Select
                                        value={employeeType}
                                        onValueChange={(v) => {
                                            setEmployeeType(v);
                                            setValidationError('');
                                        }}
                                    >
                                        <SelectTrigger
                                            className={`w-full ${!employeeType && validationError ? 'border-red-400' : ''}`}
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
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium">
                                        Working days this period
                                        {computedDays && (
                                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                (max {computedDays} days)
                                            </span>
                                        )}
                                    </Label>
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
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium">
                                        Pay Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${!payDate ? 'text-muted-foreground' : ''} ${!payDate && validationError ? 'border-red-400' : ''}`}
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
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-4 gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-medium">
                                        HR Officer Name{' '}
                                        <span className="text-xs text-muted-foreground">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        placeholder="HR Officer Name"
                                        value={hrOfficerName}
                                        onChange={(e) =>
                                            setHrOfficerName(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Summary card. Need adjusting*/}
                            {canProceedStep1 && (
                                <div className="mt-8 animate-in duration-500 fade-in slide-in-from-bottom-2">
                                    <Card className="relative overflow-hidden border-blue-100 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
                                        <CardContent className="p-6">
                                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                                        <CheckCircle2 className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                                            Ready for Processing
                                                        </h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-700/80 dark:text-blue-300/80">
                                                            <span className="flex items-center gap-1.5 font-medium">
                                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                                {format(
                                                                    dateRange!
                                                                        .from!,
                                                                    'MMM dd',
                                                                )}{' '}
                                                                –{' '}
                                                                {format(
                                                                    dateRange!
                                                                        .to!,
                                                                    'MMM dd, yyyy',
                                                                )}
                                                            </span>
                                                            <span className="hidden text-blue-200 lg:inline">
                                                                |
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-blue-100/80 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                                                            >
                                                                {employeeType}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 border-t border-blue-100 pt-6 lg:flex lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                                                    <div className="space-y-1.5">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight text-blue-500/80 uppercase">
                                                            <RefreshCw className="h-3 w-3" />{' '}
                                                            Working Days
                                                        </span>
                                                        <p className="text-lg leading-none font-bold text-blue-900 dark:text-blue-50">
                                                            {workingDays}{' '}
                                                            <span className="text-xs font-normal text-blue-600/60">
                                                                Days
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight text-blue-500/80 uppercase">
                                                            <FileText className="h-3 w-3" />{' '}
                                                            Pay Date
                                                        </span>
                                                        <p className="text-lg leading-none font-bold text-blue-900 dark:text-blue-50">
                                                            {format(
                                                                payDate!,
                                                                'MMM dd, yyyy',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight text-blue-500/80 uppercase">
                                                            <Users className="h-3 w-3" />{' '}
                                                            Employees
                                                        </span>
                                                        <p className="text-lg leading-none font-bold text-blue-900 dark:text-blue-50">
                                                            {
                                                                filteredEmployees.length
                                                            }{' '}
                                                            <span className="text-xs font-normal text-blue-600/60">
                                                                found
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end border-t pt-6">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    onClick={handleNextStep1}
                                                    className={`text-white ${canProceedStep1 ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-blue-400 opacity-60'}`}
                                                >
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
                                                <p className="text-xs">
                                                    Missing:{' '}
                                                    <span className="font-semibold">
                                                        {missingStep1Fields.join(
                                                            ', ',
                                                        )}
                                                    </span>
                                                </p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* STEP 2 — Load Employees + Attendance                        */}
                {/* ════════════════════════════════════════════════════════════ */}
                {currentStep === 2 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Load Employees
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Review employees and enter attendance.
                                        Uncheck any to exclude them.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-100"
                                    >
                                        {employeeType}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="bg-muted px-3 py-1 text-muted-foreground hover:bg-muted"
                                    >
                                        {includedEmployeeIds.length} /{' '}
                                        {filteredEmployees.length} selected
                                    </Badge>
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-2.5">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    {isLoadingAttendance ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            <span>
                                                Loading attendance data…
                                            </span>
                                        </>
                                    ) : attendanceSource === 'auto' ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>
                                                Absent days &amp; late minutes
                                                pre-filled from attendance
                                                records.{' '}
                                                <span className="text-slate-400">
                                                    Values are editable.
                                                </span>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <span className="text-slate-500">
                                                Enter absent days &amp; late
                                                minutes manually, or reload from
                                                the attendance system.
                                            </span>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchAttendanceSummary}
                                    disabled={isLoadingAttendance}
                                    className="ml-4 shrink-0 gap-1.5 text-xs"
                                >
                                    {isLoadingAttendance ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                    Reload from Attendance
                                </Button>
                            </div>

                            {filteredEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                                    <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No active {employeeType} employees
                                        found.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-12 text-center">
                                                    <div className="flex justify-center">
                                                        <Checkbox
                                                            checked={
                                                                includedEmployeeIds.length ===
                                                                filteredEmployees.length
                                                                    ? true
                                                                    : includedEmployeeIds.length ===
                                                                        0
                                                                      ? false
                                                                      : 'indeterminate'
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                setAllIncluded(
                                                                    checked ===
                                                                        true ||
                                                                        checked ===
                                                                            'indeterminate',
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="w-10 text-center">
                                                    #
                                                </TableHead>
                                                <TableHead>
                                                    Employee Name
                                                </TableHead>
                                                <TableHead>
                                                    Position Title
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Salary Grade & Step
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Basic Pay (Semi-Mo.)
                                                </TableHead>
                                                <TableHead className="w-28 text-center">
                                                    Absent Days
                                                </TableHead>
                                                <TableHead className="w-32 text-center">
                                                    Late (mins)
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmployees.map(
                                                (employee, index) => {
                                                    const included =
                                                        includedEmployeeIds.includes(
                                                            employee.id,
                                                        );
                                                    return (
                                                        <TableRow
                                                            key={employee.id}
                                                            className={
                                                                !included
                                                                    ? 'opacity-40'
                                                                    : ''
                                                            }
                                                        >
                                                            <TableCell className="text-center">
                                                                <div className="flex justify-center">
                                                                    <Checkbox
                                                                        checked={
                                                                            included
                                                                        }
                                                                        onCheckedChange={(
                                                                            checked,
                                                                        ) =>
                                                                            setEmployeeIncluded(
                                                                                employee.id,
                                                                                checked ===
                                                                                    true,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center font-medium text-muted-foreground">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {employee.name}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {
                                                                    employee.position
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {employee.salary_grade ? (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="bg-green-100 text-green-700 hover:bg-green-100"
                                                                    >
                                                                        SG{' '}
                                                                        {
                                                                            employee.salary_grade
                                                                        }{' '}
                                                                        – Step{' '}
                                                                        {employee.salary_step ??
                                                                            1}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center font-medium">
                                                                {peso(
                                                                    employee.basic_pay,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={31}
                                                                    value={
                                                                        attendance[
                                                                            employee
                                                                                .id
                                                                        ]
                                                                            ?.absent_days ??
                                                                        0
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateAttendance(
                                                                            employee.id,
                                                                            'absent_days',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !included
                                                                    }
                                                                    className="mx-auto h-8 w-20 text-center"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={
                                                                        attendance[
                                                                            employee
                                                                                .id
                                                                        ]
                                                                            ?.late_minutes ??
                                                                        0
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateAttendance(
                                                                            employee.id,
                                                                            'late_minutes',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !included
                                                                    }
                                                                    className="mx-auto h-8 w-24 text-center"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                },
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            <div className="mt-6 flex justify-between border-t pt-6">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />{' '}
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNextStep2}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
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
                {currentStep === 3 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Employee Computation
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {hasComputed
                                            ? 'Payroll computed. Review results before proceeding to Floor Check.'
                                            : 'Click "Run Payroll" to compute deductions and net pay for all included employees.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-100"
                                    >
                                        {employeeType}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="bg-muted px-3 py-1 text-muted-foreground hover:bg-muted"
                                    >
                                        {includedEmployeeIds.length} employees
                                    </Badge>
                                    <Button
                                        size="sm"
                                        onClick={handleCompute}
                                        disabled={isProcessing}
                                        className={`text-white ${hasComputed ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                {/* Group header row */}
                                                <tr className="text-xs font-semibold tracking-wide uppercase">
                                                    <th
                                                        rowSpan={2}
                                                        className="w-8 border-r border-b bg-slate-100 px-2 py-2 text-center text-slate-500"
                                                    >
                                                        #
                                                    </th>
                                                    <th
                                                        rowSpan={2}
                                                        className="border-r border-b bg-slate-100 px-3 py-2 text-left text-slate-600"
                                                    >
                                                        Employee Name
                                                    </th>
                                                    {/* Earnings group */}
                                                    <th
                                                        colSpan={3}
                                                        className="border-r border-b bg-blue-50 px-3 py-1.5 text-center text-blue-700"
                                                    >
                                                        Earnings
                                                    </th>
                                                    {/* Deductions group */}
                                                    <th
                                                        colSpan={9}
                                                        className="border-r border-b bg-red-50 px-3 py-1.5 text-center text-red-700"
                                                    >
                                                        Deductions{' '}
                                                        <span className="font-normal text-red-400 normal-case">
                                                            (2nd cut-off, based
                                                            on monthly salary)
                                                        </span>
                                                    </th>
                                                    {/* Net Pay */}
                                                    <th
                                                        rowSpan={2}
                                                        className="border-r border-b bg-green-50 px-3 py-2 text-right text-green-700"
                                                    >
                                                        Net Pay
                                                    </th>
                                                    <th
                                                        rowSpan={2}
                                                        className="border-b bg-slate-100 px-3 py-2 text-center text-slate-500"
                                                    >
                                                        Remarks
                                                    </th>
                                                </tr>
                                                {/* Sub-header row */}
                                                <tr className="text-[11px] font-medium text-slate-600">
                                                    {/* Earnings sub-cols */}
                                                    <th className="border-r border-b bg-blue-50/60 px-3 py-1.5 text-right">
                                                        <div>Basic Pay</div>
                                                        <div className="text-[10px] font-normal text-blue-400">
                                                            semi-monthly
                                                        </div>
                                                    </th>
                                                    <th className="border-r border-b bg-blue-50/60 px-3 py-1.5 text-right">
                                                        Allowances
                                                    </th>
                                                    <th className="border-r border-b bg-blue-50/60 px-3 py-1.5 text-right font-semibold">
                                                        Gross Pay
                                                    </th>
                                                    {/* Deductions sub-cols */}
                                                    <th className="border-r border-b bg-orange-50/80 px-3 py-1.5 text-right">
                                                        <div>Absent</div>
                                                        <div className="text-[10px] font-normal text-orange-400">
                                                            days / amt
                                                        </div>
                                                    </th>
                                                    <th className="border-r border-b bg-orange-50/80 px-3 py-1.5 text-right">
                                                        <div>Tardy</div>
                                                        <div className="text-[10px] font-normal text-orange-400">
                                                            mins / amt
                                                        </div>
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        GSIS
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        PhilHealth
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        Pag-IBIG
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        Tax
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        <div>Internal Org</div>
                                                        <div className="text-[10px] font-normal text-red-400">
                                                            union, coop
                                                        </div>
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right">
                                                        <div>Other Ded.</div>
                                                        <div className="text-[10px] font-normal text-red-400">
                                                            water, misc
                                                        </div>
                                                    </th>
                                                    <th className="border-r border-b bg-red-50/60 px-3 py-1.5 text-right font-semibold">
                                                        Total Ded.
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentEmployees.map(
                                                    (employee, index) => (
                                                        <tr
                                                            key={employee.id}
                                                            className={`border-b transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30`}
                                                        >
                                                            <td className="border-r px-2 py-2.5 text-center text-xs text-slate-400">
                                                                {startIndex +
                                                                    index +
                                                                    1}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 font-medium text-slate-800">
                                                                {employee.name}
                                                            </td>
                                                            {/* Earnings */}
                                                            <td className="border-r px-3 py-2.5 text-right text-slate-700 tabular-nums">
                                                                {peso(
                                                                    employee.basicPay,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-slate-700 tabular-nums">
                                                                {peso(
                                                                    employee.allowances,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right font-semibold text-blue-700 tabular-nums">
                                                                {peso(
                                                                    employee.grossPay,
                                                                )}
                                                            </td>
                                                            {/* Deductions */}
                                                            {/* Absent */}
                                                            <td className="border-r px-3 py-2.5 text-right tabular-nums">
                                                                {employee.absentDays >
                                                                0 ? (
                                                                    <div>
                                                                        <div className="text-[11px] text-orange-500">
                                                                            {
                                                                                employee.absentDays
                                                                            }{' '}
                                                                            day
                                                                            {employee.absentDays !==
                                                                            1
                                                                                ? 's'
                                                                                : ''}
                                                                        </div>
                                                                        <div className="font-medium text-orange-600">
                                                                            {peso(
                                                                                employee.absentDeduction,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>
                                                            {/* Tardy */}
                                                            <td className="border-r px-3 py-2.5 text-right tabular-nums">
                                                                {employee.lateMinutes >
                                                                0 ? (
                                                                    <div>
                                                                        <div className="text-[11px] text-orange-500">
                                                                            {
                                                                                employee.lateMinutes
                                                                            }{' '}
                                                                            min
                                                                        </div>
                                                                        <div className="font-medium text-orange-600">
                                                                            {peso(
                                                                                employee.lateDeduction,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.gsis,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.philhealth,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.pagibig,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.tax,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.internalOrgDeductions,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right text-red-600 tabular-nums">
                                                                {peso(
                                                                    employee.otherDeductionsMisc,
                                                                )}
                                                            </td>
                                                            <td className="border-r px-3 py-2.5 text-right font-semibold text-red-700 tabular-nums">
                                                                {peso(
                                                                    employee.totalDeductions,
                                                                )}
                                                            </td>
                                                            {/* Net Pay */}
                                                            <td
                                                                className={`border-r px-3 py-2.5 text-right font-bold tabular-nums ${employee.status === 'low' ? 'text-red-600' : 'text-green-700'}`}
                                                            >
                                                                {peso(
                                                                    employee.netPay,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employee.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                                                                    >
                                                                        {employee.status ===
                                                                        'ok'
                                                                            ? 'OK'
                                                                            : 'Low'}
                                                                    </span>
                                                                    {employee.floorCutAmount >
                                                                        0 && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger
                                                                                    asChild
                                                                                >
                                                                                    <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                                                        Cut
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="left"
                                                                                    className="max-w-xs"
                                                                                >
                                                                                    <p className="text-xs">
                                                                                        <span className="font-semibold">
                                                                                            ₱
                                                                                            {employee.floorCutAmount.toLocaleString(
                                                                                                'en-PH',
                                                                                                {
                                                                                                    minimumFractionDigits: 2,
                                                                                                },
                                                                                            )}
                                                                                        </span>{' '}
                                                                                        in
                                                                                        deductions
                                                                                        were
                                                                                        cut
                                                                                        because
                                                                                        applying
                                                                                        them
                                                                                        would
                                                                                        bring
                                                                                        net
                                                                                        pay
                                                                                        below
                                                                                        the
                                                                                        minimum
                                                                                        take-home
                                                                                        threshold.
                                                                                    </p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                            {/* Totals row */}
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-300 bg-slate-100 text-sm font-semibold text-slate-700">
                                                    <td
                                                        colSpan={2}
                                                        className="border-r px-3 py-2.5 text-left text-xs tracking-wide text-slate-500 uppercase"
                                                    >
                                                        Page Totals (
                                                        {
                                                            currentEmployees.length
                                                        }{' '}
                                                        employees)
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.basicPay,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.allowances,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-blue-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.grossPay,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-orange-600 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.absentDeduction,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-orange-600 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.lateDeduction,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s + e.gsis,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.philhealth,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.pagibig,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s + e.tax,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.internalOrgDeductions,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.otherDeductionsMisc,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-red-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.totalDeductions,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="border-r px-3 py-2.5 text-right text-green-700 tabular-nums">
                                                        {peso(
                                                            currentEmployees.reduce(
                                                                (s, e) =>
                                                                    s +
                                                                    e.netPay,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5" />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {startIndex + 1} to{' '}
                                            {Math.min(
                                                endIndex,
                                                employeesWithStatus.length,
                                            )}{' '}
                                            of {employeesWithStatus.length}{' '}
                                            entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    goToPage(currentPage - 1)
                                                }
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from(
                                                { length: totalPages },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        currentPage === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        goToPage(page)
                                                    }
                                                    className="w-8"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    goToPage(currentPage + 1)
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

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
                                        on the 2nd cut-off only.
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
                                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Next: Floor Check
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* STEP 4 — Floor Check                                        */}
                {/* ════════════════════════════════════════════════════════════ */}
                {currentStep === 4 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Floor Check
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Employees below the ₱
                                        {NET_PAY_THRESHOLD.toLocaleString()}{' '}
                                        minimum take-home are listed below.
                                        Uncheck deductions to waive them for
                                        this period — waived amounts will carry
                                        forward to the next payroll
                                        automatically.
                                    </p>
                                </div>
                                <div className="ml-4 flex shrink-0 items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-red-100 text-red-700 hover:bg-red-100"
                                    >
                                        {originallyFlaggedEmployees.length}{' '}
                                        flagged
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 hover:bg-green-100"
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
                                                                                                    item.id,
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
                                                                                                                    item.id,
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
                                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Next: Post and Finalize
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* STEP 5 — Post and Finalize                                  */}
                {/* ════════════════════════════════════════════════════════════ */}
                {currentStep === 5 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">
                                    Post and Finalize
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Review the payroll summary below. Once
                                    finalized, this payroll run will be posted
                                    and locked.
                                </p>
                            </div>

                            {isFinalized ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 py-16 text-center">
                                    <CheckCircle2 className="mb-3 h-14 w-14 text-green-500" />
                                    <p className="text-lg font-semibold text-green-800">
                                        Payroll Posted!
                                    </p>
                                    <p className="mt-1 text-sm text-green-700">
                                        Period #{processedPeriodId} has been
                                        posted successfully.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary meta */}
                                    <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Payroll Period
                                                </p>
                                                <p className="font-medium">
                                                    {dateRange?.from &&
                                                    dateRange?.to
                                                        ? `${format(dateRange.from, 'MMM dd')} – ${format(dateRange.to, 'MMM dd, yyyy')}`
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Employee Type
                                                </p>
                                                <p className="font-medium">
                                                    {employeeType}
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

                                    {/* Totals */}
                                    <div className="mb-6 grid grid-cols-4 gap-4">
                                        <div className="rounded-lg border p-4 text-center">
                                            <p className="text-2xl font-bold">
                                                {employeesWithStatus.length}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Total Employees
                                            </p>
                                        </div>
                                        <div className="rounded-lg border p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {peso(totalGross)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Total Gross Pay
                                            </p>
                                        </div>
                                        <div className="rounded-lg border p-4 text-center">
                                            <p className="text-2xl font-bold text-red-600">
                                                {peso(finalizedTotalDeductions)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Total Deductions
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-green-50 p-4 text-center">
                                            <p className="text-2xl font-bold text-green-700">
                                                {peso(finalizedTotalNetPay)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Total Net Pay
                                            </p>
                                        </div>
                                    </div>

                                    {/* Summary table */}
                                    <div className="overflow-hidden rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-10 text-center">
                                                        #
                                                    </TableHead>
                                                    <TableHead>
                                                        Employee Name
                                                        <span className="ml-1.5 text-[10px] font-normal text-muted-foreground/60">
                                                            (click for
                                                            breakdown)
                                                        </span>
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Gross Pay
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Total Deductions
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Net Pay
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Status
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {finalizedEmployeesWithStatus.map(
                                                    (employee, index) => (
                                                        <TableRow
                                                            key={employee.id}
                                                            className="cursor-pointer hover:bg-muted/40"
                                                            onClick={() =>
                                                                setSelectedBreakdownId(
                                                                    employee.id,
                                                                )
                                                            }
                                                        >
                                                            <TableCell className="text-center text-muted-foreground">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {employee.name}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {peso(
                                                                    employee.grossPay,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {peso(
                                                                    employee.totalDeductions,
                                                                )}
                                                            </TableCell>
                                                            <TableCell
                                                                className={`text-right font-semibold ${employee.status === 'low' ? 'text-red-600' : 'text-green-700'}`}
                                                            >
                                                                {peso(
                                                                    employee.netPay,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={
                                                                        employee.status ===
                                                                        'ok'
                                                                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                                                            : 'bg-red-100 text-red-600 hover:bg-red-100'
                                                                    }
                                                                >
                                                                    {employee.status ===
                                                                    'ok'
                                                                        ? 'OK'
                                                                        : 'Low'}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
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
                                        {/* FIXED BUTTON - removed !processedPeriodId condition */}
                                        <Button
                                            className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
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
                                        <Button variant="outline">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export Payroll
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* ── Step 5: Employee Breakdown Modal ───────────────────────── */}
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
                    raw.uniform_allowance;
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
                            {/* ── Header ───────────────────────────────────── */}
                            <div className="flex items-start justify-between border-b px-6 pt-5 pb-4">
                                <div>
                                    <DialogTitle className="text-base font-semibold">
                                        {raw.employee_name}
                                    </DialogTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {dateRange?.from && dateRange?.to
                                            ? `${format(dateRange.from, 'MMM dd')} – ${format(dateRange.to, 'MMM dd, yyyy')}`
                                            : '—'}
                                        {' · '}
                                        {employeeType || 'All Types'}
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

                                    {/* Attendance */}
                                    {(raw.absent_days > 0 ||
                                        raw.late_minutes > 0) && (
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
                                            {raw.late_minutes > 0 && (
                                                <RowLine
                                                    label={`Late (${raw.late_minutes} min)`}
                                                    amount={raw.late_deduction}
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

                                    {/* Org Loans & Dues */}
                                    {orgItemsWithStatus.length > 0 && (
                                        <>
                                            <p className="mt-3 mb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                                                Org Loans &amp; Dues
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
