// Payroll/Configuration/StepIncrement/Index.tsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/shared/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { ChevronsUp, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useStepIncrementColumns } from '@/components/Payroll/Configuration/StepIncrement/components/columns';
import { type StepIncrementEmployee } from '@/components/Payroll/Configuration/StepIncrement/data/schema';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ActiveTable {
    ssl_table_id: number;
    ssl_version: string;
    legal_basis: string;
    tranche_ordinal: string;
    effectivity_date: string;
}

interface Props {
    employees: StepIncrementEmployee[];
    activeTable: ActiveTable | null;
    stepSalaryMap: Record<string, number>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Configuration', href: '#' },
    {
        title: 'Step Increment',
        href: route('payroll.step-increment.index'),
    },
];

const INCREMENT_OPTIONS = [
    { label: '+1 Step', value: '1' },
    { label: '+2 Steps', value: '2' },
    { label: '+3 Steps', value: '3' },
];

const CLASSIFICATION_FILTER_OPTIONS = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Job Order', label: 'Job Order' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Index({
    employees,
    activeTable,
    stepSalaryMap,
}: Props) {
    const [increment, setIncrement] = useState<string>('1');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const incrementNum = parseInt(increment, 10);

    const handleToggle = (id: number) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );

    const handleToggleAll = (ids: number[], checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        } else {
            const set = new Set(ids);
            setSelectedIds((prev) => prev.filter((id) => !set.has(id)));
        }
    };

    const columns = useStepIncrementColumns({
        incrementNum,
        stepSalaryMap,
        selectedIds,
        onToggle: handleToggle,
        onToggleAll: handleToggleAll,
    });

    const handleApply = () => {
        router.post(
            route('payroll.step-increment.apply'),
            { employee_ids: selectedIds, increment: incrementNum },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setConfirmOpen(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Step Increment" />

            <div className="flex h-full flex-1 flex-col gap-6 p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Step Increment
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Bulk-advance employee salary grade steps using the
                            active SSL table.
                        </p>
                    </div>
                </div>

                {activeTable ? (
                    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                        <CardHeader className="pt-4 pb-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-green-600" />
                                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
                                    Active SSL Table
                                </CardTitle>
                            </div>
                            <CardDescription className="text-green-700 dark:text-green-400">
                                {activeTable.ssl_version} —{' '}
                                {activeTable.tranche_ordinal} Tranche ·{' '}
                                {activeTable.legal_basis} · Effective{' '}
                                {new Date(
                                    activeTable.effectivity_date,
                                ).toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="flex items-center gap-3 py-4">
                            <TriangleAlert className="size-4 shrink-0 text-destructive" />
                            <p className="text-sm text-destructive">
                                No active SSL table found. Please activate a
                                salary grade table before incrementing steps.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap items-end gap-2">
                    <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">
                            Increment by
                        </Label>
                        <div className="flex items-center gap-1">
                            {INCREMENT_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    size="sm"
                                    variant={
                                        increment === opt.value
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="h-8 text-xs"
                                    onClick={() => setIncrement(opt.value)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                            <Select
                                value={
                                    ['1', '2', '3'].includes(increment)
                                        ? ''
                                        : increment
                                }
                                onValueChange={setIncrement}
                            >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue placeholder="Custom" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[4, 5, 6, 7].map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            +{n} Steps
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        disabled={selectedIds.length === 0 || !activeTable}
                        onClick={() => setConfirmOpen(true)}
                        className="gap-1.5"
                    >
                        <ChevronsUp className="size-3.5" />
                        Apply Increment ({selectedIds.length})
                    </Button>
                </div>
                <section className="rounded-lg border border-secondary bg-card p-6">
                    <DataTable
                        data={employees}
                        columns={columns}
                        getRowId={(row) => String(row.employee_id)}
                        searchColumnId="name"
                        searchPlaceholder="Search employees..."
                        filters={[
                            {
                                columnId: 'employment_classification',
                                title: 'Classification',
                                options: CLASSIFICATION_FILTER_OPTIONS,
                            },
                        ]}
                    />
                </section>
            </div>

            {/* Confirm dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Apply Step Increment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will advance{' '}
                            <span className="font-semibold text-foreground">
                                {selectedIds.length} employee(s)
                            </span>{' '}
                            by{' '}
                            <span className="font-semibold text-foreground">
                                {incrementNum} step
                                {incrementNum > 1 ? 's' : ''}
                            </span>{' '}
                            based on the active SSL table. Their salary grade
                            step will be updated immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApply}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
