import { Head, router } from "@inertiajs/react"
import { useState, useCallback, useEffect, useRef } from "react"
import {
    Search, CalendarDays, Clock, ShieldCheck, ShieldX,
    ShieldQuestion, Users, Wifi, WifiOff, Loader2, Radio
} from "lucide-react"
import { route } from "ziggy-js"
import AppLayout from "@/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BreadcrumbItem } from "@/types"

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
}

interface AttendanceRecord {
    id: number
    work_id: string | null
    verification_status: "verified" | "unknown" | "blacklisted"
    similarity: number | null
    device_id: string | null
    snapshot_path: string | null
    captured_at: string
    employee?: Employee | null
}

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

interface Paginated<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    links: PaginationLink[]
}

interface Props {
    attendances: Paginated<AttendanceRecord>
    filters: { search: string; date: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    })
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

function getEmployeeName(record: AttendanceRecord): string {
    if (record.employee?.basic_info) {
        const { first_name, last_name } = record.employee.basic_info
        return `${first_name} ${last_name}`
    }
    return "Unknown"
}

function getWorkId(record: AttendanceRecord): string {
    return record.employee?.work_id ?? record.work_id ?? "—"
}

// ─── CCTV Stream (WebRTC/WHEP) ────────────────────────────────────────────────

function CctvStream({ src, label = "Camera" }: { src: string; label?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting")

    useEffect(() => {
        let pc: RTCPeerConnection
        let cancelled = false

        async function connect() {
            setStatus("connecting")
            try {
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                })
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
                    if (
                        (pc.connectionState === "failed" || pc.connectionState === "disconnected")
                        && !cancelled
                    ) {
                        setStatus("error")
                    }
                }

                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)

                const res = await fetch(`${src}/whep`, {
                    method: "POST",
                    headers: { "Content-Type": "application/sdp" },
                    body: offer.sdp,
                })

                if (!res.ok) throw new Error("WHEP request failed")

                const answerSdp = await res.text()
                await pc.setRemoteDescription({ type: "answer", sdp: answerSdp })
            } catch (err) {
                if (!cancelled) {
                    console.error("CCTV error:", err)
                    setStatus("error")
                }
            }
        }

        connect()
        return () => {
            cancelled = true
            pc?.close()
        }
    }, [src])

    const retry = () => {
        pcRef.current?.close()
        setStatus("connecting")
    }

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden group">
            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
            />

            {/* Overlay when not live */}
            {status !== "live" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3">
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
                                onClick={retry}
                                className="mt-1 text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
                            >
                                Retry
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Top-left: label + live badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-white bg-black/50 backdrop-blur px-2.5 py-1 rounded-md tracking-wide">
                    {label}
                </span>
                {status === "live" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-black/50 backdrop-blur px-2.5 py-1 rounded-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        LIVE
                    </span>
                )}
            </div>

            {/* Bottom-right: timestamp */}
            <LiveClock />
        </div>
    )
}

function LiveClock() {
    const [time, setTime] = useState("")
    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString("en-PH", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
        }))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])
    return (
        <div className="absolute bottom-3 right-3 text-xs font-mono text-white/60 bg-black/50 backdrop-blur px-2.5 py-1 rounded-md tabular-nums">
            {time}
        </div>
    )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceRecord["verification_status"] }) {
    if (status === "verified") {
        return (
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400 text-[10px] font-semibold">
                <ShieldCheck className="w-2.5 h-2.5" /> Verified
            </Badge>
        )
    }
    if (status === "blacklisted") {
        return (
            <Badge className="gap-1 bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 dark:text-red-400 text-[10px] font-semibold">
                <ShieldX className="w-2.5 h-2.5" /> Blacklisted
            </Badge>
        )
    }
    return (
        <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400 text-[10px] font-semibold">
            <ShieldQuestion className="w-2.5 h-2.5" /> Unknown
        </Badge>
    )
}

// ─── Similarity Bar ───────────────────────────────────────────────────────────

function SimilarityBar({ value }: { value: number | null }) {
    if (value === null) return <span className="text-muted-foreground text-xs">—</span>
    const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500"
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-7 text-right">
                {value}%
            </span>
        </div>
    )
}

// ─── Snapshot Avatar ──────────────────────────────────────────────────────────

function Avatar({ path, name, size = "md" }: { path: string | null; name: string; size?: "sm" | "md" }) {
    const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs"
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    if (!path) {
        return (
            <div className={`${dim} rounded-lg bg-muted flex items-center justify-center shrink-0 font-semibold text-muted-foreground`}>
                {initials}
            </div>
        )
    }
    return (
        <img
            src={`/storage/${path}`}
            alt={name}
            className={`${dim} rounded-lg object-cover shrink-0 border border-border`}
        />
    )
}

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({ record }: { record: AttendanceRecord }) {
    const name = getEmployeeName(record)
    const workId = getWorkId(record)

    const borderColor =
        record.verification_status === "verified"
            ? "border-l-emerald-500"
            : record.verification_status === "blacklisted"
                ? "border-l-red-500"
                : "border-l-amber-400"

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border border-l-2 ${borderColor} bg-card hover:bg-muted/30 transition-colors`}>
            <Avatar path={record.snapshot_path} name={name} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                    <StatusBadge status={record.verification_status} />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{workId}</p>
                <div className="mt-1.5">
                    <SimilarityBar value={record.similarity} />
                </div>
            </div>
            <div className="text-right shrink-0">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(record.captured_at)}
                </span>
            </div>
        </div>
    )
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: number; color: string
}) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-card`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-bold tabular-nums ml-auto">{value}</span>
        </div>
    )
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: "/attendance" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendanceIndex({
    attendances = { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0, links: [] },
    filters = { search: "", date: new Date().toISOString().split("T")[0] },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "")
    const [date, setDate] = useState(filters.date)

    const applyFilters = useCallback((overrides: { search?: string; date?: string }) => {
        router.get(
            route("attendance.index"),
            { search: overrides.search ?? search, date: overrides.date ?? date },
            { preserveScroll: true, replace: true }
        )
    }, [search, date])

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") applyFilters({ search })
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value)
        applyFilters({ date: e.target.value })
    }

    const setToday = () => {
        const today = new Date().toISOString().split("T")[0]
        setDate(today)
        applyFilters({ date: today })
    }

    const records = attendances.data
    const verifiedCount = records.filter(r => r.verification_status === "verified").length
    const unknownCount = records.filter(r => r.verification_status === "unknown").length
    const blacklistedCount = records.filter(r => r.verification_status === "blacklisted").length
    const isToday = date === new Date().toISOString().split("T")[0]

    // ── MediaMTX WHEP source — change to your server IP ──
    const CCTV_SRC = "http://192.168.0.114:8889/cam"

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="px-6 pt-5 pb-10 space-y-5">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                            <Radio className="w-4 h-4 text-emerald-500" />
                            Attendance Monitor
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isToday ? "Today — " : ""}{formatDate(date)}
                            {" · "}{attendances.total} record{attendances.total !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="w-40"
                        />
                        {!isToday && (
                            <Button variant="outline" size="sm" onClick={setToday} className="gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" /> Today
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Main Layout: CCTV + Logs ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

                    {/* ── Left: CCTV Feed ── */}
                    <div className="space-y-3">
                        {/* Stream */}
                        <div className="w-full aspect-video rounded-xl overflow-hidden border shadow-sm">
                            <CctvStream src={CCTV_SRC} label="Entrance — CAM 01" />
                        </div>

                        {/* Stats below the stream */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <StatChip icon={Users} label="Total" value={attendances.total} color="text-blue-500" />
                            <StatChip icon={ShieldCheck} label="Verified" value={verifiedCount} color="text-emerald-500" />
                            <StatChip icon={ShieldQuestion} label="Unknown" value={unknownCount} color="text-amber-500" />
                            <StatChip icon={ShieldX} label="Blacklisted" value={blacklistedCount} color="text-red-500" />
                        </div>
                    </div>

                    {/* ── Right: Logs Panel ── */}
                    <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm"
                        style={{ maxHeight: "calc(100vh - 220px)" }}>

                        {/* Panel header + search */}
                        <div className="px-4 py-3 border-b bg-muted/30 space-y-2.5 shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    Attendance Log
                                </h2>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {records.length} shown
                                </span>
                            </div>

                            {/* Search */}
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={handleSearchKey}
                                        placeholder="Name or work ID…"
                                        className="pl-8 h-8 text-sm"
                                    />
                                </div>
                                <Button size="sm" className="h-8 px-3" onClick={() => applyFilters({ search })}>
                                    Search
                                </Button>
                                {search && (
                                    <Button size="sm" variant="ghost" className="h-8 px-2"
                                        onClick={() => { setSearch(""); applyFilters({ search: "" }) }}>
                                        ✕
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable log list */}
                        <div className="flex-1 overflow-y-auto">
                            {records.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <CalendarDays className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">No records for this date.</p>
                                </div>
                            ) : (
                                <div className="p-3 space-y-2">
                                    {records.map(record => (
                                        <LogCard key={record.id} record={record} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {attendances.last_page > 1 && (
                            <div className="px-4 py-3 border-t bg-muted/20 shrink-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        Page {attendances.current_page} of {attendances.last_page}
                                    </p>
                                    <div className="flex gap-1">
                                        {attendances.links.map((link, idx) => (
                                            <Button
                                                key={idx}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="min-w-7 h-7 text-xs"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}