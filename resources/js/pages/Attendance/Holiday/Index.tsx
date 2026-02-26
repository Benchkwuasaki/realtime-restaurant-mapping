import { Head, router, useForm, usePage } from '@inertiajs/react'
import { CalendarDays, Check, Pencil, Plus, PlusCircle, Repeat, Trash2, ArrowUpDown, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types'

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

const TYPE_PILL: Record<string, string> = {
    'Regular Holiday':     'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    'Special Non-Working': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'Special Working':     'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'Local Holiday':       'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

const TYPE_DOT: Record<string, string> = {
    'Regular Holiday':     'bg-rose-400',
    'Special Non-Working': 'bg-amber-400',
    'Special Working':     'bg-sky-400',
    'Local Holiday':       'bg-violet-400',
}

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

                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {isEdit ? 'Edit Holiday' : 'Add Holiday'}
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">

                        {/* Name */}
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

                        {/* Date + Type */}
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
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[t] ?? 'bg-muted-foreground'}`} />
                                                    {t}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.type} />
                            </div>
                        </div>

                        {/* Description */}
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

                        {/* Recurring */}
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

                    {/* Footer */}
                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            className="text-xs"
                        >
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

// ─── Type Filter (adapted from data-table-faceted-filter) ─────────────────────

interface TypeFilterProps {
    selectedTypes: Set<string>
    onChange: (types: Set<string>) => void
}

function TypeFilter({ selectedTypes, onChange }: TypeFilterProps) {
    function handleSelect(type: string) {
        const updated = new Set(selectedTypes)
        if (updated.has(type)) {
            updated.delete(type)
        } else {
            updated.add(type)
        }
        onChange(updated)
    }

    function handleClear() {
        onChange(new Set())
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
                                    HOLIDAY_TYPES
                                        .filter((t) => selectedTypes.has(t))
                                        .map((t) => (
                                            <Badge
                                                key={t}
                                                variant="secondary"
                                                className="rounded-sm px-1 font-normal"
                                            >
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
                            onSelect={(e) => {
                                e.preventDefault()
                                handleSelect(type)
                            }}
                            className="flex items-center gap-2 text-xs"
                        >
                            <div
                                className={cn(
                                    'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                                    isSelected
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-input'
                                )}
                            >
                                {isSelected && <Check className="size-3 stroke-primary-foreground" />}
                            </div>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[type]}`} />
                            {type}
                        </DropdownMenuItem>
                    )
                })}
                {selectedTypes.size > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={handleClear}
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

// ─── Month Card ───────────────────────────────────────────────────────────────

interface MonthCardProps {
    monthName: string
    year: number
    holidays: Holiday[]
    onEdit: (holiday: Holiday) => void
    onDelete: (holiday: Holiday) => void
}

function MonthCard({ monthName, year, holidays, onEdit, onDelete }: MonthCardProps) {
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

            {/* Table */}
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
                                className={[
                                    'transition-colors hover:bg-muted/30',
                                    idx !== holidays.length - 1 ? 'border-b border-border' : '',
                                ].join(' ')}
                            >
                                {/* Name */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[h.type] ?? 'bg-muted-foreground'}`} />
                                        <span className="font-medium text-foreground text-xs">{h.name}</span>
                                        {h.is_recurring && (
                                            <Repeat className="w-3 h-3 text-muted-foreground shrink-0" title="Recurring yearly" />
                                        )}
                                    </div>
                                    {h.description && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 pl-3 truncate max-w-[160px]">
                                            {h.description}
                                        </p>
                                    )}
                                </td>

                                {/* Date */}
                                <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {getFormattedDate(h.date)}
                                </td>

                                {/* Day */}
                                <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {getDayOfWeek(h.date)}
                                </td>

                                {/* Type */}
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_PILL[h.type] ?? 'bg-muted text-muted-foreground'}`}>
                                        {h.type}
                                    </span>
                                </td>

                                {/* Actions */}
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
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HolidayIndex({ holidays, currentYear }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen]             = useState(false)
    const [editingHoliday, setEditingHoliday]   = useState<Holiday | null>(null)
    const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null)

    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch]               = useState('')
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

    const isFiltered = search !== '' || selectedTypes.size > 0

    // Apply filters before grouping into months
    const filteredHolidays = holidays.filter((h) => {
        const matchesSearch = search === '' ||
            h.name.toLowerCase().includes(search.toLowerCase())
        const matchesType = selectedTypes.size === 0 ||
            selectedTypes.has(h.type)
        return matchesSearch && matchesType
    })

    const byMonth: Record<number, Holiday[]> = {}
    filteredHolidays.forEach((h) => {
        const month = new Date(h.date + 'T00:00:00').getMonth()
        if (!byMonth[month]) byMonth[month] = []
        byMonth[month].push(h)
    })

    function openCreate() {
        setEditingHoliday(null)
        setModalOpen(true)
    }

    function openEdit(holiday: Holiday) {
        setEditingHoliday(holiday)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingHoliday(null)
    }

    function resetFilters() {
        setSearch('')
        setSelectedTypes(new Set())
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holiday Management" />

            <div className="px-6 py-6 space-y-5">

                {/* Header — unchanged */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            Holiday Management
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentYear} &middot; {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} &middot; {holidays.filter(h => h.is_recurring).length} recurring
                        </p>
                    </div>
                    <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}>
                        <Plus className="w-3.5 h-3.5" /> Add Holiday
                    </Button>
                </div>

                {/* Flash — unchanged */}
                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                {/* ── NEW: Search + Type filter toolbar ── */}
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search holidays..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-[180px] lg:w-[250px] text-xs"
                    />
                    <TypeFilter
                        selectedTypes={selectedTypes}
                        onChange={setSelectedTypes}
                    />
                    {isFiltered && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-8 text-xs"
                            >
                                Reset
                                <X className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {filteredHolidays.length} of {holidays.length} shown
                            </span>
                        </>
                    )}
                </div>

                {/* 2-column month grid — unchanged */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {MONTHS.map((monthName, monthIdx) => (
                        <MonthCard
                            key={monthIdx}
                            monthName={monthName}
                            year={currentYear}
                            holidays={byMonth[monthIdx] ?? []}
                            onEdit={openEdit}
                            onDelete={setDeletingHoliday}
                        />
                    ))}
                </div>
            </div>

            {/* Holiday create/edit modal — unchanged */}
            <HolidayModal
                open={modalOpen}
                editingHoliday={editingHoliday}
                onClose={closeModal}
            />

            {/* Delete confirmation — unchanged */}
            <DeleteAlertDialog
                holiday={deletingHoliday}
                onClose={() => setDeletingHoliday(null)}
            />
        </AppLayout>
    )
}