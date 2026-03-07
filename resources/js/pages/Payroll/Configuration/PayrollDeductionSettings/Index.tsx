// Payroll Deduction Settings Index.tsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Save,
    GripVertical,
    Settings2,
    ListOrdered,
    ShieldAlert,
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

interface DeductionSettings {
    gsis_employee_rate: number;
    gsis_employer_rate: number;
    philhealth_rate: number;
    pagibig_monthly: number;
    working_days_divisor: number;
    [key: string]: number;
}

interface PriorityOrderItem {
    id: string;
    priority: number;
    deduction_type: string;
    examples: string;
    can_be_cut: string;
    [key: string]: string | number;
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
        id: '1',
        priority: 1,
        deduction_type: "Gov't Contributions",
        examples: 'GSIS, PhilHealth, Pag-IBIG, Tax',
        can_be_cut: 'Never',
    },
    {
        id: '2',
        priority: 2,
        deduction_type: "Gov't Loans",
        examples: 'All GSIS Loans, Pag-IBIG Loans',
        can_be_cut: 'Rarely',
    },
    {
        id: '3',
        priority: 3,
        deduction_type: 'Internal Org Loans',
        examples: 'AMA Loan, Y2K Loans, MKWD Loans',
        can_be_cut: 'Yes',
    },
    {
        id: '4',
        priority: 4,
        deduction_type: 'Org Dues & Premiums',
        examples: 'AMA Premium, Y2K Premium, Union Dues...',
        can_be_cut: 'First to Cut',
    },
    {
        id: '5',
        priority: 5,
        deduction_type: 'Miscellaneous',
        examples: 'Water Bill, NSGND, One-time Items',
        can_be_cut: 'First to Cut',
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Government Contribution Rate
                    </CardTitle>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {CONTRIBUTION_FIELDS.map((field) => (
                            <div
                                key={field.key}
                                className="flex flex-col gap-1.5"
                            >
                                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {field.label}
                                </Label>
                                <Input
                                    type="number"
                                    step={field.step}
                                    placeholder={field.placeholder}
                                    value={form[field.key]}
                                    onChange={(e) =>
                                        set(field.key, e.target.value)
                                    }
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
                            onChange={(e) =>
                                set('working_days_divisor', e.target.value)
                            }
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

function SortableRow({ item }: { item: PriorityOrderItem }) {
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
            <TableCell className="text-sm">{item.deduction_type}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {item.examples}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {item.can_be_cut}
            </TableCell>
        </TableRow>
    );
}

// TODO: Make it based on the Internal Organizations and Government Organizations
// Currently pre defined but then need to specify it more on the deduction types hehe
// Hmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
function PriorityOrderTab({
    priorityOrder,
}: {
    priorityOrder: PriorityOrderItem[];
}) {
    const [items, setItems] = useState<PriorityOrderItem[]>(
        priorityOrder.map((item, idx) => ({ ...item, priority: idx + 1 })),
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
            return reordered.map((item, idx) => ({
                ...item,
                priority: idx + 1,
            }));
        });
    };

    const handleSave = () => {
        router.put(
            route('payroll.deduction-settings.priority-order.update'),
            { priority_order: items.map((i) => ({ ...i })) },
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <SaveButton onClick={handleSave} />

            <Card>
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
                                    {items.map((item) => (
                                        <SortableRow
                                            key={item.id}
                                            item={item}
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

            <Card>
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
