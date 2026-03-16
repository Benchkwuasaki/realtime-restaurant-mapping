"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { CornerDownLeft, Clock, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { type WhereaboutSlip } from "../data/schema"
import {
    DataTableRowActions,
    editAction,
    deleteAction,
} from "@/components/shared/data-table/data-table-row-action"

// ─── GeoRisk API base URLs ────────────────────────────────────────────────────

const ARCGIS_PROV = "https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Provincial/MapServer/0"
const ARCGIS_MUNI = "https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Municipal/MapServer/0"
const ARCGIS_BRGY = "https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4"

// ─── Module-level name cache ──────────────────────────────────────────────────
// Shared across all LocationCell instances so the same code is never fetched
// more than once per page load, even when the table re-renders.

const provNameCache = new Map<string, Promise<string>>()
const muniNameCache = new Map<string, Promise<string>>()
const brgyNameCache = new Map<string, Promise<string>>()

function fetchProvName(provCode: string): Promise<string> {
    if (!provNameCache.has(provCode)) {
        provNameCache.set(
            provCode,
            fetch(
                `${ARCGIS_PROV}/query?f=json` +
                `&where=${encodeURIComponent(`prov_code='${provCode}'`)}` +
                `&outFields=prov_name&returnGeometry=false`
            )
                .then((r) => r.json())
                .then((d) => (d.features?.[0]?.attributes?.prov_name as string) ?? provCode)
                .catch(() => provCode)
        )
    }
    return provNameCache.get(provCode)!
}

function fetchMuniName(cityCode: string): Promise<string> {
    if (!muniNameCache.has(cityCode)) {
        muniNameCache.set(
            cityCode,
            fetch(
                `${ARCGIS_MUNI}/query?f=json` +
                `&where=${encodeURIComponent(`city_code='${cityCode}'`)}` +
                `&outFields=city_name&returnGeometry=false`
            )
                .then((r) => r.json())
                .then((d) => (d.features?.[0]?.attributes?.city_name as string) ?? cityCode)
                .catch(() => cityCode)
        )
    }
    return muniNameCache.get(cityCode)!
}

function fetchBrgyName(brgyCode: string): Promise<string> {
    if (!brgyNameCache.has(brgyCode)) {
        brgyNameCache.set(
            brgyCode,
            fetch(
                `${ARCGIS_BRGY}/query?f=json` +
                `&where=${encodeURIComponent(`brgy_code='${brgyCode}'`)}` +
                `&outFields=brgy_name&returnGeometry=false`
            )
                .then((r) => r.json())
                .then((d) => (d.features?.[0]?.attributes?.brgy_name as string) ?? brgyCode)
                .catch(() => brgyCode)
        )
    }
    return brgyNameCache.get(brgyCode)!
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

export function formatEmployeeName(employee?: WhereaboutSlip["employee"]) {
    if (!employee?.basic_info) return "—"
    const { first_name, last_name, name_extension } = employee.basic_info
    return [first_name, last_name, name_extension].filter(Boolean).join(" ")
}

function formatDate(value?: string | null) {
    if (!value) return "—"
    const date = new Date(value)
    if (isNaN(date.getTime())) return value
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatTime(value?: string | null) {
    if (!value) return "—"
    const [hh, mm] = value.split(":")
    const h = parseInt(hh, 10)
    const m = mm ?? "00"
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${hour12}:${m} ${period}`
}

function timeToMinutes(time?: string | null): number {
    if (!time) return 0
    const [hh, mm] = time.split(":")
    return parseInt(hh, 10) * 60 + parseInt(mm, 10)
}

// ─── LocationCell ─────────────────────────────────────────────────────────────
// Fetches province, municipality, and barangay names in parallel on first mount.
// Falls back to the raw code while loading, and silently falls back to the code
// on error (fetch helpers already handle that).

interface LocationNames {
    prov: string
    muni: string
    brgy: string
}

function LocationCell({ slip }: { slip: WhereaboutSlip }) {
    const { prov_code, city_code, brgy_code } = slip

    const [names, setNames] = useState<LocationNames | null>(null)

    useEffect(() => {
        if (!prov_code && !city_code && !brgy_code) return

        let cancelled = false

        Promise.all([
            prov_code ? fetchProvName(prov_code) : Promise.resolve(null),
            city_code ? fetchMuniName(city_code) : Promise.resolve(null),
            brgy_code ? fetchBrgyName(brgy_code) : Promise.resolve(null),
        ]).then(([prov, muni, brgy]) => {
            if (!cancelled) {
                setNames({
                    prov: prov ?? "—",
                    muni: muni ?? "—",
                    brgy: brgy ?? "—",
                })
            }
        })

        return () => { cancelled = true }
    }, [prov_code, city_code, brgy_code])

    // No location data at all
    if (!prov_code && !city_code && !brgy_code) {
        return <span className="text-muted-foreground text-sm">—</span>
    }

    // Still loading
    if (!names) {
        return (
            <div className="space-y-1 min-w-[180px] animate-pulse">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
            </div>
        )
    }

    return (
        <div className="min-w-[180px] space-y-0.5">
            {/* Province */}
            {prov_code && (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-[52px] shrink-0">
                        Prov
                    </span>
                    <span className="text-sm font-medium text-foreground leading-tight">
                        {names.prov}
                    </span>
                </div>
            )}
            {/* Municipality / City */}
            {city_code && (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-[52px] shrink-0">
                        Muni
                    </span>
                    <span className="text-sm text-foreground/80 leading-tight">
                        {names.muni}
                    </span>
                </div>
            )}
            {/* Barangay */}
            {brgy_code && (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-[52px] shrink-0">
                        Brgy
                    </span>
                    <span className="text-sm text-foreground/60 leading-tight">
                        {names.brgy}
                    </span>
                </div>
            )}
        </div>
    )
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

interface TimeInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
    min?: string
}

function TimeInput({ id, value, onChange, min }: TimeInputProps) {
    const normalized = value ? value.slice(0, 5) : ""
    return (
        <Input
            id={id}
            type="time"
            value={normalized}
            min={min}
            onChange={(e) => onChange(e.target.value ? `${e.target.value}:00` : "")}
            className="w-32 text-sm"
        />
    )
}

// ─── Time Returned Dialog ─────────────────────────────────────────────────────

interface TimeReturnedFormData {
    time_returned: string
    time_noted: string
}

interface TimeReturnedDialogProps {
    open: boolean
    slip: WhereaboutSlip | null
    onClose: () => void
}

function TimeReturnedDialog({ open, slip, onClose }: TimeReturnedDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm<TimeReturnedFormData>({
        time_returned: slip?.time_returned ?? "",
        time_noted: slip?.time_noted ?? "",
    })

    const [clientErrors, setClientErrors] = useState<Partial<TimeReturnedFormData>>({})

    const timeOutMinutes = timeToMinutes(slip?.time_out)
    const timeOutFormatted = slip?.time_out ? slip.time_out.slice(0, 5) : undefined

    function validate(): boolean {
        const errs: Partial<TimeReturnedFormData> = {}

        if (!data.time_returned) {
            errs.time_returned = "Time returned is required."
        } else if (timeToMinutes(data.time_returned) <= timeOutMinutes) {
            errs.time_returned = `Must be after time out (${formatTime(slip?.time_out)}).`
        }

        if (!data.time_noted) {
            errs.time_noted = "Time noted is required."
        } else if (timeToMinutes(data.time_noted) <= timeOutMinutes) {
            errs.time_noted = `Must be after time out (${formatTime(slip?.time_out)}).`
        } else if (timeToMinutes(data.time_noted) <= timeToMinutes(data.time_returned)) {
            errs.time_noted = `Must be after time returned (${formatTime(data.time_returned)}).`
        }

        setClientErrors(errs)
        return Object.keys(errs).length === 0
    }

    function handleClose() { reset(); setClientErrors({}); onClose() }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        put(route("whereabout-slip.log-return", slip!.whereabout_slip_id), { onSuccess: handleClose })
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-sm">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CornerDownLeft className="w-4 h-4 text-primary" />
                        Log Return
                        {slip && (
                            <span className="font-normal text-muted-foreground truncate max-w-[180px]">
                                — {formatEmployeeName(slip.employee)}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-5">
                        {slip?.time_out && (
                            <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                                Time Out:{" "}
                                <span className="font-medium text-foreground">{formatTime(slip.time_out)}</span>
                                {" "}— both times below must be after this.
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                                Time Returned <span className="text-destructive">*</span>
                            </label>
                            <TimeInput
                                value={data.time_returned ?? ""}
                                onChange={(v) => {
                                    setData("time_returned", v)
                                    setClientErrors((prev) => ({ ...prev, time_returned: undefined }))
                                }}
                                min={timeOutFormatted}
                            />
                            <FieldError message={clientErrors.time_returned ?? errors.time_returned} />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                                Time Noted <span className="text-destructive">*</span>
                            </label>
                            <TimeInput
                                value={data.time_noted ?? ""}
                                onChange={(v) => {
                                    setData("time_noted", v)
                                    setClientErrors((prev) => ({ ...prev, time_noted: undefined }))
                                }}
                                min={data.time_returned ? data.time_returned.slice(0, 5) : timeOutFormatted}
                            />
                            <FieldError message={clientErrors.time_noted ?? errors.time_noted} />
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs">
                            {processing ? "Saving…" : "Confirm Return"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Time Returned Cell ───────────────────────────────────────────────────────

function TimeReturnedCell({ slip }: { slip: WhereaboutSlip }) {
    const [open, setOpen] = useState(false)
    const isReturned = slip.return_status === "returned"

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isReturned}
                title={isReturned ? "Already returned" : "Log return time"}
                onClick={(e) => { e.stopPropagation(); setOpen(true) }}
            >
                <Clock className={isReturned ? "w-4 h-4 text-muted-foreground/40" : "w-4 h-4 text-primary"} />
            </Button>

            <TimeReturnedDialog open={open} slip={slip} onClose={() => setOpen(false)} />
        </>
    )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

interface ColumnOptions {
    onEdit: (slip: WhereaboutSlip) => void
    onDelete: (slip: WhereaboutSlip) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<WhereaboutSlip>[] {
    return [
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
            id: "employee",
            accessorFn: (row) => formatEmployeeName(row.employee),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Employee" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[160px] font-medium">
                    {formatEmployeeName(row.original.employee)}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "date_filed",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date Filed" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[120px] text-sm">
                    {formatDate(row.getValue("date_filed"))}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "purpose_type",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Purpose Type" />
            ),
            cell: ({ row }) => {
                const v = row.getValue<string>("purpose_type")
                return (
                    <div className="min-w-[90px]">
                        <Badge variant={v === "official" ? "default" : "secondary"}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </Badge>
                    </div>
                )
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "purpose_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Purpose" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[180px] max-w-[260px] truncate text-sm text-muted-foreground">
                    {row.getValue("purpose_description")}
                </div>
            ),
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "time_out",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Time Out" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[90px] tabular-nums text-sm">
                    {formatTime(row.getValue("time_out"))}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "time_returned",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Time Returned" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[110px] tabular-nums text-sm">
                    {row.original.return_status === "returned"
                        ? formatTime(row.getValue("time_returned"))
                        : <span className="text-muted-foreground">—</span>
                    }
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        // ── Location ──────────────────────────────────────────────────────────
        {
            id: "location",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Location" />
            ),
            cell: ({ row }) => <LocationCell slip={row.original} />,
            enableSorting: false,
            enableHiding: true,
        },
        // ─────────────────────────────────────────────────────────────────────
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue<string>("status")
                return (
                    <Badge variant={status === "pending" ? "yellow" : "green"}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                )
            },
            filterFn: (row, _id, value: string[]) => value.includes(row.getValue("status")),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "return_status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Return" />
            ),
            cell: ({ row }) => {
                const v = row.getValue<string>("return_status")
                return (
                    <Badge variant={v === "returned" ? "green" : "destructive"}>
                        {v === "returned" ? "Returned" : "Not Returned"}
                    </Badge>
                )
            },
            filterFn: (row, _id, value: string[]) =>
                value.includes(row.getValue("return_status")),
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => <TimeReturnedCell slip={row.original} />,
            enableHiding: false,
        },
    ]
}