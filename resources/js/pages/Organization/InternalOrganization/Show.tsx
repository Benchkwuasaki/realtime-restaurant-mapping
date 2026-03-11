"use client"

import { Head, router, useForm } from "@inertiajs/react"
import { type ColumnDef } from "@tanstack/react-table"
import {
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Pencil,
    Search,
    Tag,
    Trash2,
    User,
    UserPlus,
    XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

import { OrganizationDialog } from "./components/OrganizationDialog"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrganizationMember {
    id: string
    name: string
    position: string
    department: string
    status: boolean
}

interface AvailableEmployee {
    id: string
    name: string
    position: string
    department: string
}

interface InternalOrganization {
    internal_organization_id: string
    code: string
    name: string
    type: "Union" | "Cooperative" | "Association"
    head: string
    payroll_deduction_linked: boolean
    status: boolean
    created_at: string
    updated_at: string
    members?: OrganizationMember[]
}

interface Props {
    organization: InternalOrganization
    availableEmployees: AvailableEmployee[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

const typeColorMap: Record<string, string> = {
    Union: "bg-primary/10 text-primary border-primary/20",
    Cooperative: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    Association: "bg-chart-3/10 text-chart-3 border-chart-3/20",
}

// ─── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
    label,
    icon,
    children,
}: {
    label: string
    icon: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1 py-3">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest">
                <span className="text-primary/50">{icon}</span>
                {label}
            </span>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    )
}

// ─── Mobile Member Card ────────────────────────────────────────────────────────

interface MobileMemberCardProps {
    row: OrganizationMember
}

function MobileMemberCard({ row }: MobileMemberCardProps) {
    return (
        <div className="flex flex-col bg-background overflow-hidden">
            <div className="px-4 pt-4 pb-5 space-y-2">
                <span className="font-semibold text-base text-foreground">
                    {row.name}
                </span>
                <div className="flex flex-col gap-0.5">
                    {row.position && (
                        <span className="text-xs text-muted-foreground">
                            {row.position}
                            {row.department && <> · {row.department}</>}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <Badge variant={row.status ? "default" : "destructive"} className="text-xs">
                    {row.status ? "Active" : "Inactive"}
                </Badge>
            </div>
        </div>
    )
}

// ─── Member Columns ────────────────────────────────────────────────────────────

const memberColumns: ColumnDef<OrganizationMember>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                aria-label="Select all"
                className="translate-y-0.5"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
                aria-label="Select row"
                className="translate-y-0.5"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
            <div className="min-w-[140px] font-medium">{row.getValue("name")}</div>
        ),
        mobileCard: (row) => <MobileMemberCard row={row} />,
    },
    {
        accessorKey: "position",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
        cell: ({ row }) => (
            <div className="min-w-[120px]">
                <span className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
                    {row.getValue("position")}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => (
            <div className="min-w-[130px] text-sm">{row.getValue("department")}</div>
        ),
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const isActive: boolean = row.getValue("status")
            return (
                <Badge variant={isActive ? "default" : "destructive"}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            )
        },
        filterFn: (row, id, value: boolean[]) => value.includes(row.getValue(id)),
    },
]

// ─── Add Member Dialog ─────────────────────────────────────────────────────────

interface AddMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: InternalOrganization
    availableEmployees: AvailableEmployee[]
}

function AddMemberDialog({
    open,
    onOpenChange,
    organization,
    availableEmployees,
}: AddMemberDialogProps) {
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [processing, setProcessing] = useState(false)

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return availableEmployees
        return availableEmployees.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.position.toLowerCase().includes(q) ||
                e.department.toLowerCase().includes(q),
        )
    }, [availableEmployees, search])

    function toggleEmployee(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) { next.delete(id) } else { next.add(id) }
            return next
        })
    }

    function toggleAll() {
        if (selectedIds.size === filtered.length && filtered.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filtered.map((e) => e.id)))
        }
    }

    function handleSubmit() {
        if (selectedIds.size === 0) return
        setProcessing(true)
        router.post(
            route("internal-organization.members.store", organization.internal_organization_id),
            { employee_ids: Array.from(selectedIds) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set())
                    setSearch("")
                    onOpenChange(false)
                },
                onFinish: () => setProcessing(false),
            },
        )
    }

    function handleOpenChange(value: boolean) {
        if (!value) {
            setSelectedIds(new Set())
            setSearch("")
        }
        onOpenChange(value)
    }

    const allFilteredSelected =
        filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id))
    const someFilteredSelected =
        filtered.some((e) => selectedIds.has(e.id)) && !allFilteredSelected

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
                <div className="shrink-0 space-y-4 p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle>Add Members</DialogTitle>
                        <DialogDescription>
                            Search and select employees to add to{" "}
                            <span className="text-foreground font-semibold">{organization.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            className="pl-9"
                            placeholder="Search by name, position, or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 rounded-md w-fit px-3 py-2">
                        <Checkbox
                            checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                            onCheckedChange={toggleAll}
                            aria-label="Select all filtered"
                            disabled={filtered.length === 0}
                        />
                        <span className="text-muted-foreground text-xs">
                            {filtered.length === 0
                                ? "No employees to select"
                                : allFilteredSelected
                                    ? `All ${filtered.length} shown selected`
                                    : someFilteredSelected
                                        ? `${selectedIds.size} of ${filtered.length} selected`
                                        : `Select all ${filtered.length} shown`}
                        </span>
                    </div>
                </div>

                <ScrollArea className="min-h-0 flex-1 border-y">
                    {filtered.length === 0 ? (
                        <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                            {availableEmployees.length === 0
                                ? "All employees are already members."
                                : "No employees match your search."}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filtered.map((employee) => {
                                const isSelected = selectedIds.has(employee.id)
                                return (
                                    <div
                                        key={employee.id}
                                        className={`flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"}`}
                                        onClick={() => toggleEmployee(employee.id)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleEmployee(employee.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Select ${employee.name}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground truncate text-sm font-medium">
                                                {employee.name}
                                            </p>
                                            {(employee.position || employee.department) && (
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {[employee.position, employee.department].filter(Boolean).join(" · ")}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <span className="text-primary shrink-0 text-xs font-medium">✓</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="shrink-0 p-6 pt-4">
                    <DialogFooter showCloseButton>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing || selectedIds.size === 0}
                        >
                            {processing
                                ? "Adding..."
                                : selectedIds.size > 0
                                    ? `Add ${selectedIds.size} ${selectedIds.size === 1 ? "Member" : "Members"}`
                                    : "Add Members"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Organization Dialog ────────────────────────────────────────────────

interface DeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: InternalOrganization
}

function DeleteDialog({ open, onOpenChange, organization }: DeleteDialogProps) {
    const { delete: destroy, processing } = useForm()

    function handleDelete() {
        destroy(route("internal-organization.destroy", organization.internal_organization_id), {
            onSuccess: () => {
                onOpenChange(false)
                router.visit(route("internal-organization.index"))
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete Organization</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="text-foreground font-semibold">{organization.name}</span>? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                        {processing ? "Deleting..." : "Delete Organization"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Show({ organization, availableEmployees }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const { patch, processing } = useForm()

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Internal Organizations", href: route("internal-organization.index") },
        { title: organization.name, href: route("internal-organization.show", organization.internal_organization_id) },
    ]

    function handleToggleStatus() {
        patch(route("internal-organization.toggle-status", organization.internal_organization_id), {
            preserveScroll: true,
        })
    }

    const typeClass =
        typeColorMap[organization.type] ?? "bg-muted text-muted-foreground border-border"
    const members = organization.members ?? []

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={organization.name} />

            <div className="flex gap-5 p-5 min-h-full bg-background">

                {/* ── Left Sidebar ───────────────────────────────────────────────────── */}
                <aside className="w-72 shrink-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col p-5">

                    <div className="mb-4 flex flex-col items-center gap-3 text-center">
                        <div className="bg-primary/10 border-primary/20 flex h-20 w-20 items-center justify-center rounded-2xl border-2">
                            <Building2 className="text-primary h-10 w-10" />
                        </div>

                        <div>
                            <h1 className="text-foreground text-lg font-semibold leading-tight">
                                {organization.name}
                            </h1>
                            <p className="text-muted-foreground font-mono text-sm">{organization.code}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {organization.status ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="bg-chart-5 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                        <span className="bg-chart-5 relative inline-flex h-2 w-2 rounded-full" />
                                    </span>
                                    <span className="text-chart-5 text-xs font-medium">Active</span>
                                </>
                            ) : (
                                <>
                                    <span className="bg-muted-foreground/40 h-2 w-2 rounded-full" />
                                    <span className="text-muted-foreground text-xs font-medium">Inactive</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => setEditDialogOpen(true)}
                        >
                            <Pencil className="mr-1.5 h-3 w-3" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive text-xs"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>

                    <Separator className="mb-2" />

                    <div className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-widest">
                        Organization Info
                    </div>

                    <InfoRow label="Type" icon={<Tag className="h-3 w-3" />}>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeClass}`}>
                            {organization.type}
                        </span>
                    </InfoRow>

                    <Separator />

                    <InfoRow label="Head" icon={<User className="h-3 w-3" />}>
                        <span className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
                            {organization.head}
                        </span>
                    </InfoRow>

                    <Separator />

                    <InfoRow label="Payroll Deduction" icon={<CreditCard className="h-3 w-3" />}>
                        {organization.payroll_deduction_linked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                <CheckCircle2 className="text-chart-5 h-3.5 w-3.5" />
                                Linked
                            </span>
                        ) : (
                            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                                <XCircle className="h-3.5 w-3.5" />
                                Not Linked
                            </span>
                        )}
                    </InfoRow>

                    <Separator />

                    <InfoRow label="Date Created" icon={<Calendar className="h-3 w-3" />}>
                        <span className="text-foreground text-xs">{formatDate(organization.created_at)}</span>
                    </InfoRow>

                    <Separator />

                    <InfoRow label="Status" icon={<CheckCircle2 className="h-3 w-3" />}>
                        <Button
                            variant={organization.status ? "default" : "destructive"}
                            size="sm"
                            className="h-6 text-xs"
                            onClick={handleToggleStatus}
                            disabled={processing}
                        >
                            {organization.status ? "Activate" : "Deactivate"}
                        </Button>
                    </InfoRow>

                    <Separator className="mb-3" />

                    <p className="text-muted-foreground text-[10px]">
                        Last updated {formatDate(organization.updated_at)}
                    </p>
                </aside>

                {/* ── Right Content ──────────────────────────────────────────────────── */}
                <main className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-w-0 p-5">

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-foreground text-lg font-semibold">Members</h2>
                            <p className="text-muted-foreground text-sm">
                                Employees under{" "}
                                <span className="text-foreground font-medium">{organization.name}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                                {members.length} {members.length === 1 ? "member" : "members"}
                            </Badge>
                            <Button
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setAddMemberDialogOpen(true)}
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Add Member
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        data={members}
                        columns={memberColumns}
                        getRowId={(row) => row.id}
                        defaultPageSize={10}
                        searchColumnId="name"
                        searchPlaceholder="Search members..."
                    />
                </main>
            </div>

            {/* ── Edit Organization Modal ─────────────────────────────────────────── */}
            <OrganizationDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                organization={organization}
            />

            <AddMemberDialog
                open={addMemberDialogOpen}
                onOpenChange={setAddMemberDialogOpen}
                organization={organization}
                availableEmployees={availableEmployees}
            />

            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                organization={organization}
            />
        </AppLayout>
    )
}