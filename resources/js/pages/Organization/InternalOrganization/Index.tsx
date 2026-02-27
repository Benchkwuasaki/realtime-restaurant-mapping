import { Head, router, useForm } from "@inertiajs/react"
import { useState } from "react"
import { route } from "ziggy-js"

import { DataTable } from "@/components/shared/data-table/data-table"
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Internal Organizations" />

      <div className="flex h-full flex-1 flex-col gap-8 p-8">
        {/* ── Table ────────────────────────────────────────────────────────── */}
        <DataTable
          data={organizations}
          columns={columns}
          getRowId={(row) => String(row.id)}
          onRowClick={(row) =>
            router.get(route("internal-organization.show", row.original.id))
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
    </AppLayout>
  )
}