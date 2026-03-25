/* ─────────────────────────────────────────────────────────────
   data/employee-report.ts
   Types · constants for the Employee Overview report page.
   All data comes from the server via Inertia props — no mocks.
───────────────────────────────────────────────────────────── */

/* ── Colour tokens ── */
export const blue    = '#3b82f6';
export const emerald = '#10b981';
export const amber   = '#f59e0b';
export const violet  = '#8b5cf6';
export const cyan    = '#06b6d4';
export const rose    = '#f43f5e';
export const indigo  = '#6366f1';
export const slate   = '#64748b';

/* ── Static domain constants ── */
export const EMP_TYPES   = ['Regular', 'Casual', 'Job Order'] as const;
export const STATUSES    = ['Active', 'Inactive'] as const;
export const SEX         = ['Male', 'Female'] as const;
export const EDUC_LEVELS = ['Elementary', 'High School', 'Vocational', 'College', 'Post-Graduate'] as const;

/* ── Colour pools (cycled by index for dynamic department lists) ── */
export const DEPT_COLOR_POOL = [blue, emerald, amber, violet, cyan, rose, indigo, slate] as const;

export const TYPE_COLORS: Record<string, string> = {
    Regular:    'var(--primary)',
    Casual:     'var(--chart-4)',
    'Job Order':'var(--chart-5)',
};

export const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Active:   { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '●' },
    Inactive: { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', icon: '○' },
};

/* ── Employee shape returned by the controller's formatForReport ── */
export interface Employee {
    id:             string;   // employee_id cast to string
    workId:         string;   // work_id
    name:           string;   // basicInfo.full_name
    avatarUrl:      string | null;
    department:     string;   // item.position.department.department_name
    division:       string;   // item.position.division.division_name
    position:       string;   // item.position.position_name
    type:           string;   // employment_classification
    status:         string;   // 'Active' | 'Inactive' (mapped from boolean)
    dateHired:      string;   // date_hired ISO string
    appointmentEnd: string | null;  // appointment_end_date — Casual/Job Order only
    salaryGrade:    string;   // 'SG-{grade} Step {step}' display string
    salaryGradeNum: number | null;  // raw salary_grade int for plantilla
    stepNum:        number | null;  // raw step int for plantilla
    monthlySalary:  string;   // formatted monthly salary e.g. '18,998.00'
    dailyRate:      string;   // monthly ÷ 22, formatted e.g. '863.55'
    age:            number;   // computed from birth_date
    sex:            string;   // 'Male' | 'Female'
    education:      string;   // highest education level label
    city:           string;   // from first address.city
    state:          string;   // from first address.state
    email:          string;   // work_email
}

/* ── Page-level props passed from Inertia ── */
export interface EmployeeReportProps {
    employees:          Employee[];
    totalEmployees:     number;
    activeEmployees:    number;
    inactiveEmployees:  number;
    departments:        string[];
    departmentAcronyms: Record<string, string>;
}

/* ── Client-side filter state (analytics charts only — table uses DataTable internally) ── */
export interface EmployeeFilters {
    dept:   string;
    type:   string;
    status: string;
}

export const EMPTY_FILTERS: EmployeeFilters = { dept: '', type: '', status: '' };