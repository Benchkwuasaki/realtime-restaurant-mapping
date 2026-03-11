import { Head, router } from "@inertiajs/react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
    Search, CalendarDays, WifiOff, Loader2, Radio,
    LogIn, LogOut, Coffee, ArrowUpFromLine, X,
    Fingerprint, Activity, Clock, RefreshCw,
    Pin, PinOff, Plus, Trash2, Edit2, Check, Camera,
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

// ─── Camera Types ─────────────────────────────────────────────────────────────

interface CameraSource {
    id: string
    label: string
    /** Full base URL, e.g. http://192.168.0.114:8889/cam1 */
    src: string
}

const DEFAULT_CAMERAS: CameraSource[] = [
    { id: "cam1", label: "Entrance — CAM 01", src: "http://192.168.0.114:8889/cam1" },
    { id: "cam2", label: "Entrance — CAM 02", src: "http://192.168.0.114:8889/cam2" },
]

const CAMERAS_STORAGE_KEY = "attendance_cctv_cameras"

function loadCameras(): CameraSource[] {
    try {
        const raw = localStorage.getItem(CAMERAS_STORAGE_KEY)
        if (raw) return JSON.parse(raw) as CameraSource[]
    } catch { /* ignore */ }
    return DEFAULT_CAMERAS
}

function saveCameras(cams: CameraSource[]) {
    try { localStorage.setItem(CAMERAS_STORAGE_KEY, JSON.stringify(cams)) } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray(raw: AttendanceLog[] | PaginatedAttendances): AttendanceLog[] {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray((raw as PaginatedAttendances).data)) return (raw as PaginatedAttendances).data
    return []
}

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

// ─── Add / Edit Camera Dialog ─────────────────────────────────────────────────

function CameraFormDialog({
    open,
    onClose,
    onSave,
    initial,
}: {
    open: boolean
    onClose: () => void
    onSave: (cam: CameraSource) => void
    initial?: CameraSource
}) {
    const [label, setLabel] = useState(initial?.label ?? "")
    const [src, setSrc] = useState(initial?.src ?? "")

    // Keep in sync if `initial` changes (edit re-opens)
    useEffect(() => {
        setLabel(initial?.label ?? "")
        setSrc(initial?.src ?? "")
    }, [initial, open])

    const handleSave = () => {
        if (!src.trim()) return
        onSave({
            id: initial?.id ?? crypto.randomUUID(),
            label: label.trim() || src.trim(),
            src: src.trim(),
        })
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-sm gap-4">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Camera className="w-4 h-4 text-primary" />
                        {initial ? "Edit Camera" : "Add Camera"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    {/* Label */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Label</label>
                        <Input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Entrance — CAM 03"
                            className="h-9"
                        />
                    </div>

                    {/* Stream URL */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            MediaMTX Stream URL
                        </label>
                        <Input
                            value={src}
                            onChange={e => setSrc(e.target.value)}
                            placeholder="http://192.168.x.x:8889/stream-name"
                            className="h-9 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground/70">
                            The base URL of your MediaMTX stream. The <code>/whep</code> suffix is added automatically.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={!src.trim()} className="gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {initial ? "Save Changes" : "Add Camera"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
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
                            <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                            <p className="text-xs text-white/30 tracking-widest uppercase">Connecting…</p>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-8 h-8 text-white/20" />
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

            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                <span className="text-xs font-semibold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    {label}
                </span>
                {status === "live" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary-foreground bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground" />
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
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/70 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md tabular-nums z-10">
            {time}
        </div>
    )
}

// ─── Camera Grid (Google Meet–style) ──────────────────────────────────────────

const THUMB_HEIGHT_PX = 80

function CameraGrid({
    cameras,
    pinnedId,
    onPin,
    onEdit,
    onRemove,
}: {
    cameras: CameraSource[]
    pinnedId: string | null
    onPin: (id: string | null) => void
    onEdit: (cam: CameraSource) => void
    onRemove: (id: string) => void
}) {
    const pinned = cameras.find(c => c.id === pinnedId) ?? null
    const others = cameras.filter(c => c.id !== pinnedId)

    if (cameras.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 aspect-video text-muted-foreground">
                <Camera className="w-8 h-8 opacity-30" />
                <p className="text-sm">No cameras added yet.</p>
            </div>
        )
    }

    if (!pinned) {
        // Equal grid — all tiles use aspect-video naturally
        const colCount = Math.min(cameras.length, 4)
        return (
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            >
                {cameras.map(cam => (
                    <CameraTile
                        key={cam.id}
                        cam={cam}
                        isPinned={false}
                        fixedHeight={null}
                        onPin={() => onPin(cam.id)}
                        onEdit={() => onEdit(cam)}
                        onRemove={() => onRemove(cam.id)}
                    />
                ))}
            </div>
        )
    }

    // Pinned mode — primary on top, horizontal scrollable thumbnail strip below
    const THUMB_H = 90
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            {/* Primary — full width, 16/9 */}
            <div style={{ width: "100%", aspectRatio: "16/9", position: "relative" }}>
                <CameraTile
                    cam={pinned}
                    isPinned
                    fixedHeight={null}
                    fullAbsolute
                    onPin={() => onPin(null)}
                    onEdit={() => onEdit(pinned)}
                    onRemove={() => onRemove(pinned.id)}
                />
            </div>

            {/* Horizontal scrollable thumbnail strip */}
            {others.length > 0 && (
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "0.5rem",
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollbarWidth: "none",
                    paddingBottom: "2px",
                }}>
                    {others.map(cam => (
                        <div
                            key={cam.id}
                            style={{
                                height: `${THUMB_H}px`,
                                aspectRatio: "16/9",
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            <CameraTile
                                cam={cam}
                                isPinned={false}
                                fixedHeight={null}
                                fullAbsolute
                                onPin={() => onPin(cam.id)}
                                onEdit={() => onEdit(cam)}
                                onRemove={() => onRemove(cam.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


function CameraTile({
    cam,
    isPinned,
    fixedHeight,
    fullAbsolute = false,
    onPin,
    onEdit,
    onRemove,
}: {
    cam: CameraSource
    isPinned: boolean
    /** null → aspect-video; number → fixed px height */
    fixedHeight: number | null
    /** true → position absolute inset-0 (used for pinned primary) */
    fullAbsolute?: boolean
    onPin: () => void
    onEdit: () => void
    onRemove: () => void
}) {
    const [hovered, setHovered] = useState(false)

    const sizeStyle: React.CSSProperties = fullAbsolute
        ? { position: "absolute", inset: 0 }
        : fixedHeight !== null
            ? { height: `${fixedHeight}px`, width: "160px", flexShrink: 0 }
            : { width: "100%", height: "100%" }

    return (
        <div
            className="relative rounded-xl overflow-hidden border border-border bg-black shadow-sm"
            style={sizeStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <CctvStream src={cam.src} label={cam.label} />

            {/* Hover overlay */}
            {hovered && <div className="absolute inset-0 bg-black/30 z-20 pointer-events-none" />}

            {/* Controls — appear on hover */}
            <div
                className="absolute top-2 right-2 z-30 flex items-center gap-1 transition-opacity duration-150"
                style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none" }}
            >
                <button
                    onClick={onPin}
                    title={isPinned ? "Unpin" : "Pin (focus)"}
                    className="w-7 h-7 rounded-lg bg-black/70 hover:bg-primary/90 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={onEdit}
                    title="Edit camera"
                    className="w-7 h-7 rounded-lg bg-black/70 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onRemove}
                    title="Remove camera"
                    className="w-7 h-7 rounded-lg bg-black/70 hover:bg-destructive/90 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {isPinned && (
                <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1 text-[10px] font-bold text-white bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                </div>
            )}
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
            <div className="h-0.5 w-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
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
            <div className="flex flex-col gap-0.5 px-2.5 py-2.5 min-w-0 font-poppins">
                <p className="text-xs font-semibold text-card-foreground truncate leading-tight">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{workId}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-primary/50 shrink-0" />
                    <span className="text-[10px] tabular-nums font-semibold text-card-foreground">
                        {fmtTime(record.captured_at)}
                    </span>
                </div>
                <p className="text-[9px] uppercase tracking-widest font-semibold mt-0.5 text-green-500">
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
                <div className="relative shrink-0">
                    <div className="absolute inset-0 overflow-hidden">
                        <SnapshotImage path={record.snapshot_path} avatarUrl={record.employee?.avatar_url} name={name} className="w-full h-full scale-110" />
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
                            <SnapshotImage path={record.snapshot_path} avatarUrl={record.employee?.avatar_url} name={name} className="w-full h-full" />
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

                <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/30 shrink-0">
                    {(["time_in", "break_out", "break_in", "time_out"] as TimeType[]).map(tt => {
                        const cfg = TT[tt]
                        const Icon = cfg.icon
                        const rec = latest[tt]
                        return (
                            <div key={tt} className="flex flex-col items-center py-3 px-1 gap-1">
                                <Icon className={`w-3.5 h-3.5 ${cfg.iconCls}`} />
                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold text-center leading-tight">{cfg.label}</span>
                                <span className={`text-[10px] font-mono tabular-nums font-bold ${rec ? "text-foreground" : "text-muted-foreground/40"}`}>
                                    {rec ? fmtTime(rec.captured_at) : "—"}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <DialogHeader className="px-5 pt-4 pb-2 shrink-0">
                    <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        All Detections Today
                        <Badge variant="secondary" className="text-[10px] ml-auto font-bold">{empRecords.length}</Badge>
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
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
                                        >
                                            <div className={`w-9 h-9 rounded-full ${cfg.bgCls} flex items-center justify-center shrink-0 border ${cfg.borderCls}`}>
                                                <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detected</span>
                                                    <span className="font-mono text-sm tabular-nums font-semibold text-foreground">{fmtTime(r.captured_at)}</span>
                                                </div>
                                                {r.device_id && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Device: {r.device_id}</p>}
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
            setEchoConnected(echo.connector?.pusher?.connection?.state === "connected")
        }
        check()
        const id = setInterval(check, 2000)
        return () => clearInterval(id)
    }, [])

    const [selectedRecord, setSelectedRecord] = useState<AttendanceLog | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const openRecord = (record: AttendanceLog) => { setSelectedRecord(record); setDialogOpen(true) }

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
        setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, time_type: updated.time_type } : r))
        setSelectedRecord(prev => prev?.id === updated.id ? { ...prev, time_type: updated.time_type } : prev)
    })

    const [search, setSearch] = useState("")
    const filtered = useMemo(() => records.filter(r => matchesSearch(r, search)), [records, search])

    // ── Camera state ──────────────────────────────────────────────────────────
    const [cameras, setCameras] = useState<CameraSource[]>(() => loadCameras())
    const [pinnedId, setPinnedId] = useState<string | null>(null)

    // Form dialog state
    const [camFormOpen, setCamFormOpen] = useState(false)
    const [editingCam, setEditingCam] = useState<CameraSource | undefined>(undefined)

    const openAddCam = () => { setEditingCam(undefined); setCamFormOpen(true) }
    const openEditCam = (cam: CameraSource) => { setEditingCam(cam); setCamFormOpen(true) }

    const handleSaveCam = (cam: CameraSource) => {
        setCameras(prev => {
            const exists = prev.findIndex(c => c.id === cam.id)
            const updated = exists >= 0
                ? prev.map(c => c.id === cam.id ? cam : c)
                : [...prev, cam]
            saveCameras(updated)
            return updated
        })
    }

    const handleRemoveCam = (id: string) => {
        setCameras(prev => {
            const updated = prev.filter(c => c.id !== id)
            saveCameras(updated)
            return updated
        })
        if (pinnedId === id) setPinnedId(null)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            {/* Full-screen flex column — fills viewport below app chrome */}
            <div className="flex flex-col px-4 sm:px-5 pt-4 pb-4" style={{ height: "calc(100dvh - 56px)" }}>

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3 flex-wrap shrink-0 mb-3">
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
                        <Input type="date" value={date} onChange={handleDateChange} className="w-38 h-9" />
                        {!isToday && (
                            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={setToday}>
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Today</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Main layout — fills all remaining height ── */}
                <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">

                    {/* ══ LEFT: Camera panel ══ */}
                    <div className="flex flex-col gap-2 xl:w-[69%] shrink-0 min-h-0">

                        {/* Camera toolbar */}
                        <div className="flex items-center justify-between gap-2 shrink-0">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" />
                                {cameras.length} camera{cameras.length !== 1 ? "s" : ""}
                                {pinnedId && <span className="text-primary"> · 1 pinned</span>}
                            </p>
                            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={openAddCam}>
                                <Plus className="w-3 h-3" />
                                Add Camera
                            </Button>
                        </div>

                        {/* Camera grid — fills remaining height */}
                        <div className="flex-1 min-h-0">
                            <CameraGrid
                                cameras={cameras}
                                pinnedId={pinnedId}
                                onPin={id => setPinnedId(id)}
                                onEdit={openEditCam}
                                onRemove={handleRemoveCam}
                            />
                        </div>
                    </div>

                    {/* ══ RIGHT: Detection log — fills full height, scrollable inside ══ */}
                    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden flex-1 min-h-0">
                        {/* Panel header */}
                        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                    <Fingerprint className="w-3.5 h-3.5 text-primary" />
                                    Detection Log
                                </p>
                                <div className="flex items-center gap-1.5">
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
                        <div className="flex-1 overflow-y-auto p-3 min-h-0">
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

            {/* Camera form dialog */}
            <CameraFormDialog
                open={camFormOpen}
                onClose={() => setCamFormOpen(false)}
                onSave={handleSaveCam}
                initial={editingCam}
            />

            <EmployeeDetailDialog
                record={selectedRecord}
                allRecords={records}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </AppLayout>
    )
}