import { Head, router } from '@inertiajs/react';
import Cropper from 'react-easy-crop';
import {
    Pencil,
    Mail,
    Phone,
    Calendar,
    MapPin,
    User,
    Heart,
    Home,
    Briefcase,
    Clock,
    FileText,
    Landmark,
    Camera,
    XCircle,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Save,
    ChevronUp,
    Pen,
    Upload,
    Download,
    FolderOpen,
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import React from 'react';
import { route } from 'ziggy-js';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
    department_name: string;
}
interface Division {
    division_name: string;
}
interface Unit {
    unit_name: string;
}
interface Position {
    position_name: string;
    department?: Department;
    division?: Division;
    unit?: Unit;
}
interface Item {
    item_id: number;
    is_occupied: boolean;
    position?: Position;
}
interface SalaryGradeStep {
    salary_grade_step_id: number;
    salary_grade: number;
    step: number;
    monthly_salary: number;
}
interface Address {
    id?: number;
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
}
interface Education {
    level?: string;
    school_name: string;
    school_address?: string;
    degree?: string;
    graduation_date?: string;
}
interface FamilyMember {
    full_name: string;
    relationship?: string;
    contact_number?: string;
    sex?: boolean;
    date_of_birth?: string;
    place_of_birth?: string;
}
interface BasicInfo {
    first_name: string;
    last_name: string;
    middle_name?: string;
    name_extension?: string;
    full_name: string;
    birth_date?: string;
    sex?: boolean;
    civil_status?: string;
    place_of_birth?: string;
    personal_email?: string;
    phone_number?: string;
    addresses?: Address[];
    educations?: Education[];
    family_info?: FamilyMember[];
}
interface GovernmentAccount {
    government_account_id: number;
    account_type: string;
    account_number: string;
}
interface EligibilityInfo {
    eligibility_information_id: number;
    eligibility_name: string;
    year_passed?: string;
}
interface Allowance {
    allowance_type: string;
    amount: number;
}
interface LeaveBalance {
    id: number;
    leave_type: string;
    remaining: number;
    used: number;
}
interface LeaveAvailment {
    id: number;
    employee_name: string;
    employee_avatar?: string;
    leave_type: string;
    leave_date_start: string;
    leave_date_end: string;
    duration: number;
    date_filed: string;
    status: 'Approved' | 'Pending' | 'Rejected';
}
interface UploadedFile {
    id: number;
    file_name: string;
    file_size: number;
    created_at: string;
    file_url: string;
}
interface SeminarTraining {
    id: number;
    seminar_name: string;
    venue?: string;
    date_attended?: string;
}
interface ServiceRecord {
    id: number;
    position_name: string;
    department_name?: string;
    year_start?: string;
    year_end?: string;
}
interface InternalOrganization {
    internal_organization_id: number;
    name: string;
    type: string;
    code: string;
}
interface Employee {
    employee_id: number;
    work_email: string;
    work_id?: string;
    employment_classification: string;
    date_applied?: string;
    date_hired?: string;
    work_schedule_start?: string;
    work_schedule_end?: string;
    break_start?: string;
    break_end?: string;
    status: boolean;
    avatar_url?: string;
    basic_info?: BasicInfo;
    item?: Item;
    salary_grade_step?: SalaryGradeStep;
    allowances?: Allowance[];
    eligibility_information?: EligibilityInfo[];
    government_accounts?: GovernmentAccount[];
    leave_balances?: LeaveBalance[];
    leave_availments?: LeaveAvailment[];
    uploadedFiles?: UploadedFile[];
    seminarsAndTrainings?: SeminarTraining[];
    serviceRecords?: ServiceRecord[];
    internal_organizations?: InternalOrganization[];
}
interface Props {
    employee: Employee;
    items: Item[];
}

// ─── Position group ───────────────────────────────────────────────────────────

interface PositionGroup {
    positionName: string;
    position: Position | undefined;
    items: Item[];
    totalSlots: number;
    availableSlots: number;
    isFull: boolean;
}

function buildPositionGroups(items: Item[]): PositionGroup[] {
    const map = new Map<string, PositionGroup>();
    for (const item of items) {
        const key = item.position?.position_name ?? `__item_${item.item_id}`;
        if (!map.has(key)) {
            map.set(key, {
                positionName:
                    item.position?.position_name ?? `Item #${item.item_id}`,
                position: item.position,
                items: [],
                totalSlots: 0,
                availableSlots: 0,
                isFull: false,
            });
        }
        const grp = map.get(key)!;
        grp.items.push(item);
        grp.totalSlots++;
        if (!item.is_occupied) grp.availableSlots++;
    }
    for (const grp of map.values()) grp.isFull = grp.availableSlots === 0;
    return Array.from(map.values()).sort((a, b) =>
        a.positionName.localeCompare(b.positionName),
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string) {
    if (!date) return undefined;
    return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
function fmtShort(date?: string) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
function cap(str?: string) {
    if (!str) return undefined;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toInputDate(date?: string) {
    if (!date) return '';
    return date.slice(0, 10);
}

function toInputTime(t?: string): string {
    if (!t) return '';
    return t.slice(0, 5); // "08:30:00" → "08:30"
}

async function getCroppedImg(
    imageSrc: string,
    croppedAreaPixels: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });
    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
    );
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error('Canvas is empty')),
            'image/jpeg',
            0.92,
        ),
    );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
    icon: Icon,
    label,
    value,
    onEdit,
}: {
    icon: React.ElementType;
    label: string;
    value?: string;
    onEdit?: () => void;
}) {
    return (
        <div className="border-border group/row flex items-start gap-3 border-b py-3 last:border-0">
            <div className="bg-accent mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-primary h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase leading-none tracking-widest">
                    {label}
                </p>
                <p className="text-foreground break-words text-sm font-medium leading-snug">
                    {value || (
                        <span className="text-muted-foreground/40 text-xs font-normal italic">
                            Not provided
                        </span>
                    )}
                </p>
            </div>
            {onEdit && (
                <Button size={'icon-xs'} onClick={onEdit} variant={'ghost'}>
                    <Pencil className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

// ─── DetailCard ───────────────────────────────────────────────────────────────

function DetailCard({
    title,
    value,
    isStatus = false,
    statusValue,
    onToggleStatus,
    onEdit,
}: {
    title: string;
    value?: string;
    isStatus?: boolean;
    statusValue?: boolean;
    onToggleStatus?: () => void;
    onEdit?: () => void;
}) {
    return (
        <div className="bg-card border-border hover:border-primary/20 group rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                    {title}
                </span>
                {isStatus ? (
                    <Switch
                        checked={statusValue}
                        onCheckedChange={onToggleStatus}
                        className="scale-90"
                    />
                ) : onEdit ? (
                    <Button size={'icon-xs'} onClick={onEdit} variant={'ghost'}>
                        <Pencil className="h-3 w-3" />
                    </Button>
                ) : null}
            </div>
            <div className="flex items-center gap-2">
                {isStatus ? (
                    statusValue ? (
                        <>
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                            <Badge className="rounded-md border-0 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                Active
                            </Badge>
                        </>
                    ) : (
                        <>
                            <div className="bg-destructive/10 border-destructive/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border">
                                <div className="bg-destructive h-2 w-2 rounded-full" />
                            </div>
                            <Badge className="bg-destructive/10 text-destructive rounded-md border-0 px-2.5 py-0.5 text-xs font-semibold">
                                Inactive
                            </Badge>
                        </>
                    )
                ) : value ? (
                    <>
                        <div className="bg-primary/10 border-primary/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border">
                            <div className="bg-primary h-2 w-2 rounded-full" />
                        </div>
                        <Badge className="bg-primary text-primary-foreground max-w-full truncate rounded-md border-0 px-2.5 py-0.5 text-xs font-semibold">
                            {value}
                        </Badge>
                    </>
                ) : (
                    <>
                        <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                            <XCircle className="text-muted-foreground/40 h-3.5 w-3.5" />
                        </div>
                        <span className="text-muted-foreground/50 text-sm font-normal italic">
                            Not set
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Basic Info Edit Dialog ────────────────────────────────────────────────────

function BasicInfoEditDialog({
    employee,
    open,
    onClose,
}: {
    employee: Employee;
    open: boolean;
    onClose: () => void;
}) {
    const basic = employee.basic_info;
    const firstAddress = (basic?.addresses ?? [])[0];

    const [form, setForm] = useState({
        first_name: basic?.first_name ?? '',
        last_name: basic?.last_name ?? '',
        middle_name: basic?.middle_name ?? '',
        name_extension: basic?.name_extension ?? '',
        birth_date: toInputDate(basic?.birth_date),
        sex: basic?.sex !== undefined ? String(Number(basic.sex)) : '',
        civil_status: basic?.civil_status ?? '',
        place_of_birth: basic?.place_of_birth ?? '',
        personal_email: basic?.personal_email ?? '',
        phone_number: basic?.phone_number ?? '',
        street_address: firstAddress?.street_address ?? '',
        city: firstAddress?.city ?? '',
        state: firstAddress?.state ?? '',
        zip_code: firstAddress?.zip_code ?? '',
    });
    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
    const save = () =>
        router.put(route('employee.update', employee.employee_id), form, {
            preserveScroll: true,
            onSuccess: onClose,
        });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Basic Information</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            First Name *
                        </Label>
                        <Input
                            value={form.first_name}
                            onChange={(e) => set('first_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Last Name *
                        </Label>
                        <Input
                            value={form.last_name}
                            onChange={(e) => set('last_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Middle Name
                        </Label>
                        <Input
                            value={form.middle_name}
                            onChange={(e) => set('middle_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Extension
                        </Label>
                        <Input
                            value={form.name_extension}
                            onChange={(e) =>
                                set('name_extension', e.target.value)
                            }
                            placeholder="Jr., Sr., III…"
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Date of Birth
                        </Label>
                        <Input
                            type="date"
                            value={form.birth_date}
                            onChange={(e) => set('birth_date', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Sex
                        </Label>
                        <Select
                            value={form.sex}
                            onValueChange={(v) => set('sex', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Male</SelectItem>
                                <SelectItem value="0">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Civil Status
                        </Label>
                        <Select
                            value={form.civil_status}
                            onValueChange={(v) => set('civil_status', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">
                                    Divorced
                                </SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Place of Birth
                        </Label>
                        <Input
                            value={form.place_of_birth}
                            onChange={(e) =>
                                set('place_of_birth', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Personal Email
                        </Label>
                        <Input
                            type="email"
                            value={form.personal_email}
                            onChange={(e) =>
                                set('personal_email', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Phone Number
                        </Label>
                        <Input
                            value={form.phone_number}
                            onChange={(e) =>
                                set('phone_number', e.target.value)
                            }
                        />
                    </div>
                </div>
                <div className="border-border mt-1 border-t pt-3">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-widest">
                        Address
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="col-span-full">
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Street Address
                            </Label>
                            <Input
                                value={form.street_address}
                                onChange={(e) =>
                                    set('street_address', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                City
                            </Label>
                            <Input
                                value={form.city}
                                onChange={(e) => set('city', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Province / State
                            </Label>
                            <Input
                                value={form.state}
                                onChange={(e) => set('state', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Zip Code
                            </Label>
                            <Input
                                value={form.zip_code}
                                onChange={(e) =>
                                    set('zip_code', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={save}
                        disabled={!form.first_name || !form.last_name}
                    >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Salary Grade Edit Dialog ─────────────────────────────────────────────────

function SalaryEditDialog({
    employee,
    open,
    onClose,
}: {
    employee: Employee;
    open: boolean;
    onClose: () => void;
}) {
    const sgs = employee.salary_grade_step;
    const [form, setForm] = useState({
        salary_grade_step_id: sgs?.salary_grade_step_id?.toString() ?? '',
    });
    const save = () =>
        router.put(route('employee.update', employee.employee_id), form, {
            preserveScroll: true,
            onSuccess: onClose,
        });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Salary Classification</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div>
                        <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                            Salary Grade Step ID
                        </Label>
                        <Input
                            type="number"
                            value={form.salary_grade_step_id}
                            onChange={(e) =>
                                setForm({
                                    salary_grade_step_id: e.target.value,
                                })
                            }
                            placeholder="Enter salary grade step ID"
                        />
                        {sgs && (
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                Current: SG-{sgs.salary_grade}, Step {sgs.step}{' '}
                                — ₱
                                {Number(sgs.monthly_salary).toLocaleString(
                                    'en-PH',
                                    { minimumFractionDigits: 2 },
                                )}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={save}
                        disabled={!form.salary_grade_step_id}
                    >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Employment Edit Dialog ───────────────────────────────────────────────────

type EditField =
    | 'position'
    | 'date_hired'
    | 'unit_division_department'
    | 'employment_classification'
    | 'date_applied'
    | 'work_schedule'
    | 'break_time'
    | null;

function EmploymentEditDialog({
    employee,
    field,
    onClose,
    items,
}: {
    employee: Employee;
    field: EditField;
    onClose: () => void;
    items: Item[];
}) {
    const open = field !== null;
    const positionGroups = useMemo(() => buildPositionGroups(items), [items]);
    const currentItemId = employee.item?.item_id?.toString() ?? '';
    const currentPositionName = useMemo(() => {
        return (
            items.find((i) => i.item_id.toString() === currentItemId)?.position
                ?.position_name ?? ''
        );
    }, [items, currentItemId]);

    const [form, setForm] = useState({
        item_id: currentItemId,
        selected_position_name: currentPositionName,
        date_hired: toInputDate(employee.date_hired),
        date_applied: toInputDate(employee.date_applied),
        employment_classification: employee.employment_classification ?? '',
        work_schedule_start: toInputTime(employee.work_schedule_start),
        work_schedule_end: toInputTime(employee.work_schedule_end),
        break_start: toInputTime(employee.break_start),
        break_end: toInputTime(employee.break_end),
    });

    const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const handlePositionSelect = (positionName: string) => {
        const grp = positionGroups.find((g) => g.positionName === positionName);
        if (!grp) return;
        const ownSlot = grp.items.find(
            (i) => i.item_id.toString() === currentItemId,
        );
        if (ownSlot) {
            setForm((p) => ({
                ...p,
                selected_position_name: positionName,
                item_id: ownSlot.item_id.toString(),
            }));
            return;
        }
        const firstAvailable = grp.items.find((i) => !i.is_occupied);
        setForm((p) => ({
            ...p,
            selected_position_name: positionName,
            item_id: firstAvailable ? firstAvailable.item_id.toString() : '',
        }));
    };

    const selectedGroup = useMemo(
        () =>
            positionGroups.find(
                (g) => g.positionName === form.selected_position_name,
            ),
        [positionGroups, form.selected_position_name],
    );

    const save = () => {
        let data: Record<string, string> = {};
        if (field === 'position') data = { item_id: form.item_id };
        if (field === 'date_hired') data = { date_hired: form.date_hired };
        if (field === 'date_applied')
            data = { date_applied: form.date_applied };
        if (field === 'employment_classification')
            data = {
                employment_classification: form.employment_classification,
            };
        if (field === 'work_schedule')
            data = {
                work_schedule_start: form.work_schedule_start,
                work_schedule_end: form.work_schedule_end,
            };
        if (field === 'break_time')
            data = { break_start: form.break_start, break_end: form.break_end };
        router.put(route('employee.update', employee.employee_id), data, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const titles: Record<NonNullable<EditField>, string> = {
        position: 'Edit Position',
        date_hired: 'Edit Date Hired',
        unit_division_department: 'Unit / Division / Department',
        employment_classification: 'Edit Employment Classification',
        date_applied: 'Edit Date Applied',
        work_schedule: 'Edit Work Schedule',
        break_time: 'Edit Break Time',
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{field ? titles[field] : ''}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {field === 'position' && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Position
                                </Label>
                                <Select
                                    value={form.selected_position_name}
                                    onValueChange={handlePositionSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a position…" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72">
                                        {positionGroups.map((grp) => {
                                            const employeeIsInGroup =
                                                grp.items.some(
                                                    (i) =>
                                                        i.item_id.toString() ===
                                                        currentItemId,
                                                );
                                            const isDisabled =
                                                grp.isFull &&
                                                !employeeIsInGroup;
                                            return (
                                                <SelectItem
                                                    key={grp.positionName}
                                                    value={grp.positionName}
                                                    disabled={isDisabled}
                                                    className="py-2.5"
                                                >
                                                    <div className="flex w-full items-center justify-between gap-3">
                                                        <span
                                                            className={
                                                                isDisabled
                                                                    ? 'text-muted-foreground/50'
                                                                    : ''
                                                            }
                                                        >
                                                            {grp.positionName}
                                                        </span>
                                                        {grp.totalSlots > 1 &&
                                                            (isDisabled ? (
                                                                <Badge className="bg-destructive/10 text-destructive shrink-0 rounded-md border-0 px-2 py-0.5 text-[10px] font-bold">
                                                                    Full
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-accent text-accent-foreground shrink-0 rounded-md border-0 px-2 py-0.5 text-[10px] font-semibold">
                                                                    {
                                                                        grp.availableSlots
                                                                    }
                                                                    /
                                                                    {
                                                                        grp.totalSlots
                                                                    }{' '}
                                                                    open
                                                                </Badge>
                                                            ))}
                                                        {grp.totalSlots === 1 &&
                                                            isDisabled && (
                                                                <Badge className="bg-destructive/10 text-destructive shrink-0 rounded-md border-0 px-2 py-0.5 text-[10px] font-bold">
                                                                    Full
                                                                </Badge>
                                                            )}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {selectedGroup &&
                                    selectedGroup.totalSlots > 1 && (
                                        <p className="text-muted-foreground mt-1.5 text-xs">
                                            {selectedGroup.availableSlots === 0
                                                ? 'All slots are currently occupied.'
                                                : `${selectedGroup.availableSlots} of ${selectedGroup.totalSlots} slot${selectedGroup.totalSlots > 1 ? 's' : ''} available — a slot will be auto-assigned.`}
                                        </p>
                                    )}
                            </div>
                            {selectedGroup?.position && (
                                <div className="border-border divide-border bg-muted/20 divide-y rounded-lg border">
                                    {selectedGroup.position.department && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-muted-foreground text-xs">
                                                Department
                                            </span>
                                            <span className="text-foreground text-xs font-medium">
                                                {
                                                    selectedGroup.position
                                                        .department
                                                        .department_name
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {selectedGroup.position.division && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-muted-foreground text-xs">
                                                Division
                                            </span>
                                            <span className="text-foreground text-xs font-medium">
                                                {
                                                    selectedGroup.position
                                                        .division.division_name
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {selectedGroup.position.unit && (
                                        <div className="flex justify-between px-4 py-2">
                                            <span className="text-muted-foreground text-xs">
                                                Unit
                                            </span>
                                            <span className="text-foreground text-xs font-medium">
                                                {
                                                    selectedGroup.position.unit
                                                        .unit_name
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {field === 'date_hired' && (
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Date Hired
                            </Label>
                            <Input
                                type="date"
                                value={form.date_hired}
                                onChange={(e) =>
                                    set('date_hired', e.target.value)
                                }
                                autoFocus
                            />
                        </div>
                    )}
                    {field === 'unit_division_department' && (
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">
                                Unit, Division, and Department are determined by
                                the assigned <strong>Position</strong>. To
                                change them, update the Position.
                            </p>
                            <div className="border-border divide-border divide-y rounded-lg border">
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-muted-foreground text-sm">
                                        Unit
                                    </span>
                                    <span className="text-foreground text-sm font-medium">
                                        {employee.item?.position?.unit
                                            ?.unit_name ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-muted-foreground text-sm">
                                        Division
                                    </span>
                                    <span className="text-foreground text-sm font-medium">
                                        {employee.item?.position?.division
                                            ?.division_name ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between px-4 py-2.5">
                                    <span className="text-muted-foreground text-sm">
                                        Department
                                    </span>
                                    <span className="text-foreground text-sm font-medium">
                                        {employee.item?.position?.department
                                            ?.department_name ?? '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {field === 'employment_classification' && (
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Employment Classification
                            </Label>
                            <Select
                                value={form.employment_classification}
                                onValueChange={(v) =>
                                    set('employment_classification', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Regular">
                                        Regular
                                    </SelectItem>
                                    <SelectItem value="Job Order">
                                        Job Order
                                    </SelectItem>
                                    <SelectItem value="Casual">
                                        Casual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {field === 'date_applied' && (
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Date Applied
                            </Label>
                            <Input
                                type="date"
                                value={form.date_applied}
                                onChange={(e) =>
                                    set('date_applied', e.target.value)
                                }
                                autoFocus
                            />
                        </div>
                    )}
                    {field === 'work_schedule' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Start Time
                                </Label>
                                <Input
                                    type="time"
                                    value={form.work_schedule_start}
                                    onChange={(e) =>
                                        set(
                                            'work_schedule_start',
                                            e.target.value,
                                        )
                                    }
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    End Time
                                </Label>
                                <Input
                                    type="time"
                                    value={form.work_schedule_end}
                                    onChange={(e) =>
                                        set('work_schedule_end', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    )}
                    {field === 'break_time' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Break Start
                                </Label>
                                <Input
                                    type="time"
                                    value={form.break_start}
                                    onChange={(e) =>
                                        set('break_start', e.target.value)
                                    }
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Break End
                                </Label>
                                <Input
                                    type="time"
                                    value={form.break_end}
                                    onChange={(e) =>
                                        set('break_end', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {field !== 'unit_division_department' && (
                        <Button
                            onClick={save}
                            disabled={field === 'position' && !form.item_id}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Employment Tab ───────────────────────────────────────────────────────────

function EmploymentDetailsTab({
    employee,
    items,
}: {
    employee: Employee;
    items: Item[];
}) {
    const position = employee.item?.position;
    const [editField, setEditField] = useState<EditField>(null);
    const orgs = employee.internal_organizations ?? [];
    const toggleStatus = () =>
        router.patch(
            route('employee.toggleStatus', employee.employee_id),
            {},
            { preserveScroll: true },
        );

    return (
        <div className="space-y-4 p-3 sm:p-5">
            {/* Responsive grid: 1 col on mobile, 2 on sm, 3 on lg */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailCard
                    title="Position"
                    value={position?.position_name}
                    onEdit={() => setEditField('position')}
                />
                <DetailCard
                    title="Date Hired"
                    value={fmt(employee.date_hired)}
                    onEdit={() => setEditField('date_hired')}
                />
                <DetailCard
                    title="Status"
                    isStatus
                    statusValue={employee.status}
                    onToggleStatus={toggleStatus}
                />
                <DetailCard
                    title="Unit"
                    value={position?.unit?.unit_name}
                    onEdit={() => setEditField('unit_division_department')}
                />
                <DetailCard
                    title="Division"
                    value={position?.division?.division_name}
                    onEdit={() => setEditField('unit_division_department')}
                />
                <DetailCard
                    title="Department"
                    value={position?.department?.department_name}
                    onEdit={() => setEditField('unit_division_department')}
                />
                <DetailCard
                    title="Employment Classification"
                    value={employee.employment_classification}
                    onEdit={() => setEditField('employment_classification')}
                />
                <DetailCard
                    title="Date Applied"
                    value={fmt(employee.date_applied)}
                    onEdit={() => setEditField('date_applied')}
                />
                <DetailCard
                    title="Work Schedule"
                    value={
                        employee.work_schedule_start &&
                        employee.work_schedule_end
                            ? `${employee.work_schedule_start} – ${employee.work_schedule_end}`
                            : undefined
                    }
                    onEdit={() => setEditField('work_schedule')}
                />
                <DetailCard
                    title="Break Time"
                    value={
                        employee.break_start && employee.break_end
                            ? `${employee.break_start} – ${employee.break_end}`
                            : undefined
                    }
                    onEdit={() => setEditField('break_time')}
                />
            </div>

            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Internal Organizations
                    </span>
                </div>
                {orgs.length === 0 ? (
                    <div className="text-muted-foreground px-5 py-6 text-center text-sm italic">
                        Not a member of any internal organization.
                    </div>
                ) : (
                    <div className="divide-border divide-y">
                        {orgs.map((org) => (
                            <div
                                key={org.internal_organization_id}
                                className="flex items-center gap-4 px-4 py-3 sm:px-5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-sm font-medium">
                                        {org.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {org.code}
                                    </p>
                                </div>
                                <Badge className="bg-accent text-accent-foreground shrink-0 rounded-md border-0 px-2.5 py-0.5 text-[10px] font-semibold">
                                    {org.type}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <EmploymentEditDialog
                employee={employee}
                field={editField}
                onClose={() => setEditField(null)}
                items={items}
            />
        </div>
    );
}

// ─── Compensation Tab ─────────────────────────────────────────────────────────

function CompensationTab({ employee }: { employee: Employee }) {
    const sgs = employee.salary_grade_step;
    const allowances = employee.allowances ?? [];
    const [salaryEditOpen, setSalaryEditOpen] = useState(false);

    return (
        <div className="space-y-4 p-3 sm:p-5">
            {/* Stack on mobile, side-by-side on md+ */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="bg-card border-border overflow-hidden rounded-xl border">
                    <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                        <span className="text-foreground text-sm font-bold">
                            Salary Classification
                        </span>
                        <Button
                            onClick={() => setSalaryEditOpen(true)}
                            variant="ghost"
                            size="icon-xs"
                        >
                            <Pen className="h-3 w-3" />
                        </Button>
                    </div>
                    {sgs ? (
                        <div className="divide-border divide-y">
                            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                                <span className="text-muted-foreground text-sm">
                                    Salary Grade
                                </span>
                                <span className="text-foreground text-sm font-bold">
                                    SG-{sgs.salary_grade}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                                <span className="text-muted-foreground text-sm">
                                    Step Number
                                </span>
                                <span className="text-foreground text-sm font-bold">
                                    Step {sgs.step}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                                <span className="text-muted-foreground text-sm">
                                    Amount
                                </span>
                                <span className="text-foreground text-sm font-bold">
                                    ₱
                                    {Number(sgs.monthly_salary).toLocaleString(
                                        'en-PH',
                                        { minimumFractionDigits: 2 },
                                    )}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground px-5 py-8 text-center text-sm italic">
                            No salary data.
                        </div>
                    )}
                </div>

                <div className="bg-card border-border overflow-hidden rounded-xl border">
                    <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                        <span className="text-foreground text-sm font-bold">
                            Allowances
                        </span>
                    </div>
                    {allowances.length > 0 ? (
                        <div className="divide-border divide-y">
                            {allowances.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between px-4 py-3 sm:px-5"
                                >
                                    <span className="text-muted-foreground text-sm">
                                        {a.allowance_type}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground text-sm font-bold">
                                            ₱
                                            {Number(a.amount).toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </span>
                                        <Badge className="bg-accent text-accent-foreground rounded-md border-0 px-2 py-0.5 text-[10px] font-semibold">
                                            Present
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground px-5 py-8 text-center text-sm italic">
                            No allowances on file.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Payroll Data
                    </span>
                </div>
                <div className="text-muted-foreground px-5 py-8 text-center text-sm italic">
                    No payroll data available.
                </div>
            </div>

            <SalaryEditDialog
                employee={employee}
                open={salaryEditOpen}
                onClose={() => setSalaryEditOpen(false)}
            />
        </div>
    );
}

// ─── Leave Information Tab ────────────────────────────────────────────────────

function LeaveInformationTab({ employee }: { employee: Employee }) {
    const balances = employee.leave_balances ?? [];
    const availments = employee.leave_availments ?? [];

    const [balanceDialog, setBalanceDialog] = useState<{
        open: boolean;
        id?: number;
        leave_type: string;
        remaining: string;
        used: string;
    }>({ open: false, leave_type: '', remaining: '', used: '' });
    const [deleteBalanceId, setDeleteBalanceId] = useState<number | null>(null);

    const openBalanceDialog = (b?: LeaveBalance) =>
        setBalanceDialog({
            open: true,
            id: b?.id,
            leave_type: b?.leave_type ?? '',
            remaining: b?.remaining?.toString() ?? '',
            used: b?.used?.toString() ?? '',
        });

    const saveBalance = () => {
        const data = {
            leave_type: balanceDialog.leave_type,
            remaining: parseFloat(balanceDialog.remaining),
            used: parseFloat(balanceDialog.used),
        };
        if (balanceDialog.id) {
            router.put(
                route('employee.leave-balance.update', {
                    employee: employee.employee_id,
                    balance: balanceDialog.id,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setBalanceDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.leave-balance.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setBalanceDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };

    const confirmDeleteBalance = () => {
        if (!deleteBalanceId) return;
        router.delete(
            route('employee.leave-balance.destroy', {
                employee: employee.employee_id,
                balance: deleteBalanceId,
            }),
            { preserveScroll: true, onSuccess: () => setDeleteBalanceId(null) },
        );
    };

    return (
        <div className="space-y-5 p-3 sm:p-5">
            {/* Leave Balances */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Leave Balances
                    </span>
                    <button
                        onClick={() => openBalanceDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {balances.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No leave balances on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBalanceDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Leave Balance
                        </Button>
                    </div>
                ) : (
                    /* Horizontal scroll on small screens */
                    <div className="overflow-x-auto">
                        <div className="min-w-[480px]">
                            <div className="border-border bg-muted/30 grid grid-cols-[auto_1fr_120px_120px_80px] items-center gap-2 border-b px-5 py-2.5">
                                <div className="w-5" />
                                <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                                    Leave Type <ChevronUp className="h-3 w-3" />
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Remaining
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Used
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Actions
                                </span>
                            </div>
                            <div className="divide-border divide-y">
                                {balances.map((b) => (
                                    <div
                                        key={b.id}
                                        className="hover:bg-muted/20 group/row grid grid-cols-[auto_1fr_120px_120px_80px] items-center gap-2 px-5 py-3 transition-colors"
                                    >
                                        <Checkbox className="h-4 w-4" />
                                        <span className="text-muted-foreground text-sm">
                                            {b.leave_type}
                                        </span>
                                        <span className="text-foreground text-right text-sm font-medium">
                                            {b.remaining}
                                        </span>
                                        <span className="text-foreground text-right text-sm font-medium">
                                            {b.used}
                                        </span>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                onClick={() =>
                                                    openBalanceDialog(b)
                                                }
                                                variant="ghost"
                                                size="icon-xs"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    setDeleteBalanceId(b.id)
                                                }
                                                variant="ghost"
                                                size="icon-xs"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Leave Availments */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Leave Availments
                    </span>
                    <button className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {availments.length === 0 ? (
                    <div className="text-muted-foreground px-5 py-8 text-center text-sm italic">
                        No leave availments on record.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            <div className="border-border bg-muted/30 grid grid-cols-[auto_auto_1fr_1fr_100px_110px_100px] items-center gap-2 border-b px-5 py-2.5">
                                <div className="w-5" />
                                <div className="w-8" />
                                <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                                    Leave Type <ChevronUp className="h-3 w-3" />
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                                    Leave Date <ChevronUp className="h-3 w-3" />
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Duration
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                                    Date Filed <ChevronUp className="h-3 w-3" />
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                                    Status <ChevronUp className="h-3 w-3" />
                                </span>
                            </div>
                            <div className="divide-border divide-y">
                                {availments.map((a) => (
                                    <div
                                        key={a.id}
                                        className="hover:bg-muted/20 grid grid-cols-[auto_auto_1fr_1fr_100px_110px_100px] items-center gap-2 px-5 py-3 transition-colors"
                                    >
                                        <Checkbox className="h-4 w-4" />
                                        <div className="bg-muted border-border h-8 w-8 shrink-0 overflow-hidden rounded-full border">
                                            <img
                                                src={
                                                    a.employee_avatar ??
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(a.employee_name)}&background=5854cc&color=fff&size=32`
                                                }
                                                alt={a.employee_name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">
                                                {a.employee_name}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {a.leave_type}
                                            </p>
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {fmtShort(a.leave_date_start)} —{' '}
                                            {fmtShort(a.leave_date_end)}
                                        </span>
                                        <span className="text-foreground text-sm font-medium">
                                            {a.duration} days
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {fmtShort(a.date_filed)}
                                        </span>
                                        <Badge
                                            className={`w-fit rounded-full border-0 px-2.5 py-0.5 text-[10px] font-bold ${
                                                a.status === 'Approved'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                                    : a.status === 'Pending'
                                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                                      : 'bg-destructive/10 text-destructive'
                                            }`}
                                        >
                                            ● {a.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog
                open={balanceDialog.open}
                onOpenChange={(open) =>
                    setBalanceDialog((p) => ({ ...p, open }))
                }
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {balanceDialog.id ? 'Edit' : 'Add'} Leave Balance
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Leave Type
                            </Label>
                            <Select
                                value={balanceDialog.leave_type}
                                onValueChange={(v) =>
                                    setBalanceDialog((p) => ({
                                        ...p,
                                        leave_type: v,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        'Vacation Leave',
                                        'Sick Leave',
                                        'Special Leave',
                                        'Bereavement Leave',
                                        'Maternity/Paternity Leave',
                                        'Privilege Leave',
                                    ].map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Remaining
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={balanceDialog.remaining}
                                    onChange={(e) =>
                                        setBalanceDialog((p) => ({
                                            ...p,
                                            remaining: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Used
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={balanceDialog.used}
                                    onChange={(e) =>
                                        setBalanceDialog((p) => ({
                                            ...p,
                                            used: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setBalanceDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveBalance}
                            disabled={!balanceDialog.leave_type}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!deleteBalanceId}
                onOpenChange={(open) => !open && setDeleteBalanceId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Leave Balance
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this leave balance?
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteBalance}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Government & Eligibility Tab ─────────────────────────────────────────────

const STANDARD_GOV_ID_TYPES = ['GSIS', 'PhilHealth', 'Pag-IBIG', 'TIN'];

function GovernmentEligibilityTab({ employee }: { employee: Employee }) {
    const govAccounts = employee.government_accounts ?? [];
    const eligibilities = employee.eligibility_information ?? [];

    const [visibleIds, setVisibleIds] = useState<Record<string, boolean>>({});
    const toggleVisibility = (key: string) =>
        setVisibleIds((prev) => ({ ...prev, [key]: !prev[key] }));

    const [govDialog, setGovDialog] = useState<{
        open: boolean;
        mode: 'standard' | 'custom';
        type: string;
        id?: number;
        value: string;
        customTypeName: string;
    }>({
        open: false,
        mode: 'standard',
        type: '',
        value: '',
        customTypeName: '',
    });

    const openEditGovDialog = (type: string, existing: GovernmentAccount) =>
        setGovDialog({
            open: true,
            mode: 'standard',
            type,
            id: existing.government_account_id,
            value: existing.account_number,
            customTypeName: '',
        });

    const openAddCustomDialog = () =>
        setGovDialog({
            open: true,
            mode: 'custom',
            type: '',
            id: undefined,
            value: '',
            customTypeName: '',
        });

    const saveGovAccount = () => {
        if (!govDialog.value.trim()) return;
        const accountType =
            govDialog.mode === 'custom'
                ? govDialog.customTypeName
                : govDialog.type;
        if (!accountType.trim()) return;

        if (govDialog.id) {
            router.put(
                route('employee.government-account.update', {
                    employee: employee.employee_id,
                    account: govDialog.id,
                }),
                { account_number: govDialog.value },
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setGovDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route(
                    'employee.government-account.store',
                    employee.employee_id,
                ),
                { account_type: accountType, account_number: govDialog.value },
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setGovDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };

    const accountMap = Object.fromEntries(
        govAccounts.map((g) => [g.account_type.toLowerCase(), g]),
    );
    const standardKeys = STANDARD_GOV_ID_TYPES.map((t) => t.toLowerCase());
    const extraAccounts = govAccounts.filter(
        (g) => !standardKeys.includes(g.account_type.toLowerCase()),
    );

    const [eligDialog, setEligDialog] = useState<{
        open: boolean;
        id?: number;
        name: string;
        year: string;
    }>({ open: false, name: '', year: '' });

    const openEligDialog = (existing?: EligibilityInfo) =>
        setEligDialog({
            open: true,
            id: existing?.eligibility_information_id,
            name: existing?.eligibility_name ?? '',
            year: existing?.year_passed?.slice(0, 10) ?? '',
        });

    const saveEligibility = () => {
        if (!eligDialog.name.trim()) return;
        const data = {
            eligibility_name: eligDialog.name,
            year_passed: eligDialog.year || null,
        };
        if (eligDialog.id) {
            router.put(
                route('employee.eligibility.update', {
                    employee: employee.employee_id,
                    eligibility: eligDialog.id,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setEligDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.eligibility.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setEligDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };

    return (
        <div className="space-y-5 p-3 sm:p-5">
            {/* Government IDs */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Government ID Numbers
                    </span>
                    <button
                        onClick={openAddCustomDialog}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="divide-border divide-y">
                    {STANDARD_GOV_ID_TYPES.map((type) => {
                        const key = type.toLowerCase();
                        const account = accountMap[key];
                        const isVisible = visibleIds[key];
                        return (
                            <div
                                key={type}
                                className="flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5"
                            >
                                <span className="text-foreground w-20 shrink-0 text-sm font-medium sm:w-28">
                                    {type}
                                </span>
                                <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-sm tracking-widest">
                                    {account ? (
                                        isVisible ? (
                                            account.account_number
                                        ) : (
                                            '•'.repeat(10)
                                        )
                                    ) : (
                                        <span className="text-muted-foreground/40 font-sans text-xs italic tracking-normal">
                                            Not provided
                                        </span>
                                    )}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                    {account ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    toggleVisibility(key)
                                                }
                                                className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                            >
                                                {isVisible ? (
                                                    <EyeOff className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Eye className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <Button
                                                onClick={() =>
                                                    openEditGovDialog(
                                                        type,
                                                        account,
                                                    )
                                                }
                                                variant={'ghost'}
                                                size={'icon-xs'}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                setGovDialog({
                                                    open: true,
                                                    mode: 'standard',
                                                    type,
                                                    id: undefined,
                                                    value: '',
                                                    customTypeName: '',
                                                })
                                            }
                                            variant={'ghost'}
                                            size={'icon-xs'}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {extraAccounts.map((account) => {
                        const key = account.account_type.toLowerCase();
                        const isVisible = visibleIds[key];
                        return (
                            <div
                                key={account.government_account_id}
                                className="flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5"
                            >
                                <span className="text-foreground w-20 shrink-0 text-sm font-medium sm:w-28">
                                    {account.account_type}
                                </span>
                                <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-sm tracking-widest">
                                    {isVisible
                                        ? account.account_number
                                        : '•'.repeat(10)}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => toggleVisibility(key)}
                                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                    >
                                        {isVisible ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <Button
                                        onClick={() =>
                                            openEditGovDialog(
                                                account.account_type,
                                                account,
                                            )
                                        }
                                        variant="ghost"
                                        size="icon-xs"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Eligibility */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Eligibility and Credentials
                    </span>
                    <button
                        onClick={() => openEligDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {eligibilities.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No eligibility records on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEligDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Eligibility
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[480px]">
                            <div className="divide-border divide-y">
                                {eligibilities.map((e) => (
                                    <div
                                        key={e.eligibility_information_id}
                                        className="flex items-center gap-4 px-5 py-3"
                                    >
                                        <span className="text-foreground flex-1 text-sm font-medium">
                                            {e.eligibility_name}
                                        </span>
                                        <span className="text-muted-foreground w-36 shrink-0 text-right text-sm">
                                            {e.year_passed
                                                ? fmt(e.year_passed)
                                                : '—'}
                                        </span>
                                        <Badge className="shrink-0 rounded-md border-0 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                            ✓ Active
                                        </Badge>
                                        <Button
                                            onClick={() => openEligDialog(e)}
                                            variant={'ghost'}
                                            size={'icon-xs'}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog
                open={govDialog.open}
                onOpenChange={(open) => setGovDialog((p) => ({ ...p, open }))}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {govDialog.id
                                ? `Edit ${govDialog.type} Number`
                                : govDialog.mode === 'custom'
                                  ? 'Add Government ID'
                                  : `Add ${govDialog.type} Number`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {govDialog.mode === 'custom' && !govDialog.id && (
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    ID Type / Name
                                </Label>
                                <Input
                                    value={govDialog.customTypeName}
                                    onChange={(e) =>
                                        setGovDialog((p) => ({
                                            ...p,
                                            customTypeName: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. GSIS, Voter's ID…"
                                    autoFocus
                                />
                            </div>
                        )}
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Account / ID Number
                            </Label>
                            <Input
                                value={govDialog.value}
                                onChange={(e) =>
                                    setGovDialog((p) => ({
                                        ...p,
                                        value: e.target.value,
                                    }))
                                }
                                placeholder={`Enter ${govDialog.mode === 'custom' ? govDialog.customTypeName || 'ID' : govDialog.type} number`}
                                className="font-mono"
                                autoFocus={govDialog.mode !== 'custom'}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && saveGovAccount()
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setGovDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveGovAccount}
                            disabled={
                                !govDialog.value.trim() ||
                                (govDialog.mode === 'custom' &&
                                    !govDialog.id &&
                                    !govDialog.customTypeName.trim())
                            }
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={eligDialog.open}
                onOpenChange={(open) => setEligDialog((p) => ({ ...p, open }))}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {eligDialog.id ? 'Edit' : 'Add'} Eligibility
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Eligibility Name
                            </Label>
                            <Input
                                value={eligDialog.name}
                                onChange={(e) =>
                                    setEligDialog((p) => ({
                                        ...p,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Career Service Professional"
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Year Passed
                            </Label>
                            <Input
                                type="date"
                                value={eligDialog.year}
                                onChange={(e) =>
                                    setEligDialog((p) => ({
                                        ...p,
                                        year: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setEligDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveEligibility}
                            disabled={!eligDialog.name.trim()}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Background Information Tab ───────────────────────────────────────────────

function BackgroundInformationTab({ employee }: { employee: Employee }) {
    const basic = employee.basic_info;
    const familyMembers = basic?.family_info ?? [];
    const educations = basic?.educations ?? [];
    const seminars = employee.seminarsAndTrainings ?? [];
    const serviceRecs = employee.serviceRecords ?? [];

    const [familyDialog, setFamilyDialog] = useState<{
        open: boolean;
        index?: number;
        full_name: string;
        relationship: string;
        contact_number: string;
        sex: string;
        date_of_birth: string;
        place_of_birth: string;
    }>({
        open: false,
        full_name: '',
        relationship: '',
        contact_number: '',
        sex: '',
        date_of_birth: '',
        place_of_birth: '',
    });
    const [deleteFamilyIndex, setDeleteFamilyIndex] = useState<number | null>(
        null,
    );

    const openFamilyDialog = (member?: FamilyMember, index?: number) =>
        setFamilyDialog({
            open: true,
            index,
            full_name: member?.full_name ?? '',
            relationship: member?.relationship ?? '',
            contact_number: member?.contact_number ?? '',
            sex: member?.sex !== undefined ? String(Number(member.sex)) : '',
            date_of_birth: toInputDate(member?.date_of_birth),
            place_of_birth: member?.place_of_birth ?? '',
        });

    const saveFamilyMember = () => {
        const data = {
            full_name: familyDialog.full_name,
            relationship: familyDialog.relationship,
            contact_number: familyDialog.contact_number,
            sex: familyDialog.sex,
            date_of_birth: familyDialog.date_of_birth || null,
            place_of_birth: familyDialog.place_of_birth,
        };
        if (familyDialog.index !== undefined) {
            router.put(
                route('employee.family.update', {
                    employee: employee.employee_id,
                    index: familyDialog.index,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setFamilyDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.family.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setFamilyDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };
    const confirmDeleteFamily = () => {
        if (deleteFamilyIndex === null) return;
        router.delete(
            route('employee.family.destroy', {
                employee: employee.employee_id,
                index: deleteFamilyIndex,
            }),
            {
                preserveScroll: true,
                onSuccess: () => setDeleteFamilyIndex(null),
            },
        );
    };

    const [educDialog, setEducDialog] = useState<{
        open: boolean;
        index?: number;
        level: string;
        school_name: string;
        school_address: string;
        degree: string;
        graduation_date: string;
    }>({
        open: false,
        level: '',
        school_name: '',
        school_address: '',
        degree: '',
        graduation_date: '',
    });
    const [deleteEducIndex, setDeleteEducIndex] = useState<number | null>(null);

    const openEducDialog = (edu?: Education, index?: number) =>
        setEducDialog({
            open: true,
            index,
            level: edu?.level ?? '',
            school_name: edu?.school_name ?? '',
            school_address: edu?.school_address ?? '',
            degree: edu?.degree ?? '',
            graduation_date: toInputDate(edu?.graduation_date),
        });

    const saveEducation = () => {
        const data = {
            level: educDialog.level,
            school_name: educDialog.school_name,
            school_address: educDialog.school_address,
            degree: educDialog.degree,
            graduation_date: educDialog.graduation_date || null,
        };
        if (educDialog.index !== undefined) {
            router.put(
                route('employee.education.update', {
                    employee: employee.employee_id,
                    index: educDialog.index,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setEducDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.education.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setEducDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };
    const confirmDeleteEduc = () => {
        if (deleteEducIndex === null) return;
        router.delete(
            route('employee.education.destroy', {
                employee: employee.employee_id,
                index: deleteEducIndex,
            }),
            { preserveScroll: true, onSuccess: () => setDeleteEducIndex(null) },
        );
    };

    const educByLevel = educations.reduce<Record<string, Education[]>>(
        (acc, edu) => {
            const key = edu.level ?? 'Other';
            if (!acc[key]) acc[key] = [];
            acc[key].push(edu);
            return acc;
        },
        {},
    );

    const [seminarDialog, setSeminarDialog] = useState<{
        open: boolean;
        id?: number;
        seminar_name: string;
        venue: string;
        date_attended: string;
    }>({ open: false, seminar_name: '', venue: '', date_attended: '' });
    const [deleteSeminarId, setDeleteSeminarId] = useState<number | null>(null);

    const openSeminarDialog = (s?: SeminarTraining) =>
        setSeminarDialog({
            open: true,
            id: s?.id,
            seminar_name: s?.seminar_name ?? '',
            venue: s?.venue ?? '',
            date_attended: toInputDate(s?.date_attended),
        });

    const saveSeminar = () => {
        const data = {
            seminar_name: seminarDialog.seminar_name,
            venue: seminarDialog.venue,
            date_attended: seminarDialog.date_attended || null,
        };
        if (seminarDialog.id) {
            router.put(
                route('employee.seminar.update', {
                    employee: employee.employee_id,
                    seminar: seminarDialog.id,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setSeminarDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.seminar.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setSeminarDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };
    const confirmDeleteSeminar = () => {
        if (!deleteSeminarId) return;
        router.delete(
            route('employee.seminar.destroy', {
                employee: employee.employee_id,
                seminar: deleteSeminarId,
            }),
            { preserveScroll: true, onSuccess: () => setDeleteSeminarId(null) },
        );
    };

    const [serviceDialog, setServiceDialog] = useState<{
        open: boolean;
        id?: number;
        position_name: string;
        department_name: string;
        year_start: string;
        year_end: string;
    }>({
        open: false,
        position_name: '',
        department_name: '',
        year_start: '',
        year_end: '',
    });
    const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null);

    const openServiceDialog = (s?: ServiceRecord) =>
        setServiceDialog({
            open: true,
            id: s?.id,
            position_name: s?.position_name ?? '',
            department_name: s?.department_name ?? '',
            year_start: s?.year_start ?? '',
            year_end: s?.year_end ?? '',
        });

    const saveServiceRecord = () => {
        const data = {
            position_name: serviceDialog.position_name,
            department_name: serviceDialog.department_name,
            year_start: serviceDialog.year_start,
            year_end: serviceDialog.year_end,
        };
        if (serviceDialog.id) {
            router.put(
                route('employee.service-record.update', {
                    employee: employee.employee_id,
                    record: serviceDialog.id,
                }),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setServiceDialog((p) => ({ ...p, open: false })),
                },
            );
        } else {
            router.post(
                route('employee.service-record.store', employee.employee_id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        setServiceDialog((p) => ({ ...p, open: false })),
                },
            );
        }
    };
    const confirmDeleteService = () => {
        if (!deleteServiceId) return;
        router.delete(
            route('employee.service-record.destroy', {
                employee: employee.employee_id,
                record: deleteServiceId,
            }),
            { preserveScroll: true, onSuccess: () => setDeleteServiceId(null) },
        );
    };

    return (
        <div className="space-y-5 p-3 sm:p-5">
            {/* Family Information */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Family Information
                    </span>
                    <button
                        onClick={() => openFamilyDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {familyMembers.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No family information on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFamilyDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Family Member
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[640px]">
                            <div className="border-border bg-muted/30 grid grid-cols-[auto_1fr_1fr_80px_140px_1fr_80px] items-center gap-3 border-b px-5 py-2.5">
                                <div className="w-4" />
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Full Name
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Relationship
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Sex
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Date of Birth
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Place of Birth
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Actions
                                </span>
                            </div>
                            <div className="divide-border divide-y">
                                {familyMembers.map((member, i) => (
                                    <div
                                        key={i}
                                        className="hover:bg-muted/20 grid grid-cols-[auto_1fr_1fr_80px_140px_1fr_80px] items-center gap-3 px-5 py-3 transition-colors"
                                    >
                                        <Checkbox className="h-4 w-4" />
                                        <span className="text-foreground truncate text-sm font-medium">
                                            {member.full_name}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {member.relationship ?? '—'}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {member.sex !== undefined
                                                ? member.sex
                                                    ? 'Male'
                                                    : 'Female'
                                                : '—'}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {member.date_of_birth
                                                ? fmtShort(member.date_of_birth)
                                                : '—'}
                                        </span>
                                        <span className="text-muted-foreground truncate text-sm">
                                            {member.place_of_birth ?? '—'}
                                        </span>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() =>
                                                    openFamilyDialog(member, i)
                                                }
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    setDeleteFamilyIndex(i)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Educational Background */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Educational Background
                    </span>
                    <button
                        onClick={() => openEducDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {educations.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No educational records on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEducDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Education
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[580px]">
                            {Object.entries(educByLevel).map(
                                ([level, edus]) => (
                                    <div key={level}>
                                        <div className="bg-muted/30 border-border border-y px-5 py-2">
                                            <span className="text-muted-foreground text-xs font-semibold">
                                                {level}
                                            </span>
                                        </div>
                                        <div className="divide-border divide-y">
                                            {edus.map((edu, i) => {
                                                const globalIndex =
                                                    educations.indexOf(edu);
                                                return (
                                                    <div
                                                        key={i}
                                                        className="hover:bg-muted/20 grid grid-cols-[auto_1fr_1fr_1fr_80px_80px] items-center gap-3 px-5 py-3 transition-colors"
                                                    >
                                                        <Checkbox className="h-4 w-4" />
                                                        <span className="text-foreground text-sm font-medium">
                                                            {edu.school_name}
                                                        </span>
                                                        <span className="text-muted-foreground text-sm">
                                                            {edu.school_address ??
                                                                '—'}
                                                        </span>
                                                        <span className="text-muted-foreground text-sm">
                                                            {edu.degree ?? '—'}
                                                        </span>
                                                        <span className="text-muted-foreground text-right text-sm">
                                                            {edu.graduation_date
                                                                ? new Date(
                                                                      edu.graduation_date,
                                                                  ).getFullYear()
                                                                : '—'}
                                                        </span>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                onClick={() =>
                                                                    openEducDialog(
                                                                        edu,
                                                                        globalIndex,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() =>
                                                                    setDeleteEducIndex(
                                                                        globalIndex,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Seminars and Trainings */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Seminars and Trainings
                    </span>
                    <button
                        onClick={() => openSeminarDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {seminars.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No seminars or trainings on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSeminarDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Seminar
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[520px]">
                            <div className="border-border bg-muted/30 grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 border-b px-5 py-2.5">
                                <div className="w-4" />
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Seminar / Training
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Organizer
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Date Attended
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Actions
                                </span>
                            </div>
                            <div className="divide-border divide-y">
                                {seminars.map((s) => (
                                    <div
                                        key={s.id}
                                        className="hover:bg-muted/20 grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 px-5 py-3 transition-colors"
                                    >
                                        <Checkbox className="h-4 w-4" />
                                        <span className="text-foreground text-sm font-medium">
                                            {s.seminar_name}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {s.venue ?? '—'}
                                        </span>
                                        <span className="text-muted-foreground text-right text-sm">
                                            {fmtShort(s.date_attended)}
                                        </span>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() =>
                                                    openSeminarDialog(s)
                                                }
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    setDeleteSeminarId(s.id)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Service Records */}
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <span className="text-foreground text-sm font-bold">
                        Service Records
                    </span>
                    <button
                        onClick={() => openServiceDialog()}
                        className="hover:bg-accent text-muted-foreground hover:text-primary flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {serviceRecs.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm italic">
                            No service records on file.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openServiceDialog()}
                            className="gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Service Record
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[480px]">
                            <div className="border-border bg-muted/30 grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 border-b px-5 py-2.5">
                                <div className="w-4" />
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Position
                                </span>
                                <span className="text-muted-foreground text-xs font-semibold">
                                    Department
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Duration
                                </span>
                                <span className="text-muted-foreground text-right text-xs font-semibold">
                                    Actions
                                </span>
                            </div>
                            <div className="divide-border divide-y">
                                {serviceRecs.map((s) => (
                                    <div
                                        key={s.id}
                                        className="hover:bg-muted/20 grid grid-cols-[auto_1fr_1fr_160px_80px] items-center gap-3 px-5 py-3 transition-colors"
                                    >
                                        <Checkbox className="h-4 w-4" />
                                        <span className="text-foreground text-sm font-medium">
                                            {s.position_name}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {s.department_name ?? '—'}
                                        </span>
                                        <span className="text-muted-foreground text-right text-sm">
                                            {s.year_start && s.year_end
                                                ? `${s.year_start}–${s.year_end}`
                                                : (s.year_start ?? '—')}
                                        </span>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() =>
                                                    openServiceDialog(s)
                                                }
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    setDeleteServiceId(s.id)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <Dialog
                open={familyDialog.open}
                onOpenChange={(o) =>
                    setFamilyDialog((p) => ({ ...p, open: o }))
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {familyDialog.index !== undefined ? 'Edit' : 'Add'}{' '}
                            Family Member
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Full Name *
                            </Label>
                            <Input
                                value={familyDialog.full_name}
                                onChange={(e) =>
                                    setFamilyDialog((p) => ({
                                        ...p,
                                        full_name: e.target.value,
                                    }))
                                }
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Relationship
                                </Label>
                                <Select
                                    value={familyDialog.relationship}
                                    onValueChange={(v) =>
                                        setFamilyDialog((p) => ({
                                            ...p,
                                            relationship: v,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            'Spouse',
                                            'Child',
                                            'Parent',
                                            'Sibling',
                                            'Guardian',
                                            'Other',
                                        ].map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Sex
                                </Label>
                                <Select
                                    value={familyDialog.sex}
                                    onValueChange={(v) =>
                                        setFamilyDialog((p) => ({
                                            ...p,
                                            sex: v,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Male</SelectItem>
                                        <SelectItem value="0">
                                            Female
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Date of Birth
                                </Label>
                                <Input
                                    type="date"
                                    value={familyDialog.date_of_birth}
                                    onChange={(e) =>
                                        setFamilyDialog((p) => ({
                                            ...p,
                                            date_of_birth: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Contact Number
                                </Label>
                                <Input
                                    value={familyDialog.contact_number}
                                    onChange={(e) =>
                                        setFamilyDialog((p) => ({
                                            ...p,
                                            contact_number: e.target.value,
                                        }))
                                    }
                                    placeholder="09XXXXXXXXXX"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Place of Birth
                            </Label>
                            <Input
                                value={familyDialog.place_of_birth}
                                onChange={(e) =>
                                    setFamilyDialog((p) => ({
                                        ...p,
                                        place_of_birth: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Manila, Philippines"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setFamilyDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveFamilyMember}
                            disabled={!familyDialog.full_name.trim()}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={educDialog.open}
                onOpenChange={(o) => setEducDialog((p) => ({ ...p, open: o }))}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {educDialog.index !== undefined ? 'Edit' : 'Add'}{' '}
                            Education
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Education Level
                            </Label>
                            <Select
                                value={educDialog.level}
                                onValueChange={(v) =>
                                    setEducDialog((p) => ({ ...p, level: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        'Elementary Education',
                                        'Secondary Education',
                                        'Vocational / Technical',
                                        "Bachelor's Degree",
                                        "Master's Degree",
                                        'Doctorate',
                                        'Other',
                                    ].map((l) => (
                                        <SelectItem key={l} value={l}>
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                School Name *
                            </Label>
                            <Input
                                value={educDialog.school_name}
                                onChange={(e) =>
                                    setEducDialog((p) => ({
                                        ...p,
                                        school_name: e.target.value,
                                    }))
                                }
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                School Address
                            </Label>
                            <Input
                                value={educDialog.school_address}
                                onChange={(e) =>
                                    setEducDialog((p) => ({
                                        ...p,
                                        school_address: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Degree / Course
                                </Label>
                                <Input
                                    value={educDialog.degree}
                                    onChange={(e) =>
                                        setEducDialog((p) => ({
                                            ...p,
                                            degree: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Graduation Date
                                </Label>
                                <Input
                                    type="date"
                                    value={educDialog.graduation_date}
                                    onChange={(e) =>
                                        setEducDialog((p) => ({
                                            ...p,
                                            graduation_date: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setEducDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveEducation}
                            disabled={!educDialog.school_name.trim()}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={seminarDialog.open}
                onOpenChange={(o) =>
                    setSeminarDialog((p) => ({ ...p, open: o }))
                }
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {seminarDialog.id ? 'Edit' : 'Add'} Seminar /
                            Training
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Seminar / Training Name *
                            </Label>
                            <Input
                                value={seminarDialog.seminar_name}
                                onChange={(e) =>
                                    setSeminarDialog((p) => ({
                                        ...p,
                                        seminar_name: e.target.value,
                                    }))
                                }
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Organizer
                            </Label>
                            <Input
                                value={seminarDialog.venue}
                                onChange={(e) =>
                                    setSeminarDialog((p) => ({
                                        ...p,
                                        venue: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Date Attended
                            </Label>
                            <Input
                                type="date"
                                value={seminarDialog.date_attended}
                                onChange={(e) =>
                                    setSeminarDialog((p) => ({
                                        ...p,
                                        date_attended: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setSeminarDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveSeminar}
                            disabled={!seminarDialog.seminar_name.trim()}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={serviceDialog.open}
                onOpenChange={(o) =>
                    setServiceDialog((p) => ({ ...p, open: o }))
                }
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {serviceDialog.id ? 'Edit' : 'Add'} Service Record
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Position Name *
                            </Label>
                            <Input
                                value={serviceDialog.position_name}
                                onChange={(e) =>
                                    setServiceDialog((p) => ({
                                        ...p,
                                        position_name: e.target.value,
                                    }))
                                }
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                Department
                            </Label>
                            <Input
                                value={serviceDialog.department_name}
                                onChange={(e) =>
                                    setServiceDialog((p) => ({
                                        ...p,
                                        department_name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Year Start
                                </Label>
                                <Input
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    placeholder="e.g. 2020"
                                    value={serviceDialog.year_start}
                                    onChange={(e) =>
                                        setServiceDialog((p) => ({
                                            ...p,
                                            year_start: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1.5 block text-xs uppercase tracking-widest">
                                    Year End
                                </Label>
                                <Input
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    placeholder="e.g. 2026"
                                    value={serviceDialog.year_end}
                                    onChange={(e) =>
                                        setServiceDialog((p) => ({
                                            ...p,
                                            year_end: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setServiceDialog((p) => ({ ...p, open: false }))
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveServiceRecord}
                            disabled={!serviceDialog.position_name.trim()}
                        >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {[
                {
                    open: deleteFamilyIndex !== null,
                    onClose: () => setDeleteFamilyIndex(null),
                    onConfirm: confirmDeleteFamily,
                    label: 'family member',
                },
                {
                    open: deleteEducIndex !== null,
                    onClose: () => setDeleteEducIndex(null),
                    onConfirm: confirmDeleteEduc,
                    label: 'education record',
                },
                {
                    open: !!deleteSeminarId,
                    onClose: () => setDeleteSeminarId(null),
                    onConfirm: confirmDeleteSeminar,
                    label: 'seminar',
                },
                {
                    open: !!deleteServiceId,
                    onClose: () => setDeleteServiceId(null),
                    onConfirm: confirmDeleteService,
                    label: 'service record',
                },
            ].map(({ open, onClose, onConfirm, label }) => (
                <AlertDialog
                    key={label}
                    open={open}
                    onOpenChange={(o) => !o && onClose()}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onConfirm}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ))}
        </div>
    );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, { icon: string; color: string; bg: string }> =
    {
        pdf: {
            icon: 'PDF',
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-950/40',
        },
        doc: {
            icon: 'DOC',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
        },
        docx: {
            icon: 'DOCX',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
        },
        xls: {
            icon: 'XLS',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        },
        xlsx: {
            icon: 'XLSX',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        },
        png: {
            icon: 'PNG',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/40',
        },
        jpg: {
            icon: 'JPG',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/40',
        },
        jpeg: {
            icon: 'JPEG',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/40',
        },
        txt: { icon: 'TXT', color: 'text-muted-foreground', bg: 'bg-muted' },
        zip: {
            icon: 'ZIP',
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/40',
        },
    };

function getFileExt(name: string) {
    return name.split('.').pop()?.toLowerCase() ?? '';
}

function getFileIcon(name: string) {
    const ext = getFileExt(name);
    return (
        FILE_ICONS[ext] ?? {
            icon: ext.toUpperCase() || 'FILE',
            color: 'text-muted-foreground',
            bg: 'bg-muted',
        }
    );
}

function isViewable(name: string) {
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt'].includes(
        getFileExt(name),
    );
}

function isImage(name: string) {
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(getFileExt(name));
}

function DocumentsTab({ employee }: { employee: Employee }) {
    const uploadedFiles = employee.uploadedFiles ?? [];
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null);
    const [viewFile, setViewFile] = useState<UploadedFile | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setUploadError(
                `File is too large. Maximum size is 25 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
            );
            e.target.value = '';
            return;
        }

        setUploadError(null);
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        router.post(
            route('employee.file.store', employee.employee_id),
            formData,
            {
                preserveScroll: true,
                onFinish: () => setUploading(false),
                onError: () => {
                    setUploadError('Upload failed. Please try again.');
                    setUploading(false);
                },
            },
        );
        e.target.value = '';
    };

    const confirmDeleteFile = () => {
        if (!deleteFileId) return;
        router.delete(
            route('employee.file.destroy', {
                employee: employee.employee_id,
                file: deleteFileId,
            }),
            { preserveScroll: true, onSuccess: () => setDeleteFileId(null) },
        );
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="space-y-4 p-3 sm:p-5">
            <div className="bg-card border-border overflow-hidden rounded-xl border">
                {/* ── Header ── */}
                <div className="border-border flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-bold">
                            Uploaded Files
                        </span>
                        {uploadedFiles.length > 0 && (
                            <Badge className="bg-accent text-accent-foreground rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold">
                                {uploadedFiles.length}
                            </Badge>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        title="Upload file"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>

                {/* ── Upload error ── */}
                {uploadError && (
                    <div className="bg-destructive/10 border-destructive/20 mx-4 mt-3 flex items-start gap-2.5 rounded-lg border px-4 py-3 sm:mx-5">
                        <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-destructive text-sm leading-snug">
                                {uploadError}
                            </p>
                        </div>
                        <button
                            onClick={() => setUploadError(null)}
                            className="text-destructive/60 hover:text-destructive shrink-0 transition-colors"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* ── Size hint ── */}
                <div className="border-border bg-muted/20 border-b px-4 py-2 sm:px-5">
                    <p className="text-muted-foreground text-[11px]">
                        Maximum file size:{' '}
                        <span className="font-semibold">25 MB</span>. All file
                        types accepted.
                    </p>
                </div>

                {/* ── Empty state ── */}
                {uploadedFiles.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="bg-muted mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                            <FolderOpen className="text-muted-foreground/30 h-7 w-7" />
                        </div>
                        <p className="text-foreground mb-1 text-sm font-medium">
                            No files uploaded yet
                        </p>
                        <p className="text-muted-foreground mb-4 text-xs">
                            Upload documents, certificates, or any relevant
                            files.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-1.5"
                        >
                            <Upload className="h-3.5 w-3.5" /> Upload First File
                        </Button>
                    </div>
                ) : (
                    /* ── File list ── */
                    <div className="divide-border divide-y">
                        {uploadedFiles.map((file) => {
                            const { icon, color, bg } = getFileIcon(
                                file.file_name,
                            );
                            const canView = isViewable(file.file_name);
                            return (
                                <div
                                    key={file.id}
                                    className="hover:bg-muted/20 group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors sm:px-5"
                                    onClick={() =>
                                        canView
                                            ? setViewFile(file)
                                            : window.open(
                                                  file.file_url,
                                                  '_blank',
                                              )
                                    }
                                >
                                    {/* File type badge */}
                                    <div
                                        className={`h-9 w-9 rounded-xl sm:h-10 sm:w-10 ${bg} flex shrink-0 items-center justify-center`}
                                    >
                                        <span
                                            className={`text-[9px] font-black ${color} tracking-tight`}
                                        >
                                            {icon}
                                        </span>
                                    </div>

                                    {/* File info — takes all remaining space */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-sm font-medium leading-snug">
                                            {file.file_name}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-xs">
                                            <span>
                                                {formatBytes(file.file_size)}
                                            </span>
                                            <span className="hidden sm:inline">
                                                ·
                                            </span>
                                            <span className="hidden sm:inline">
                                                {fmtShort(file.created_at)}
                                            </span>
                                        </p>
                                        {/* Date shown below name on mobile */}
                                        <p className="text-muted-foreground mt-0.5 text-xs sm:hidden">
                                            {fmtShort(file.created_at)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div
                                        className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {canView && (
                                            <a
                                                href={file.file_url}
                                                download={file.file_name}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    title="Download"
                                                    className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-7 sm:w-7"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </a>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-7 sm:w-7"
                                            onClick={() =>
                                                setDeleteFileId(file.id)
                                            }
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── View / Preview Dialog ── */}
            <Dialog
                open={!!viewFile}
                onOpenChange={(o) => !o && setViewFile(null)}
            >
                <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
                    <DialogHeader className="border-border flex shrink-0 flex-row items-center justify-between border-b px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {viewFile &&
                                (() => {
                                    const { icon, color, bg } = getFileIcon(
                                        viewFile.file_name,
                                    );
                                    return (
                                        <div
                                            className={`h-8 w-8 rounded-lg ${bg} flex shrink-0 items-center justify-center`}
                                        >
                                            <span
                                                className={`text-[9px] font-black ${color}`}
                                            >
                                                {icon}
                                            </span>
                                        </div>
                                    );
                                })()}
                            <div className="min-w-0">
                                <DialogTitle className="truncate text-sm font-bold">
                                    {viewFile?.file_name}
                                </DialogTitle>
                                <p className="text-muted-foreground text-xs">
                                    {viewFile
                                        ? formatBytes(viewFile.file_size)
                                        : ''}{' '}
                                    · {fmtShort(viewFile?.created_at)}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Preview body */}
                    <div
                        className="bg-muted/30 min-h-0 flex-1 overflow-auto"
                        style={{ maxHeight: 'calc(90vh - 80px)' }}
                    >
                        {viewFile && isImage(viewFile.file_name) && (
                            <div className="flex min-h-64 items-center justify-center p-6">
                                <img
                                    src={viewFile.file_url}
                                    alt={viewFile.file_name}
                                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
                                />
                            </div>
                        )}
                        {viewFile &&
                            getFileExt(viewFile.file_name) === 'pdf' && (
                                <iframe
                                    src={viewFile.file_url}
                                    className="w-full"
                                    style={{ height: 'calc(90vh - 80px)' }}
                                    title={viewFile.file_name}
                                />
                            )}
                        {viewFile &&
                            getFileExt(viewFile.file_name) === 'txt' && (
                                <div className="p-6">
                                    <iframe
                                        src={viewFile.file_url}
                                        className="border-border bg-card min-h-96 w-full rounded-xl border"
                                        title={viewFile.file_name}
                                    />
                                </div>
                            )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog
                open={!!deleteFileId}
                onOpenChange={(o) => !o && setDeleteFileId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete File?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{' '}
                            <span className="text-foreground font-semibold">
                                {
                                    uploadedFiles.find(
                                        (f) => f.id === deleteFileId,
                                    )?.file_name
                                }
                            </span>
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteFile}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Avatar Preview Dialog ────────────────────────────────────────────────────

function AvatarPreviewDialog({
    src,
    name,
    open,
    onClose,
}: {
    src: string;
    name?: string;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="border-border gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:max-w-xs">
                <div className="bg-card relative flex flex-col items-center overflow-hidden rounded-2xl">
                    <img
                        src={src}
                        alt={name}
                        className="aspect-square w-full object-cover"
                    />
                    {name && (
                        <div className="border-border bg-card w-full border-t px-5 py-3.5">
                            <p className="text-foreground text-center text-sm font-semibold">
                                {name}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Avatar file validator ────────────────────────────────────────────────────

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

function validateAvatarFile(file: File): string | null {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type))
        return 'Only JPEG, JPG, or PNG images are allowed.';
    if (file.size > MAX_AVATAR_SIZE) return 'File size must not exceed 5 MB.';
    return null;
}

// ─── Avatar Upload Dialog ─────────────────────────────────────────────────────

function AvatarUploadDialog({
    open,
    onClose,
    onFileSelected,
}: {
    open: boolean;
    onClose: () => void;
    onFileSelected: (file: File) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [mode, setMode] = useState<'choose' | 'camera' | 'crop'>('choose');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    // Crop state
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraReady(false);
    };

    const goToCrop = (src: string) => {
        stopCamera();
        setRawImageSrc(src);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setMode('crop');
    };

    const startCamera = async () => {
        setCameraError(null);
        setCameraReady(false);
        setMode('camera');
        try {
            const permission = await navigator.permissions.query({
                name: 'camera' as PermissionName,
            });
            if (permission.state === 'denied') {
                setCameraError(
                    'Camera access was blocked. Please enable it in your browser or device settings, then try again.',
                );
                return;
            }
        } catch {
            /* Permissions API not supported */
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraReady(true);
                };
            }
        } catch (err: any) {
            if (err?.name === 'NotAllowedError')
                setCameraError(
                    "Camera permission was denied. Please allow access when prompted, or use 'Select Image' instead.",
                );
            else if (err?.name === 'NotFoundError')
                setCameraError('No camera was found on this device.');
            else
                setCameraError(
                    "Could not access the camera. Please try again or use 'Select Image' instead.",
                );
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        goToCrop(dataUrl);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const error = validateAvatarFile(file);
        if (error) {
            setFileError(error);
            e.target.value = '';
            return;
        }
        setFileError(null);
        const reader = new FileReader();
        reader.onload = () => goToCrop(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const applyCrop = async () => {
        if (!rawImageSrc || !croppedAreaPixels) return;
        try {
            const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
            const file = new File([blob], 'avatar-cropped.jpg', {
                type: 'image/jpeg',
            });
            onFileSelected(file);
            handleClose();
        } catch {
            setCameraError('Failed to crop image. Please try again.');
        }
    };

    const handleClose = () => {
        stopCamera();
        setMode('choose');
        setCameraError(null);
        setFileError(null);
        setRawImageSrc(null);
        onClose();
    };

    const backToChoose = () => {
        stopCamera();
        setRawImageSrc(null);
        setMode('choose');
        setCameraError(null);
        setFileError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-sm">
                <DialogHeader className="border-border border-b px-5 pb-3 pt-5">
                    <DialogTitle className="text-base font-bold">
                        {mode === 'camera'
                            ? 'Take a Photo'
                            : mode === 'crop'
                              ? 'Crop Photo'
                              : 'Update Profile Photo'}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Choose mode ── */}
                {mode === 'choose' && (
                    <div className="space-y-4 px-5 py-5">
                        <p className="text-muted-foreground text-sm">
                            Choose how you'd like to update your profile photo.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="border-border hover:border-primary/50 hover:bg-accent/40 group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all"
                            >
                                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full transition-colors">
                                    <Upload className="text-primary h-5 w-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-foreground text-sm font-semibold">
                                        Select Image
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                                        Choose from device
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={startCamera}
                                className="border-border hover:border-primary/50 hover:bg-accent/40 group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all"
                            >
                                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full transition-colors">
                                    <Camera className="text-primary h-5 w-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-foreground text-sm font-semibold">
                                        Take a Photo
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                                        Use your camera
                                    </p>
                                </div>
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {fileError && (
                            <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2.5 rounded-lg border px-4 py-3">
                                <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                                <p className="text-destructive text-sm leading-snug">
                                    {fileError}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Camera mode ── */}
                {mode === 'camera' && (
                    <div className="space-y-4 px-5 py-5">
                        {cameraError ? (
                            <div className="bg-destructive/10 border-destructive/20 space-y-3 rounded-xl border p-4 text-center">
                                <div className="bg-destructive/10 mx-auto flex h-10 w-10 items-center justify-center rounded-full">
                                    <XCircle className="text-destructive h-5 w-5" />
                                </div>
                                <p className="text-destructive text-sm leading-snug">
                                    {cameraError}
                                </p>
                            </div>
                        ) : (
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-black shadow-inner">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="h-full w-full scale-x-[-1] object-cover"
                                />
                                {!cameraReady && (
                                    <div className="bg-muted absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <Camera className="text-muted-foreground/30 h-8 w-8 animate-pulse" />
                                        <p className="text-muted-foreground animate-pulse text-xs">
                                            Starting camera…
                                        </p>
                                    </div>
                                )}
                                {cameraReady && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="h-44 w-44 rounded-full border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                                    </div>
                                )}
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-2.5">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={backToChoose}
                            >
                                Back
                            </Button>
                            {!cameraError && (
                                <Button
                                    className="flex-1"
                                    onClick={capturePhoto}
                                    disabled={!cameraReady}
                                >
                                    <Camera className="mr-1.5 h-3.5 w-3.5" />
                                    Capture
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Crop mode ── */}
                {mode === 'crop' && rawImageSrc && (
                    <div className="space-y-4 px-5 py-5">
                        {/* Crop area */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                            <Cropper
                                image={rawImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(
                                    _croppedArea,
                                    croppedAreaPixels,
                                ) => setCroppedAreaPixels(croppedAreaPixels)}
                            />
                        </div>
                        {/* Zoom slider */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs font-medium">
                                    Zoom
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {zoom.toFixed(1)}×
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(e) =>
                                    setZoom(Number(e.target.value))
                                }
                                className="accent-primary w-full cursor-pointer"
                            />
                        </div>
                        <div className="flex gap-2.5">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={backToChoose}
                            >
                                Back
                            </Button>
                            <Button className="flex-1" onClick={applyCrop}>
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                                Apply Crop
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowEmployee({ employee, items }: Props) {
    const basic = employee.basic_info;
    const position = employee.item?.position;
    const firstAddress = (basic?.addresses ?? [])[0];
    const addressStr = firstAddress
        ? [firstAddress.street_address, firstAddress.city, firstAddress.state]
              .filter(Boolean)
              .join(', ')
        : undefined;

    const [basicEditOpen, setBasicEditOpen] = useState(false);
    const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
    const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);

    const handleAvatarFileSelected = (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        router.post(
            route('employee.avatar.update', employee.employee_id),
            formData,
            { preserveScroll: true },
        );
    };

    const avatarSrc =
        employee.avatar_url ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(basic?.full_name ?? 'E')}&background=5854cc&color=fff&size=96`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee', href: route('employee.index') },
        { title: 'Employee Profile', href: '#' },
    ];

    const tabs = [
        { value: 'employment', label: 'Employment Details', icon: Briefcase },
        { value: 'compensation', label: 'Compensation', icon: FileText },
        { value: 'leave', label: 'Leave Information', icon: Calendar },
        { value: 'time', label: 'Time Records', icon: Clock },
        {
            value: 'government',
            label: 'Government Eligibility',
            icon: Landmark,
        },
        { value: 'background', label: 'Background Information', icon: User },
        { value: 'documents', label: 'Documents', icon: FolderOpen },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${basic?.full_name ?? 'Employee'} — Profile`} />

            {/*
             * Outer wrapper: stacks vertically on mobile, side-by-side on lg+
             * p-3 on mobile, p-5 on sm+
             */}
            <div className="bg-background flex min-h-full flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:gap-5">
                {/* ── Left Panel ── full-width on mobile, fixed 288px on lg+ */}
                <div className="bg-card border-border flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border shadow-sm lg:w-72">
                    <div className="from-accent/30 to-card border-border relative flex flex-col items-center border-b bg-gradient-to-b px-5 pb-5 pt-8">
                        <div className="absolute right-3 top-3">
                            <Button
                                size={'icon-xs'}
                                onClick={() => setBasicEditOpen(true)}
                                variant={'ghost'}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setAvatarPreviewOpen(true)}
                                className="bg-muted border-card ring-primary/20 hover:ring-primary/50 h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 shadow-lg ring-2 transition-all"
                                title="View photo"
                            >
                                <img
                                    src={avatarSrc}
                                    alt={basic?.full_name}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                            <button
                                onClick={() => setAvatarUploadOpen(true)}
                                title="Change photo"
                                className="bg-primary text-primary-foreground border-card absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-md transition-opacity hover:opacity-90"
                            >
                                <Camera className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="mt-4 text-center">
                            <h1 className="text-foreground text-base font-bold leading-tight">
                                {basic?.full_name ?? '—'}
                            </h1>
                            <p className="text-primary mt-0.5 text-xs font-semibold">
                                {position?.position_name ??
                                    'No Position Assigned'}
                            </p>
                        </div>
                        <Badge
                            className={`mt-2.5 rounded-full border-0 px-3 py-0.5 text-[10px] font-bold ${employee.status ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}
                        >
                            {employee.status ? '● Active' : '● Inactive'}
                        </Badge>
                    </div>

                    {/*
                     * On mobile the info rows sit below the avatar in a 2-column
                     * grid so they don't take up too much vertical space.
                     * On lg+ they revert to a single-column stacked list.
                     */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-widest">
                            Basic Information
                        </p>
                        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-1">
                            <InfoRow
                                icon={Mail}
                                label="Work Email"
                                value={employee.work_email}
                            />
                            <InfoRow
                                icon={Mail}
                                label="Personal Email"
                                value={basic?.personal_email}
                            />
                            <InfoRow
                                icon={Briefcase}
                                label="Work ID"
                                value={employee.work_id}
                            />
                            <InfoRow
                                icon={Phone}
                                label="Contact Number"
                                value={basic?.phone_number}
                            />
                            <InfoRow
                                icon={Calendar}
                                label="Date of Birth"
                                value={fmt(basic?.birth_date)}
                            />
                            <InfoRow
                                icon={MapPin}
                                label="Place of Birth"
                                value={basic?.place_of_birth}
                            />
                            <InfoRow
                                icon={User}
                                label="Sex"
                                value={
                                    basic?.sex !== undefined
                                        ? basic.sex
                                            ? 'Male'
                                            : 'Female'
                                        : undefined
                                }
                            />
                            <InfoRow
                                icon={Heart}
                                label="Civil Status"
                                value={cap(basic?.civil_status)}
                            />
                            <InfoRow
                                icon={Home}
                                label="Address"
                                value={addressStr}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ── takes remaining width, min-w-0 prevents overflow */}
                <div className="bg-card border-border flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
                    <Tabs
                        defaultValue="employment"
                        className="flex flex-1 flex-col"
                    >
                        {/* Horizontally scrollable tab bar on all screen sizes */}
                        <div className="border-border shrink-0 overflow-x-auto border-b px-2 pt-1 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
                            <TabsList className="flex h-auto w-max min-w-full flex-nowrap gap-0 bg-transparent p-0">
                                {tabs.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4"
                                    >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        {/* Hide label text on very small screens, show icon only */}
                                        <span className="xs:inline hidden sm:inline">
                                            {label}
                                        </span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent
                            value="employment"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <EmploymentDetailsTab
                                employee={employee}
                                items={items}
                            />
                        </TabsContent>
                        <TabsContent
                            value="compensation"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <CompensationTab employee={employee} />
                        </TabsContent>
                        <TabsContent
                            value="leave"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <LeaveInformationTab employee={employee} />
                        </TabsContent>
                        <TabsContent
                            value="time"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <div className="flex h-64 flex-col items-center justify-center gap-3">
                                <Clock className="text-muted-foreground/30 h-10 w-10" />
                                <p className="text-muted-foreground text-sm italic">
                                    Time records coming soon.
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent
                            value="government"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <GovernmentEligibilityTab employee={employee} />
                        </TabsContent>
                        <TabsContent
                            value="background"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <BackgroundInformationTab employee={employee} />
                        </TabsContent>
                        <TabsContent
                            value="documents"
                            className="mt-0 flex-1 overflow-y-auto"
                        >
                            <DocumentsTab employee={employee} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <AvatarPreviewDialog
                src={avatarSrc}
                name={basic?.full_name}
                open={avatarPreviewOpen}
                onClose={() => setAvatarPreviewOpen(false)}
            />
            <AvatarUploadDialog
                open={avatarUploadOpen}
                onClose={() => setAvatarUploadOpen(false)}
                onFileSelected={handleAvatarFileSelected}
            />
            <BasicInfoEditDialog
                employee={employee}
                open={basicEditOpen}
                onClose={() => setBasicEditOpen(false)}
            />
        </AppLayout>
    );
}
