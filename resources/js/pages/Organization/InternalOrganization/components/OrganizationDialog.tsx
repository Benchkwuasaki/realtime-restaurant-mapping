import { useForm } from "@inertiajs/react"
import { useEffect } from "react"
import { route } from "ziggy-js"

import { Button } from "@/components/ui/button"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { type InternalOrganization } from "../data/schema"

// ─── Types ──────────────────────────────────────────────────────────────────────

type OrganizationType = "Union" | "Cooperative" | "Association"

// ─── Props ──────────────────────────────────────────────────────────────────────

interface OrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization?: InternalOrganization | null
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function OrganizationDialog({ open, onOpenChange, organization }: OrganizationDialogProps) {
    const isEditing = !!organization

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: "",
        name: "",
        type: "" as OrganizationType | "",
        head: "",
        payroll_deduction_linked: false,
        status: true,
    })

    useEffect(() => {
        if (organization) {
            setData({
                code: organization.code ?? "",
                name: organization.name ?? "",
                type: (organization.type ?? "") as OrganizationType | "",
                head: organization.head ?? "",
                payroll_deduction_linked: organization.payroll_deduction_linked ?? false,
                status: organization.status ?? true,
            })
        }
    }, [organization])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEditing) {
            put(route("internal-organization.update", organization.internal_organization_id), {
                preserveScroll: true,
                onSuccess: () => { reset(); onOpenChange(false) },
            })
        } else {
            post(route("internal-organization.store"), {
                preserveScroll: true,
                onSuccess: () => { reset(); onOpenChange(false) },
            })
        }
    }

    function handleOpenChange(value: boolean) {
        if (!value) reset()
        onOpenChange(value)
    }

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

                    {/* ── Row: Code + Type ─────────────────────────────────────────── */}
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

                        <div className="grid gap-1.5">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={data.type}
                                onValueChange={(v) => setData("type", v as OrganizationType)}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Union">Union</SelectItem>
                                    <SelectItem value="Cooperative">Cooperative</SelectItem>
                                    <SelectItem value="Association">Association</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-destructive text-xs">{errors.type}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Name ─────────────────────────────────────────────────────── */}
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

                    {/* ── Head ─────────────────────────────────────────────────────── */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="head">Head</Label>
                        <Input
                            id="head"
                            value={data.head}
                            onChange={(e) => setData("head", e.target.value)}
                            placeholder="Name of the organization head"
                        />
                        {errors.head && (
                            <p className="text-destructive text-xs">{errors.head}</p>
                        )}
                    </div>

                    {/* ── Toggles ───────────────────────────────────────────────────── */}
                    <div className="grid gap-3">
                        <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3">
                            <div className="grid gap-0.5">
                                <Label htmlFor="payroll_deduction_linked" className="cursor-pointer text-sm font-medium">
                                    Payroll Deduction Linked
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                    Link this organization to payroll deductions
                                </p>
                            </div>
                            <Switch
                                id="payroll_deduction_linked"
                                checked={data.payroll_deduction_linked}
                                onCheckedChange={(checked) => setData("payroll_deduction_linked", checked)}
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
                                onCheckedChange={(checked) => setData("status", checked)}
                            />
                        </div>
                    </div>
                </form>
                    <DialogFooter showCloseButton>
                        <Button
                            type="submit"
                            form="organization-form"
                            disabled={processing}
                        >
                            {processing ? "Saving..." : isEditing ? "Update Organization" : "Save Organization"}
                        </Button>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}