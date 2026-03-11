// resources/js/pages/Payroll/Processing/types.ts

export interface PayrollEmployee {
    id: number;
    name: string;
    position: string;
    employment_classification: string;
    salary_grade: number | null;
    salary_step: number | null;
    monthly_salary: number;
    basic_pay: number;
}

export interface AttendanceRecord {
    absent_days: number;
    late_minutes: number;
}

/**
 * The shape of each row in the Step 5 finalized table.
 * Derived from employeesWithStatus / finalizedEmployeesWithStatus inside Index.tsx.
 */
export interface FinalizedEmployee {
    id: number;
    name: string;
    basicPay: number;
    allowances: number;
    grossPay: number;
    gsis: number;
    philhealth: number;
    pagibig: number;
    tax: number;
    otherDeductions: number;
    internalOrgDeductions: number;
    otherDeductionsMisc: number;
    attendanceDeduction: number;
    absentDays: number;
    absentDeduction: number;
    lateMinutes: number;
    lateDeduction: number;
    totalDeductions: number;
    netPay: number;
    floorPassed: boolean;
    floorCutAmount: number;
    /** 'ok' | 'low' — kept as string to match the inferred return type of finalizedEmployeesWithStatus */
    status: string;
}