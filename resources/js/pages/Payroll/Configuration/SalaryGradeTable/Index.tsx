import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    CircleDashed,
    FilePlus2,
    ShieldCheck,
    TriangleAlert,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table/data-table';
import type { BreadcrumbItem } from '@/types';
import { sslTableColumns } from '@/components/Payroll/Configuration/SalaryGradeTable/components/columns';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SslTableSummary {
    ssl_table_id: number;
    ssl_version: string;
    legal_basis: string;
    tranche: number;
    tranche_ordinal: string;
    effectivity_date: string;
    status: 'draft' | 'active' | 'superseded';
    activated_at: string | null;
    activated_by_name: string | null;
    filled_cells: number;
    total_cells: number;
}

interface Props {
    tables: SslTableSummary[];
    activeTable: SslTableSummary | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Configuration', href: '#' },
    { title: 'Salary Grade Table', href: route('payroll.salary-grade.index') },
];

const SSL_VERSIONS = ['SSL VI', 'SSL V', 'SSL IV', 'SSL III'] as const;

const STATUS_FILTER_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'superseded', label: 'Superseded' },
];

// ── Create Draft Dialog ────────────────────────────────────────────────────────

function CreateDraftDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        ssl_version: 'SSL VI',
        legal_basis: '',
        tranche: '',
        effectivity_date: '',
    });

    const handleSubmit = () => {
        post(route('payroll.salary-grade.store'), {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <FilePlus2 className="size-4" />
                    New SSL Table
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New SSL Table</DialogTitle>
                    <DialogDescription>
                        This creates a blank draft. You will fill in the salary
                        amounts on the next screen.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ssl_version">SSL Version</Label>
                        <Select
                            value={data.ssl_version}
                            onValueChange={(v) => setData('ssl_version', v)}
                        >
                            <SelectTrigger id="ssl_version">
                                <SelectValue placeholder="Select SSL version" />
                            </SelectTrigger>
                            <SelectContent>
                                {SSL_VERSIONS.map((v) => (
                                    <SelectItem key={v} value={v}>
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="legal_basis">Legal Basis</Label>
                        <Input
                            id="legal_basis"
                            placeholder="e.g. RA 11466 / EO 64"
                            value={data.legal_basis}
                            onChange={(e) =>
                                setData('legal_basis', e.target.value)
                            }
                        />
                        {errors.legal_basis && (
                            <p className="text-xs text-destructive">
                                {errors.legal_basis}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="tranche">Tranche</Label>
                        <Select
                            value={data.tranche}
                            onValueChange={(v) => setData('tranche', v)}
                        >
                            <SelectTrigger id="tranche">
                                <SelectValue placeholder="Select tranche" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map((t) => (
                                    <SelectItem key={t} value={String(t)}>
                                        {t === 1
                                            ? '1st'
                                            : t === 2
                                              ? '2nd'
                                              : t === 3
                                                ? '3rd'
                                                : '4th'}{' '}
                                        Tranche
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.tranche && (
                            <p className="text-xs text-destructive">
                                {errors.tranche}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="effectivity_date">
                            Effectivity Date
                        </Label>
                        <Input
                            id="effectivity_date"
                            type="date"
                            value={data.effectivity_date}
                            onChange={(e) =>
                                setData('effectivity_date', e.target.value)
                            }
                        />
                        {errors.effectivity_date && (
                            <p className="text-xs text-destructive">
                                {errors.effectivity_date}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing}>
                        Create Draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Index({ tables, activeTable }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salary Grade Table" />

            <div className="flex h-full flex-1 flex-col gap-6 p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Salary Grade Table
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage SSL salary schedules. Only one table can be
                            active at a time.
                        </p>
                    </div>
                    <CreateDraftDialog />
                </div>

                {activeTable ? (
                    <Card
                        className="cursor-pointer border-green-200 bg-green-50/50 transition-colors hover:bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                        onClick={() =>
                            router.visit(
                                route(
                                    'payroll.salary-grade.show',
                                    activeTable.ssl_table_id,
                                ),
                            )
                        }
                    >
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
                                {activeTable.activated_by_name && (
                                    <>
                                        {' '}
                                        · Activated by{' '}
                                        {activeTable.activated_by_name}
                                    </>
                                )}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="flex items-center gap-3 py-4">
                            <TriangleAlert className="size-4 shrink-0 text-destructive" />
                            <p className="text-sm text-destructive">
                                No active salary grade table. Create a draft,
                                fill in the salary amounts, then activate it.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <section className="rounded-lg border border-secondary bg-card p-6">
                    <DataTable
                        data={tables}
                        columns={sslTableColumns}
                        getRowId={(row) => String(row.ssl_table_id)}
                        onRowClick={(row) =>
                            router.visit(
                                route(
                                    'payroll.salary-grade.show',
                                    row.original.ssl_table_id,
                                ),
                            )
                        }
                        searchColumnId="ssl_version"
                        searchPlaceholder="Search SSL version..."
                        filters={[
                            {
                                columnId: 'status',
                                title: 'Status',
                                options: STATUS_FILTER_OPTIONS,
                            },
                        ]}
                    />
                </section>
            </div>
        </AppLayout>
    );
}
