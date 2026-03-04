"use client"

import * as React from "react"
import { DataTable } from "@/components/shared/data-table/data-table"
import { getColumns } from "./components/columns"
import type { LeaveType } from "./data/schema"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { Trash2, Plus } from "lucide-react"

type Props = {
    leave_types: LeaveType[]
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

interface LeaveTypeModalProps {
    open: boolean
    editingLeaveType: LeaveType | null
    onClose: () => void
}

function LeaveTypeModal({
    open,
    editingLeaveType,
    onClose,
}: LeaveTypeModalProps) {
    const isEdit = editingLeaveType !== null

    // Local state for dynamic requirements list
    const [requirementInputs, setRequirementInputs] = React.useState<
        { leave_type_requirement_id?: number; requirement_name: string }[]
    >(() =>
        editingLeaveType?.requirements?.map((r) => ({
            leave_type_requirement_id: r.leave_type_requirement_id,
            requirement_name: r.requirement_name,
        })) ?? []
    )

    const { data, setData, post, put, processing, errors, reset } = useForm({
        leave_type_name: editingLeaveType?.leave_type_name ?? "",
        leave_type_description: editingLeaveType?.leave_type_description ?? "",
        eligible_sex: editingLeaveType?.eligible_sex ?? "",
        is_paid: editingLeaveType ? String(editingLeaveType.is_paid) : "",
        is_convertible: editingLeaveType ? String(editingLeaveType.is_convertible) : "",
        status: editingLeaveType ? String(editingLeaveType.status) : "",
        requirements: editingLeaveType?.requirements ?? [],
    })

    // Sync requirements into form data whenever the local list changes
    React.useEffect(() => {
        setData("requirements", requirementInputs as any)
    }, [requirementInputs])

    function addRequirement() {
        setRequirementInputs((prev) => [
            ...prev,
            { requirement_name: "" },
        ])
    }

    function removeRequirement(index: number) {
        setRequirementInputs((prev) => prev.filter((_, i) => i !== index))
    }

    function updateRequirement(
        index: number,
        value: string
    ) {
        setRequirementInputs((prev) =>
            prev.map((req, i) => (i === index ? { ...req, requirement_name: value } : req))
        )
    }

    function handleClose() {
        reset()
        setRequirementInputs([])
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Build final payload including requirements
        const payload = {
            ...data,
            requirements: requirementInputs,
        }

        if (isEdit) {
            put(route("leave.update", editingLeaveType!.leave_type_id), {
                data: payload,
                onSuccess: handleClose,
            } as any)
        } else {
            post(route("leave.store"), {
                data: payload,
                onSuccess: handleClose,
            } as any)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader className="px-5 py-4 border-b shrink-0">
                    <DialogTitle className="text-sm font-semibold">
                        {isEdit ? "Edit Leave Type" : "Create Leave Type"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable body */}
                    <div className="px-5 py-5 space-y-4 overflow-y-auto flex-1">
                        <p className="text-xs text-muted-foreground">
                            All fields with <span className="text-red-600">*</span> are required.
                        </p>

                        {/* Leave Type Name */}
                        <div>
                            <label className="text-xs font-medium">
                                Leave Type Name <span className="text-red-600">*</span>
                            </label>
                            <Input
                                value={data.leave_type_name}
                                onChange={(e) => setData("leave_type_name", e.target.value)}
                                className="text-sm mt-1"
                                placeholder="e.g. Maternity Leave"
                            />
                            <FieldError message={errors.leave_type_name} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-medium">Description</label>
                            <Textarea
                                value={data.leave_type_description}
                                onChange={(e) => setData("leave_type_description", e.target.value)}
                                rows={3}
                                className="text-sm mt-1"
                                placeholder="The description is optional..."
                            />
                            <FieldError message={errors.leave_type_description} />
                        </div>


                        <section className="grid grid-cols-2 gap-5">
                            {/* Eligible Sex */}
                            <div>
                                <label className="text-xs font-medium">
                                    Eligible Sex <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.eligible_sex}
                                    onValueChange={(v) => setData("eligible_sex", v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select eligible sex" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.eligible_sex} />
                            </div>

                            {/* Compensation Status */}
                            <div>
                                <label className="text-xs font-medium">
                                    Compensation Status <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_paid}
                                    onValueChange={(v) => setData("is_paid", v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select compensation status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Paid</SelectItem>
                                        <SelectItem value="0">Not Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </section>


                        <section className="grid grid-cols-2 gap-5">
                            {/* Cash Convertible */}
                            <div>
                                <label className="text-xs font-medium">
                                    Cash Convertible Status <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.is_convertible}
                                    onValueChange={(v) => setData("is_convertible", v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select cash conversion status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Convertible</SelectItem>
                                        <SelectItem value="0">Not Convertible</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-medium">
                                    Status <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) => setData("status", v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="0">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </section>

                        {/* ── Requirements ── */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium">Requirements</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={addRequirement}
                                >
                                    <Plus className="w-3 h-3" />
                                    Requirement
                                </Button>
                            </div>

                            {requirementInputs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    No requirements added yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {requirementInputs.map((req, index) => (
                                        <div
                                            key={index}
                                            className="bg-muted/20 relative flex items-center gap-2"
                                        >
                                            <Input
                                                value={req.requirement_name}
                                                onChange={(e) =>
                                                    updateRequirement(index, e.target.value)
                                                }
                                                className="text-sm"
                                                placeholder="e.g. Medical Certificate"
                                            />
                                            {(errors as any)[`requirements.${index}.requirement_name`] && (
                                                <FieldError
                                                    message={(errors as any)[`requirements.${index}.requirement_name`]}
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeRequirement(index)}
                                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                                title="Remove requirement"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t bg-muted/30 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? "Saving..." : isEdit ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function LeaveTypeIndex({ leave_types }: Props) {
    const [modalOpen, setModalOpen] = React.useState(false)
    const [editingLeaveType, setEditingLeaveType] = React.useState<LeaveType | null>(null)

    function openCreate() {
        setEditingLeaveType(null)
        setModalOpen(true)
    }

    function openEdit(leaveType: LeaveType) {
        setEditingLeaveType(leaveType)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingLeaveType(null)
    }

    const columns = getColumns({ onEdit: openEdit })

    return (
        <section className="space-y-4">
            <DataTable
                columns={columns}
                data={leave_types}
                getRowId={(row) => String(row.leave_type_id)}
                searchColumnId="leave_type_name"
                searchPlaceholder="Search leave types..."
                filters={[
                    {
                        columnId: "eligible_sex",
                        title: "Eligible Sex",
                        options: [
                            { label: "All", value: "All" },
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                        ],
                    },
                    {
                        columnId: "is_paid",
                        title: "Paid",
                        options: [
                            { label: "Paid", value: true },
                            { label: "Not Paid", value: false },
                        ],
                    },
                    {
                        columnId: "is_convertible",
                        title: "Convertible",
                        options: [
                            { label: "Convertible", value: true },
                            { label: "Not Convertible", value: false },
                        ],
                    },
                    {
                        columnId: "status",
                        title: "Status",
                        options: [
                            { label: "Active", value: true },
                            { label: "Inactive", value: false },
                        ],
                    },
                ]}
                addButton={{
                    label: "Add Leave Type",
                    onClick: openCreate,
                }}
            />

            <LeaveTypeModal
                key={editingLeaveType?.leave_type_id ?? "create"}
                open={modalOpen}
                editingLeaveType={editingLeaveType}
                onClose={closeModal}
            />
        </section>
    )
}