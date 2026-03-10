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
    gsis_employee_rate: number;
    gsis_employer_rate: number;
    philhealth_rate: number;
    pagibig_monthly: number;
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
    pagibig_monthly: 100.0,
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

const CONTRIBUTION_FIELDS: {
    key: string;
    label: string;
    helper: string;
    placeholder: string;
    step: string;
}[] = [
        {
            key: 'gsis_employee_rate',
            label: 'GSIS EMPLOYEE RATE (%)',
            helper: 'Regular & Casual only',
            placeholder: '0.0',
            step: '0.1',
        },
        {
            key: 'gsis_employer_rate',
            label: 'GSIS EMPLOYER RATE (%) - MKWD',
            helper: 'MKWD pays this share',
            placeholder: '0.0',
            step: '0.1',
        },
        {
            key: 'philhealth_rate',
            label: 'PhilHealth RATE (%) - MKWD',
            helper: 'Split 50/50 Employer – Employee',
            placeholder: '0.0',
            step: '0.1',
        },
        {
            key: 'pagibig_monthly',
            label: 'Pag-IBIG Monthly (₱)',
            helper: '₱50 per payroll period (15 days)',
            placeholder: '0.00',
            step: '0.01',
        },
    ];

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

// Middle items can be manually set to either of these
const EDITABLE_OPTIONS: Cuttability[] = ['Never', 'Rarely', 'Yes', 'First_to_Cut'];

/**
 * Enforces cuttability rules across the full list:
 * - index 0         → always 'never'        (locked)
 * - index last      → always 'first_to_cut' (locked)
 * - middle items    → 'rarely' or 'yes', defaulting to 'yes'
 *
 * Ordering constraint: no 'yes' may appear above a 'rarely' in the list.
 * If a violation is detected after a drag, the offending items are corrected
 * by converting any 'yes' that precedes a 'rarely' into 'rarely'.
 */
const ORDER: Cuttability[] = ['Never', 'Rarely', 'Yes', 'First_to_Cut'];

const rankOf = (c: Cuttability) => ORDER.indexOf(c);

function assignCuttability(items: PriorityOrderItem[]): PriorityOrderItem[] {
    const total = items.length;

    // Step 1 — pin first and last
    const pinned = items.map((item, idx) => {
        if (idx === 0) return { ...item, cuttability: 'Never' as Cuttability };
        if (idx === total - 1) return { ...item, cuttability: 'First_to_Cut' as Cuttability };
        return item;
    });

    // Step 2 — forward pass: each item must be >= rank of item above it
    const forward = [...pinned];
    for (let i = 1; i < total; i++) {
        const above = forward[i - 1].cuttability;
        if (rankOf(forward[i].cuttability) < rankOf(above)) {
            forward[i] = { ...forward[i], cuttability: above };
        }
    }

    // Step 3 — backward pass: each item must be <= rank of item below it
    const backward = [...forward];
    for (let i = total - 2; i >= 1; i--) {
        const below = backward[i + 1].cuttability;
        if (rankOf(backward[i].cuttability) > rankOf(below)) {
            backward[i] = { ...backward[i], cuttability: below };
        }
    }

    // Step 4 — reassign priority numbers
    return backward.map((item, idx) => ({ ...item, priority: idx + 1 }));
}
// ── Shared components ─────────────────────────────────────────────────────────

function SaveButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex justify-end">
            <Button
                onClick={onClick}
                className="gap-2 bg-green-500 text-white hover:bg-green-600"
            >
                <Save className="size-4" />
                Save Settings
            </Button>
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
        router.put(
            route('payroll.deduction-settings.update'),
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
                        Government Contribution Rate
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {CONTRIBUTION_FIELDS.map((field) => (
                            <div key={field.key} className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {field.label}
                                </Label>
                                <Input
                                    type="number"
                                    step={field.step}
                                    placeholder={field.placeholder}
                                    value={form[field.key]}
                                    onChange={(e) => set(field.key, e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {field.helper}
                                </p>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex max-w-[220px] flex-col gap-1.5">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            WORKING DAYS DIVISOR
                        </Label>
                        <Input
                            type="number"
                            step="1"
                            placeholder="22"
                            value={form.working_days_divisor}
                            onChange={(e) => set('working_days_divisor', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Used for daily rate (standard: 22)
                        </p>
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

function SortableRow({ item, isFirst, isLast, onCuttabilityChange }: SortableRowProps) {
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
                    // First and last are locked — show label only
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
                                <SelectItem key={opt} value={opt} className="text-xs">
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
            priorityOrder.map((item, idx) => ({ ...item, priority: idx + 1 }))
        )
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
            // Apply the new cuttability value to the item
            const updated = prev.map((item) =>
                item.id === id ? { ...item, cuttability: value } : item
            );

            // Extract middle items (exclude first and last which are locked)
            const first = updated[0];
            const last = updated[updated.length - 1];
            const middle = updated.slice(1, updated.length - 1);

            // Stable sort middle items by cuttability rank
            // Items with the same rank keep their relative order
            const sorted = [...middle].sort(
                (a, b) => rankOf(a.cuttability) - rankOf(b.cuttability)
            );

            // Reconstruct and reassign priorities
            const reordered = [first, ...sorted, last];
            return reordered.map((item, idx) => ({ ...item, priority: idx + 1 }));
        });
    };


    const handleSave = () => {
        router.put(
            route('payroll.deduction-settings.priority-order.update'),
            {
                ordered_ids: items.map((i) => i.id),
                cuttability: Object.fromEntries(
                    items.map((i) => [i.id, i.cuttability])
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
                                            onCuttabilityChange={handleCuttabilityChange}
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

                <CardContent className="pt-6">
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
                                Reference Threshold of employee per monthly
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