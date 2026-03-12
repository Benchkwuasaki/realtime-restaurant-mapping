import { CheckCircle2, ChevronRight, Clock3, FileText, MapPinned, MessageSquareText, RotateCcw, Workflow, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type OfficeReference = {
    id: number
    name: string
    acronym: string
}

type DocumentTimelineAction = {
    id: number
    action: string
    label: string
    remarks: string | null
    acted_at: string | null
    actor_name: string | null
    office: OfficeReference | null
    from_office: OfficeReference | null
    to_office: OfficeReference | null
}

export type DocumentHistoryDetails = {
    title: string
    notes: string | null
    status: string
    office_status: string | null
    elapsed_time: string | null
    origin_office: OfficeReference | null
    current_office: OfficeReference | null
    final_office: OfficeReference | null
    flow: { office: OfficeReference; action: string | null }[]
    actions: DocumentTimelineAction[]
}

interface DocumentHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    document: DocumentHistoryDetails | null
}

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    filed: "secondary",
    in_progress: "default",
    completed: "default",
    cancelled: "destructive",
}

function formatStatus(status: string | null | undefined) {
    if (!status) return "Unknown"

    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDateTime(value: string | null) {
    if (!value) return "No timestamp"

    return new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

function TimelineIcon({ action }: { action: string }) {
    if (action === "returned") {
        return <RotateCcw className="h-4 w-4 text-amber-600" />
    }

    if (action === "completed") {
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    }

    if (action === "cancelled") {
        return <XCircle className="h-4 w-4 text-destructive" />
    }

    return <Clock3 className="h-4 w-4 text-primary" />
}

function OfficePill({
    office,
    action,
}: {
    office: OfficeReference
    action: string | null
}) {
    const tone = action === "returned"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : action === "completed"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : action === "cancelled"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-border bg-background text-foreground"

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs ${tone}`}>
                        <span>{office.acronym || office.name}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{office.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function timelineTone(action: string) {
    if (action === "returned") {
        return {
            dot: "border-amber-200 bg-amber-50",
            card: "border-amber-200/70 bg-amber-50/40",
            remarks: "bg-amber-100/50 text-amber-900",
        } as const
    }

    if (action === "completed") {
        return {
            dot: "border-emerald-200 bg-emerald-50",
            card: "border-emerald-200/70 bg-emerald-50/40",
            remarks: "bg-emerald-100/50 text-emerald-900",
        } as const
    }

    if (action === "cancelled") {
        return {
            dot: "border-red-200 bg-red-50",
            card: "border-red-200/70 bg-red-50/40",
            remarks: "bg-red-100/50 text-red-900",
        } as const
    }

    return {
        dot: "border-border bg-background",
        card: "border-border bg-background",
        remarks: "bg-muted/40 text-muted-foreground",
    } as const
}

export function DocumentHistoryDialog({
    open,
    onOpenChange,
    document,
}: DocumentHistoryDialogProps) {
    const actions = [...(document?.actions ?? [])].reverse()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-5xl">
                {document ? (
                    <div className="grid max-h-[85vh] min-h-0 bg-background lg:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="border-b border-border bg-muted/30 p-6 lg:border-r lg:border-b-0">
                            <DialogHeader className="space-y-3 text-left">
                                <DialogTitle className="text-xl font-semibold tracking-tight">
                                    {document.title}
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                                    Review the document flow, action history, and final disposition.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <Badge variant={statusVariants[document.status] ?? "secondary"}>
                                    {formatStatus(document.status)}
                                </Badge>
                                {document.office_status ? (
                                    <Badge variant="outline">{formatStatus(document.office_status)}</Badge>
                                ) : null}
                            </div>

                            <div className="mt-6 space-y-4">
                                <Card className="border-border/70 shadow-none">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                            <Clock3 className="h-4 w-4 text-primary" />
                                            Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Elapsed</span>
                                            <span className="font-medium">{document.elapsed_time ?? "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Origin</span>
                                            <span className="text-right font-medium">
                                                {document.origin_office?.acronym ?? document.origin_office?.name ?? "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Current</span>
                                            <span className="text-right font-medium">
                                                {document.current_office?.acronym ?? document.current_office?.name ?? "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Final Office</span>
                                            <span className="text-right font-medium">
                                                {document.final_office?.acronym ?? document.final_office?.name ?? "-"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/70 shadow-none">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm leading-6 text-muted-foreground">
                                        {document.notes?.trim() || "No notes provided."}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <ScrollArea className="max-h-[85vh]">
                            <div className="space-y-8 p-6">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Workflow className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Document Flow
                                        </h3>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {document.flow.length > 0 ? (
                                                document.flow.map((step, index) => (
                                                    <div key={`${step.office.id}-${index}`} className="flex items-center gap-2">
                                                        <OfficePill office={step.office} action={step.action} />
                                                        {step.action === "returned" ? (
                                                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                                Returned
                                                            </Badge>
                                                        ) : null}
                                                        {step.action === "completed" ? (
                                                            <Badge variant="default" className="text-[10px]">
                                                                Completed
                                                            </Badge>
                                                        ) : null}
                                                        {step.action === "cancelled" ? (
                                                            <Badge variant="destructive" className="text-[10px]">
                                                                Cancelled
                                                            </Badge>
                                                        ) : null}
                                                        {index < document.flow.length - 1 ? (
                                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                        ) : null}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    No office flow available.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <Separator />

                                <section className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <MapPinned className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            History Timeline
                                        </h3>
                                    </div>

                                    <div className="space-y-0">
                                        {actions.length > 0 ? (
                                            actions.map((action, index) => (
                                                <div key={action.id} className="grid grid-cols-[96px_20px_minmax(0,1fr)] gap-4">
                                                    <div className="pt-0.5 text-xs font-medium text-muted-foreground">
                                                        {formatDateTime(action.acted_at)}
                                                    </div>
                                                    <div className="relative flex justify-center">
                                                        <div className="absolute inset-y-0 top-0 w-px bg-border" />
                                                        <div className={`relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm ${timelineTone(action.action).dot}`}>
                                                            <TimelineIcon action={action.action} />
                                                        </div>
                                                        {index === actions.length - 1 ? (
                                                            <div className="absolute bottom-0 top-5 w-px bg-transparent" />
                                                        ) : null}
                                                    </div>
                                                    <div className="pb-6">
                                                        <div className={`rounded-2xl border p-4 shadow-xs ${timelineTone(action.action).card}`}>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {action.label}
                                                                </p>
                                                                {action.action === "returned" ? (
                                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                                        Return
                                                                    </Badge>
                                                                ) : null}
                                                                {action.action === "completed" ? (
                                                                    <Badge variant="default" className="text-[10px]">
                                                                        Completed
                                                                    </Badge>
                                                                ) : null}
                                                                {action.action === "cancelled" ? (
                                                                    <Badge variant="destructive" className="text-[10px]">
                                                                        Cancelled
                                                                    </Badge>
                                                                ) : null}
                                                                {action.office?.acronym ? (
                                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                                                        {action.office.acronym}
                                                                    </Badge>
                                                                ) : null}
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                                <span>
                                                                    Actor: {action.actor_name ?? "System"}
                                                                </span>
                                                                {action.from_office?.acronym ? (
                                                                    <span>From: {action.from_office.acronym}</span>
                                                                ) : null}
                                                                {action.to_office?.acronym ? (
                                                                    <span>To: {action.to_office.acronym}</span>
                                                                ) : null}
                                                            </div>

                                                            <div className={`mt-3 rounded-xl p-3 text-sm leading-6 ${timelineTone(action.action).remarks}`}>
                                                                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                    <MessageSquareText className="h-3.5 w-3.5" />
                                                                    Remarks
                                                                </div>
                                                                {action.remarks?.trim() || "No remarks provided."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                                No action history available.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
