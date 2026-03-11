import { useState } from "react"
import { Head, router, useForm, usePage } from "@inertiajs/react"
import { route } from "ziggy-js"
import { FileText, GitBranch, Building2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { BreadcrumbItem } from "@/types"
import { getColumns } from "./components/columns"
import { officeStatusOptions } from "./data/data"
import { type OutgoingRow, type Department } from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    ourOffice: OutgoingRow[]
    otherOffices: OutgoingRow[]
    departmentId: number
    departments: Department[]
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Document Tracking", href: "#" },
    { title: "Outgoing", href: route("document-tracking-outgoing.index") },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ─── New Request Modal ────────────────────────────────────────────────────────

interface NewRequestModalProps {
    open: boolean
    departments: Department[]
    onClose: () => void
}

function NewRequestModal({ open, departments, onClose }: NewRequestModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        notes: "",
        to_office_id: "",
        remarks: "",
    })

    function handleClose() {
        reset()
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        post(route("document-tracking-outgoing.store"), { onSuccess: handleClose })
    }

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        New Request
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4">

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-xs font-medium text-foreground mb-1.5">
                                Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={e => setData("title", e.target.value)}
                                placeholder="e.g. Budget Approval Request"
                                className="text-sm"
                            />
                            <FieldError message={errors.title} />
                        </div>

                        {/* Forward To */}
                        <div>
                            <label htmlFor="to_office_id" className="block text-xs font-medium text-foreground mb-1.5">
                                Forward To <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={data.to_office_id}
                                onValueChange={v => setData("to_office_id", v)}
                            >
                                <SelectTrigger id="to_office_id" className="text-sm">
                                    <SelectValue placeholder="Select department…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.department_id} value={String(d.department_id)}>
                                            {d.department_acronym} — {d.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.to_office_id} />
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-xs font-medium text-foreground mb-1.5">
                                Notes
                                <span className="ml-1 text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={e => setData("notes", e.target.value)}
                                placeholder="Additional context or details about this request…"
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.notes} />
                        </div>

                        {/* Remarks */}
                        <div>
                            <label htmlFor="remarks" className="block text-xs font-medium text-foreground mb-1.5">
                                Forwarding Remarks
                                <span className="ml-1 text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <Textarea
                                id="remarks"
                                value={data.remarks}
                                onChange={e => setData("remarks", e.target.value)}
                                placeholder="Any note to include with the initial forward…"
                                rows={2}
                                className="text-sm resize-none"
                            />
                            <FieldError message={errors.remarks} />
                        </div>

                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing || !data.title || !data.to_office_id}
                            className="text-xs"
                        >
                            {processing ? "Submitting…" : "Create & Forward"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutgoingIndex({ ourOffice, otherOffices, departmentId, departments }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [tab, setTab] = useState<"our" | "other">("our")
    const [modalOpen, setModalOpen] = useState(false)

    const isOurTab = tab === "our"
    const activeData = isOurTab ? ourOffice : otherOffices
    const columns = getColumns(departmentId, !isOurTab)

    const ourActive = ourOffice.filter(d => !["completed", "cancelled"].includes(d.status)).length
    const ourTotal = ourOffice.length
    const otherTotal = otherOffices.length

    function openCreate() {
        setModalOpen(true)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outgoing Requests" />

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Outgoing Requests</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Requests created or previously forwarded by your department
                        </p>
                    </div>
                </div>

                {/* Flash message */}
                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard
                        title="Our Requests"
                        value={ourTotal}
                        description="Created by your department"
                        icon={<FileText className="w-4 h-4 m-2 text-primary" />}
                    />
                    <StatCard
                        title="Still Active"
                        value={ourActive}
                        description="In progress"
                        icon={<GitBranch className="w-4 h-4 m-2 text-blue-500" />}
                    />
                    <StatCard
                        title="Other Offices"
                        value={otherTotal}
                        description="Previously forwarded by you"
                        icon={<Building2 className="w-4 h-4 m-2 text-indigo-500" />}
                    />
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="flex gap-6">
                        {(["our", "other"] as const).map(t => (
                            <button
                                key={t}
                                className={cn(
                                    "pb-3 text-sm font-medium border-b-2 transition-colors",
                                    tab === t
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                                onClick={() => setTab(t)}
                            >
                                {t === "our" ? "Our Office" : "Other Offices"}
                                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                                    ({t === "our" ? ourTotal : otherTotal})
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Table — key forces remount on tab switch so filters/search reset */}
                <DataTable
                    key={tab}
                    columns={columns}
                    data={activeData}
                    getRowId={row => String(row.id)}
                    searchColumnId="title"
                    searchPlaceholder="Search by title…"
                    filters={[
                        { columnId: "office_status", title: "Status", options: officeStatusOptions },
                    ]}
                    addButton={{
                        label: "New Request",
                        onClick: openCreate,
                    }}
                    defaultPageSize={25}
                    onRowClick={row => router.visit(route("document-tracking.show", row.original.id))}
                />

            </div>

            {/* New Request Modal */}
            <NewRequestModal
                open={modalOpen}
                departments={departments}
                onClose={() => setModalOpen(false)}
            />

        </AppLayout>
    )
}