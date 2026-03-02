import { Head, router, useForm } from "@inertiajs/react"
import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardAction, CardContent, CardDescription } from "@/components/ui/card"

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
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

import { columns } from "./components/columns"
import { type InternalOrganization } from "./data/schema"

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrganizationType = "Union" | "Cooperative" | "Association"

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Internal Organizations", href: route("internal-organization.index") },
]

// ─── Add Organization Dialog ───────────────────────────────────────────────────

interface AddOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface StatCardProps {
  title: string
  value: number
  description?: string
  icon: React.ReactNode
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="bg-muted text-muted-foreground rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        {description && (
          <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}

function AddOrganizationDialog({ open, onOpenChange }: AddOrganizationDialogProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    code: "",
    name: "",
    type: "" as OrganizationType | "",
    head: "",
    payroll_deduction_linked: false,
    status: true,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post(route("internal-organization.store"), {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Organization</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new internal organization.
          </DialogDescription>
        </DialogHeader>

        <form id="add-organization-form" onSubmit={handleSubmit} className="grid gap-4 py-2">

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
            form="add-organization-form"
            disabled={processing}
          >
            {processing ? "Saving..." : "Save Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Organization Dialog ──────────────────────────────────────────────────

interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: InternalOrganization | null
}

function EditOrganizationDialog({ open, onOpenChange, organization }: EditOrganizationDialogProps) {
  const { data, setData, put, processing, errors, reset } = useForm({
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
    if (!organization) return
    put(route("internal-organization.update", organization.internal_organization_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the details for this internal organization.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-organization-form" onSubmit={handleSubmit} className="grid gap-4 py-2">

          {/* ── Row: Code + Type ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={data.code}
                onChange={(e) => setData("code", e.target.value)}
                placeholder="e.g. ORG-001"
              />
              {errors.code && (
                <p className="text-destructive text-xs">{errors.code}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={data.type}
                onValueChange={(v) => setData("type", v as OrganizationType)}
              >
                <SelectTrigger id="edit-type">
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
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
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
            <Label htmlFor="edit-head">Head</Label>
            <Input
              id="edit-head"
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
                <Label htmlFor="edit-payroll" className="cursor-pointer text-sm font-medium">
                  Payroll Deduction Linked
                </Label>
                <p className="text-muted-foreground text-xs">
                  Link this organization to payroll deductions
                </p>
              </div>
              <Switch
                id="edit-payroll"
                checked={data.payroll_deduction_linked}
                onCheckedChange={(checked) => setData("payroll_deduction_linked", checked)}
              />
            </div>

            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-status" className="cursor-pointer text-sm font-medium">
                  Active
                </Label>
                <p className="text-muted-foreground text-xs">
                  Set the organization as active or inactive
                </p>
              </div>
              <Switch
                id="edit-status"
                checked={data.status}
                onCheckedChange={(checked) => setData("status", checked)}
              />
            </div>
          </div>
        </form>

        <DialogFooter showCloseButton>
          <Button
            type="submit"
            form="edit-organization-form"
            disabled={processing}
          >
            {processing ? "Saving..." : "Update Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  organizations: InternalOrganization[]
  totalOrganizations: number
  activeOrganizations: number
  inactiveOrganizations: number
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Index({
  organizations,
  totalOrganizations,
  activeOrganizations,
  inactiveOrganizations,
}: Props) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<InternalOrganization | null>(null)

  const tableColumns = useMemo(
    () => columns({ onEdit: (org) => setEditingOrg(org) }),
    []
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Internal Organizations" />

      <div className="flex h-full flex-1 flex-col gap-8 p-8">

        <div className="max-w-300 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Organizations"
            value={totalOrganizations}
            description="All registered organizations"
            icon={<Building2 className="size-4 text-destructive" />}
          />
          <StatCard
            title="Active"
            value={activeOrganizations}
            description="Currently active organizations"
            icon={<CheckCircle2 className="size-4 text-green-500" />}
          />
          <StatCard
            title="Inactive"
            value={inactiveOrganizations}
            description="Currently inactive organizations"
            icon={<XCircle className="size-4 text-destructive" />}
          />
        </div>
        {/* ── Table ────────────────────────────────────────────────────────── */}
        <DataTable
          data={organizations}
          columns={tableColumns}
          getRowId={(row) => String(row.internal_organization_id)}
          onRowClick={(row) =>
            router.get(route("internal-organization.show", row.original.internal_organization_id))
          }
          defaultPageSize={10}
          searchColumnId="name"
          searchPlaceholder="Search organizations..."
          addButton={{
            label: "Add Organization",
            onClick: () => setAddDialogOpen(true),
          }}
          bulkDelete={{
            route: route("internal-organization.bulk-destroy"),
            entityName: "Organization",
            getId: (row) => (row as InternalOrganization).id,
          }}
        />
      </div>

      {/* ── Add Organization Modal ──────────────────────────────────────────── */}
      <AddOrganizationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* ── Edit Organization Modal ─────────────────────────────────────────── */}
      <EditOrganizationDialog
        open={!!editingOrg}
        onOpenChange={(open) => { if (!open) setEditingOrg(null) }}
        organization={editingOrg}
      />
    </AppLayout>
  )
}