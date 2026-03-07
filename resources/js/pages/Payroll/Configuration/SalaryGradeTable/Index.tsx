import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    CheckCircle2,
    CircleDashed,
    FilePlus2,
    ShieldCheck,
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
import { Separator } from '@/components/ui/separator';
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

            <div className="flex h-full flex-1 flex-col gap-8 p-8">
                {/* ── Header ── */}
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

                {/* ── Active table featured card ── */}
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
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/40">
                                        <ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            {activeTable.ssl_version} —{' '}
                                            {activeTable.tranche_ordinal}{' '}
                                            Tranche
                                        </CardTitle>
                                        <CardDescription className="mt-0.5">
                                            {activeTable.legal_basis} ·
                                            Effective{' '}
                                            {new Date(
                                                activeTable.effectivity_date,
                                            ).toLocaleDateString('en-PH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400">
                                    <CheckCircle2 className="size-3" />
                                    Active
                                </Badge>
                            </div>
                        </CardHeader>
                        <Separator className="bg-green-200 dark:bg-green-900" />
                        <CardContent className="pt-3">
                            <p className="text-xs text-muted-foreground">
                                {activeTable.activated_by_name
                                    ? `Activated by ${activeTable.activated_by_name} on ${new Date(activeTable.activated_at!).toLocaleDateString('en-PH')}.`
                                    : 'Active table — all employee salaries are based on this schedule.'}{' '}
                                Click to view the full 33×8 salary grid.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                            <CircleDashed className="size-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No active salary grade table
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Create a draft, fill in the salary amounts, then
                                activate it.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* ── All Tables ── */}
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
            </div>
        </AppLayout>
    );
}
