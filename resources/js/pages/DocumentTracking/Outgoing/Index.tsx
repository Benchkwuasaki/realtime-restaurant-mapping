import { useState, type FormEvent } from "react"
import { Head, router, usePage } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Building2, FileText, GitBranch } from "lucide-react"

import AppLayout from "@/layouts/app-layout"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { BreadcrumbItem } from "@/types"

import { getColumns } from "./components/columns"
import { officeStatusOptions } from "./data/data"
import { type Department, type OutgoingRow } from "./data/schema"

interface Props {
    ourOffice: OutgoingRow[]
    otherOffices: OutgoingRow[]
    departmentId: number
    departments: Department[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Document Tracking", href: "#" },
    { title: "Outgoing", href: route("document-tracking-outgoing.index") },
]

function FieldError({ message }: { message?: string }) {
    if (!message) return null

    return <p className="mt-1 text-xs text-destructive">{message}</p>
}

interface NewRequestModalProps {
    open: boolean
    departments: Department[]
    onClose: () => void
}

function NewRequestModal({ open, departments, onClose }: NewRequestModalProps) {
    const [form, setForm] = useState({
        title: "",
        notes: "",
        to_office_id: "",
        remarks: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [processing, setProcessing] = useState(false)

    function handleClose() {
        setForm({ title: "", notes: "", to_office_id: "", remarks: "" })
        setErrors({})
        setProcessing(false)
        onClose()
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setProcessing(true)

        router.post(route("document-tracking-outgoing.store"), form, {
            onSuccess: handleClose,
            onError: (errs) => {
                setErrors(errs)
                setProcessing(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
            <DialogContent className="overflow-hidden gap-0 p-0 sm:max-w-lg">
                <DialogHeader className="border-b border-border px-5 py-4">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        New Request
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-5 py-5">
                        <div>
                            <label
                                htmlFor="title"
                                className="mb-1.5 block text-xs font-medium text-foreground"
                            >
                                Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                                placeholder="e.g. Budget Approval Request"
                                className="text-sm"
                            />
                            <FieldError message={errors.title} />
                        </div>

                        <div>
                            <label
                                htmlFor="to_office_id"
                                className="mb-1.5 block text-xs font-medium text-foreground"
                            >
                                Forward To <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={form.to_office_id}
                                onValueChange={(value) =>
                                    setForm((current) => ({ ...current, to_office_id: value }))
                                }
                            >
                                <SelectTrigger id="to_office_id" className="text-sm">
                                    <SelectValue placeholder="Select department..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((department) => (
                                        <SelectItem
                                            key={department.department_id}
                                            value={String(department.department_id)}
                                        >
                                            {department.department_acronym} - {department.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.to_office_id} />
                        </div>

                        <div>
                            <label
                                htmlFor="notes"
                                className="mb-1.5 block text-xs font-medium text-foreground"
                            >
                                Notes{" "}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </label>
                            <Textarea
                                id="notes"
                                value={form.notes}
                                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                                placeholder="Additional context or details about this request..."
                                rows={3}
                                className="resize-none text-sm"
                            />
                            <FieldError message={errors.notes} />
                        </div>

                        <div>
                            <label
                                htmlFor="remarks"
                                className="mb-1.5 block text-xs font-medium text-foreground"
                            >
                                Forwarding Remarks{" "}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </label>
                            <Textarea
                                id="remarks"
                                value={form.remarks}
                                onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))}
                                placeholder="Any note to include with the initial forward..."
                                rows={2}
                                className="resize-none text-sm"
                            />
                            <FieldError message={errors.remarks} />
                        </div>
                    </div>

                    <DialogFooter className="border-t border-border bg-muted/30 px-5 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing || !form.title || !form.to_office_id}
                            className="text-xs"
                        >
                            {processing ? "Submitting..." : "Create & Forward"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function OutgoingIndex({
    ourOffice,
    otherOffices,
    departmentId,
    departments,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()
    const [tab, setTab] = useState<"our" | "other">("our")
    const [modalOpen, setModalOpen] = useState(false)

    const ourActive = ourOffice.filter(
        (document) => !["completed", "cancelled"].includes(document.status),
    ).length
    const ourTotal = ourOffice.length
    const otherTotal = otherOffices.length

    const sharedTableProps = {
        getRowId: (row: OutgoingRow) => String(row.id),
        searchColumnId: "title",
        searchPlaceholder: "Search by title...",
        filters: [
            { columnId: "office_status", title: "Status", options: officeStatusOptions },
        ],
        defaultPageSize: 25,
        onRowClick: (row: { original: OutgoingRow }) =>
            router.visit(route("document-tracking.show", row.original.id)),
        addButton: {
            label: "New Request",
            onClick: () => setModalOpen(true),
        },
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outgoing Requests" />

            <div className="flex flex-col gap-5 px-5 pb-8 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Outgoing Requests
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Requests created or previously forwarded by your department
                        </p>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StatCard
                        title="Our Requests"
                        value={ourTotal}
                        description="Created by your department"
                        icon={<FileText className="m-2 h-4 w-4 text-primary" />}
                    />
                    <StatCard
                        title="Still Active"
                        value={ourActive}
                        description="In progress"
                        icon={<GitBranch className="m-2 h-4 w-4 text-blue-500" />}
                    />
                    <StatCard
                        title="Other Offices"
                        value={otherTotal}
                        description="Previously forwarded by you"
                        icon={<Building2 className="m-2 h-4 w-4 text-indigo-500" />}
                    />
                </div>

                <Tabs
                    value={tab}
                    onValueChange={(value) => setTab(value as "our" | "other")}
                    className="flex flex-col gap-0"
                >
                    <div className="border-b border-border">
                        <TabsList className="h-auto gap-0 bg-transparent p-0">
                            <TabsTrigger
                                value="our"
                                className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 pr-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                My Requests
                                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                                    ({ourTotal})
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="other"
                                className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Forwards
                                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                                    ({otherTotal})
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="our" className="mt-4">
                        <DataTable
                            key="our"
                            columns={getColumns(departmentId, false)}
                            data={ourOffice}
                            {...sharedTableProps}
                        />
                    </TabsContent>

                    <TabsContent value="other" className="mt-4">
                        <DataTable
                            key="other"
                            columns={getColumns(departmentId, true)}
                            data={otherOffices}
                            {...sharedTableProps}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <NewRequestModal
                open={modalOpen}
                departments={departments}
                onClose={() => setModalOpen(false)}
            />
        </AppLayout>
    )
}
