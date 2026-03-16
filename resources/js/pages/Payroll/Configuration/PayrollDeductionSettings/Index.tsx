// Payroll Deduction Settings — Index.tsx

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router } from '@inertiajs/react';
import {
    Save,
    GripVertical,
    Settings2,
    ListOrdered,
    ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeductionSettings {
    // GSIS
    gsis_employee_rate: number;
    gsis_employer_rate: number;
    // PhilHealth
    philhealth_rate: number;
    philhealth_min: number;
    philhealth_max: number;
    // Pag-IBIG
    pagibig_cap: number;
    pagibig_lower_threshold: number;
    pagibig_lower_rate: number;
    pagibig_upper_rate: number;
    // General
    working_days_divisor: number;
    [key: string]: number;
}

type Cuttability = 'Never' | 'Rarely' | 'Yes' | 'First_to_Cut';

interface PriorityOrderItem {
    id: number;
    priority: number;
    deduction_category: string;
    label: string;
    examples: string;
    cuttability: Cuttability;
}

interface FloorRules {
    minimum_take_home_pay: number;
    salary_threshold: number;
    [key: string]: number;
}

interface Props {
    settings?: DeductionSettings;
    priorityOrder?: PriorityOrderItem[];
    floorRules?: FloorRules;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '#' },
    { title: 'Configuration', href: '#' },
    {
        title: 'Payroll Deduction Settings',
        href: route('payroll.deduction-settings.index'),
    },
];

const DEFAULT_SETTINGS: DeductionSettings = {
    gsis_employee_rate: 9.0,
    gsis_employer_rate: 12.0,
    philhealth_rate: 2.5,
    philhealth_min: 250.0,
    philhealth_max: 2500.0,
    pagibig_cap: 100.0,
    pagibig_lower_threshold: 1500.0,
    pagibig_lower_rate: 1.0,
    pagibig_upper_rate: 2.0,
    working_days_divisor: 22,
};

const DEFAULT_PRIORITY_ORDER: PriorityOrderItem[] = [
    {
        id: 1,
        priority: 1,
        deduction_category: 'government_contribution',
        label: "Gov't Contributions",
        examples: 'GSIS, PhilHealth, Pag-IBIG, Tax',
        cuttability: 'Never',
    },
    {
        id: 2,
        priority: 2,
        deduction_category: 'government_loan',
        label: "Gov't Loans",
        examples: 'All GSIS Loans, Pag-IBIG Loans',
        cuttability: 'Rarely',
    },
    {
        id: 3,
        priority: 3,
        deduction_category: 'internal_org_loan',
        label: 'Internal Org Loans',
        examples: 'AMA Loan, Y2K Loans, MKWD Loans',
        cuttability: 'Yes',
    },
    {
        id: 4,
        priority: 4,
        deduction_category: 'internal_org_dues',
        label: 'Org Dues & Premiums',
        examples: 'AMA Premium, Y2K Premium, Union Dues...',
        cuttability: 'First_to_Cut',
    },
    {
        id: 5,
        priority: 5,
        deduction_category: 'miscellaneous',
        label: 'Miscellaneous',
        examples: 'Water Bill, NSGND, One-time Items',
        cuttability: 'First_to_Cut',
    },
];

const DEFAULT_FLOOR_RULES: FloorRules = {
    minimum_take_home_pay: 3000,
    salary_threshold: 6000.0,
};

const TABS = [
    {
        value: 'government-contribution-rates',
        label: 'Government Contribution Rates',
        icon: Settings2,
    },
    {
        value: 'priority-order',
        label: 'Priority Order',
        icon: ListOrdered,
    },
    {
        value: 'floor-rules',
        label: 'Floor Rules',
        icon: ShieldAlert,
    },
] as const;

// ── Cuttability helpers ───────────────────────────────────────────────────────

const CUTTABILITY_LABELS: Record<Cuttability, string> = {
    Never: 'Never',
    Rarely: 'Rarely',
    Yes: 'Yes',
    First_to_Cut: 'First to Cut',
};

const EDITABLE_OPTIONS: Cuttability[] = [
    'Never',
    'Rarely',
    'Yes',
    'First_to_Cut',
];

const ORDER: Cuttability[] = ['Never', 'Rarely', 'Yes', 'First_to_Cut'];
const rankOf = (c: Cuttability) => ORDER.indexOf(c);

function assignCuttability(items: PriorityOrderItem[]): PriorityOrderItem[] {
    const total = items.length;
    const pinned = items.map((item, idx) => {
        if (idx === 0) return { ...item, cuttability: 'Never' as Cuttability };
        if (idx === total - 1)
            return { ...item, cuttability: 'First_to_Cut' as Cuttability };
        return item;
    });
    const forward = [...pinned];
    for (let i = 1; i < total; i++) {
        const above = forward[i - 1].cuttability;
        if (rankOf(forward[i].cuttability) < rankOf(above)) {
            forward[i] = { ...forward[i], cuttability: above };
        }
    }
    const backward = [...forward];
    for (let i = total - 2; i >= 1; i--) {
        const below = backward[i + 1].cuttability;
        if (rankOf(backward[i].cuttability) > rankOf(below)) {
            backward[i] = { ...backward[i], cuttability: below };
        }
    }
    return backward.map((item, idx) => ({ ...item, priority: idx + 1 }));
}

// ── Shared components ─────────────────────────────────────────────────────────

function SaveButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex justify-end">
            <Button onClick={onClick} variant="default">
                <Save className="size-4" />
                Save Settings
            </Button>
        </div>
    );
}

// ── Reusable field component ──────────────────────────────────────────────────

interface FieldProps {
    label: string;
    helper: string;
    fieldKey: string;
    form: DeductionSettings;
    step?: string;
    placeholder?: string;
    onChange: (key: string, value: string) => void;
}

function ContributionField({
    label,
    helper,
    fieldKey,
    form,
    step = '0.01',
    placeholder = '0.00',
    onChange,
}: FieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </Label>
            <Input
                type="number"
                step={step}
                placeholder={placeholder}
                value={form[fieldKey]}
                onChange={(e) => onChange(fieldKey, e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
    );
}

// ── Government Contribution Rates tab ────────────────────────────────────────

function GovernmentContributionRatesTab({
    settings,
}: {
    settings: DeductionSettings;
}) {
    const [form, setForm] = useState<DeductionSettings>({ ...settings });

    const set = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));

    const handleSave = () => {
        router.put(route('payroll.deduction-settings.update'), form, {
            preserveScroll: true,
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <SaveButton onClick={handleSave} />

            {/* ── GSIS ──────────────────────────────────────────────────────── */}
            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        GSIS
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <ContributionField
                            label="Employee Share (%)"
                            helper="The portion deducted from the employee's salary every 15."
                            fieldKey="gsis_employee_rate"
                            form={form}
                            step="0.1"
                            placeholder="9.0"
                            onChange={set}
                        />
                        <ContributionField
                            label="MKWD Share (%)"
                            helper="The portion paid by MKWD on behalf of the employee"
                            fieldKey="gsis_employer_rate"
                            form={form}
                            step="0.1"
                            placeholder="12.0"
                            onChange={set}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── PhilHealth ────────────────────────────────────────────────── */}
            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        PhilHealth
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <ContributionField
                            label="Monthly Rate (%)"
                            helper="The employee's share of the monthly premium"
                            fieldKey="philhealth_rate"
                            form={form}
                            step="0.01"
                            placeholder="2.5"
                            onChange={set}
                        />
                        <ContributionField
                            label="Lowest Deduction (₱)"
                            helper="For low salaries, the deduction will not go below this amount"
                            fieldKey="philhealth_min"
                            form={form}
                            step="0.01"
                            placeholder="250.00"
                            onChange={set}
                        />
                        <ContributionField
                            label="Highest Deduction (₱)"
                            helper="For high salaries, the deduction will not exceed this amount"
                            fieldKey="philhealth_max"
                            form={form}
                            step="0.01"
                            placeholder="2500.00"
                            onChange={set}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Pag-IBIG ──────────────────────────────────────────────────── */}
            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Pag-IBIG (HDMF)
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <ContributionField
                            label="Salary Cutoff (₱)"
                            helper="Employees earning this amount or less use the lower rate below"
                            fieldKey="pagibig_lower_threshold"
                            form={form}
                            step="0.01"
                            placeholder="1500.00"
                            onChange={set}
                        />
                        <ContributionField
                            label="Rate for Lower Salaries (%)"
                            helper="Used when the employee's salary is at or below the cutoff"
                            fieldKey="pagibig_lower_rate"
                            form={form}
                            step="0.01"
                            placeholder="1.0"
                            onChange={set}
                        />
                        <ContributionField
                            label="Rate for Higher Salaries (%)"
                            helper="Used when the employee's salary is above the cutoff"
                            fieldKey="pagibig_upper_rate"
                            form={form}
                            step="0.01"
                            placeholder="2.0"
                            onChange={set}
                        />
                        <ContributionField
                            label="Monthly Limit (₱)"
                            helper="The amount to be deducted per month"
                            fieldKey="pagibig_cap"
                            form={form}
                            step="0.01"
                            placeholder="100.00"
                            onChange={set}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Working Days Divisor ──────────────────────────────────────── */}
            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        General Settings
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent>
                    <div className="max-w-[220px]">
                        <ContributionField
                            label="Working Days Divisor"
                            helper="Used to compute daily rate from monthly basic (standard: 22)"
                            fieldKey="working_days_divisor"
                            form={form}
                            step="1"
                            placeholder="22"
                            onChange={set}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Priority Order tab ────────────────────────────────────────────────────────

interface SortableRowProps {
    item: PriorityOrderItem;
    isFirst: boolean;
    isLast: boolean;
    onCuttabilityChange: (id: number, value: Cuttability) => void;
}

function SortableRow({
    item,
    isFirst,
    isLast,
    onCuttabilityChange,
}: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    const isLocked = isFirst || isLast;

    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/40">
            <TableCell className="w-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="size-4" />
                </button>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {item.priority}
            </TableCell>
            <TableCell className="text-sm">{item.label}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {item.examples}
            </TableCell>
            <TableCell className="text-sm">
                {isLocked ? (
                    <span className="text-muted-foreground">
                        {CUTTABILITY_LABELS[item.cuttability]}
                    </span>
                ) : (
                    <Select
                        value={item.cuttability}
                        onValueChange={(v) =>
                            onCuttabilityChange(item.id, v as Cuttability)
                        }
                    >
                        <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EDITABLE_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt}
                                    value={opt}
                                    className="text-xs"
                                >
                                    {CUTTABILITY_LABELS[opt]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </TableCell>
        </TableRow>
    );
}

function PriorityOrderTab({
    priorityOrder,
}: {
    priorityOrder: PriorityOrderItem[];
}) {
    const [items, setItems] = useState<PriorityOrderItem[]>(() =>
        assignCuttability(
            priorityOrder.map((item, idx) => ({ ...item, priority: idx + 1 })),
        ),
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems((prev) => {
            const oldIndex = prev.findIndex((i) => i.id === active.id);
            const newIndex = prev.findIndex((i) => i.id === over.id);
            const reordered = arrayMove(prev, oldIndex, newIndex);
            return assignCuttability(reordered);
        });
    };

    const handleCuttabilityChange = (id: number, value: Cuttability) => {
        setItems((prev) => {
            const updated = prev.map((item) =>
                item.id === id ? { ...item, cuttability: value } : item,
            );
            const first = updated[0];
            const last = updated[updated.length - 1];
            const middle = updated.slice(1, updated.length - 1);
            const sorted = [...middle].sort(
                (a, b) => rankOf(a.cuttability) - rankOf(b.cuttability),
            );
            const reordered = [first, ...sorted, last];
            return reordered.map((item, idx) => ({
                ...item,
                priority: idx + 1,
            }));
        });
    };

    const handleSave = () => {
        router.put(
            route('payroll.deduction-settings.priority-order.update'),
            {
                ordered_ids: items.map((i) => i.id),
                cuttability: Object.fromEntries(
                    items.map((i) => [i.id, i.cuttability]),
                ),
            },
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <SaveButton onClick={handleSave} />

            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Deduction Priority Order
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="px-0 pt-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-10" />
                                        <TableHead className="w-28 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Priority No.
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Deduction Type
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Examples
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Can be Cut?
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, idx) => (
                                        <SortableRow
                                            key={item.id}
                                            item={item}
                                            isFirst={idx === 0}
                                            isLast={idx === items.length - 1}
                                            onCuttabilityChange={
                                                handleCuttabilityChange
                                            }
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </SortableContext>
                    </DndContext>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Floor Rules tab ───────────────────────────────────────────────────────────

function FloorRulesTab({ floorRules }: { floorRules: FloorRules }) {
    const [form, setForm] = useState<FloorRules>({ ...floorRules });

    const set = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));

    const handleSave = () => {
        router.put(
            route('payroll.deduction-settings.floor-rules.update'),
            form,
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <SaveButton onClick={handleSave} />

            <Card className="border-secondary">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Floor Rules
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">
                                Minimum Take-Home Pay (₱)
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={form.minimum_take_home_pay}
                                onChange={(e) =>
                                    set('minimum_take_home_pay', e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Org deductions are cut if net falls below this
                                per half month salary
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">
                                Salary Threshold (₱)
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={form.salary_threshold}
                                onChange={(e) =>
                                    set('salary_threshold', e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Reference threshold of employee per monthly
                                salary
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
    settings = DEFAULT_SETTINGS,
    priorityOrder = DEFAULT_PRIORITY_ORDER,
    floorRules = DEFAULT_FLOOR_RULES,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Deduction Settings" />

            <div className="flex h-full flex-1 flex-col p-8">
                <Tabs
                    defaultValue="government-contribution-rates"
                    className="flex flex-1 flex-col"
                >
                    <div className="shrink-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <TabsList className="flex h-auto flex-nowrap gap-0 bg-transparent p-0">
                            {TABS.map(({ value, label, icon: Icon }) => (
                                <TabsTrigger
                                    key={value}
                                    value={value}
                                    className="relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    {label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent
                        value="government-contribution-rates"
                        className="mt-6"
                    >
                        <GovernmentContributionRatesTab settings={settings} />
                    </TabsContent>

                    <TabsContent value="priority-order" className="mt-6">
                        <PriorityOrderTab priorityOrder={priorityOrder} />
                    </TabsContent>

                    <TabsContent value="floor-rules" className="mt-6">
                        <FloorRulesTab floorRules={floorRules} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
