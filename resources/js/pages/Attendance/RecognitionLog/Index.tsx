import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Search,
    CalendarDays,
    WifiOff,
    Loader2,
    Radio,
    LogIn,
    LogOut,
    Coffee,
    ArrowUpFromLine,
    X,
    Fingerprint,
    Activity,
    Clock,
    RefreshCw,
    Pin,
    PinOff,
    Plus,
    Trash2,
    Edit2,
    Check,
    Camera,
} from 'lucide-react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BreadcrumbItem } from '@/types';
import { useEchoPublic } from '@laravel/echo-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicInfo {
    first_name: string;
    last_name: string;
    middle_name?: string;
}

interface Employee {
    employee_id: number;
    work_id: string;
    basic_info?: BasicInfo;
    avatar_url?: string;
}

type TimeType = 'time_in' | 'break_in' | 'break_out' | 'time_out';

interface AttendanceLog {
    id: number;
    work_id: string | null;
    verification_status: 'verified' | 'unknown' | 'blacklisted';
    time_type: TimeType;
    similarity: number | null;
    device_id: string | null;
    snapshot_path: string | null;
    captured_at: string;
    employee?: Employee | null;
}

interface PaginatedAttendances {
    data: AttendanceLog[];
    total?: number;
    [key: string]: unknown;
}

interface Props {
    attendances: AttendanceLog[] | PaginatedAttendances;
    filters: { date: string };
}

// ─── Camera Types ─────────────────────────────────────────────────────────────

interface CameraSource {
    id: string;
    label: string;
    /** Full base URL, e.g. http://192.168.0.114:8889/cam1 */
    src: string;
}

const DEFAULT_CAMERAS: CameraSource[] = [
    {
        id: 'cam1',
        label: 'Entrance — CAM 01',
        src: 'http://192.168.0.115:8889/cam1',
    },
    {
        id: 'cam2',
        label: 'Entrance — CAM 02',
        src: 'http://192.168.0.115:8889/cam2',
    },
];

const CAMERAS_STORAGE_KEY = 'attendance_cctv_cameras';

function loadCameras(): CameraSource[] {
    try {
        const raw = localStorage.getItem(CAMERAS_STORAGE_KEY);
        if (raw) return JSON.parse(raw) as CameraSource[];
    } catch {
        /* ignore */
    }
    return DEFAULT_CAMERAS;
}

function saveCameras(cams: CameraSource[]) {
    try {
        localStorage.setItem(CAMERAS_STORAGE_KEY, JSON.stringify(cams));
    } catch {
        /* ignore */
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray(raw: AttendanceLog[] | PaginatedAttendances): AttendanceLog[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as PaginatedAttendances).data))
        return (raw as PaginatedAttendances).data;
    return [];
}

const TT: Record<
    TimeType,
    {
        label: string;
        icon: React.ElementType;
        iconCls: string;
        bgCls: string;
        borderCls: string;
    }
> = {
    time_in: {
        label: 'Time In',
        icon: LogIn,
        iconCls: 'text-primary',
        bgCls: 'bg-primary/10',
        borderCls: 'border-primary/20',
    },
    break_in: {
        label: 'Break In',
        icon: Coffee,
        iconCls: 'text-secondary-foreground',
        bgCls: 'bg-secondary',
        borderCls: 'border-border',
    },
    break_out: {
        label: 'Break Out',
        icon: ArrowUpFromLine,
        iconCls: 'text-accent-foreground',
        bgCls: 'bg-accent',
        borderCls: 'border-accent-foreground/20',
    },
    time_out: {
        label: 'Time Out',
        icon: LogOut,
        iconCls: 'text-destructive',
        bgCls: 'bg-destructive/10',
        borderCls: 'border-destructive/20',
    },
};

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

function fmtDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function todayPH(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function getName(r: AttendanceLog): string {
    const b = r.employee?.basic_info;
    return b ? `${b.first_name} ${b.last_name}` : 'Unknown';
}

function getWorkId(r: AttendanceLog): string {
    return r.employee?.work_id ?? r.work_id ?? '—';
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function matchesSearch(r: AttendanceLog, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    return (
        getName(r).toLowerCase().includes(lower) ||
        getWorkId(r).toLowerCase().includes(lower)
    );
}

// ─── Add / Edit Camera Dialog ─────────────────────────────────────────────────

function CameraFormDialog({
    open,
    onClose,
    onSave,
    initial,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (cam: CameraSource) => void;
    initial?: CameraSource;
}) {
    const [label, setLabel] = useState(initial?.label ?? '');
    const [src, setSrc] = useState(initial?.src ?? '');

    // Keep in sync if `initial` changes (edit re-opens)
    useEffect(() => {
        setLabel(initial?.label ?? '');
        setSrc(initial?.src ?? '');
    }, [initial, open]);

    const handleSave = () => {
        if (!src.trim()) return;
        onSave({
            id: initial?.id ?? crypto.randomUUID(),
            label: label.trim() || src.trim(),
            src: src.trim(),
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="gap-4 sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-4 w-4 text-primary" />
                        {initial ? 'Edit Camera' : 'Add Camera'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    {/* Label */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Label
                        </label>
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
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
                            onChange={(e) => setSrc(e.target.value)}
                            placeholder="http://192.168.x.x:8889/stream-name"
                            className="h-9 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground/70">
                            The base URL of your MediaMTX stream. The{' '}
                            <code>/whep</code> suffix is added automatically.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!src.trim()}
                        className="gap-1.5"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {initial ? 'Save Changes' : 'Add Camera'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── CCTV Stream (WebRTC/WHEP) ────────────────────────────────────────────────

function CctvStream({
    src,
    label = 'Camera',
}: {
    src: string;
    label?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [status, setStatus] = useState<'connecting' | 'live' | 'error'>(
        'connecting',
    );

    const connect = useCallback(async () => {
        pcRef.current?.close();
        setStatus('connecting');
        let cancelled = false;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (e) => {
            if (videoRef.current && e.streams[0] && !cancelled) {
                videoRef.current.srcObject = e.streams[0];
                setStatus('live');
            }
        };
        pc.onconnectionstatechange = () => {
            if (
                (pc.connectionState === 'failed' ||
                    pc.connectionState === 'disconnected') &&
                !cancelled
            )
                setStatus('error');
        };

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // ── Wait for ICE gathering to finish so all candidates are
            //    included in the SDP before posting to the WHEP endpoint.
            //    Without this, MediaMTX receives an offer with no candidates
            //    and closes the session with "deadline exceeded". ──────────
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error('ICE gathering timeout')),
                    10_000,
                );
                if (pc.iceGatheringState === 'complete') {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
                pc.onicegatheringstatechange = () => {
                    if (pc.iceGatheringState === 'complete') {
                        clearTimeout(timeout);
                        resolve();
                    }
                };
            });

            const res = await fetch(`${src}/whep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                // Use the fully-gathered local description, not the bare offer
                body: pc.localDescription!.sdp,
            });
            if (!res.ok) throw new Error(`WHEP ${res.status}`);
            await pc.setRemoteDescription({
                type: 'answer',
                sdp: await res.text(),
            });
        } catch {
            if (!cancelled) setStatus('error');
        }

        return () => {
            cancelled = true;
            pc.close();
        };
    }, [src]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        connect().then((fn) => {
            cleanup = fn;
        });
        return () => {
            cleanup?.();
            pcRef.current?.close();
        };
    }, [connect]);

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
            />

            {status !== 'live' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90">
                    {status === 'connecting' ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-white/30" />
                            <p className="text-xs tracking-widest text-white/30 uppercase">
                                Connecting…
                            </p>
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-8 w-8 text-white/20" />
                            <p className="text-xs tracking-widest text-white/30 uppercase">
                                Stream Offline
                            </p>
                            <button
                                onClick={() => connect()}
                                className="mt-1 text-xs text-white/50 underline transition-colors hover:text-white/80"
                            >
                                Retry
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {label}
                </span>
                {status === 'live' && (
                    <span className="flex items-center gap-1 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] font-bold text-primary-foreground backdrop-blur-sm">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        </span>
                        LIVE
                    </span>
                )}
            </div>

            <LiveClock />
        </div>
    );
}

function LiveClock() {
    const [time, setTime] = useState('');
    useEffect(() => {
        const tick = () =>
            setTime(
                new Date().toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                }),
            );
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <div className="absolute right-2 bottom-2 z-10 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/70 tabular-nums backdrop-blur-sm">
            {time}
        </div>
    );
}

// ─── Camera Grid (Google Meet–style) ──────────────────────────────────────────

const THUMB_HEIGHT_PX = 80;

function CameraGrid({
    cameras,
    pinnedId,
    onPin,
    onEdit,
    onRemove,
}: {
    cameras: CameraSource[];
    pinnedId: string | null;
    onPin: (id: string | null) => void;
    onEdit: (cam: CameraSource) => void;
    onRemove: (id: string) => void;
}) {
    const pinned = cameras.find((c) => c.id === pinnedId) ?? null;
    const others = cameras.filter((c) => c.id !== pinnedId);

    if (cameras.length === 0) {
        return (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground">
                <Camera className="h-8 w-8 opacity-30" />
                <p className="text-sm">No cameras added yet.</p>
            </div>
        );
    }

    if (!pinned) {
        // Equal grid — all tiles use aspect-video naturally
        const colCount = Math.min(cameras.length, 4);
        return (
            <div
                className="grid gap-2"
                style={{
                    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                }}
            >
                {cameras.map((cam) => (
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
        );
    }

    // Pinned mode — primary on top, horizontal scrollable thumbnail strip below
    const THUMB_H = 90;
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '100%',
                height: '100%',
            }}
        >
            {/* Primary — fills remaining height */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'none',
                        paddingBottom: '2px',
                    }}
                >
                    {others.map((cam) => (
                        <div
                            key={cam.id}
                            style={{
                                height: `${THUMB_H}px`,
                                aspectRatio: '16/9',
                                flexShrink: 0,
                                position: 'relative',
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
    );
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
    cam: CameraSource;
    isPinned: boolean;
    /** null → aspect-video; number → fixed px height */
    fixedHeight: number | null;
    /** true → position absolute inset-0 (used for pinned primary) */
    fullAbsolute?: boolean;
    onPin: () => void;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    const sizeStyle: React.CSSProperties = fullAbsolute
        ? { position: 'absolute', inset: 0 }
        : fixedHeight !== null
          ? { height: `${fixedHeight}px`, width: '160px', flexShrink: 0 }
          : { width: '100%', height: '100%' };

    return (
        <div
            className="relative overflow-hidden rounded-xl border border-border bg-black shadow-sm"
            style={sizeStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <CctvStream src={cam.src} label={cam.label} />

            {/* Hover overlay */}
            {hovered && (
                <div className="pointer-events-none absolute inset-0 z-20 bg-black/30" />
            )}

            {/* Controls — appear on hover */}
            <div
                className="absolute top-2 right-2 z-30 flex items-center gap-1 transition-opacity duration-150"
                style={{
                    opacity: hovered ? 1 : 0,
                    pointerEvents: hovered ? 'auto' : 'none',
                }}
            >
                <button
                    onClick={onPin}
                    title={isPinned ? 'Unpin' : 'Pin (focus)'}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-primary/90"
                >
                    {isPinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                    ) : (
                        <Pin className="h-3.5 w-3.5" />
                    )}
                </button>
                <button
                    onClick={onEdit}
                    title="Edit camera"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                    <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={onRemove}
                    title="Remove camera"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-destructive/90"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            {isPinned && (
                <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                </div>
            )}
        </div>
    );
}

// ─── SnapshotImage ────────────────────────────────────────────────────────────

function SnapshotImage({
    path,
    avatarUrl,
    name,
    className = '',
}: {
    path: string | null;
    avatarUrl?: string;
    name: string;
    className?: string;
}) {
    const [err, setErr] = useState(false);
    const src = path ? `/storage/${path}` : (avatarUrl ?? null);

    if (!src || err) {
        return (
            <div
                className={`flex items-center justify-center bg-primary/10 ${className}`}
            >
                <span className="text-xl font-bold text-primary select-none">
                    {initials(name)}
                </span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={name}
            onError={() => setErr(true)}
            className={`object-cover ${className}`}
        />
    );
}

// ─── Attendance Card ──────────────────────────────────────────────────────────

function AttendanceCard({
    record,
    isNew,
    onClick,
}: {
    record: AttendanceLog;
    isNew?: boolean;
    onClick: () => void;
}) {
    const name = getName(record);
    const workId = getWorkId(record);

    return (
        <button
            onClick={onClick}
            className={`group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] ${isNew ? 'border-primary/60 shadow-sm shadow-primary/10' : 'border-border'}`}
        >
            <div className="h-0.5 w-full shrink-0 bg-primary opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <SnapshotImage
                    path={record.snapshot_path}
                    avatarUrl={record.employee?.avatar_url}
                    name={name}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                {isNew && (
                    <div className="absolute top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        NEW
                    </div>
                )}
            </div>
            <div className="font-poppins flex min-w-0 flex-col gap-0.5 px-2.5 py-2.5">
                <p className="truncate text-xs leading-tight font-semibold text-card-foreground">
                    {name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                    {workId}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 shrink-0 text-primary/50" />
                    <span className="text-[10px] font-semibold text-card-foreground tabular-nums">
                        {fmtTime(record.captured_at)}
                    </span>
                </div>
                <p className="mt-0.5 text-[9px] font-semibold tracking-widest text-green-500 uppercase">
                    Detected
                </p>
            </div>
        </button>
    );
}

// ─── Employee Detail Dialog ───────────────────────────────────────────────────

function EmployeeDetailDialog({
    record,
    allRecords,
    open,
    onClose,
}: {
    record: AttendanceLog | null;
    allRecords: AttendanceLog[];
    open: boolean;
    onClose: () => void;
}) {
    if (!record) return null;

    const name = getName(record);
    const workId = getWorkId(record);
    const employeeId = record.employee?.employee_id;

    const empRecords = useMemo(
        () =>
            allRecords
                .filter((r) =>
                    employeeId
                        ? r.employee?.employee_id === employeeId
                        : r.work_id === record.work_id,
                )
                .sort(
                    (a, b) =>
                        new Date(b.captured_at).getTime() -
                        new Date(a.captured_at).getTime(),
                ),
        [allRecords, employeeId, record.work_id],
    );

    const latest = useMemo(() => {
        const map: Partial<Record<TimeType, AttendanceLog>> = {};
        for (const r of [...empRecords].reverse()) map[r.time_type] = r;
        return map;
    }, [empRecords]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-lg">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 overflow-hidden">
                        <SnapshotImage
                            path={record.snapshot_path}
                            avatarUrl={record.employee?.avatar_url}
                            name={name}
                            className="h-full w-full scale-110"
                        />
                        <div className="absolute inset-0 bg-primary/85 backdrop-blur-lg" />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/25"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="relative z-10 flex items-end gap-4 px-5 pt-8 pb-5">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-primary-foreground/20 shadow-xl">
                            <SnapshotImage
                                path={record.snapshot_path}
                                avatarUrl={record.employee?.avatar_url}
                                name={name}
                                className="h-full w-full"
                            />
                        </div>
                        <div className="min-w-0 pb-1">
                            <h2 className="truncate text-lg leading-tight font-bold text-primary-foreground">
                                {name}
                            </h2>
                            <p className="mt-0.5 font-mono text-xs text-primary-foreground/60">
                                {workId}
                            </p>
                            <div className="mt-2.5 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-primary-foreground/60" />
                                <span className="font-mono text-sm font-semibold text-primary-foreground tabular-nums">
                                    {fmtTime(record.captured_at)}
                                </span>
                                <span className="ml-1 text-[9px] font-semibold tracking-widest text-primary-foreground/50 uppercase">
                                    Detected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-4 divide-x divide-border border-b border-border bg-muted/30">
                    {(
                        [
                            'time_in',
                            'break_out',
                            'break_in',
                            'time_out',
                        ] as TimeType[]
                    ).map((tt) => {
                        const cfg = TT[tt];
                        const Icon = cfg.icon;
                        const rec = latest[tt];
                        return (
                            <div
                                key={tt}
                                className="flex flex-col items-center gap-1 px-1 py-3"
                            >
                                <Icon
                                    className={`h-3.5 w-3.5 ${cfg.iconCls}`}
                                />
                                <span className="text-center text-[9px] leading-tight font-semibold tracking-widest text-muted-foreground uppercase">
                                    {cfg.label}
                                </span>
                                <span
                                    className={`font-mono text-[10px] font-bold tabular-nums ${rec ? 'text-foreground' : 'text-muted-foreground/40'}`}
                                >
                                    {rec ? fmtTime(rec.captured_at) : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <DialogHeader className="shrink-0 px-5 pt-4 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        All Detections Today
                        <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] font-bold"
                        >
                            {empRecords.length}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[280px]">
                    <div className="px-5 pb-5">
                        {empRecords.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground italic">
                                No records found.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {empRecords.map((r) => {
                                    const cfg = TT[r.time_type ?? 'time_in'];
                                    const Icon = cfg.icon;
                                    const active = r.id === record.id;
                                    return (
                                        <div
                                            key={r.id}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? 'border border-primary/20 bg-primary/10' : 'hover:bg-muted/50'}`}
                                        >
                                            <div
                                                className={`h-9 w-9 rounded-full ${cfg.bgCls} flex shrink-0 items-center justify-center border ${cfg.borderCls}`}
                                            >
                                                <Icon
                                                    className={`h-4 w-4 ${cfg.iconCls}`}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        Detected
                                                    </span>
                                                    <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                                                        {fmtTime(r.captured_at)}
                                                    </span>
                                                </div>
                                                {r.device_id && (
                                                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                                        Device: {r.device_id}
                                                    </p>
                                                )}
                                            </div>
                                            {r.snapshot_path && (
                                                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border">
                                                    <img
                                                        src={`/storage/${r.snapshot_path}`}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '#' },
    { title: 'Logs', href: '#' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecognitionLogIndex({
    attendances: initialAttendances,
    filters = { date: todayPH() },
}: Props) {
    const [date, setDate] = useState(filters.date);
    const isToday = date === todayPH();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const d = e.target.value;
        setDate(d);
        router.get(
            route('recognition-logs.index'),
            { date: d },
            { preserveScroll: true, replace: true },
        );
    };

    const setToday = () => {
        const today = todayPH();
        setDate(today);
        router.get(
            route('recognition-logs.index'),
            { date: today },
            { preserveScroll: true, replace: true },
        );
    };

    const [records, setRecords] = useState<AttendanceLog[]>(() =>
        toArray(initialAttendances),
    );
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [newIds, setNewIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        setRecords(toArray(initialAttendances));
    }, [initialAttendances]);

    const [echoConnected, setEchoConnected] = useState(false);
    useEffect(() => {
        const check = () => {
            const echo = (window as any).Echo;
            if (!echo) {
                setEchoConnected(false);
                return;
            }
            setEchoConnected(
                echo.connector?.pusher?.connection?.state === 'connected',
            );
        };
        check();
        const id = setInterval(check, 2000);
        return () => clearInterval(id);
    }, []);

    const [selectedRecord, setSelectedRecord] = useState<AttendanceLog | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const openRecord = (record: AttendanceLog) => {
        setSelectedRecord(record);
        setDialogOpen(true);
    };

    useEchoPublic(
        'attendance-logs',
        '.log.created',
        (incoming: AttendanceLog) => {
            if (date !== todayPH()) return;
            setRecords((prev) =>
                prev.some((r) => r.id === incoming.id)
                    ? prev
                    : [incoming, ...prev],
            );
            setNewIds((prev) => new Set(prev).add(incoming.id));
            setLastUpdated(new Date());
            setTimeout(() => {
                setNewIds((prev) => {
                    const s = new Set(prev);
                    s.delete(incoming.id);
                    return s;
                });
            }, 5000);
        },
    );

    useEchoPublic(
        'attendance-logs',
        '.log.updated',
        (updated: Pick<AttendanceLog, 'id' | 'time_type'>) => {
            if (date !== todayPH()) return;
            setRecords((prev) =>
                prev.map((r) =>
                    r.id === updated.id
                        ? { ...r, time_type: updated.time_type }
                        : r,
                ),
            );
            setSelectedRecord((prev) =>
                prev?.id === updated.id
                    ? { ...prev, time_type: updated.time_type }
                    : prev,
            );
        },
    );

    const [search, setSearch] = useState('');
    const filtered = useMemo(
        () => records.filter((r) => matchesSearch(r, search)),
        [records, search],
    );

    // ── Camera state ──────────────────────────────────────────────────────────
    const [cameras, setCameras] = useState<CameraSource[]>(() => loadCameras());
    const [pinnedId, setPinnedId] = useState<string | null>(null);

    // Form dialog state
    const [camFormOpen, setCamFormOpen] = useState(false);
    const [editingCam, setEditingCam] = useState<CameraSource | undefined>(
        undefined,
    );

    const openAddCam = () => {
        setEditingCam(undefined);
        setCamFormOpen(true);
    };
    const openEditCam = (cam: CameraSource) => {
        setEditingCam(cam);
        setCamFormOpen(true);
    };

    const handleSaveCam = (cam: CameraSource) => {
        setCameras((prev) => {
            const exists = prev.findIndex((c) => c.id === cam.id);
            const updated =
                exists >= 0
                    ? prev.map((c) => (c.id === cam.id ? cam : c))
                    : [...prev, cam];
            saveCameras(updated);
            return updated;
        });
    };

    const handleRemoveCam = (id: string) => {
        setCameras((prev) => {
            const updated = prev.filter((c) => c.id !== id);
            saveCameras(updated);
            return updated;
        });
        if (pinnedId === id) setPinnedId(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            {/* Full-screen flex column — fills viewport below app chrome */}
            <div
                className="flex flex-col px-4 pt-4 pb-4 sm:px-5"
                style={{ height: 'calc(100dvh - 56px)' }}
            >
                {/* ── Header ── */}
                <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Radio className="h-4 w-4 text-primary" />
                            Attendance Monitor
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {isToday ? 'Today — ' : ''}
                            {fmtDate(date)}
                            {' · '}
                            <span className="font-semibold text-foreground">
                                {records.length}
                            </span>{' '}
                            detection{records.length !== 1 ? 's' : ''}
                            {lastUpdated && (
                                <span className="ml-2 text-[11px] text-muted-foreground/60">
                                    · updated{' '}
                                    {lastUpdated.toLocaleTimeString('en-PH', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true,
                                    })}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="h-9 w-38"
                        />
                        {!isToday && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5"
                                onClick={setToday}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Today</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Main layout — fills all remaining height ── */}
                <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
                    {/* ══ LEFT: Camera panel ══ */}
                    <div className="flex min-h-0 flex-col gap-2 xl:w-[69%]">
                        {/* Camera toolbar */}
                        <div className="flex shrink-0 items-center justify-between gap-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Camera className="h-3.5 w-3.5" />
                                {cameras.length} camera
                                {cameras.length !== 1 ? 's' : ''}
                                {pinnedId && (
                                    <span className="text-primary">
                                        {' '}
                                        · 1 pinned
                                    </span>
                                )}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={openAddCam}
                            >
                                <Plus className="h-3 w-3" />
                                Add Camera
                            </Button>
                        </div>

                        {/* Camera grid — fills remaining height */}
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <CameraGrid
                                cameras={cameras}
                                pinnedId={pinnedId}
                                onPin={(id) => setPinnedId(id)}
                                onEdit={openEditCam}
                                onRemove={handleRemoveCam}
                            />
                        </div>
                    </div>

                    {/* ══ RIGHT: Detection log — fills full height, scrollable inside ══ */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
                        {/* Panel header */}
                        <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/20 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                    <Fingerprint className="h-3.5 w-3.5 text-primary" />
                                    Detection Log
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {filtered.length}
                                        {search
                                            ? ` / ${records.length}`
                                            : ''}{' '}
                                        detection
                                        {filtered.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or work ID…"
                                    className="h-8 bg-background pr-8 pl-8 text-sm"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable grid */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                    <Fingerprint className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">
                                        {search
                                            ? 'No detections match your search.'
                                            : 'No detections for this date.'}
                                    </p>
                                    {search && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSearch('')}
                                            className="gap-1.5"
                                        >
                                            <X className="h-3 w-3" /> Clear
                                            search
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-2">
                                    {filtered.map((record) => (
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
    );
}
