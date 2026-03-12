import { Head, router, useForm } from "@inertiajs/react"
import { useState } from "react"
import { route } from "ziggy-js"
import { BadgeCheck, Pencil, Plus, Shield, Trash2, Star } from "lucide-react"

import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import type { BreadcrumbItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceSetting {
    id: number
    name: string
    early_time_in_minutes: number
    late_time_out_minutes: number
    is_default: boolean
}

interface Props {
    settings: AttendanceSetting[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480]

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Settings", href: route("attendance-settings.index") },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMins(n: number): string {
    if (n === 0) return "None"
    if (n >= 60) {
        const h = Math.floor(n / 60)
        const m = n % 60
        return m === 0 ? `${h}h` : `${h}h ${m}m`
    }
    return `${n} min`
}

// ─── Select field ─────────────────────────────────────────────────────────────

function SelectField({
    label,
    description,
    value,
    onChange,
    options,
}: {
    label: string
    description: string
    value: number
    onChange: (v: number) => void
    options: number[]
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground -mt-0.5">{description}</p>
            <select
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
                {options.map(o => (
                    <option key={o} value={o}>{fmtMins(o)}</option>
                ))}
            </select>
        </div>
    )
}

// ─── Setting form dialog ──────────────────────────────────────────────────────

function SettingDialog({
    open,
    onClose,
    setting,
}: {
    open: boolean
    onClose: () => void
    setting?: AttendanceSetting
}) {
    const isEdit = !!setting

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: setting?.name ?? "",
        early_time_in_minutes: setting?.early_time_in_minutes ?? 60,
        late_time_out_minutes: setting?.late_time_out_minutes ?? 60,
        is_default: setting?.is_default === true,
    })

    function handleClose() {
        reset()
        onClose()
    }

    function submit() {
        if (isEdit) {
            put(route("attendance-settings.update", setting!.id), {
                preserveState: false,
                onSuccess: handleClose,
            })
        } else {
            post(route("attendance-settings.store"), {
                preserveState: false,
                onSuccess: handleClose,
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Setting" : "New Attendance Setting"}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Name</Label>
                        <Input
                            value={data.name}
                            onChange={e => setData("name", e.target.value)}
                            placeholder="e.g. Standard Policy"
                        />
                        {errors.name && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>
                        )}
                    </div>

                    {/* Windows */}
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Early Time-in Allowance"
                            description="How early before scheduled time-in scans are accepted"
                            value={data.early_time_in_minutes}
                            onChange={v => setData("early_time_in_minutes", v)}
                            options={WINDOW_OPTIONS}
                        />
                        <SelectField
                            label="Late Time-out Allowance"
                            description="How late after scheduled time-out scans are accepted"
                            value={data.late_time_out_minutes}
                            onChange={v => setData("late_time_out_minutes", v)}
                            options={WINDOW_OPTIONS}
                        />
                    </div>

                    {/* Default toggle — disabled for the existing default to prevent accidental un-defaulting */}
                    <div className={`flex items-center justify-between rounded-lg border border-border px-4 py-3 ${isEdit && setting?.is_default ? "opacity-60 pointer-events-none" : ""
                        }`}>
                        <div>
                            <p className="text-sm font-medium">Set as default</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEdit && setting?.is_default
                                    ? "Already the default — use another setting's card to change this"
                                    : "This setting will be used for all attendance calculations"}
                            </p>
                        </div>
                        <Switch
                            checked={data.is_default}
                            onCheckedChange={v => setData("is_default", v)}
                            disabled={isEdit && setting?.is_default}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={submit} disabled={processing}>
                        {isEdit ? "Save Changes" : "Create Setting"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Setting card ─────────────────────────────────────────────────────────────

function SettingCard({
    setting,
    onEdit,
    onDelete,
    onMakeDefault,
}: {
    setting: AttendanceSetting
    onEdit: () => void
    onDelete: () => void
    onMakeDefault: () => void
}) {
    const rows = [
        { label: "Early Time-in Allows", value: fmtMins(setting.early_time_in_minutes) },
        { label: "Late Time-out Allows", value: fmtMins(setting.late_time_out_minutes) },
    ]

    return (
        <div className={`rounded-xl border bg-background overflow-hidden transition-colors ${setting.is_default
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-border"
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                    <Shield className={`w-4 h-4 shrink-0 ${setting.is_default ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold text-sm truncate">{setting.name}</span>
                    {setting.is_default && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 shrink-0">
                            <BadgeCheck className="w-3 h-3" />
                            Default
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* One-click promote — only shown for non-default cards */}
                    {!setting.is_default && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Make default"
                            onClick={onMakeDefault}
                        >
                            <Star className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={onEdit}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:pointer-events-none"
                        onClick={onDelete}
                        disabled={setting.is_default}
                        title={setting.is_default ? "Cannot delete the default setting" : "Delete"}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-px bg-border">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 px-4 py-3 bg-background">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
                        <span className="text-sm font-mono font-medium">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendanceSettingsIndex({ settings }: Props) {
    const [createOpen, setCreateOpen] = useState(false)
    const [editing, setEditing] = useState<AttendanceSetting | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const deletingRecord = settings.find(s => s.id === deletingId)

    function handleMakeDefault(setting: AttendanceSetting) {
        router.post(route("attendance-settings.set-default", setting.id), {}, {
            preserveScroll: true,
        })
    }

    function confirmDelete() {
        if (!deletingId) return
        router.delete(route("attendance-settings.destroy", deletingId), {
            onSuccess: () => setDeletingId(null),
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Settings" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Attendance Settings</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Configure scan windows for attendance computation. Lateness is always
                            calculated from the exact scheduled time — no grace period applied.
                        </p>
                    </div>
                    <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4" />
                        New Setting
                    </Button>
                </div>

                {/* Cards */}
                {settings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
                        <Shield className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No settings configured yet.</p>
                        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                            Create your first setting
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {settings.map(s => (
                            <SettingCard
                                key={s.id}
                                setting={s}
                                onEdit={() => setEditing(s)}
                                onDelete={() => setDeletingId(s.id)}
                                onMakeDefault={() => handleMakeDefault(s)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create dialog */}
            <SettingDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />

            {/* Edit dialog — key forces full remount so useForm re-initialises */}
            <SettingDialog
                key={editing?.id ?? "edit"}
                open={!!editing}
                onClose={() => setEditing(null)}
                setting={editing ?? undefined}
            />

            {/* Delete confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={v => !v && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deletingRecord?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This setting will be permanently removed. Any attendance calculations currently
                            using this setting will fall back to the default.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    )
}