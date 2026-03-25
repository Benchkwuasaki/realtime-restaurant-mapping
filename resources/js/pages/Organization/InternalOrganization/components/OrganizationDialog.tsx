import { router, useForm } from "@inertiajs/react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { route } from "ziggy-js"
import { toast } from 'sonner';
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { type InternalOrganization } from "../data/schema"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InternalOrgType {
    internal_org_type_id: number
    internal_org_type: string
}

export interface EmployeeOption {
    id: string
    name: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization?: InternalOrganization | null
    orgTypes?: InternalOrgType[]
    employees?: EmployeeOption[]
    redirectTo?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrganizationDialog({
    open,
    onOpenChange,
    organization,
    orgTypes: initialOrgTypes = [],
    employees = [],
    redirectTo,
}: OrganizationDialogProps) {
    const isEditing = !!organization

    // Local copy of org types so we can append a newly created one instantly
    const [orgTypes, setOrgTypes] = useState<InternalOrgType[]>(initialOrgTypes)

    // Keep in sync when the prop refreshes (e.g. after a page visit)
    useEffect(() => setOrgTypes(initialOrgTypes), [initialOrgTypes])

    // ── Main form ─────────────────────────────────────────────────────────────

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: "",
        name: "",
        internal_org_type_id: "" as string | number,
        head_employee_id: "",
        payroll_deduction_linked: false,
        status: true,
    })

    useEffect(() => {
        if (organization) {
            setData({
                code: organization.code ?? "",
                name: organization.name ?? "",
                internal_org_type_id: organization.internal_org_type_id ?? "",
                head_employee_id: String(organization.head_employee_id ?? ""),
                payroll_deduction_linked: organization.payroll_deduction_linked ?? false,
                status: organization.status ?? true,
            })
            setHeadSearch(organization.head ?? "")
        }
    }, [organization])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEditing) {
            put(route("internal-organization.update", organization.internal_organization_id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset()
                    onOpenChange(false)
                    if (redirectTo) {
                        router.visit(redirectTo)
                    }
                },
            })
        } else {
            post(route("internal-organization.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                    toast.success('Organization added successfully.');
                },
            })
        }
    }

    function handleOpenChange(value: boolean) {
        if (!value) {
            reset()
            setAddingType(false)
            setNewTypeName("")
            setHeadSearch("")
            setHeadOpen(false)
        }
        onOpenChange(value)
    }

    // ── Inline "Add Type" sub-form ────────────────────────────────────────────

    const [addingType, setAddingType] = useState(false)
    const [headSearch, setHeadSearch] = useState("")
    const [headOpen, setHeadOpen] = useState(false)
    const selectedEmployee = employees.find(e => e.id === data.head_employee_id)

    const filteredEmployees = headSearch.trim().length === 0
        ? employees
        : employees.filter((e) =>
            e.name.toLowerCase().includes(headSearch.toLowerCase())
        )
    const [newTypeName, setNewTypeName] = useState("")
    const [typeError, setTypeError] = useState<string | null>(null)
    const [savingType, setSavingType] = useState(false)

    function handleSaveType() {
        if (!newTypeName.trim()) {
            setTypeError("Type name is required.")
            return
        }
        setSavingType(true)
        setTypeError(null)

        router.post(
            route("internal-organization.org-type.store"),
            { internal_org_type: newTypeName.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const created = (page.props as Record<string, unknown>).newOrgType as InternalOrgType | undefined
                    if (created) {
                        setOrgTypes((prev) =>
                            [...prev, created].sort((a, b) =>
                                a.internal_org_type.localeCompare(b.internal_org_type)
                            )
                        )
                        setData("internal_org_type_id", created.internal_org_type_id)
                    }
                    setNewTypeName("")
                    setAddingType(false)
                },
                onError: (errors) => {
                    setTypeError(errors.internal_org_type ?? "Failed to save type.")
                },
                onFinish: () => setSavingType(false),
            }
        )
    }

    function handleOpenChange(value: boolean) {
        if (!value) { reset(); setAddingType(false); setNewTypeName(""); setHeadOpen(false) }
        onOpenChange(value)
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Organization" : "Add Organization"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the details for this internal organization."
                            : "Fill in the details below to create a new internal organization."}
                    </DialogDescription>
                </DialogHeader>

                <form id="organization-form" onSubmit={handleSubmit} className="grid gap-4 py-2">

                    {/* ── Row: Code + Type ──────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData("code", e.target.value)}
                                placeholder="e.g. ORG-001"
                            />
                            {errors.code && (
                                <p className="text-destructive text-xs">{errors.code}</p>
                            )}
                        </div>

                        {/* ── Type selector + inline add ───────────────────── */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="type">Type</Label>
                                {!addingType && (
                                    <button
                                        type="button"
                                        onClick={() => setAddingType(true)}
                                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                                    >
                                        <Plus className="size-3" />
                                        New type
                                    </button>
                                )}
                            </div>

                            {addingType ? (
                                /* ── Inline new-type form ─────────────────── */
                                <div className="grid gap-1.5">
                                    <div className="flex gap-1.5">
                                        <Input
                                            autoFocus
                                            value={newTypeName}
                                            onChange={(e) => { setNewTypeName(e.target.value); setTypeError(null) }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") { e.preventDefault(); handleSaveType() }
                                                if (e.key === "Escape") { setAddingType(false); setNewTypeName(""); setTypeError(null) }
                                            }}
                                            placeholder="e.g. Federation"
                                            className="h-9 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleSaveType}
                                            disabled={savingType}
                                            className="shrink-0"
                                        >
                                            {savingType ? "Saving…" : "Add"}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => { setAddingType(false); setNewTypeName(""); setTypeError(null) }}
                                            className="shrink-0"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    {typeError && (
                                        <p className="text-destructive text-xs">{typeError}</p>
                                    )}
                                </div>
                            ) : (
                                /* ── Normal dropdown ──────────────────────── */
                                <>
                                    <Select
                                        value={data.internal_org_type_id ? String(data.internal_org_type_id) : ""}
                                        onValueChange={(v) => setData("internal_org_type_id", Number(v))}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {orgTypes.map((t) => (
                                                <SelectItem
                                                    key={t.internal_org_type_id}
                                                    value={String(t.internal_org_type_id)}
                                                >
                                                    {t.internal_org_type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.internal_org_type_id && (
                                        <p className="text-destructive text-xs">{errors.internal_org_type_id}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Name ─────────────────────────────────────────────── */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Organization name"
                        />
                        {errors.name && (
                            <p className="text-destructive text-xs">{errors.name}</p>
                        )}
                    </div>

                    {/* ── Head ─────────────────────────────────────────────── */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="head">Head</Label>
                        <Popover open={headOpen} onOpenChange={setHeadOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="head"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={headOpen}
                                    className="w-full justify-between font-normal text-sm shadow-none hover:bg-background"
                                >
                                    <span className={cn("truncate", !selectedEmployee && "text-muted-foreground")}>
                                        {selectedEmployee ? selectedEmployee.name : "Select employee…"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command filter={(itemValue, search) =>
                                    itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                                }>
                                    <CommandInput placeholder="Search employee…" className="text-sm" />
                                    <CommandList className="max-h-52 overflow-y-auto">
                                        <CommandEmpty>No employees found.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((emp) => (
                                                <CommandItem
                                                    key={emp.id}
                                                    value={emp.name}
                                                    onSelect={() => {
                                                        setData("head_employee_id", data.head_employee_id === emp.id ? "" : emp.id)
                                                        setHeadOpen(false)
                                                    }}
                                                    className="text-sm"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", data.head_employee_id === emp.id ? "opacity-100" : "opacity-0")} />
                                                    {emp.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.head_employee_id && (
                            <p className="text-destructive text-xs">{errors.head_employee_id}</p>
                        )}
                    </div>

                    {/* ── Toggles ───────────────────────────────────────────── */}
                    <div className="grid gap-3">
                        <div className={`bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3 transition-opacity ${!data.status ? "opacity-50" : ""}`}>
                            <div className="grid gap-0.5">
                                <Label
                                    htmlFor="payroll_deduction_linked"
                                    className={`text-sm font-medium ${!data.status ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}`}
                                >
                                    Payroll Deduction Linked
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                    {!data.status
                                        ? "Unavailable while organization is inactive"
                                        : "Link this organization to payroll deductions"}
                                </p>
                            </div>
                            <Switch
                                id="payroll_deduction_linked"
                                checked={data.payroll_deduction_linked}
                                onCheckedChange={(checked) => setData("payroll_deduction_linked", checked)}
                                disabled={!data.status}
                            />
                        </div>

                        <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3">
                            <div className="grid gap-0.5">
                                <Label htmlFor="status" className="cursor-pointer text-sm font-medium">
                                    Active
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                    Set the organization as active or inactive
                                </p>
                            </div>
                            <Switch
                                id="status"
                                checked={data.status}
                                onCheckedChange={(checked) => {
                                    setData("status", checked)
                                    if (!checked) setData("payroll_deduction_linked", false)
                                }}
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter className="px-5 py-4 border-t border-border xs:flex xs:flex-row xs:justify-between bg-muted/30" showCloseButton>
                    <Button
                        type="submit"
                        form="organization-form"
                        disabled={processing}
                    >
                        {processing ? "Saving..." : isEditing ? "Update Organization" : "Save Organization"}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    )
}