import { Head, router, useForm, usePage } from '@inertiajs/react'
import { CalendarDays, Check, Pencil, Plus, PlusCircle, Repeat, Trash2, ArrowUpDown, X, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { route } from 'ziggy-js'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import AppLayout from '@/layouts/app-layout'
import { StatCard } from '@/components/shared/stat-card'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types'
import { TYPE_BADGE_VARIANT } from './data/data'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holiday {
    holiday_id: number
    name: string
    date: string
    display_date: string
    type: string
    description?: string
    is_recurring: boolean
}

interface Props {
    holidays: Holiday[]
    currentYear: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const HOLIDAY_TYPES = [
    'Regular Holiday',
    'Special Non-Working',
    'Special Working',
    'Local Holiday',
]

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '#' },
    { title: 'Holiday Management', href: '/holiday' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfWeek(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function getFormattedDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    return (
        <Badge variant={TYPE_BADGE_VARIANT[type] ?? 'secondary'}>
            {type}
        </Badge>
    )
}

// ─── Holiday Modal ────────────────────────────────────────────────────────────

interface HolidayModalProps {
    open: boolean
    editingHoliday: Holiday | null
    onClose: () => void
}

function HolidayModal({ open, editingHoliday, onClose }: HolidayModalProps) {
    const isEdit = editingHoliday !== null

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:         editingHoliday?.name         ?? '',
        date:         editingHoliday?.date         ?? '',
        type:         editingHoliday?.type         ?? '',
        description:  editingHoliday?.description  ?? '',
        is_recurring: editingHoliday?.is_recurring ?? false,
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route('holiday.update', editingHoliday!.holiday_id), { onSuccess: handleClose })
        } else {
            post(route('holiday.store'), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {isEdit ? 'Edit Holiday' : 'Add Holiday'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-xs font-medium text-foreground mb-1.5">
                                Holiday Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. New Year's Day"
                                className="text-sm"
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-xs font-medium text-foreground mb-1.5">
                                    Date <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="text-sm"
                                />
                                <FieldError message={errors.date} />
                            </div>

                            <div>
                                <label htmlFor="type" className="block text-xs font-medium text-foreground mb-1.5">
                                    Type <span className="text-destructive">*</span>
                                </label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                    <SelectTrigger id="type" className="text-sm">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOLIDAY_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                <TypeBadge type={t} />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.type} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-xs font-medium text-foreground mb-1.5">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Optional notes about this holiday..."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.description} />
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                            <Checkbox
                                id="is_recurring"
                                checked={data.is_recurring}
                                onCheckedChange={(checked) => setData('is_recurring', !!checked)}
                                className="mt-0.5"
                            />
                            <div>
                                <label htmlFor="is_recurring" className="text-xs font-medium text-foreground cursor-pointer">
                                    Recurring yearly
                                </label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    This holiday will automatically appear every year on the same month and day.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? 'Saving…' : isEdit ? 'Update Holiday' : 'Create Holiday'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Alert Dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
    holiday: Holiday | null
    onClose: () => void
}

function DeleteAlertDialog({ holiday, onClose }: DeleteDialogProps) {
    function handleConfirm() {
        if (holiday) {
            router.delete(route('holiday.destroy', holiday.holiday_id), {
                onFinish: onClose,
            })
        }
    }

    return (
        <AlertDialog open={holiday !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-medium text-foreground">{holiday?.name}</span>?
                        {' '}This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleConfirm}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ─── Type Filter ──────────────────────────────────────────────────────────────

interface TypeFilterProps {
    selectedTypes: Set<string>
    onChange: (types: Set<string>) => void
}

function TypeFilter({ selectedTypes, onChange }: TypeFilterProps) {
    function handleSelect(type: string) {
        const updated = new Set(selectedTypes)
        if (updated.has(type)) updated.delete(type)
        else updated.add(type)
        onChange(updated)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed text-xs">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Type
                    {selectedTypes.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selectedTypes.size}
                            </Badge>
                            <div className="hidden gap-1 lg:flex">
                                {selectedTypes.size > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selectedTypes.size} selected
                                    </Badge>
                                ) : (
                                    HOLIDAY_TYPES.filter((t) => selectedTypes.has(t)).map((t) => (
                                        <Badge key={t} variant="secondary" className="rounded-sm px-1 font-normal">
                                            {t}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                {HOLIDAY_TYPES.map((type) => {
                    const isSelected = selectedTypes.has(type)
                    return (
                        <DropdownMenuItem
                            key={type}
                            onSelect={(e) => { e.preventDefault(); handleSelect(type) }}
                            className="flex items-center gap-2 text-xs"
                        >
                            <div className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                            )}>
                                {isSelected && <Check className="size-3 stroke-primary-foreground" />}
                            </div>
                            <TypeBadge type={type} />
                        </DropdownMenuItem>
                    )
                })}
                {selectedTypes.size > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onChange(new Set())}
                            className="justify-center text-center text-xs"
                        >
                            Clear filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// ─── Holiday Mobile Card ──────────────────────────────────────────────────────

interface HolidayMobileCardProps {
    holiday: Holiday
    onEdit: (holiday: Holiday) => void
    onDelete: (holiday: Holiday) => void
    isLast: boolean
}

function HolidayMobileCard({ holiday, onEdit, onDelete, isLast }: HolidayMobileCardProps) {
    return (
        <div className={cn("bg-background", !isLast && "border-b border-border")}>
            {/* ── Card Body ── */}
            <div className="px-4 pt-3.5 pb-3 space-y-1.5">
                {/* Name + type badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">
                            {holiday.name}
                        </span>
                        {holiday.is_recurring && (
                            <Repeat className="w-3.5 h-3.5 text-muted-foreground shrink-0" title="Recurring yearly" />
                        )}
                    </div>
                    <TypeBadge type={holiday.type} />
                </div>

                {/* Date + day of week */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{getFormattedDate(holiday.date)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{getDayOfWeek(holiday.date)}</span>
                </div>

                {/* Description */}
                {holiday.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {holiday.description}
                    </p>
                )}
            </div>

            {/* ── Card Footer ── */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <Badge variant={holiday.is_recurring ? 'default' : 'secondary'}>
                    {holiday.is_recurring ? 'Recurring' : 'One-time'}
                </Badge>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(holiday)}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(holiday)}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Month Card ───────────────────────────────────────────────────────────────

interface MonthCardProps {
    monthName: string
    year: number
    holidays: Holiday[]
    onEdit: (holiday: Holiday) => void
    onDelete: (holiday: Holiday) => void
    isMobile: boolean
}

function MonthCard({ monthName, year, holidays, onEdit, onDelete, isMobile }: MonthCardProps) {
    return (
        <div className="bg-card text-card-foreground border border-border rounded-lg overflow-hidden shadow-sm">

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h2 className="font-semibold text-foreground text-sm">{monthName} {year}</h2>
                {holidays.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Mobile: card list ── */}
            {isMobile ? (
                <div>
                    {holidays.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                            No holidays this month
                        </div>
                    ) : (
                        holidays.map((h, idx) => (
                            <HolidayMobileCard
                                key={h.holiday_id}
                                holiday={h}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                isLast={idx === holidays.length - 1}
                            />
                        ))
                    )}
                </div>
            ) : (
                /* ── Desktop: table ── */
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    Holiday Name
                                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
                                </div>
                            </th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Day</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holidays.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                                    No holidays this month
                                </td>
                            </tr>
                        ) : (
                            holidays.map((h, idx) => (
                                <tr
                                    key={h.holiday_id}
                                    className={cn(
                                        'transition-colors hover:bg-muted/30',
                                        idx !== holidays.length - 1 && 'border-b border-border'
                                    )}
                                >
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-foreground text-xs">{h.name}</span>
                                            {h.is_recurring && (
                                                <Repeat className="w-3 h-3 text-muted-foreground shrink-0" title="Recurring yearly" />
                                            )}
                                        </div>
                                        {h.description && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[160px]">
                                                {h.description}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {getFormattedDate(h.date)}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {getDayOfWeek(h.date)}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <TypeBadge type={h.type} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => onEdit(h)}
                                                className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(h)}
                                                className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HolidayIndex({ holidays, currentYear }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()
    const isMobile = useIsMobile()

    const [modalOpen, setModalOpen]             = useState(false)
    const [editingHoliday, setEditingHoliday]   = useState<Holiday | null>(null)
    const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null)

    const [search, setSearch]               = useState('')
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

    const isFiltered = search !== '' || selectedTypes.size > 0

    const filteredHolidays = holidays.filter((h) => {
        const matchesSearch = search === '' || h.name.toLowerCase().includes(search.toLowerCase())
        const matchesType   = selectedTypes.size === 0 || selectedTypes.has(h.type)
        return matchesSearch && matchesType
    })

    const byMonth: Record<number, Holiday[]> = {}
    filteredHolidays.forEach((h) => {
        const month = new Date(h.date + 'T00:00:00').getMonth()
        if (!byMonth[month]) byMonth[month] = []
        byMonth[month].push(h)
    })

    function openCreate() { setEditingHoliday(null); setModalOpen(true) }
    function openEdit(holiday: Holiday) { setEditingHoliday(holiday); setModalOpen(true) }
    function closeModal() { setModalOpen(false); setEditingHoliday(null) }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holiday Management" />

            <div className="px-6 py-6 space-y-5">
                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-200">
                    <StatCard
                        title="Total Holidays"
                        value={holidays.length}
                        description={`Holidays in ${currentYear}`}
                        icon={<CalendarDays className="size-4 text-primary" />}
                    />
                    <StatCard
                        title="Recurring"
                        value={holidays.filter(h => h.is_recurring).length}
                        description="Repeat automatically every year"
                        icon={<RefreshCw className="size-4 text-primary" />}
                    />
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search holidays..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-[180px] lg:w-[250px] text-xs"
                    />
                    <TypeFilter selectedTypes={selectedTypes} onChange={setSelectedTypes} />
                    {isFiltered && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSearch(''); setSelectedTypes(new Set()) }}
                                className="h-8 text-xs"
                            >
                                Reset <X className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {filteredHolidays.length} of {holidays.length} shown
                            </span>
                        </>
                    )}
                    <Button size="sm" className="gap-1.5 text-xs ml-auto" onClick={openCreate}>
                        <Plus className="w-3.5 h-3.5" /> Add Holiday
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {MONTHS.map((monthName, monthIdx) => (
                        <MonthCard
                            key={monthIdx}
                            monthName={monthName}
                            year={currentYear}
                            holidays={byMonth[monthIdx] ?? []}
                            onEdit={openEdit}
                            onDelete={setDeletingHoliday}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            </div>

            <HolidayModal
                open={modalOpen}
                editingHoliday={editingHoliday}
                onClose={closeModal}
            />

            <DeleteAlertDialog
                holiday={deletingHoliday}
                onClose={() => setDeletingHoliday(null)}
            />
        </AppLayout>
    )
}