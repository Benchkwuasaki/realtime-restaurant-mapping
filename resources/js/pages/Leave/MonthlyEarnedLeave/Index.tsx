import { router, usePage } from "@inertiajs/react"
import { Plus, TrendingUp, CalendarDays, Hash, User, Briefcase } from "lucide-react"
import React, { useMemo, useState } from "react"

import { route } from "ziggy-js"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Stepper } from "@/components/ui/stepper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"
import { getHistoryColumns, CreditBadge, EmployeeAvatar } from "./components/history-columns"
import {
    buildPreviewCreditRows,
    usePreviewCreditColumns,
    usePreviewCreditHeaderGroups,
    type PreviewCreditRow,
} from "./components/preview-credits-columns"
import {
    useLeaveBalanceColumns,
    type LeaveBalanceRow,
} from "./components/leave-balances-columns"
import {
    type LeaveType,
    type PreviewRow,
    type HistoryRow,
    type HistoryTableRow,
    type PostDetails,
    type Summary,
    type PostingMeta,
} from './data/schema';

// ─── Page props ───────────────────────────────────────────────────────────────

interface PageProps {
    tab?: "posting" | "history"
    step?: number
    period?: { month: number; year: number }
    previews?: PreviewRow[]
    leave_types?: LeaveType[]
    leave_type_ids?: number[]
    available_leave_types?: LeaveType[]
    summary?: Summary
    post_details?: PostDetails
    posting_meta?: PostingMeta
    history?: HistoryRow[]
    history_filter?: { year: number | null; month: number | null }
    balances_data?: LeaveBalanceRow[]
    balances_leave_types?: LeaveType[]
    balances_cycle_year?: number
    balances_cycle_years?: number[]
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

const breadcrumbs = [
    { title: 'Leave', href: '#' },
    { title: 'Monthly Earned Leave', href: route('leave.accrual.index') },
];

const WIZARD_STEPS = [
    { title: "Select Period", description: "Step 1" },
    { title: "Preview Credits", description: "Step 2" },
    { title: "Confirm Posting", description: "Step 3" },
    { title: "Posted", description: "Step 4" },
]

=======
>>>>>>> a6822789afa3a397a92d3446098c7d0aa5a139b4
// ─── Step 1 ───────────────────────────────────────────────────────────────────

function StepSelectPeriod({
    availableLeaveTypes,
}: {
    availableLeaveTypes: LeaveType[];
}) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set(availableLeaveTypes.map((lt) => lt.leave_type_id)),
    );
    const { errors } = usePage().props as { errors?: Record<string, string> };

    function toggleLeaveType(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function handleNext() {
        if (selectedIds.size === 0) return;
        setLoading(true);
        router.get(
            route('leave.accrual.preview'),
            { month, year, leave_type_ids: Array.from(selectedIds) },
            { preserveState: false, onFinish: () => setLoading(false) },
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h2 className="text-foreground mb-1 text-base font-semibold">
                    Select Posting Period
                </h2>
                <p className="text-muted-foreground text-sm">
                    Choose the month, year, and leave types to compute accruals
                    for.
                </p>
            </div>

            {errors?.period && (
                <div className="border-destructive/40 bg-destructive/10 text-destructive max-w-xl rounded-md border px-4 py-3 text-sm">
                    {errors.period}
                </div>
            )}

            <div className="grid max-w-xl grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Month</label>
                    <Select
                        value={String(month)}
                        onValueChange={(v) => setMonth(Number(v))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => (
                                <SelectItem key={i} value={String(i + 1)}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Year</label>
                    <Select
                        value={String(year)}
                        onValueChange={(v) => setYear(Number(v))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex max-w-xl flex-col gap-3">
                <div>
                    <p className="text-sm font-medium">Leave Types to Accrue</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        All accrual-eligible types are selected. Deselect any
                        that should not be processed this period.
                    </p>
                </div>
                <div className="border-border divide-border divide-y rounded-md border">
                    {availableLeaveTypes.length ? (
                        availableLeaveTypes.map((lt) => (
                            <label
                                key={lt.leave_type_id}
                                className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                            >
                                <Checkbox
                                    checked={selectedIds.has(lt.leave_type_id)}
                                    onCheckedChange={() =>
                                        toggleLeaveType(lt.leave_type_id)
                                    }
                                />
                                <span className="text-sm">
                                    {lt.leave_type_name}
                                </span>
                            </label>
                        ))
                    ) : (
                        <p className="text-muted-foreground px-4 py-3 text-sm">
                            No accrual-eligible leave types configured.
                        </p>
                    )}
                </div>
                {selectedIds.size === 0 && (
                    <p className="text-destructive text-xs">
                        Select at least one leave type to proceed.
                    </p>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleNext} disabled={loading || selectedIds.size === 0} size="sm">
                     {loading ? "Loading…" : "Next"}
                </Button>
            </div>
        </div>
    );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function StepPreviewCredits({
    previews,
    leaveTypes,
    period,
    leaveTypeIds,
}: {
    previews: PreviewRow[];
    leaveTypes: LeaveType[];
    period: { month: number; year: number };
    leaveTypeIds: number[];
}) {
    const [loading, setLoading] = useState(false)
    const employeeRows = useMemo(() => buildPreviewCreditRows(previews), [previews])
    const columns      = usePreviewCreditColumns(leaveTypes)
    const headerGroups = usePreviewCreditHeaderGroups(leaveTypes)

    return (
        <div className="flex flex-col gap-4 p-6">
            <div>
                <h2 className="text-foreground text-base font-semibold">
                    Preview Earned Leave Credits
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                    {MONTHS[period.month - 1]} {period.year} ·{' '}
                    {leaveTypes.length} leave type
                    {leaveTypes.length !== 1 ? 's' : ''}
                </p>
            </div>
            <DataTable
                columns={columns}
                data={employeeRows}
                getRowId={(row) => String(row.employee_id)}
                searchColumnId="name"
                searchPlaceholder="Search employee..."
                headerGroups={headerGroups}
                defaultPageSize={10}
            />
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.get(route('leave.accrual.index'))}
                >
                    Back
                </Button>
                <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                        setLoading(true);
                        router.post(
                            route('leave.accrual.confirm'),
                            {
                                month: period.month,
                                year: period.year,
                                leave_type_ids: leaveTypeIds,
                            },
                            {
                                preserveState: false,
                                onFinish: () => setLoading(false),
                            },
                        );
                    }}
                >
                    {loading ? "Loading…" : "Next"}
                </Button>
            </div>
        </div>
    );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function StepConfirmPosting({
    summary,
    postDetails,
    period,
    leaveTypeIds,
}: {
    summary: Summary;
    postDetails: PostDetails;
    period: { month: number; year: number };
    leaveTypeIds: number[];
}) {
    const [loading, setLoading] = useState(false);

    const summaryRows: [string, string | number][] = [
        ['Posting Period', `${MONTHS[period.month - 1]} ${period.year}`],
        ['Working Days', summary.work_days],
        ['Total Days', summary.total_days],
        ['Total Sundays', summary.total_sundays],
        ['Total Holidays', summary.total_holidays],
        ['Total Eligible', summary.total_eligible],
        ['Full Credit', summary.full_credit],
        ['Prorated', summary.prorated],
        ['Ineligible', summary.ineligible],
    ];

    const detailRows: [string, string][] = [
        ['Posted By', postDetails.posted_by],
        ['Role', postDetails.role],
        ['User ID', postDetails.user_id_str],
        ['Posting Date', postDetails.posting_date],
        ['Reference No', postDetails.reference_no],
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h2 className="text-foreground text-base font-semibold">
                    Confirm Posting
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                    Review the summary before finalising.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border-border rounded-lg border p-5">
                    <p className="mb-4 text-sm font-semibold">
                        Posting Summary
                    </p>
                    {summaryRows.map(([l, v]) => (
                        <div
                            key={l}
                            className="border-border flex justify-between border-b py-2.5 last:border-0"
                        >
                            <span className="text-muted-foreground text-sm">
                                {l}
                            </span>
                            <span className="text-sm font-semibold">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="border-border rounded-lg border p-5">
                    <p className="mb-4 text-sm font-semibold">Post Details</p>
                    {detailRows.map(([l, v]) => (
                        <div
                            key={l}
                            className="border-border flex justify-between border-b py-2.5 last:border-0"
                        >
                            <span className="text-muted-foreground text-sm">
                                {l}
                            </span>
                            <span className="text-sm font-semibold">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.get(route('leave.accrual.preview'), {
                            month: period.month,
                            year: period.year,
                            leave_type_ids: leaveTypeIds,
                        })
                    }
                >
                    Back
                </Button>
                <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={loading}
                    onClick={() => {
                        setLoading(true);
                        router.post(
                            route('leave.accrual.post'),
                            {
                                month: period.month,
                                year: period.year,
                                leave_type_ids: leaveTypeIds,
                            },
                            {
                                preserveState: false,
                                onFinish: () => setLoading(false),
                            },
                        );
                    }}
                >
                   {loading ? "Posting…" : "Confirm & Post"}
                </Button>
            </div>
        </div>
    );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function StepPostedReview({
    previews,
    leaveTypes,
    period,
    postingMeta,
}: {
    previews: PreviewRow[];
    leaveTypes: LeaveType[];
    period: { month: number; year: number };
    postingMeta: PostingMeta;
}) {
    const employeeRows = useMemo(() => buildPreviewCreditRows(previews), [previews])
    const columns      = usePreviewCreditColumns(leaveTypes)
    const headerGroups = usePreviewCreditHeaderGroups(leaveTypes)

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-foreground text-base font-semibold">
                        Posted Credits
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        {MONTHS[period.month - 1]} {period.year} · Ref:{' '}
                        {postingMeta.reference_no} · {postingMeta.posted_date}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="green">Posted</Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(route('leave.accrual.index'))}
                    >
                        <Plus /> New Posting
                    </Button>
                </div>
            </div>
            <DataTable
                columns={columns}
                data={employeeRows}
                getRowId={(row) => String(row.employee_id)}
                searchColumnId="name"
                searchPlaceholder="Search employee..."
                headerGroups={headerGroups}
                defaultPageSize={10}
            />
        </div>
    );
}

// ─── History tab ────────────────────────────────────────────────────────────────────────────

function HistoryTab({
    history,
    historyFilter,
}: {
    history: HistoryRow[];
    historyFilter: { year: number | null; month: number | null };
}) {
    const [activeYear, setActiveYear] = useState<string>(
        String(historyFilter.year ?? ''),
    );
    const [activeMonth, setActiveMonth] = useState<string>(
        String(historyFilter.month ?? ''),
    );

    // ── Dialog state ──────────────────────────────────────────────────────────
    const [selectedRow, setSelectedRow] = useState<HistoryTableRow | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    function handleViewRow(row: HistoryTableRow) {
        setSelectedRow(row);
        setDialogOpen(true);
    }

    function handleDialogClose() {
        setDialogOpen(false);
        // Keep selectedRow mounted until dialog finishes closing to avoid
        // content flicker during the exit animation.
        setTimeout(() => setSelectedRow(null), 200);
    }

    const tableData: HistoryTableRow[] = useMemo(
        () =>
            history.map((h) => ({
                ...h,
                _key: `${h.posting_id}-${h.employee_id}-${h.leave_type_name}`,
            })),
        [history],
    );

    const columns = useMemo(() => getHistoryColumns(handleViewRow), []);

    const yearOptions = useMemo(() => {
        const years = [...new Set(history.map((h) => h.posting_year))].sort(
            (a, b) => b - a,
        );
        return years.map((y) => ({ value: String(y), label: String(y) }));
    }, [history]);

    const monthOptions = useMemo(() => {
        const months = [...new Set(history.map((h) => h.posting_month))].sort(
            (a, b) => a - b,
        );
        return months.map((m) => ({ value: String(m), label: MONTHS[m - 1] }));
    }, [history]);

    function handleColumnFiltersChange(
        filters: { id: string; value: unknown }[],
    ) {
        const yearValues =
            (filters.find((f) => f.id === 'posting_year')?.value as
                | string[]
                | undefined) ?? [];
        const monthValues =
            (filters.find((f) => f.id === 'posting_month')?.value as
                | string[]
                | undefined) ?? [];

        const newYear = yearValues[0] ?? '';
        const newMonth = monthValues[0] ?? '';

        if (newYear === activeYear && newMonth === activeMonth) return;

        setActiveYear(newYear);
        setActiveMonth(newMonth);

        router.get(
            route('leave.accrual.history'),
            { year: newYear || undefined, month: newMonth || undefined },
            { preserveState: true, preserveScroll: true },
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={tableData}
                getRowId={(row) => row._key}
                searchColumnId="name"
                searchPlaceholder="Search employee, leave type, ref..."
                defaultPageSize={10}
                onColumnFiltersChange={handleColumnFiltersChange}
                onRowClick={(row) => handleViewRow(row.original)}
                rowClassName="cursor-pointer"
                filters={[
                    {
                        columnId: 'posting_year',
                        title: 'Year',
                        options: yearOptions,
                    },
                    {
                        columnId: 'posting_month',
                        title: 'Month',
                        options: monthOptions,
                    },
                    {
                        columnId: 'credit_status',
                        title: 'Status',
                        options: [
                            { value: 'full_credit', label: 'Full Credit' },
                            { value: 'prorated', label: 'Prorated' },
                            { value: 'ineligible', label: 'Ineligible' },
                        ],
                    },
                ]}
            />

            {/* ── Accrual Transaction Detail Dialog ───────────────────────────── */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(o) => {
                    if (!o) handleDialogClose();
                }}
            >
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <DialogHeader className="border-border border-b px-5 py-4">
                        <DialogTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
                            <TrendingUp className="text-primary size-4 shrink-0" />
                            Accrual Transaction Detail
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRow && (
                        <div className="flex flex-col gap-5 px-5 py-5">
                            {/* Employee card */}
                            <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border px-4 py-3">
                                <EmployeeAvatar
                                    url={selectedRow.avatar_url}
                                    name={selectedRow.name}
                                />
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-foreground truncate text-sm font-semibold">
                                        {selectedRow.name}
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {selectedRow.department}
                                    </span>
                                </div>
                                <div className="ml-auto shrink-0">
                                    <CreditBadge
                                        status={selectedRow.credit_status}
                                    />
                                </div>
                            </div>

                            {/* Posting meta tiles */}
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        {
                                            icon: (
                                                <CalendarDays className="size-3.5" />
                                            ),
                                            label: 'Period',
                                            value: `${MONTHS[selectedRow.posting_month - 1]} ${selectedRow.posting_year}`,
                                            mono: false,
                                        },
                                        {
                                            icon: <Hash className="size-3.5" />,
                                            label: 'Reference',
                                            value: selectedRow.reference_no,
                                            mono: true,
                                        },
                                        {
                                            icon: <User className="size-3.5" />,
                                            label: 'Employment',
                                            value: selectedRow.employment_classification,
                                            mono: false,
                                        },
                                        {
                                            icon: (
                                                <Briefcase className="size-3.5" />
                                            ),
                                            label: 'Posted On',
                                            value: selectedRow.posting_date,
                                            mono: false,
                                        },
                                    ] as const
                                ).map(({ icon, label, value, mono }) => (
                                    <div
                                        key={label}
                                        className="border-border flex flex-col gap-1 rounded-md border px-3 py-2.5"
                                    >
                                        <div className="text-muted-foreground flex items-center gap-1.5">
                                            {icon}
                                            <span className="text-xs">
                                                {label}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-foreground truncate text-sm font-medium ${mono ? 'font-mono' : ''}`}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Leave credit breakdown */}
                            <div>
                                <p className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                                    Leave Credit Breakdown
                                </p>
                                <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                                    {/* Column headers */}
                                    <div className="bg-muted/40 grid grid-cols-4 px-4 py-2">
                                        <span className="text-muted-foreground col-span-2 text-xs font-medium">
                                            Leave Type
                                        </span>
                                        <span className="text-muted-foreground text-right text-xs font-medium">
                                            Credit Earned
                                        </span>
                                        <span className="text-muted-foreground text-right text-xs font-medium">
                                            New Balance
                                        </span>
                                    </div>

                                    {/* One row per leave type with its own accurate values */}
                                    {(selectedRow.leave_credits ?? []).map(
                                        (lc) => (
                                            <div
                                                key={lc.leave_type_id}
                                                className="grid grid-cols-4 items-center px-4 py-3"
                                            >
                                                <span className="text-foreground col-span-2 text-sm">
                                                    {lc.leave_type_name}
                                                </span>
                                                <span className="text-right text-sm font-semibold text-green-600 dark:text-green-400">
                                                    +
                                                    {lc.accrual_earned.toFixed(
                                                        4,
                                                    )}
                                                </span>
                                                <span className="text-primary text-right text-sm font-semibold">
                                                    {lc.balance_after.toFixed(
                                                        4,
                                                    )}
                                                </span>
                                            </div>
                                        ),
                                    )}

                                    {/* Balance before per leave type footer */}
                                    {(selectedRow.leave_credits ?? []).map(
                                        (lc) => (
                                            <div
                                                key={`before-${lc.leave_type_id}`}
                                                className="bg-muted/20 grid grid-cols-4 items-center px-4 py-2.5"
                                            >
                                                <span className="text-muted-foreground col-span-2 text-xs">
                                                    {lc.leave_type_name} —
                                                    before
                                                </span>
                                                <span className="text-muted-foreground col-span-2 text-right text-xs">
                                                    {lc.balance_before.toFixed(
                                                        4,
                                                    )}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Contextual status note */}
                            {selectedRow.credit_status === 'ineligible' && (
                                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-xs">
                                    This employee had no recorded attendance for
                                    this period and received no credit.
                                </div>
                            )}
                            {selectedRow.credit_status === 'prorated' && (
                                <div className="rounded-md border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-700 dark:text-yellow-400">
                                    Credit was prorated based on actual minutes
                                    worked relative to the expected work hours
                                    for the period.
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter
                        className="border-border bg-muted/30 border-t px-5 py-4"
                        showCloseButton
                    >
                        {selectedRow && (
                            <div className="mr-auto flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                >
                                    {selectedRow.reference_no}
                                </Badge>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function BalancesTab({
    data,
    leaveTypes,
    cycleYear: _cycleYear,
}: {
    data: LeaveBalanceRow[]
    leaveTypes: LeaveType[]
    cycleYear: number
    cycleYears?: number[]
}) {
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return data.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.department.toLowerCase().includes(q) ||
                e.employment_classification.toLowerCase().includes(q),
        );
    }, [data, search]);

    const table = useReactTable({
        data: filtered,
        columns: [{ id: 'select', header: '', cell: () => null }],
        getRowId: (row) => String(row.employee_id),
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualFiltering: true,
    });

    const pageRows = filtered.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
    );
    const pageCount = Math.max(
        1,
        Math.ceil(filtered.length / pagination.pageSize),
    );
    const colSpan = 3 + leaveTypes.length;
    const columns = useLeaveBalanceColumns(leaveTypes)

    return (
        <DataTable
            columns={columns}
            data={data}
            getRowId={(row) => String(row.employee_id)}
            searchColumnId="name"
            searchPlaceholder="Search employee..."
            defaultPageSize={10}
        />
    )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function MonthlyEarnedLeave() {
    const {
        tab = 'posting',
        step = 1,
        period,
        previews = [],
        leave_types = [],
        leave_type_ids = [],
        available_leave_types = [],
        summary,
        post_details,
        posting_meta,
        history = [],
        history_filter = { year: null, month: null },
        balances_data = [],
        balances_leave_types = [],
        balances_cycle_year = new Date().getFullYear(),
    } = usePage<{ props: PageProps }>().props as unknown as PageProps

    const activeTab =
        tab === 'history'
            ? 'history'
            : tab === 'balances'
              ? 'balances'
              : 'posting';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => {
                        if (v === 'history')
                            router.get(route('leave.accrual.history'));
                        else if (v === 'balances')
                            router.get(route('leave.accrual.balances'));
                        else router.get(route('leave.accrual.index'));
                    }}
                >
                    <div className="border-border max-w-100 overflow-x-auto border-b pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <TabsList className="flex h-auto w-max min-w-full flex-nowrap gap-0 bg-transparent p-0">
                            <TabsTrigger
                                value="posting"
                                className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4"
                            >
                                Monthly Posting
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4"
                            >
                                Transaction History
                            </TabsTrigger>
                            <TabsTrigger
                                value="balances"
                                className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4"
                            >
                                Leave Balances
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent
                        value="posting"
                        className="mt-4 flex flex-col gap-4"
                    >
                        <div className="border-border bg-card rounded-lg border px-6 pt-4 shadow-sm">
                            <Stepper
                                steps={WIZARD_STEPS}
                                currentStep={step - 1}
                                onStepChange={() => {}}
                            />
                        </div>
                        <div className="border-border bg-card rounded-lg border shadow-sm">
                            {step === 1 && (
                                <StepSelectPeriod
                                    availableLeaveTypes={available_leave_types}
                                />
                            )}
                            {step === 2 && period && (
                                <StepPreviewCredits
                                    previews={previews}
                                    leaveTypes={leave_types}
                                    period={period}
                                    leaveTypeIds={leave_type_ids}
                                />
                            )}
                            {step === 3 &&
                                summary &&
                                post_details &&
                                period && (
                                    <StepConfirmPosting
                                        summary={summary}
                                        postDetails={post_details}
                                        period={period}
                                        leaveTypeIds={leave_type_ids}
                                    />
                                )}
                            {step === 4 && period && posting_meta && (
                                <StepPostedReview
                                    previews={previews}
                                    leaveTypes={leave_types}
                                    period={period}
                                    postingMeta={posting_meta}
                                />
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-foreground text-base font-semibold">
                                    Transaction History
                                </h2>
                                <p className="text-muted-foreground mt-0.5 text-sm">
                                    All posted leave accrual credits across all
                                    periods.
                                </p>
                            </div>
                            <HistoryTab
                                history={history}
                                historyFilter={history_filter}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="balances" className="mt-4">
                        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-foreground text-base font-semibold">
                                    Leave Balances
                                </h2>
                                <p className="text-muted-foreground mt-0.5 text-sm">
                                    Current leave balances per employee for FY{' '}
                                    {balances_cycle_year}–
                                    {balances_cycle_year + 1}.
                                </p>
                            </div>
                            <BalancesTab
                                data={balances_data}
                                leaveTypes={balances_leave_types}
                                cycleYear={balances_cycle_year}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}