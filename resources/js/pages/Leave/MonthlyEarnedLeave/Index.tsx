import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    CheckCircle,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewRow {
    employee_id: number;
    name: string;
    department: string;
    employment_classification: string;
    avatar_url: string | null;
    leave_type_id: number;
    leave_type_name: string;
    attendance_days: number;
    accrual_earned: number;
    balance_before: number;
    balance_after: number;
    credit_status: 'full_credit' | 'prorated' | 'ineligible';
}

interface HistoryRow {
    posting_id: number;
    employee_id: number;
    name: string;
    department: string;
    employment_classification: string;
    avatar_url: string | null;
    leave_type_name: string;
    balance_after: number;
    reference_no: string;
    posting_date: string;
    status: string;
}

interface LeaveType {
    leave_type_id: number;
    leave_type_name: string;
}

interface PostDetails {
    posted_by: string;
    role: string;
    user_id_str: string;
    posting_date: string;
    reference_no: string;
}

interface Summary {
    total_eligible: number;
    full_credit: number;
    prorated: number;
    ineligible: number;
}

interface PageProps {
    history: HistoryRow[];
    step?: number;
    period?: { month: number; year: number };
    work_days?: number;
    total_days?: number;
    total_sundays?: number;
    total_holidays?: number;
    previews?: PreviewRow[];
    leave_types?: LeaveType[];
    summary?: Summary;
    post_details?: PostDetails;
    flash?: { success?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

// ─── Small shared components ──────────────────────────────────────────────────

function StepBadge({
    number,
    label,
    state,
}: {
    number: number;
    label: string;
    state: 'done' | 'active' | 'pending';
}) {
    return (
        <div
            className={`flex flex-1 items-center gap-3 px-5 py-4 ${
                state === 'done'
                    ? 'bg-green-50'
                    : state === 'active'
                      ? 'bg-blue-50'
                      : 'bg-white'
            }`}
        >
            {state === 'done' ? (
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle size={18} className="text-white" />
                </span>
            ) : (
                <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        state === 'active'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                    }`}
                >
                    {number}
                </span>
            )}
            <div>
                <p className="text-xs text-gray-400">Step {number}</p>
                <p
                    className={`text-sm font-medium ${
                        state === 'done'
                            ? 'text-green-700'
                            : state === 'active'
                              ? 'text-blue-700'
                              : 'text-gray-500'
                    }`}
                >
                    {label}
                </p>
            </div>
        </div>
    );
}

function CreditBadge({ status }: { status: PreviewRow['credit_status'] }) {
    const map = {
        full_credit: 'bg-green-100 text-green-700',
        prorated: 'bg-yellow-100 text-yellow-700',
        ineligible: 'bg-red-100 text-red-600',
    };
    const label = {
        full_credit: 'Full Credit',
        prorated: 'Prorated',
        ineligible: 'Ineligible',
    };
    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}
        >
            {label[status]}
        </span>
    );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
    return url ? (
        <img
            src={url}
            alt={name}
            className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
        />
    ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
            {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
        </div>
    );
}

// ─── Pagination hook ──────────────────────────────────────────────────────────

function usePagination<T>(items: T[], rowsPerPage = 10) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
    const paginated = items.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    return { page, setPage, totalPages, paginated, total: items.length };
}

// ─── Step 1 – Select Period ───────────────────────────────────────────────────

function StepSelectPeriod() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);

    function handleNext() {
        setLoading(true);
        router.get(
            route('leave.accrual.preview'),
            { month, year },
            { preserveState: false, onFinish: () => setLoading(false) },
        );
    }

    return (
        <div className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-800">
                Select Posting Period
            </h2>
            <div className="grid max-w-2xl grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-xs text-gray-500">
                        Month
                    </label>
                    <div className="relative">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <ChevronRight
                            size={14}
                            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-gray-400"
                        />
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-xs text-gray-500">
                        Year
                    </label>
                    <div className="relative">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <ChevronRight
                            size={14}
                            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rotate-90 text-gray-400"
                        />
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                    <Plus size={15} />
                    {loading ? 'Loading…' : 'Next'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 2 – Preview Credits ─────────────────────────────────────────────────

function StepPreviewCredits({
    previews,
    leaveTypes,
    period,
}: {
    previews: PreviewRow[];
    leaveTypes: LeaveType[];
    period: { month: number; year: number };
}) {
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Group previews by employee then pivot leave types as columns
    const employeeMap = useMemo(() => {
        const map = new Map<
            number,
            {
                employee_id: number;
                name: string;
                department: string;
                employment_classification: string;
                avatar_url: string | null;
                credit_status: PreviewRow['credit_status'];
                leaves: Record<
                    number,
                    { before: number; credit: number; after: number }
                >;
            }
        >();

        for (const row of previews) {
            if (!map.has(row.employee_id)) {
                map.set(row.employee_id, {
                    employee_id: row.employee_id,
                    name: row.name,
                    department: row.department,
                    employment_classification: row.employment_classification,
                    avatar_url: row.avatar_url,
                    credit_status: row.credit_status,
                    leaves: {},
                });
            }
            map.get(row.employee_id)!.leaves[row.leave_type_id] = {
                before: row.balance_before,
                credit: row.accrual_earned,
                after: row.balance_after,
            };
        }

        return Array.from(map.values());
    }, [previews]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return employeeMap.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.department.toLowerCase().includes(q) ||
                e.employment_classification.toLowerCase().includes(q),
        );
    }, [employeeMap, search]);

    const { page, setPage, totalPages, paginated, total } = usePagination(
        filtered,
        rowsPerPage,
    );

    const [selected, setSelected] = useState<Set<number>>(new Set());

    function toggleAll() {
        if (selected.size === paginated.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paginated.map((e) => e.employee_id)));
        }
    }

    function toggle(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    const [loading, setLoading] = useState(false);

    function handleNext() {
        setLoading(true);
        router.post(
            route('leave.accrual.confirm'),
            { month: period.month, year: period.year },
            { preserveState: false, onFinish: () => setLoading(false) },
        );
    }

    function handleBack() {
        router.get(route('leave.accrual.index'));
    }

    const monthLabel = MONTHS[period.month - 1];

    return (
        <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    Preview Earned Leave Credits — {monthLabel} {period.year}
                </h2>
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-56 rounded-lg border border-gray-200 py-2 pr-3 pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="w-10 px-3 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={
                                        selected.size === paginated.length &&
                                        paginated.length > 0
                                    }
                                    onChange={toggleAll}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Employee Name
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Department
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Employment Type
                            </th>
                            {leaveTypes.map((lt) => (
                                <th
                                    key={lt.leave_type_id}
                                    colSpan={3}
                                    className="border-l border-gray-100 px-3 py-3 text-center font-medium text-gray-600"
                                >
                                    {lt.leave_type_name}
                                </th>
                            ))}
                            <th className="px-3 py-3 text-center font-medium text-gray-600">
                                Status
                            </th>
                        </tr>
                        {/* Sub-header for Balance / Credit / New Balance */}
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th colSpan={4} />
                            {leaveTypes.map((lt) => (
                                <>
                                    <th
                                        key={`${lt.leave_type_id}-b`}
                                        className="border-l border-gray-100 px-2 py-2 text-center text-xs font-normal text-gray-400"
                                    >
                                        Balance
                                    </th>
                                    <th
                                        key={`${lt.leave_type_id}-c`}
                                        className="px-2 py-2 text-center text-xs font-normal text-gray-400"
                                    >
                                        Credit
                                    </th>
                                    <th
                                        key={`${lt.leave_type_id}-n`}
                                        className="px-2 py-2 text-center text-xs font-normal text-gray-400"
                                    >
                                        New Balance
                                    </th>
                                </>
                            ))}
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((employee) => (
                            <tr
                                key={employee.employee_id}
                                className="border-b border-gray-50 hover:bg-gray-50/50"
                            >
                                <td className="px-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(
                                            employee.employee_id,
                                        )}
                                        onChange={() =>
                                            toggle(employee.employee_id)
                                        }
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            url={employee.avatar_url}
                                            name={employee.name}
                                        />
                                        <span className="text-gray-700">
                                            {employee.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-gray-500">
                                    {employee.department}
                                </td>
                                <td className="px-3 py-3 text-gray-500">
                                    {employee.employment_classification}
                                </td>
                                {leaveTypes.map((lt) => {
                                    const data =
                                        employee.leaves[lt.leave_type_id];
                                    return (
                                        <>
                                            <td
                                                key={`${employee.employee_id}-${lt.leave_type_id}-b`}
                                                className="border-l border-gray-100 px-2 py-3 text-center text-gray-400"
                                            >
                                                {data
                                                    ? data.before.toFixed(2)
                                                    : '0.00'}
                                            </td>
                                            <td
                                                key={`${employee.employee_id}-${lt.leave_type_id}-c`}
                                                className="px-2 py-3 text-center font-medium text-green-500"
                                            >
                                                {data
                                                    ? `+${data.credit.toFixed(2)}`
                                                    : '+0.00'}
                                            </td>
                                            <td
                                                key={`${employee.employee_id}-${lt.leave_type_id}-n`}
                                                className="px-2 py-3 text-center font-medium text-blue-500"
                                            >
                                                {data
                                                    ? data.after.toFixed(2)
                                                    : '0.00'}
                                            </td>
                                        </>
                                    );
                                })}
                                <td className="px-3 py-3 text-center">
                                    <CreditBadge
                                        status={employee.credit_status}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                    {selected.size} of {total} row(s) selected.
                </span>
                <div className="flex items-center gap-3">
                    <span>Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                    >
                        {[10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronsLeft size={15} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronRight size={15} />
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronsRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
                >
                    <Plus size={14} className="rotate-45" /> Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                    <Plus size={15} />
                    {loading ? 'Loading…' : 'Next'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 3 – Confirm Posting ─────────────────────────────────────────────────

function StepConfirmPosting({
    summary,
    postDetails,
    period,
}: {
    summary: Summary;
    postDetails: PostDetails;
    period: { month: number; year: number };
}) {
    const [loading, setLoading] = useState(false);
    const monthLabel = MONTHS[period.month - 1];

    function handleBack() {
        router.get(route('leave.accrual.preview'), {
            month: period.month,
            year: period.year,
        });
    }

    function handleConfirm() {
        setLoading(true);
        router.post(
            route('leave.accrual.post'),
            { month: period.month, year: period.year },
            { preserveState: false, onFinish: () => setLoading(false) },
        );
    }

    return (
        <div className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-800">
                Confirm Posting
            </h2>
            <div className="grid grid-cols-2 gap-5">
                {/* Posting Summary */}
                <div className="rounded-xl border border-gray-200 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                        Posting Summary
                    </h3>
                    {[
                        ['Posting Period', `${monthLabel} ${period.year}`],
                        ['Total Eligible', summary.total_eligible],
                        ['Full Credit Employees', summary.full_credit],
                        ['Prorated', summary.prorated],
                        ['Ineligible', summary.ineligible],
                    ].map(([label, value]) => (
                        <div
                            key={String(label)}
                            className="flex justify-between border-b border-gray-100 py-2.5 last:border-0"
                        >
                            <span className="text-sm text-gray-400">
                                {label}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Post Details */}
                <div className="rounded-xl border border-gray-200 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                        Post Details
                    </h3>
                    {[
                        ['Posted By', postDetails.posted_by],
                        ['Role', postDetails.role],
                        ['User ID', postDetails.user_id_str],
                        ['Posting Date', postDetails.posting_date],
                        ['Reference No.', postDetails.reference_no],
                    ].map(([label, value]) => (
                        <div
                            key={String(label)}
                            className="flex justify-between border-b border-gray-100 py-2.5 last:border-0"
                        >
                            <span className="text-sm text-gray-400">
                                {label}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
                >
                    <Plus size={14} className="rotate-45" /> Back
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                    <Plus size={15} />
                    {loading ? 'Posting…' : 'Confirm'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 4 – Posted / Transaction History ────────────────────────────────────

function StepPosted({ history }: { history: HistoryRow[] }) {
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return history.filter(
            (h) =>
                h.name.toLowerCase().includes(q) ||
                h.department.toLowerCase().includes(q) ||
                h.employment_classification.toLowerCase().includes(q),
        );
    }, [history, search]);

    const { page, setPage, totalPages, paginated, total } = usePagination(
        filtered,
        rowsPerPage,
    );
    const [selected, setSelected] = useState<Set<string>>(new Set());

    function toggleAll() {
        const keys = paginated.map(
            (h) => `${h.posting_id}-${h.employee_id}-${h.leave_type_name}`,
        );
        if (selected.size === keys.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(keys));
        }
    }

    function toggle(key: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }

    return (
        <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    Transaction History
                </h2>
                <button
                    onClick={() => router.get(route('leave.accrual.index'))}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                    <Plus size={14} /> New Posting
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="w-10 px-3 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={
                                        selected.size === paginated.length &&
                                        paginated.length > 0
                                    }
                                    onChange={toggleAll}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Employee Name
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Department
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Employment Type
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Leave Type
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                New Balance
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Posted By
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Date Posted
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-600">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((h) => {
                            const key = `${h.posting_id}-${h.employee_id}-${h.leave_type_name}`;
                            return (
                                <tr
                                    key={key}
                                    className="border-b border-gray-50 hover:bg-gray-50/50"
                                >
                                    <td className="px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(key)}
                                            onChange={() => toggle(key)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                url={h.avatar_url}
                                                name={h.name}
                                            />
                                            <span className="text-gray-700">
                                                {h.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">
                                        {h.department}
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">
                                        {h.employment_classification}
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">
                                        {h.leave_type_name}
                                    </td>
                                    <td className="px-3 py-3 font-medium text-blue-500">
                                        {Number(h.balance_after).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">
                                        Admin ({h.reference_no})
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">
                                        {h.posting_date}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                            ✓ Posted
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginated.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="py-10 text-center text-sm text-gray-400"
                                >
                                    No posted transactions yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                    {selected.size} of {total} row(s) selected.
                </span>
                <div className="flex items-center gap-3">
                    <span>Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                    >
                        {[10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronsLeft size={15} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronRight size={15} />
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="p-1 disabled:opacity-30"
                        >
                            <ChevronsRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function MonthlyEarnedLeave() {
    const {
        step = 1,
        history = [],
        period,
        previews = [],
        leave_types = [],
        summary,
        post_details,
    } = usePage<{ props: PageProps }>().props as unknown as PageProps;

    // Determine stepper states
    function stepState(s: number): 'done' | 'active' | 'pending' {
        if (step > s) return 'done';
        if (step === s) return 'active';
        return 'pending';
    }

    // Steps: 1 = Select Period, 2 = Identify Employees, 4 = Confirm Posting, 5 = Posted
    // (matching Figma numbering — step 3 was "Preview Credits" shown inline in step 2)
    const isHistory = step === 5;

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-screen-xl px-6 py-6">
                    {/* Top bar */}
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={() =>
                                router.get(route('leave.accrual.history'))
                            }
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            <Plus size={14} /> View Transaction History
                        </button>
                    </div>

                    {/* Stepper */}
                    {!isHistory && (
                        <div className="mb-6 flex divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <StepBadge
                                number={1}
                                label="Selected Period"
                                state={stepState(1)}
                            />
                            <StepBadge
                                number={2}
                                label="Identify Employees"
                                state={stepState(2)}
                            />
                            <StepBadge
                                number={4}
                                label="Confirm Posting"
                                state={stepState(4)}
                            />
                            <StepBadge
                                number={5}
                                label="Posted"
                                state={stepState(5)}
                            />
                        </div>
                    )}

                    {/* Full step history stepper */}
                    {isHistory && (
                        <div className="mb-6 flex divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <StepBadge
                                number={1}
                                label="Selected Period"
                                state="done"
                            />
                            <StepBadge
                                number={2}
                                label="Identify Employees"
                                state="done"
                            />
                            <StepBadge
                                number={3}
                                label="Preview Credits"
                                state="done"
                            />
                            <StepBadge
                                number={4}
                                label="Confirm Posting"
                                state="done"
                            />
                            <StepBadge
                                number={5}
                                label="Posted"
                                state="active"
                            />
                        </div>
                    )}

                    {/* Card body */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        {step === 1 && <StepSelectPeriod />}

                        {step === 2 && period && (
                            <StepPreviewCredits
                                previews={previews}
                                leaveTypes={leave_types}
                                period={period}
                            />
                        )}

                        {step === 4 && summary && post_details && period && (
                            <StepConfirmPosting
                                summary={summary}
                                postDetails={post_details}
                                period={period}
                            />
                        )}

                        {(step === 5 || isHistory) && (
                            <StepPosted history={history} />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
