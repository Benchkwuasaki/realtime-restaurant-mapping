import { useState, useCallback, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    CircleDashed,
    Clock,
    Pencil,
    Save,
    ShieldCheck,
    X,
    Zap,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SalaryStep {
    step: number;
    monthly_salary: number | null;
}

interface SalaryGradeRow {
    salary_grade: number;
    steps: SalaryStep[];
}

interface SslTableMeta {
    ssl_table_id: number;
    ssl_version: string;
    legal_basis: string;
    tranche: number;
    tranche_ordinal: string;
    effectivity_date: string;
    status: 'draft' | 'active' | 'superseded';
    activated_at: string | null;
}

interface Props {
    sslTable: SslTableMeta;
    salaryTable: SalaryGradeRow[];
    affectedEmployeeCount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function fmtPeso(n: number | null): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

function parseSalary(raw: string): number | null {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SslTableMeta['status'] }) {
    if (status === 'active') {
        return (
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle2 className="size-3" />
                Active
            </Badge>
        );
    }
    if (status === 'draft') {
        return (
            <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400">
                <CircleDashed className="size-3" />
                Draft
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="gap-1 text-muted-foreground">
            <Clock className="size-3" />
            Superseded
        </Badge>
    );
}

// ── Editable Cell ──────────────────────────────────────────────────────────────

function EditableCell({
    value,
    onChange,
    isEditing,
}: {
    value: number | null;
    onChange: (val: number | null) => void;
    isEditing: boolean;
}) {
    const [raw, setRaw] = useState(value != null ? String(value) : '');
    const inputRef = useRef<HTMLInputElement>(null);

    const commit = () => {
        const parsed = parseSalary(raw);
        onChange(parsed);
        setRaw(parsed != null ? String(parsed) : '');
    };

    if (!isEditing) {
        return (
            <span
                className={`block text-right text-xs tabular-nums ${
                    value == null ? 'text-muted-foreground/40' : ''
                }`}
            >
                {fmtPeso(value)}
            </span>
        );
    }

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    commit();
                    // Move to next cell (next input in DOM)
                    const inputs =
                        document.querySelectorAll<HTMLInputElement>(
                            '.sg-cell-input',
                        );
                    const idx = Array.from(inputs).indexOf(inputRef.current!);
                    inputs[idx + 1]?.focus();
                }
                if (e.key === 'Escape') {
                    setRaw(value != null ? String(value) : '');
                    inputRef.current?.blur();
                }
            }}
            className="sg-cell-input w-full rounded border-0 bg-transparent px-1 py-0.5 text-right text-xs tabular-nums ring-1 ring-ring/40 outline-none focus:ring-ring/80"
            placeholder="—"
        />
    );
}

// ── Activate Confirmation Dialog ───────────────────────────────────────────────

function ActivateDialog({
    sslTable,
    affectedEmployeeCount,
    open,
    onOpenChange,
}: {
    sslTable: SslTableMeta;
    affectedEmployeeCount: number;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { post, processing } = useForm({});

    const handleActivate = () => {
        post(route('payroll.salary-grade.activate', sslTable.ssl_table_id), {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-green-600" />
                        Activate Salary Grade Table
                    </DialogTitle>
                    <DialogDescription>
                        Please review the details before activating. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            SSL Version
                        </span>
                        <span className="font-medium">
                            {sslTable.ssl_version}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tranche</span>
                        <span className="font-medium">
                            {sslTable.tranche_ordinal}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Legal Basis
                        </span>
                        <span className="font-medium">
                            {sslTable.legal_basis}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Effectivity Date
                        </span>
                        <span className="font-medium">
                            {new Date(
                                sslTable.effectivity_date,
                            ).toLocaleDateString('en-PH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Employees Affected
                        </span>
                        <span className="font-semibold text-amber-600">
                            {affectedEmployeeCount} employee
                            {affectedEmployeeCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle className="size-4" />
                    <AlertDescription className="text-xs">
                        All {affectedEmployeeCount} employee salaries will be{' '}
                        <strong>automatically updated</strong> to reflect this
                        table. The current active table will be marked as
                        superseded.
                    </AlertDescription>
                </Alert>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleActivate}
                        disabled={processing}
                        className="gap-1.5 bg-green-600 hover:bg-green-700"
                    >
                        <Zap className="size-4" />
                        {processing ? 'Activating...' : 'Confirm & Activate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Show({
    sslTable,
    salaryTable,
    affectedEmployeeCount,
}: Props) {
    const [table, setTable] = useState<SalaryGradeRow[]>(salaryTable);
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activateOpen, setActivateOpen] = useState(false);
    const originalTable = useRef<SalaryGradeRow[]>(salaryTable);

    const isDraft = sslTable.status === 'draft';
    const isReadOnly = !isDraft;

    // ── Cell change ──────────────────────────────────────────────────────────

    const updateCell = useCallback(
        (sg: number, step: number, val: number | null) => {
            setTable((prev) =>
                prev.map((row) =>
                    row.salary_grade !== sg
                        ? row
                        : {
                              ...row,
                              steps: row.steps.map((s) =>
                                  s.step !== step
                                      ? s
                                      : { ...s, monthly_salary: val },
                              ),
                          },
                ),
            );
            setHasChanges(true);
        },
        [],
    );

    // ── Save ─────────────────────────────────────────────────────────────────

    const handleSave = () => {
        router.put(
            route('payroll.salary-grade.update', sslTable.ssl_table_id),
            { salary_table: table },
            {
                preserveScroll: true,
                onSuccess: () => {
                    originalTable.current = table;
                    setHasChanges(false);
                    setIsEditing(false);
                },
            },
        );
    };

    // ── Cancel edit ──────────────────────────────────────────────────────────

    const handleCancel = () => {
        setTable(originalTable.current);
        setHasChanges(false);
        setIsEditing(false);
    };

    // ── Completeness check (for activate button) ─────────────────────────────

    const emptyRequiredCells = table.reduce((acc, row) => {
        return (
            acc +
            row.steps.filter((s) => {
                // SG33 Steps 3-8 are allowed null
                const isOptional = row.salary_grade === 33 && s.step >= 3;
                return !isOptional && s.monthly_salary == null;
            }).length
        );
    }, 0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll', href: '#' },
        { title: 'Configuration', href: '#' },
        {
            title: 'Salary Grade Table',
            href: route('payroll.salary-grade.index'),
        },
        {
            title: `${sslTable.ssl_version} – ${sslTable.tranche_ordinal} Tranche`,
            href: route('payroll.salary-grade.show', sslTable.ssl_table_id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${sslTable.ssl_version} – ${sslTable.tranche_ordinal} Tranche`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-8">
                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                                router.visit(
                                    route('payroll.salary-grade.index'),
                                )
                            }
                        >
                            <ArrowLeft className="size-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold">
                                    {sslTable.ssl_version} —{' '}
                                    {sslTable.tranche_ordinal} Tranche
                                </h1>
                                <StatusBadge status={sslTable.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {sslTable.legal_basis} · Effective{' '}
                                {new Date(
                                    sslTable.effectivity_date,
                                ).toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        {isDraft && !isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Pencil className="size-4" />
                                    Edit Table
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                                    disabled={emptyRequiredCells > 0}
                                    onClick={() => setActivateOpen(true)}
                                    title={
                                        emptyRequiredCells > 0
                                            ? `${emptyRequiredCells} required cells are still empty`
                                            : 'Activate this table'
                                    }
                                >
                                    <Zap className="size-4" />
                                    Activate
                                </Button>
                            </>
                        )}

                        {isDraft && isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={handleCancel}
                                >
                                    <X className="size-4" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={!hasChanges}
                                    onClick={handleSave}
                                >
                                    <Save className="size-4" />
                                    Save Changes
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Incomplete warning ── */}
                {isDraft && !isEditing && emptyRequiredCells > 0 && (
                    <Alert variant="default">
                        <AlertTriangle className="size-4" />
                        <AlertDescription className="text-xs">
                            <strong>{emptyRequiredCells} cells</strong> still
                            need salary amounts before this table can be
                            activated.
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Salary Grid ── */}
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/30 pb-3">
                        <CardTitle className="text-sm font-semibold">
                            Salary Schedule (SG 1–33 × Step 1–8)
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Monthly basic salary in Philippine Peso (₱). SG 33
                            Steps 3–8 are not applicable.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="w-16 px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                                            SG
                                        </th>
                                        {STEPS.map((s) => (
                                            <th
                                                key={s}
                                                className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground"
                                            >
                                                Step {s}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {table.map((row, rowIdx) => (
                                        <tr
                                            key={row.salary_grade}
                                            className={`border-b transition-colors last:border-0 ${
                                                isEditing
                                                    ? 'hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
                                                    : 'hover:bg-muted/20'
                                            } ${rowIdx % 2 === 0 ? '' : 'bg-muted/10'}`}
                                        >
                                            <td className="px-3 py-1.5 text-center">
                                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums">
                                                    {row.salary_grade}
                                                </span>
                                            </td>
                                            {row.steps.map((s) => {
                                                // SG33 steps 3-8 are N/A
                                                const isNA =
                                                    row.salary_grade === 33 &&
                                                    s.step >= 3;

                                                return (
                                                    <td
                                                        key={s.step}
                                                        className={`px-3 py-1.5 ${isNA ? 'bg-muted/30' : ''}`}
                                                    >
                                                        {isNA ? (
                                                            <span className="block text-right text-xs text-muted-foreground/30">
                                                                N/A
                                                            </span>
                                                        ) : (
                                                            <EditableCell
                                                                value={
                                                                    s.monthly_salary
                                                                }
                                                                isEditing={
                                                                    isEditing &&
                                                                    !isReadOnly
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    updateCell(
                                                                        row.salary_grade,
                                                                        s.step,
                                                                        val,
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Activate Dialog ── */}
            <ActivateDialog
                sslTable={sslTable}
                affectedEmployeeCount={affectedEmployeeCount}
                open={activateOpen}
                onOpenChange={setActivateOpen}
            />
        </AppLayout>
    );
}
