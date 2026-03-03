import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"
import { Head, router, usePage } from "@inertiajs/react"
import React from "react"
import Webcam from "react-webcam"
import { route } from "ziggy-js"

// shadcn/ui components (adjust paths if yours differ)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type EmployeeOption = {
    id: string | number
    name: string
}

// Flash payloads returned by back()->with(...)
type DetectFlash = {
    success: boolean
    data?: any
    message?: string
}

type ClockInFlash =
    | {
        success: true
        employee_id: string
        confidence: number
        attendance_id?: number | null
        recognition_log_id?: string | null
        message: string
    }
    | {
        success: false
        message: string
        candidates?: any[]
        similarity?: number
        threshold?: number
    }

type EnrollFlash =
    | {
        success: true
        employee_id: string
        embeddings_id?: string | null
        enrollment_session_id?: string | null
        message: string
        saved_image_path?: string
    }
    | {
        success: false
        message: string
    }

type PageProps = {
    employees?: EmployeeOption[]
    flash?: {
        kiosk_detect?: DetectFlash
        kiosk_identify?: ClockInFlash
        kiosk_enroll?: EnrollFlash
    }
}

function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    return fetch(dataUrl)
        .then((r) => r.blob())
        .then((blob) => new File([blob], filename, { type: "image/jpeg" }))
}

export default function Kiosk() {
    const webcamRef = React.useRef<Webcam>(null)

    const { props } = usePage<PageProps>()
    const employees = props.employees ?? []
    const breadcrumbs: BreadcrumbItem[] = [{ title: "Attendance Logs", href: route("attendance-logs.index") }]

    // UI state
    const [tab, setTab] = React.useState<"attendance" | "enroll">("attendance")

    // Shared status panel
    const [status, setStatus] = React.useState("Ready.")
    const [busy, setBusy] = React.useState(false)

    // Attendance scanning state
    const [running, setRunning] = React.useState(false)
    const [cooldownUntil, setCooldownUntil] = React.useState(0)

    // Enrollment state
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("")

    // Tunables
    const DETECT_INTERVAL_MS = 900
    const IDENTIFY_COOLDOWN_MS = 8000
    const MIN_FACES = 1
    const MIN_FACE_SCORE = 0.5

    // Inertia helper: post image (and optional extra fields) and return flash from onSuccess(page)
    const inertiaPost = (routeName: string, formData: FormData): Promise<PageProps["flash"]> => {
        return new Promise((resolve, reject) => {
            router.post(route(routeName), formData, {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                only: ["flash"],

                onError: (errors) => {
                    setStatus(`❌ Validation error: ${JSON.stringify(errors)}`)
                    reject(errors)
                },

                onSuccess: (page) => {
                    resolve((page.props as any).flash ?? {})
                },
            })
        })
    }

    const captureFrameFile = async (): Promise<File | null> => {
        const cam = webcamRef.current
        if (!cam) return null
        const dataUrl = cam.getScreenshot()
        if (!dataUrl) return null
        return await dataUrlToFile(dataUrl, "frame.jpg")
    }

    // ─────────────────────────────────────────────────────────────
    // Attendance flow: detect → clock-in
    // ─────────────────────────────────────────────────────────────
    const detectThenClockIn = async () => {
        if (busy) return
        if (Date.now() < cooldownUntil) return

        const file = await captureFrameFile()
        if (!file) {
            setStatus("No frame captured (allow camera permission).")
            return
        }

        setBusy(true)
        try {
            // 1) Detect
            const fdDetect = new FormData()
            fdDetect.append("image", file)

            const flashDetect = await inertiaPost("attendance.detect", fdDetect)
            const detect = flashDetect?.kiosk_detect

            if (!detect || !detect.success) {
                setStatus(`Detect error: ${detect?.message ?? "unknown"}`)
                return
            }

            // Your dd() showed: data.status, data.faces, etc.
            // Your detect response from FastAPI: { status: "success", faces: [...] }
            const faces = detect.data?.faces ?? detect.data?.detected_faces ?? detect.data?.results ?? []
            if (!Array.isArray(faces) || faces.length < MIN_FACES) {
                setStatus("No face detected.")
                return
            }

            const bestScore =
                Math.max(...faces.map((f: any) => Number(f.confidence ?? f.score ?? f.det_score ?? 0))) || 0

            if (bestScore < MIN_FACE_SCORE) {
                setStatus(`Face detected but low confidence (${bestScore.toFixed(2)}).`)
                return
            }

            setStatus(`Face detected ✅ (score ${bestScore.toFixed(2)}). Identifying…`)

            // 2) Clock-in (identify)
            const fdClock = new FormData()
            fdClock.append("image", file)

            const flashClock = await inertiaPost("attendance.clock-in", fdClock)
            const identify = flashClock?.kiosk_identify as ClockInFlash | undefined

            if (!identify) {
                setStatus("❌ Clock-in error: unknown")
                return
            }

            if ((identify as any).success) {
                const ok = identify as Extract<ClockInFlash, { success: true }>
                setStatus(`✅ ${ok.message} (ID ${ok.employee_id}, conf ${Number(ok.confidence).toFixed(3)})`)
                setCooldownUntil(Date.now() + IDENTIFY_COOLDOWN_MS)
            } else {
                const bad = identify as Extract<ClockInFlash, { success: false }>
                setStatus(`❌ ${bad.message}`)
            }
        } catch (e: any) {
            setStatus(`❌ Failed: ${e?.message ?? "unknown error"}`)
        } finally {
            setBusy(false)
        }
    }

    React.useEffect(() => {
        if (!running || tab !== "attendance") return
        const id = window.setInterval(detectThenClockIn, DETECT_INTERVAL_MS)
        return () => window.clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, tab, busy, cooldownUntil])

    // ─────────────────────────────────────────────────────────────
    // Enrollment flow
    // ─────────────────────────────────────────────────────────────
    const enrollSelectedEmployee = async () => {
        if (busy) return

        if (!selectedEmployeeId) {
            setStatus("❌ Please select an employee first.")
            return
        }

        const file = await captureFrameFile()
        if (!file) {
            setStatus("No frame captured (allow camera permission).")
            return
        }

        setBusy(true)
        try {
            const fd = new FormData()
            fd.append("image", file)
            fd.append("employee_id", selectedEmployeeId)

            const flashEnroll = await inertiaPost("attendance.enroll", fd)
            const enroll = flashEnroll?.kiosk_enroll as EnrollFlash | undefined

            if (!enroll) {
                setStatus("❌ Enrollment error: unknown")
                return
            }

            if ((enroll as any).success) {
                const ok = enroll as Extract<EnrollFlash, { success: true }>
                setStatus(`✅ ${ok.message} (Employee ID ${ok.employee_id})`)
            } else {
                const bad = enroll as Extract<EnrollFlash, { success: false }>
                setStatus(`❌ ${bad.message}`)
            }
        } catch (e: any) {
            setStatus(`❌ Failed: ${e?.message ?? "unknown error"}`)
        } finally {
            setBusy(false)
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Kiosk" />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold">Attendance Kiosk</h1>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Camera */}
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Camera</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl overflow-hidden border">
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={0.9}
                                    videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                                    className="w-full h-auto"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {tab === "attendance" ? (
                                    <>
                                        <Button
                                            variant={running ? "default" : "outline"}
                                            onClick={() => setRunning((v) => !v)}
                                            disabled={busy}
                                        >
                                            {running ? "Stop Auto Scan" : "Start Auto Scan"}
                                        </Button>

                                        <Button variant="outline" onClick={detectThenClockIn} disabled={busy}>
                                            Scan Now
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={enrollSelectedEmployee} disabled={busy}>
                                            Enroll Selected Employee
                                        </Button>
                                    </>
                                )}
                            </div>

                            {cooldownUntil > Date.now() && tab === "attendance" && (
                                <div className="text-sm text-muted-foreground">
                                    Cooldown: {Math.ceil((cooldownUntil - Date.now()) / 1000)}s
                                </div>
                            )}

                            {busy && <div className="text-sm text-muted-foreground">Processing…</div>}
                        </CardContent>
                    </Card>

                    {/* Right panel: Tabs + controls + status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full">
                                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                    <TabsTrigger value="enroll">Enroll</TabsTrigger>
                                </TabsList>

                                <TabsContent value="attendance" className="space-y-3">
                                    <div className="text-sm text-muted-foreground">
                                        Auto scan runs: <span className="font-medium">{running ? "ON" : "OFF"}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Flow: detect → clock-in when face quality passes threshold.
                                    </div>
                                </TabsContent>

                                <TabsContent value="enroll" className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Employee</Label>
                                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.length === 0 ? (
                                                    <SelectItem value="__none" disabled>
                                                        No employees loaded
                                                    </SelectItem>
                                                ) : (
                                                    employees.map((e) => (
                                                        <SelectItem key={String(e.id)} value={String(e.id)}>
                                                            {e.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <div className="text-xs text-muted-foreground">
                                            Select an employee, then click “Enroll Selected Employee”.
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="pt-2 border-t space-y-2">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="text-sm whitespace-pre-wrap">{status}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}