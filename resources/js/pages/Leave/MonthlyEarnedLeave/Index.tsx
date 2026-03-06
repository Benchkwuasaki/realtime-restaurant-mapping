// resources/js/pages/Leave/Accrual/Index.tsx

import React, { useMemo, useState } from "react"
import { router, usePage } from "@inertiajs/react"
import { Plus } from "lucide-react"
import { useReactTable, getCoreRowModel, getPaginationRowModel, type RowSelectionState } from "@tanstack/react-table"

import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Stepper } from "@/components/ui/stepper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination"

import { getHistoryColumns, CreditBadge, EmployeeAvatar } from "./components/history-columns"
import {
    type LeaveType,
    type PreviewRow,
    type HistoryRow,
    type HistoryTableRow,
    type PostDetails,
    type Summary,
    type PostingMeta,
} from "./data/schema"

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
    balances_data?: BalanceEmployeeRow[]
    balances_leave_types?: LeaveType[]
    balances_cycle_year?: number
    balances_cycle_years?: number[]
}

interface LeaveBalanceEntry {
    leave_type_id: number
    leave_type_name: string
    total_days: number
    used_days: number
    balance: number
}

interface BalanceEmployeeRow {
    employee_id: number
    name: string
    avatar_url: string | null
    department: string
    employment_classification: string
    leave_balances: LeaveBalanceEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i)

const breadcrumbs = [
    { title: "Leave", href: "#" },
    { title: "Monthly Earned Leave", href: route("leave.accrual.index") },
]

const WIZARD_STEPS = [
    { title: "Select Period", description: "Step 1" },
    { title: "Preview Credits", description: "Step 2" },
    { title: "Confirm Posting", description: "Step 3" },
    { title: "Posted", description: "Step 4" },
]

// ─── Pivoted table ────────────────────────────────────────────────────────────
// Uses a custom multi-level header (one column group per leave type ×
// Balance / Credit / New Balance). This layout cannot be expressed through
// DataTable's flat ColumnDef API, so we keep raw <Table> here and reuse
// only DataTablePagination for consistent UI.

function PivotedTable({
    rows,
    leaveTypes,
    selectable = false,
}: {
    rows: PreviewRow[]
    leaveTypes: LeaveType[]
    selectable?: boolean
}) {
    const [search, setSearch] = useState("")
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    const employeeRows = useMemo(() => {
        const map = new Map<number, {
            employee_id: number; name: string; department: string
            employment_classification: string; avatar_url: string | null
            credit_status: PreviewRow["credit_status"]; attendance_days: number
            leaves: Record<number, { before: number; credit: number; after: number }>
        }>()

        for (const row of rows) {
            if (!map.has(row.employee_id)) {
                map.set(row.employee_id, {
                    employee_id: row.employee_id, name: row.name,
                    department: row.department,
                    employment_classification: row.employment_classification,
                    avatar_url: row.avatar_url, credit_status: row.credit_status,
                    attendance_days: row.attendance_days, leaves: {},
                })
            }
            map.get(row.employee_id)!.leaves[row.leave_type_id] = {
                before: row.balance_before,
                credit: row.accrual_earned,
                after: row.balance_after,
            }
        }
        return Array.from(map.values())
    }, [rows])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return employeeRows.filter((e) =>
            e.name.toLowerCase().includes(q) ||
            e.department.toLowerCase().includes(q) ||
            e.employment_classification.toLowerCase().includes(q)
        )
    }, [employeeRows, search])

    // Minimal table instance — only to drive DataTablePagination + select-all
    const table = useReactTable({
        data: filtered,
        columns: [{ id: "select", header: "", cell: () => null }],
        getRowId: (row) => String(row.employee_id),
        enableRowSelection: selectable,
        state: { rowSelection, pagination },
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualFiltering: true,
    })

    const pageRows = filtered.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize)
    const totalFiltered = filtered.length
    const pageCount = Math.max(1, Math.ceil(totalFiltered / pagination.pageSize))
    const colSpan = (selectable ? 1 : 0) + 5 + leaveTypes.length * 3 + 1

    return (
        <div className="flex flex-col gap-4">
            <Input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })) }}
                className="h-8 w-56"
            />

            <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {selectable && (
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                                        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                            )}
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Employment Type</TableHead>
                            <TableHead className="text-center">Attendance</TableHead>
                            {leaveTypes.map((lt) => (
                                <TableHead key={lt.leave_type_id} colSpan={3} className="text-center border-l border-border">
                                    {lt.leave_type_name}
                                </TableHead>
                            ))}
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40">
                            {selectable && <TableHead />}
                            <TableHead colSpan={4} />
                            {leaveTypes.map((lt) => (
                                <React.Fragment key={lt.leave_type_id}>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground border-l border-border">Balance</TableHead>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground">Credit</TableHead>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground">New Balance</TableHead>
                                </React.Fragment>
                            ))}
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.length ? pageRows.map((emp) => {
                            const rowId = String(emp.employee_id)
                            const isSelected = !!rowSelection[rowId]
                            return (
                                <TableRow key={emp.employee_id} data-state={isSelected ? "selected" : undefined}>
                                    {selectable && (
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(v) =>
                                                    setRowSelection((prev) => {
                                                        const next = { ...prev }
                                                        v ? (next[rowId] = true) : delete next[rowId]
                                                        return next
                                                    })
                                                }
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <EmployeeAvatar url={emp.avatar_url} name={emp.name} />
                                            <span className="text-sm">{emp.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{emp.department}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{emp.employment_classification}</TableCell>
                                    <TableCell className="text-center text-muted-foreground text-sm">{emp.attendance_days}d</TableCell>
                                    {leaveTypes.map((lt) => {
                                        const d = emp.leaves[lt.leave_type_id]
                                        return (
                                            <React.Fragment key={lt.leave_type_id}>
                                                <TableCell className="text-center text-muted-foreground text-sm border-l border-border">{d ? d.before.toFixed(2) : "0.00"}</TableCell>
                                                <TableCell className="text-center text-sm font-medium text-green-600 dark:text-green-400">{d ? `+${d.credit.toFixed(2)}` : "+0.00"}</TableCell>
                                                <TableCell className="text-center text-sm font-medium text-primary">{d ? d.after.toFixed(2) : "0.00"}</TableCell>
                                            </React.Fragment>
                                        )
                                    })}
                                    <TableCell className="text-center">
                                        <CreditBadge status={emp.credit_status} />
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                table={table}
                rowSelection={rowSelection}
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                pageCount={pageCount}
                totalFiltered={totalFiltered}
                onPageIndexChange={(i) => setPagination((p) => ({ ...p, pageIndex: i }))}
                onPageSizeChange={(s) => setPagination({ pageIndex: 0, pageSize: s })}
            />
        </div>
    )
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function StepSelectPeriod({ availableLeaveTypes }: { availableLeaveTypes: LeaveType[] }) {
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(currentYear)
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set(availableLeaveTypes.map((lt) => lt.leave_type_id))
    )
    const { errors } = usePage().props as { errors?: Record<string, string> }

    function toggleLeaveType(id: number) {
        setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
    }

    function handleNext() {
        if (selectedIds.size === 0) return
        setLoading(true)
        router.get(
            route("leave.accrual.preview"),
            { month, year, leave_type_ids: Array.from(selectedIds) },
            { preserveState: false, onFinish: () => setLoading(false) }
        )
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <div>
                <h2 className="text-base font-semibold text-foreground mb-1">Select Posting Period</h2>
                <p className="text-sm text-muted-foreground">Choose the month, year, and leave types to compute accruals for.</p>
            </div>

            {errors?.period && (
                <div className="max-w-xl rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errors.period}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 max-w-xl">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col gap-3 max-w-xl">
                <div>
                    <p className="text-sm font-medium">Leave Types to Accrue</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        All accrual-eligible types are selected. Deselect any that should not be processed this period.
                    </p>
                </div>
                <div className="rounded-md border border-border divide-y divide-border">
                    {availableLeaveTypes.length ? availableLeaveTypes.map((lt) => (
                        <label key={lt.leave_type_id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors">
                            <Checkbox checked={selectedIds.has(lt.leave_type_id)} onCheckedChange={() => toggleLeaveType(lt.leave_type_id)} />
                            <span className="text-sm">{lt.leave_type_name}</span>
                        </label>
                    )) : (
                        <p className="px-4 py-3 text-sm text-muted-foreground">No accrual-eligible leave types configured.</p>
                    )}
                </div>
                {selectedIds.size === 0 && (
                    <p className="text-xs text-destructive">Select at least one leave type to proceed.</p>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleNext} disabled={loading || selectedIds.size === 0} size="sm">
                    <Plus /> {loading ? "Loading…" : "Next"}
                </Button>
            </div>
        </div>
    )
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function StepPreviewCredits({
    previews, leaveTypes, period, leaveTypeIds,
}: {
    previews: PreviewRow[]; leaveTypes: LeaveType[]
    period: { month: number; year: number }; leaveTypeIds: number[]
}) {
    const [loading, setLoading] = useState(false)

    return (
        <div className="p-6 flex flex-col gap-4">
            <div>
                <h2 className="text-base font-semibold text-foreground">Preview Earned Leave Credits</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {MONTHS[period.month - 1]} {period.year} · {leaveTypes.length} leave type{leaveTypes.length !== 1 ? "s" : ""}
                </p>
            </div>
            <PivotedTable rows={previews} leaveTypes={leaveTypes} selectable />
            <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => router.get(route("leave.accrual.index"))}>Back</Button>
                <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                        setLoading(true)
                        router.post(
                            route("leave.accrual.confirm"),
                            { month: period.month, year: period.year, leave_type_ids: leaveTypeIds },
                            { preserveState: false, onFinish: () => setLoading(false) }
                        )
                    }}
                >
                    <Plus /> {loading ? "Loading…" : "Next"}
                </Button>
            </div>
        </div>
    )
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function StepConfirmPosting({
    summary, postDetails, period, leaveTypeIds,
}: {
    summary: Summary; postDetails: PostDetails
    period: { month: number; year: number }; leaveTypeIds: number[]
}) {
    const [loading, setLoading] = useState(false)

    const summaryRows: [string, string | number][] = [
        ["Posting Period", `${MONTHS[period.month - 1]} ${period.year}`],
        ["Working Days", summary.work_days],
        ["Total Days", summary.total_days],
        ["Total Sundays", summary.total_sundays],
        ["Total Holidays", summary.total_holidays],
        ["Total Eligible", summary.total_eligible],
        ["Full Credit", summary.full_credit],
        ["Prorated", summary.prorated],
        ["Ineligible", summary.ineligible],
    ]

    const detailRows: [string, string][] = [
        ["Posted By", postDetails.posted_by],
        ["Role", postDetails.role],
        ["User ID", postDetails.user_id_str],
        ["Posting Date", postDetails.posting_date],
        ["Reference No", postDetails.reference_no],
    ]

    return (
        <div className="p-6 flex flex-col gap-6">
            <div>
                <h2 className="text-base font-semibold text-foreground">Confirm Posting</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Review the summary before finalising.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-5">
                    <p className="text-sm font-semibold mb-4">Posting Summary</p>
                    {summaryRows.map(([l, v]) => (
                        <div key={l} className="flex justify-between py-2.5 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">{l}</span>
                            <span className="text-sm font-semibold">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="rounded-lg border border-border p-5">
                    <p className="text-sm font-semibold mb-4">Post Details</p>
                    {detailRows.map(([l, v]) => (
                        <div key={l} className="flex justify-between py-2.5 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">{l}</span>
                            <span className="text-sm font-semibold">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Button
                    variant="outline" size="sm"
                    onClick={() => router.get(route("leave.accrual.preview"), { month: period.month, year: period.year, leave_type_ids: leaveTypeIds })}
                >
                    Back
                </Button>
                <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                    onClick={() => {
                        setLoading(true)
                        router.post(
                            route("leave.accrual.post"),
                            { month: period.month, year: period.year, leave_type_ids: leaveTypeIds },
                            { preserveState: false, onFinish: () => setLoading(false) }
                        )
                    }}
                >
                    <Plus /> {loading ? "Posting…" : "Confirm & Post"}
                </Button>
            </div>
        </div>
    )
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function StepPostedReview({
    previews, leaveTypes, period, postingMeta,
}: {
    previews: PreviewRow[]; leaveTypes: LeaveType[]
    period: { month: number; year: number }; postingMeta: PostingMeta
}) {
    return (
        <div className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Posted Credits</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {MONTHS[period.month - 1]} {period.year} · Ref: {postingMeta.reference_no} · {postingMeta.posted_date}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="green">Posted</Badge>
                    <Button variant="outline" size="sm" onClick={() => router.get(route("leave.accrual.index"))}>
                        <Plus /> New Posting
                    </Button>
                </div>
            </div>
            <PivotedTable rows={previews} leaveTypes={leaveTypes} selectable={false} />
        </div>
    )
}

// ─── History tab ────────────────────────────────────────────────────────────────────────────

function HistoryTab({
    history,
    historyFilter,
}: {
    history: HistoryRow[]
    historyFilter: { year: number | null; month: number | null }
}) {
    // Mirror of the server-applied period filter — updated whenever the
    // faceted filter selection changes, so both year and month are always
    // sent together in a single router.get() call.
    const [activeYear, setActiveYear] = useState<string>(String(historyFilter.year ?? ""))
    const [activeMonth, setActiveMonth] = useState<string>(String(historyFilter.month ?? ""))

    const tableData: HistoryTableRow[] = useMemo(
        () => history.map((h) => ({ ...h, _key: `${h.posting_id}-${h.employee_id}-${h.leave_type_name}` })),
        [history]
    )

    const columns = useMemo(() => getHistoryColumns(), [])

    // Derive year and month options from the loaded dataset — only values
    // that exist appear, sorted for a predictable order.
    const yearOptions = useMemo(() => {
        const years = [...new Set(history.map((h) => h.posting_year))].sort((a, b) => b - a)
        return years.map((y) => ({ value: String(y), label: String(y) }))
    }, [history])

    const monthOptions = useMemo(() => {
        const months = [...new Set(history.map((h) => h.posting_month))].sort((a, b) => a - b)
        return months.map((m) => ({ value: String(m), label: MONTHS[m - 1] }))
    }, [history])

    // Called by DataTable whenever any column filter changes.
    // We pick out the year and month filter values and fire a server visit
    // only when either of them has actually changed.
    function handleColumnFiltersChange(filters: { id: string; value: unknown }[]) {
        const yearValues = (filters.find((f) => f.id === "posting_year")?.value as string[] | undefined) ?? []
        const monthValues = (filters.find((f) => f.id === "posting_month")?.value as string[] | undefined) ?? []

        const newYear = yearValues[0] ?? ""
        const newMonth = monthValues[0] ?? ""

        if (newYear === activeYear && newMonth === activeMonth) return

        setActiveYear(newYear)
        setActiveMonth(newMonth)

        router.get(
            route("leave.accrual.history"),
            { year: newYear || undefined, month: newMonth || undefined },
            { preserveState: true, preserveScroll: true }
        )
    }

    return (
        <DataTable
            columns={columns}
            data={tableData}
            getRowId={(row) => row._key}
            searchColumnId="name"
            searchPlaceholder="Search employee, leave type, ref..."
            defaultPageSize={10}
            onColumnFiltersChange={handleColumnFiltersChange}
            filters={[
                {
                    columnId: "posting_year",
                    title: "Year",
                    options: yearOptions,
                },
                {
                    columnId: "posting_month",
                    title: "Month",
                    options: monthOptions,
                },
                {
                    columnId: "credit_status",
                    title: "Status",
                    options: [
                        { value: "full_credit", label: "Full Credit" },
                        { value: "prorated", label: "Prorated" },
                        { value: "ineligible", label: "Ineligible" },
                    ],
                },
            ]}
        />
    )
}

function BalancesTab({
    data,
    leaveTypes,
    cycleYear,
}: {
    data: BalanceEmployeeRow[]
    leaveTypes: LeaveType[]
    cycleYear: number
}) {
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return data.filter((e) =>
            e.name.toLowerCase().includes(q) ||
            e.department.toLowerCase().includes(q) ||
            e.employment_classification.toLowerCase().includes(q)
        )
    }, [data, search])

    const table = useReactTable({
        data: filtered,
        columns: [{ id: "select", header: "", cell: () => null }],
        getRowId: (row) => String(row.employee_id),
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualFiltering: true,
    })

    const pageRows = filtered.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize
    )
    const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
    const colSpan = 3 + leaveTypes.length * 3

    return (
        <div className="flex flex-col gap-4">
            <Input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })) }}
                className="h-8 w-56"
            />

            <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Employment Type</TableHead>
                            {leaveTypes.map((lt) => (
                                <TableHead key={lt.leave_type_id} colSpan={3} className="text-center border-l border-border">
                                    {lt.leave_type_name}
                                </TableHead>
                            ))}
                        </TableRow>
                        <TableRow className="bg-muted/40">
                            <TableHead colSpan={3} />
                            {leaveTypes.map((lt) => (
                                <React.Fragment key={lt.leave_type_id}>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground border-l border-border">Total</TableHead>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground">Used</TableHead>
                                    <TableHead className="text-center text-xs font-normal text-muted-foreground">Balance</TableHead>
                                </React.Fragment>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.length ? pageRows.map((emp) => {
                            const balanceMap = Object.fromEntries(
                                emp.leave_balances.map((b) => [b.leave_type_id, b])
                            )
                            return (
                                <TableRow key={emp.employee_id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <EmployeeAvatar url={emp.avatar_url} name={emp.name} />
                                            <span className="text-sm">{emp.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{emp.department}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{emp.employment_classification}</TableCell>
                                    {leaveTypes.map((lt) => {
                                        const b = balanceMap[lt.leave_type_id]
                                        return (
                                            <React.Fragment key={lt.leave_type_id}>
                                                <TableCell className="text-center text-muted-foreground text-sm border-l border-border">
                                                    {b ? b.total_days.toFixed(1) : "—"}
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-destructive font-medium">
                                                    {b ? b.used_days.toFixed(1) : "—"}
                                                </TableCell>
                                                <TableCell className="text-center text-sm font-semibold text-primary">
                                                    {b ? b.balance.toFixed(1) : "—"}
                                                </TableCell>
                                            </React.Fragment>
                                        )
                                    })}
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                                    No balance records found for {cycleYear}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                table={table}
                rowSelection={{}}
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                pageCount={pageCount}
                totalFiltered={filtered.length}
                onPageIndexChange={(i) => setPagination((p) => ({ ...p, pageIndex: i }))}
                onPageSizeChange={(s) => setPagination({ pageIndex: 0, pageSize: s })}
            />
        </div>
    )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function MonthlyEarnedLeave() {
    const {
        tab = "posting", step = 1, period,
        previews = [], leave_types = [], leave_type_ids = [],
        available_leave_types = [], summary, post_details,
        posting_meta, history = [],
        history_filter = { year: null, month: null },
        balances_data = [],
        balances_leave_types = [],
        balances_cycle_year = new Date().getFullYear(),
        balances_cycle_years = [],
    } = usePage<{ props: PageProps }>().props as unknown as PageProps

    const activeTab = tab === "history" ? "history" : tab === "balances" ? "balances" : "posting"

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => {
                        if (v === "history") router.get(route("leave.accrual.history"))
                        else if (v === "balances") router.get(route("leave.accrual.balances"))
                        else router.get(route("leave.accrual.index"))
                    }}
                >
                    <div className="border-b border-border max-w-100 pt-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        <TabsList className="h-auto bg-transparent gap-0 p-0 flex flex-nowrap w-max min-w-full">
                            <TabsTrigger
                                value="posting"
                                className="relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                            >
                                Monthly Posting
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                            >
                                Transaction History
                            </TabsTrigger>
                            <TabsTrigger
                                value="balances"
                                className="relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                            >
                                Leave Balances
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="posting" className="flex flex-col gap-4 mt-4">
                        <div className="rounded-lg border border-border bg-card px-6 pt-4 shadow-sm">
                            <Stepper steps={WIZARD_STEPS} currentStep={step - 1} onStepChange={() => { }} />
                        </div>
                        <div className="rounded-lg border border-border bg-card shadow-sm">
                            {step === 1 && <StepSelectPeriod availableLeaveTypes={available_leave_types} />}
                            {step === 2 && period && <StepPreviewCredits previews={previews} leaveTypes={leave_types} period={period} leaveTypeIds={leave_type_ids} />}
                            {step === 3 && summary && post_details && period && <StepConfirmPosting summary={summary} postDetails={post_details} period={period} leaveTypeIds={leave_type_ids} />}
                            {step === 4 && period && posting_meta && <StepPostedReview previews={previews} leaveTypes={leave_types} period={period} postingMeta={posting_meta} />}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <div className="rounded-lg border border-border bg-card shadow-sm p-6">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-foreground">Transaction History</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    All posted leave accrual credits across all periods.
                                </p>
                            </div>
                            <HistoryTab history={history} historyFilter={history_filter} />
                        </div>
                    </TabsContent>
                    <TabsContent value="balances" className="mt-4">
                        <div className="rounded-lg border border-border bg-card shadow-sm p-6">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-foreground">Leave Balances</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Current leave balances per employee for FY {balances_cycle_year}–{balances_cycle_year + 1}.
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
    )
}