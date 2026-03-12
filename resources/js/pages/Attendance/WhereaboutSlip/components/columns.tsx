"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { CornerDownLeft, Clock } from "lucide-react"
import { useState } from "react"
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

// Convert "HH:MM:SS" or "HH:MM" to total minutes for easy comparison
function timeToMinutes(time?: string | null): number {
    if (!time) return 0
    const [hh, mm] = time.split(":")
    return parseInt(hh, 10) * 60 + parseInt(mm, 10)
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

interface TimeInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
    min?: string // "HH:MM" — browser will enforce visually
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

    // Client-side errors for time comparison
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

    function handleClose() {
        reset()
        setClientErrors({})
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        put(route("whereabout-slip.log-return", slip!.whereabout_slip_id), {
            onSuccess: handleClose,
        })
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

                        {/* Time Out reference — read only, so user knows the constraint */}
                        {slip?.time_out && (
                            <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                                Time Out: <span className="font-medium text-foreground">{formatTime(slip.time_out)}</span>
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
                            disabled={processing}
                            className="text-xs"
                        >
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
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(true)
                }}
            >
                <Clock
                    className={
                        isReturned
                            ? "w-4 h-4 text-muted-foreground/40"
                            : "w-4 h-4 text-primary"
                    }
                />
            </Button>

            <TimeReturnedDialog
                open={open}
                slip={slip}
                onClose={() => setOpen(false)}
            />
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
            cell: ({ row }) => (
                <TimeReturnedCell slip={row.original} />
                // <DataTableRowActions
                //     row={row}
                //     actions={[
                //         editAction(onEdit),
                //         deleteAction(onDelete, {
                //             getName: (s) =>
                //                 formatEmployeeName(s.employee) ||
                //                 `Slip #${s.whereabout_slip_id}`,
                //             description: (s) => (
                //                 <>
                //                     Are you sure you want to delete the whereabout slip for{" "}
                //                     <span className="font-medium text-foreground">
                //                         {formatEmployeeName(s.employee)}
                //                     </span>
                //                     ? This action cannot be undone.
                //                 </>
                //             ),
                //             confirmLabel: "Delete Slip",
                //         }),
                //     ]}
                // />
            ),
            enableHiding: false,
        },
    ]
}