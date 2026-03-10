import { Head, router } from "@inertiajs/react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import axios from "axios"
import {
    Search, CalendarDays, WifiOff, Loader2, Radio,
    LogIn, LogOut, Coffee, ArrowUpFromLine, X,
    Fingerprint, Activity, Clock, RefreshCw,
} from "lucide-react"
import { route } from "ziggy-js"
import AppLayout from "@/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { BreadcrumbItem } from "@/types"
import { useEchoPublic } from "@laravel/echo-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicInfo {
    first_name: string
    last_name: string
    middle_name?: string
}

interface Employee {
    employee_id: number
    work_id: string
    basic_info?: BasicInfo
    avatar_url?: string
}

type TimeType = "time_in" | "break_in" | "break_out" | "time_out"

interface AttendanceLog {
    id: number
    work_id: string | null
    verification_status: "verified" | "unknown" | "blacklisted"
    time_type: TimeType
    similarity: number | null
    device_id: string | null
    snapshot_path: string | null
    captured_at: string
    employee?: Employee | null
}

interface PaginatedAttendances {
    data: AttendanceLog[]
    total?: number
    [key: string]: unknown
}

interface Props {
    attendances: AttendanceLog[] | PaginatedAttendances
    filters: { date: string }
}

function toArray(raw: AttendanceLog[] | PaginatedAttendances): AttendanceLog[] {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray((raw as PaginatedAttendances).data)) return (raw as PaginatedAttendances).data
    return []
}

// ─── Time-type config — mapped to theme tokens ────────────────────────────────

const TT: Record<TimeType, {
    label: string
    icon: React.ElementType
    iconCls: string
    bgCls: string
    borderCls: string
}> = {
    time_in: {
        label: "Time In",
        icon: LogIn,
        iconCls: "text-primary",
        bgCls: "bg-primary/10",
        borderCls: "border-primary/20",
    },
    break_in: {
        label: "Break In",
        icon: Coffee,
        iconCls: "text-secondary-foreground",
        bgCls: "bg-secondary",
        borderCls: "border-border",
    },
    break_out: {
        label: "Break Out",
        icon: ArrowUpFromLine,
        iconCls: "text-accent-foreground",
        bgCls: "bg-accent",
        borderCls: "border-accent-foreground/20",
    },
    time_out: {
        label: "Time Out",
        icon: LogOut,
        iconCls: "text-destructive",
        bgCls: "bg-destructive/10",
        borderCls: "border-destructive/20",
    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-PH", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    })
}

function fmtDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
}

function todayPH(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
}

function getName(r: AttendanceLog): string {
    const b = r.employee?.basic_info
    return b ? `${b.first_name} ${b.last_name}` : "Unknown"
}

function getWorkId(r: AttendanceLog): string {
    return r.employee?.work_id ?? r.work_id ?? "—"
}

function initials(name: string): string {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

function matchesSearch(r: AttendanceLog, q: string): boolean {
    if (!q.trim()) return true
    const lower = q.toLowerCase()
    return getName(r).toLowerCase().includes(lower) || getWorkId(r).toLowerCase().includes(lower)
}



// ─── CCTV Stream (WebRTC/WHEP) ────────────────────────────────────────────────

function CctvStream({ src, label = "Camera" }: { src: string; label?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting")

    const connect = useCallback(async () => {
        pcRef.current?.close()
        setStatus("connecting")
        let cancelled = false

        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
        pcRef.current = pc
        pc.addTransceiver("video", { direction: "recvonly" })
        pc.addTransceiver("audio", { direction: "recvonly" })

        pc.ontrack = (e) => {
            if (videoRef.current && e.streams[0] && !cancelled) {
                videoRef.current.srcObject = e.streams[0]
                setStatus("live")
            }
        }
        pc.onconnectionstatechange = () => {
            if ((pc.connectionState === "failed" || pc.connectionState === "disconnected") && !cancelled)
                setStatus("error")
        }

        try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            const res = await fetch(`${src}/whep`, {
                method: "POST",
                headers: { "Content-Type": "application/sdp" },
                body: offer.sdp,
            })
            if (!res.ok) throw new Error("WHEP failed")
            await pc.setRemoteDescription({ type: "answer", sdp: await res.text() })
        } catch {
            if (!cancelled) setStatus("error")
        }

        return () => { cancelled = true; pc.close() }
    }, [src])

    useEffect(() => {
        let cleanup: (() => void) | undefined
        connect().then(fn => { cleanup = fn })
        return () => { cleanup?.(); pcRef.current?.close() }
    }, [connect])

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

            {status !== "live" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 z-10">
                    {status === "connecting" ? (
                        <>
                            <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
                            <p className="text-xs text-white/30 tracking-widest uppercase">Connecting…</p>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-10 h-10 text-white/20" />
                            <p className="text-xs text-white/30 tracking-widest uppercase">Stream Offline</p>
                            <button
                                onClick={() => connect()}
                                className="mt-1 text-xs text-white/50 hover:text-white/80 underline transition-colors"
                            >
                                Retry
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <span className="text-xs font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    {label}
                </span>
                {status === "live" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
                        </span>
                        LIVE
                    </span>
                )}
            </div>

            <LiveClock />
        </div>
    )
}

function LiveClock() {
    const [time, setTime] = useState("")
    useEffect(() => {
        const tick = () => setTime(
            new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
        )
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])
    return (
        <div className="absolute bottom-3 right-3 text-xs font-mono text-white/70 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg tabular-nums z-10">
            {time}
        </div>
    )
}

// ─── SnapshotImage ────────────────────────────────────────────────────────────

function SnapshotImage({ path, avatarUrl, name, className = "" }: {
    path: string | null; avatarUrl?: string; name: string; className?: string
}) {
    const [err, setErr] = useState(false)
    const src = path ? `/storage/${path}` : (avatarUrl ?? null)

    if (!src || err) {
        return (
            <div className={`bg-primary/10 flex items-center justify-center ${className}`}>
                <span className="text-primary font-bold text-xl select-none">{initials(name)}</span>
            </div>
        )
    }
    return <img src={src} alt={name} onError={() => setErr(true)} className={`object-cover ${className}`} />
}

// ─── Attendance Card ──────────────────────────────────────────────────────────

function AttendanceCard({ record, isNew, onClick }: {
    record: AttendanceLog; isNew?: boolean; onClick: () => void
}) {
    const name = getName(record)
    const workId = getWorkId(record)

    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col w-full bg-card rounded-xl overflow-hidden text-left transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]
                border hover:shadow-md hover:border-primary/40
                ${isNew ? "border-primary/60 shadow-sm shadow-primary/10" : "border-border"}`}
        >
            {/* Primary accent bar */}
            <div className="h-0.5 w-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />

            {/* Snapshot */}
            <div className="relative w-full aspect-square overflow-hidden bg-muted">
                <SnapshotImage
                    path={record.snapshot_path}
                    avatarUrl={record.employee?.avatar_url}
                    name={name}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                {isNew && (
                    <div className="absolute top-2 right-2 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        NEW
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-0.5 px-2.5 py-2.5 min-w-0 font-poppins">
                <p className="text-xs font-semibold text-card-foreground truncate leading-tight font-poppins">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate font-poppins">{workId}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-primary/50 shrink-0" />
                    <span className="text-[10px]  tabular-nums font-semibold text-card-foreground ">
                        {fmtTime(record.captured_at)}
                    </span>
                </div>
                <p className="text-[9px] uppercase tracking-widest font-semibold  mt-0.5 text-green-500">
                    Detected
                </p>
            </div>
        </button>
    )
}

// ─── Employee Detail Dialog ───────────────────────────────────────────────────

function EmployeeDetailDialog({ record, allRecords, open, onClose }: {
    record: AttendanceLog | null
    allRecords: AttendanceLog[]
    open: boolean
    onClose: () => void
}) {
    if (!record) return null

    const name = getName(record)
    const workId = getWorkId(record)
    const employeeId = record.employee?.employee_id

    const empRecords = useMemo(() =>
        allRecords
            .filter(r => employeeId ? r.employee?.employee_id === employeeId : r.work_id === record.work_id)
            .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()),
        [allRecords, employeeId, record.work_id]
    )

    const latest = useMemo(() => {
        const map: Partial<Record<TimeType, AttendanceLog>> = {}
        for (const r of [...empRecords].reverse()) map[r.time_type] = r
        return map
    }, [empRecords])

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">

                {/* Hero — primary colour wash */}
                <div className="relative shrink-0">
                    <div className="absolute inset-0 overflow-hidden">
                        <SnapshotImage
                            path={record.snapshot_path}
                            avatarUrl={record.employee?.avatar_url}
                            name={name}
                            className="w-full h-full scale-110"
                        />
                        <div className="absolute inset-0 bg-primary/85 backdrop-blur-2xl" />
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/25 flex items-center justify-center text-primary-foreground transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative z-10 flex items-end gap-4 px-5 pt-8 pb-5">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary-foreground/20 shadow-xl shrink-0">
                            <SnapshotImage
                                path={record.snapshot_path}
                                avatarUrl={record.employee?.avatar_url}
                                name={name}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="min-w-0 pb-1">
                            <h2 className="text-lg font-bold text-primary-foreground leading-tight truncate">{name}</h2>
                            <p className="text-xs font-mono text-primary-foreground/60 mt-0.5">{workId}</p>
                            <div className="mt-2.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary-foreground/60" />
                                <span className="text-sm font-mono tabular-nums font-semibold text-primary-foreground">
                                    {fmtTime(record.captured_at)}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest font-semibold text-primary-foreground/50 ml-1">
                                    Detected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4-column time summary */}
                <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/30 shrink-0">
                    {(["time_in", "break_out", "break_in", "time_out"] as TimeType[]).map(tt => {
                        const cfg = TT[tt]
                        const Icon = cfg.icon
                        const rec = latest[tt]
                        return (
                            <div key={tt} className="flex flex-col items-center py-3 px-1 gap-1">
                                <Icon className={`w-3.5 h-3.5 ${cfg.iconCls}`} />
                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold text-center leading-tight">
                                    {cfg.label}
                                </span>
                                <span className={`text-[10px] font-mono tabular-nums font-bold ${rec ? "text-foreground" : "text-muted-foreground/40"}`}>
                                    {rec ? fmtTime(rec.captured_at) : "—"}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Timeline */}
                <DialogHeader className="px-5 pt-4 pb-2 shrink-0">
                    <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        All Detections Today
                        <Badge variant="secondary" className="text-[10px] ml-auto font-bold">
                            {empRecords.length}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[280px]">
                    <div className="px-5 pb-5">
                        {empRecords.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-8">No records found.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {empRecords.map(r => {
                                    const cfg = TT[r.time_type ?? "time_in"]
                                    const Icon = cfg.icon
                                    const active = r.id === record.id
                                    return (
                                        <div
                                            key={r.id}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-full ${cfg.bgCls} flex items-center justify-center shrink-0 border ${cfg.borderCls}`}>
                                                <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        Detected
                                                    </span>
                                                    <span className="font-mono text-sm tabular-nums font-semibold text-foreground">
                                                        {fmtTime(r.captured_at)}
                                                    </span>
                                                </div>
                                                {r.device_id && (
                                                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Device: {r.device_id}</p>
                                                )}
                                            </div>
                                            {r.snapshot_path && (
                                                <div className="w-9 h-9 rounded-lg overflow-hidden border border-border shrink-0">
                                                    <img src={`/storage/${r.snapshot_path}`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "#" },
    { title: "Logs", href: "#" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecognitionLogIndex({
    attendances: initialAttendances,
    filters = { date: todayPH() },
}: Props) {
    const [date, setDate] = useState(filters.date)
    const isToday = date === todayPH()

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const d = e.target.value
        setDate(d)
        router.get(route("recognition-logs.index"), { date: d }, { preserveScroll: true, replace: true })
    }

    const setToday = () => {
        const today = todayPH()
        setDate(today)
        router.get(route("recognition-logs.index"), { date: today }, { preserveScroll: true, replace: true })
    }

    const [records, setRecords] = useState<AttendanceLog[]>(() => toArray(initialAttendances))
    const [refreshing, setRefreshing] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [newIds, setNewIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        setRecords(toArray(initialAttendances))
    }, [initialAttendances])

    const [echoConnected, setEchoConnected] = useState(false)

    useEffect(() => {
        const check = () => {
            const echo = (window as any).Echo
            if (!echo) { setEchoConnected(false); return }
            const state = echo.connector?.pusher?.connection?.state
            setEchoConnected(state === "connected")
        }
        check()
        const id = setInterval(check, 2000)
        return () => clearInterval(id)
    }, [])

    const [selectedRecord, setSelectedRecord] = useState<AttendanceLog | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const openRecord = (record: AttendanceLog) => {
        setSelectedRecord(record)
        setDialogOpen(true)
    }

    useEchoPublic("attendance-logs", ".log.created", (incoming: AttendanceLog) => {
        if (date !== todayPH()) return
        setRecords(prev => prev.some(r => r.id === incoming.id) ? prev : [incoming, ...prev])
        setNewIds(prev => new Set(prev).add(incoming.id))
        setLastUpdated(new Date())
        setTimeout(() => {
            setNewIds(prev => { const s = new Set(prev); s.delete(incoming.id); return s })
        }, 5000)
    })

    useEchoPublic("attendance-logs", ".log.updated", (updated: Pick<AttendanceLog, "id" | "time_type">) => {
        if (date !== todayPH()) return
        setRecords(prev =>
            prev.map(r => r.id === updated.id ? { ...r, time_type: updated.time_type } : r)
        )
        setSelectedRecord(prev =>
            prev?.id === updated.id ? { ...prev, time_type: updated.time_type } : prev
        )
    })

    const fetchRecords = useCallback(async (targetDate: string) => {
        setRefreshing(true)
        try {
            const res = await axios.get<{ attendances: AttendanceLog[] }>(
                route("recognition-logs.index"),
                { params: { date: targetDate, json: 1 } }
            )
            setRecords(toArray(res.data.attendances ?? []))
            setLastUpdated(new Date())
        } catch {
            // silently fail
        } finally {
            setRefreshing(false)
        }
    }, [])

    const [search, setSearch] = useState("")
    const filtered = useMemo(
        () => records.filter(r => matchesSearch(r, search)),
        [records, search]
    )

    const CCTV_SRC = "http://192.168.0.114:8889/cam"

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="flex flex-col gap-4 px-4 sm:px-5 pt-4 pb-4">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3 flex-wrap shrink-0">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Radio className="w-4 h-4 text-primary" />
                            Attendance Monitor
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isToday ? "Today — " : ""}{fmtDate(date)}
                            {" · "}
                            <span className="font-semibold text-foreground">{records.length}</span>
                            {" "}detection{records.length !== 1 ? "s" : ""}
                            {lastUpdated && (
                                <span className="ml-2 text-[11px] text-muted-foreground/60">
                                    · updated {lastUpdated.toLocaleTimeString("en-PH", {
                                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                                    })}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="w-38 h-9"
                        />
                        {!isToday && (
                            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={setToday}>
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Today</span>
                            </Button>
                        )}
                        <Button
                            variant="outline" size="sm" className="h-9 w-9 p-0"
                            onClick={() => fetchRecords(date)}
                            disabled={refreshing}
                            title="Refresh now"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* ── Main layout ── */}
                <div className="flex flex-col xl:flex-row gap-4">

                    {/* ══ LEFT: Camera ══ */}
                    <div className="flex flex-col gap-3 xl:w-[69%] shrink-0 xl:self-start xl:sticky xl:top-4">
                        <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm bg-black aspect-video">
                            <CctvStream src={CCTV_SRC} label="Entrance — CAM 01" />
                        </div>
                    </div>

                    {/* ══ RIGHT: Detection log ══ */}
                    <div
                        className="flex flex-col bg-card border border-border rounded-xl overflow-hidden"
                        style={{ height: "calc(87dvh - 10rem)" }}>
                        {/* Panel header */}
                        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                    <Fingerprint className="w-3.5 h-3.5 text-primary" />
                                    Detection Log
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {refreshing && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {filtered.length}{search ? ` / ${records.length}` : ""} detection{filtered.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name or work ID…"
                                    className="pl-8 pr-8 h-8 text-sm bg-background"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable grid */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Fingerprint className="w-10 h-10 opacity-20" />
                                    <p className="text-sm">
                                        {search ? "No detections match your search." : "No detections for this date."}
                                    </p>
                                    {search && (
                                        <Button variant="outline" size="sm" onClick={() => setSearch("")} className="gap-1.5">
                                            <X className="w-3 h-3" /> Clear search
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                                    {filtered.map(record => (
                                        <AttendanceCard
                                            key={record.id}
                                            record={record}
                                            isNew={newIds.has(record.id)}
                                            onClick={() => openRecord(record)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EmployeeDetailDialog
                record={selectedRecord}
                allRecords={records}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </AppLayout>
    )
}