import { Head, useForm, usePage } from "@inertiajs/react"
import {
    ClipboardList, Check, ChevronsUpDown, MapPin, Navigation,
    Clock, AlertCircle, MapPinned, Users,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { route } from "ziggy-js"
import { cn } from "@/lib/utils"
import { getColumns } from "./components/columns"
import { DataTable } from "@/components/shared/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { type Employee, type WhereaboutSlip } from "./data/schema"
import { StatCard } from "@/components/shared/stat-card"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    slips: WhereaboutSlip[]
    employees: Employee[]
}

interface SlipFormData {
    employee_id: string
    reviewed_and_noted_by_id: string
    approved_by_id: string
    attested_by_id: string
    date_filed: string
    purpose_type: string
    purpose_description: string
    time_out: string
    prov_code: string
    city_code: string
    brgy_code: string
    latitude: string
    longitude: string
}

interface GeoOption { code: string; name: string }

interface MapPickedResult {
    lat: number; lng: number
    prov_code: string; prov_name: string
    city_code: string; city_name: string
    brgy_code: string; brgy_name: string
}

interface MapCommand {
    type: "fitProvince" | "fitMunicipality"
    code: string
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Attendance", href: route("whereabout-slip.index") },
    { title: "Whereabout Slips", href: route("whereabout-slip.index") },
]

const ARCGIS_PROV = "https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Provincial/MapServer/0"
const ARCGIS_MUNI = "https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Municipal/MapServer/0"
const ARCGIS_BRGY = "https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

function getFullName(e: Employee) {
    return e.basic_info
        ? `${e.basic_info.first_name} ${e.basic_info.last_name}`
        : `Employee #${e.employee_id}`
}

async function fetchBounds(baseUrl: string, whereClause: string): Promise<[[number, number], [number, number]] | null> {
    try {
        const url = `${baseUrl}/query?f=json&where=${encodeURIComponent(whereClause)}&outFields=OBJECTID&returnGeometry=true&outSR=4326&geometryType=esriGeometryPolygon&returnExtentOnly=true`
        const data = await fetch(url).then((r) => r.json())
        const ext = data.extent
        if (!ext) return null
        return [[ext.ymin, ext.xmin], [ext.ymax, ext.xmax]]
    } catch { return null }
}

const brgyNameCache = new Map<string, Promise<string>>()
function fetchBrgyName(brgyCode: string): Promise<string> {
    if (!brgyNameCache.has(brgyCode)) {
        brgyNameCache.set(
            brgyCode,
            fetch(`${ARCGIS_BRGY}/query?f=json&where=${encodeURIComponent(`brgy_code='${brgyCode}'`)}&outFields=brgy_name&returnGeometry=false`)
                .then((r) => r.json())
                .then((d) => (d.features?.[0]?.attributes?.brgy_name as string) ?? brgyCode)
                .catch(() => brgyCode)
        )
    }
    return brgyNameCache.get(brgyCode)!
}

function formatTime(value?: string | null) {
    if (!value) return "—"
    const [hh, mm] = value.split(":")
    const h = parseInt(hh, 10)
    const m = mm ?? "00"
    return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? "PM" : "AM"}`
}

// ─── SlipDashboard ─────────────────────────────────────────────────────────────

function SlipDashboard({ slips }: { slips: WhereaboutSlip[] }) {
    const [topBrgyName, setTopBrgyName] = useState<string | null>(null)

    const stats = useMemo(() => {
        const withLocation = slips.filter((s) => s.latitude && s.longitude)
        // Outstanding = still_out | not_returned
        const outstanding = slips.filter((s) => s.status === "still_out" || s.status === "not_returned")
        const overdue = slips.filter((s) => s.status === "not_returned")
        const official = slips.filter((s) => s.purpose_type === "official")
        const personal = slips.filter((s) => s.purpose_type === "personal")
        const uniqueEmployees = new Set(slips.map((s) => s.employee_id)).size

        const returnedPersonal = slips.filter((s) => s.purpose_type === "personal" && s.minutes_gone != null)
        const avgMinutes =
            returnedPersonal.length > 0
                ? Math.round(returnedPersonal.reduce((sum, s) => sum + (s.minutes_gone ?? 0), 0) / returnedPersonal.length)
                : null

        const brgyCount: Record<string, number> = {}
        withLocation.forEach((s) => {
            if (s.brgy_code) brgyCount[s.brgy_code] = (brgyCount[s.brgy_code] ?? 0) + 1
        })
        const topBrgyEntry = Object.entries(brgyCount).sort((a, b) => b[1] - a[1])[0]

        return { withLocation, outstanding, overdue, official, personal, uniqueEmployees, avgMinutes, topBrgyEntry }
    }, [slips])

    useEffect(() => {
        if (!stats.topBrgyEntry) return
        fetchBrgyName(stats.topBrgyEntry[0]).then(setTopBrgyName)
    }, [stats.topBrgyEntry])

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
                title="Total Slips"
                value={slips.length}
                description={`${stats.withLocation.length} with location`}
                icon={<ClipboardList className="w-4 h-4 text-primary" />}
            />
            <StatCard
                title="Still Out"
                value={stats.outstanding.length}
                description={stats.overdue.length > 0 ? `${stats.overdue.length} not returned` : "all within schedule"}
                icon={<AlertCircle className="w-4 h-4 text-primary" />}
            />
            <StatCard
                title="Employees"
                value={stats.uniqueEmployees}
                description={`${stats.official.length} official · ${stats.personal.length} personal`}
                icon={<Users className="w-4 h-4 text-primary" />}
            />
            <StatCard
                title="Avg Time Away"
                value={stats.avgMinutes != null ? `${stats.avgMinutes}m` : "—"}
                description="personal slips only"
                icon={<Clock className="w-4 h-4 text-primary" />}
            />
            <StatCard
                title="Top Destination"
                value={topBrgyName ?? (stats.topBrgyEntry ? stats.topBrgyEntry[0] : "—")}
                description={stats.topBrgyEntry ? `${stats.topBrgyEntry[1]} visit${stats.topBrgyEntry[1] !== 1 ? "s" : ""}` : undefined}
                icon={<MapPinned className="w-4 h-4 text-primary" />}
            />
        </div>
    )
}

// ─── SlipMapView ──────────────────────────────────────────────────────────────
// Only shows outstanding slips (still_out + not_returned).

function SlipMapView({ slips }: { slips: WhereaboutSlip[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

    // Only outstanding slips with coordinates are relevant for the map.
    const outstandingSlips = useMemo(
        () => slips.filter(
            (s) => (s.status === "still_out" || s.status === "not_returned") && s.latitude && s.longitude
        ),
        [slips]
    )

    const toReturnCount = outstandingSlips.filter((s) => s.status === "still_out").length
    const notReturnedCount = outstandingSlips.filter((s) => s.status === "not_returned").length

    // ── Pin color: amber = still_out, red = not_returned ─────────────────────
    function makeIcon(L: any, slip: WhereaboutSlip) {
        const isOverdue = slip.status === "not_returned"
        const isOfficial = slip.purpose_type === "official"
        // Overdue → red. To-return official → blue. To-return personal → amber.
        const color = isOverdue ? "#ef4444" : isOfficial ? "#3b82f6" : "#f59e0b"
        const ringColor = isOverdue ? "#fca5a5" : isOfficial ? "#93c5fd" : "#fcd34d"
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
            <circle cx="14" cy="12" r="13" fill="${ringColor}" opacity="0.35"/>
            <path d="M14 1C8.477 1 4 5.477 4 11c0 7.875 10 23 10 23S24 18.875 24 11C24 5.477 19.523 1 14 1z"
                  fill="${color}" stroke="white" stroke-width="1.5"/>
            <circle cx="14" cy="11" r="4.5" fill="white" opacity="0.9"/>
        </svg>`
        return L.divIcon({ html: svg, className: "", iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -38] })
    }

    const refreshMarkers = useCallback(() => {
        const map = mapRef.current
        if (!map) return
        const L = (window as any).L

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        outstandingSlips.forEach((slip) => {
            const lat = parseFloat(slip.latitude!)
            const lng = parseFloat(slip.longitude!)
            if (isNaN(lat) || isNaN(lng)) return

            const empName = slip.employee?.basic_info
                ? `${slip.employee.basic_info.first_name} ${slip.employee.basic_info.last_name}`
                : `Employee #${slip.employee_id}`

            const isOverdue = slip.status === "not_returned"
            const isOfficial = slip.purpose_type === "official"

            const statusColor = isOverdue ? "#ef4444" : "#f59e0b"
            const statusBg = isOverdue ? "#fef2f2" : "#fffbeb"
            const statusLabel = isOverdue ? "⚠ Not Returned — past work hours" : "🕐 Still Out"
            const typeColor = isOfficial ? "#3b82f6" : "#6b7280"
            const typeLabel = isOfficial ? "Official" : "Personal"
            const typeBg = isOfficial ? "#eff6ff" : "#f3f4f6"

            const timeOutStr = formatTime(slip.time_out)
            const minutesSince = slip.time_out
                ? (() => {
                    const now = new Date()
                    const [hh, mm] = slip.time_out.split(":")
                    const out = new Date(now)
                    out.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0)
                    const diff = Math.max(0, Math.floor((now.getTime() - out.getTime()) / 60000))
                    return diff > 0 ? `${diff} min ago` : "just now"
                })()
                : null

            const popup = `
                <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.55;min-width:180px;max-width:220px">
                    <div style="font-weight:700;font-size:13px;margin-bottom:2px;color:#111">${empName}</div>
                    <div style="color:#6b7280;font-size:11px;margin-bottom:8px">${slip.purpose_description ?? ""}</div>

                    <div style="display:flex;flex-direction:column;gap:4px">
                        <div style="background:${statusBg};border:1px solid ${statusColor}40;border-radius:5px;padding:4px 8px;color:${statusColor};font-size:11px;font-weight:600">
                            ${statusLabel}
                        </div>

                        <div style="display:flex;gap:6px">
                            <span style="background:${typeBg};color:${typeColor};border-radius:4px;padding:2px 7px;font-size:11px;font-weight:500">
                                ${typeLabel}
                            </span>
                            ${minutesSince ? `<span style="background:#f3f4f6;color:#374151;border-radius:4px;padding:2px 7px;font-size:11px">Out ${minutesSince}</span>` : ""}
                        </div>

                        <div style="display:flex;justify-content:space-between;padding-top:2px;font-size:11px;color:#6b7280;border-top:1px solid #f3f4f6;margin-top:2px">
                            <span>Time Out</span>
                            <span style="font-weight:600;color:#111">${timeOutStr}</span>
                        </div>
                    </div>
                </div>`

            const marker = L.marker([lat, lng], { icon: makeIcon(L, slip) })
                .bindPopup(popup, { maxWidth: 240, className: "whereabout-popup" })
                .addTo(map)

            markersRef.current.push(marker)
        })
    }, [outstandingSlips])

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        const init = () => {
            const L = (window as any).L
            delete (L.Icon.Default.prototype as any)._getIconUrl
            const map = L.map(containerRef.current!).setView([12.8797, 121.774], 6)
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap contributors",
            }).addTo(map)
            mapRef.current = map
            refreshMarkers()
        }

        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link")
            link.id = "leaflet-css"; link.rel = "stylesheet"
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            document.head.appendChild(link)
        }

        if ((window as any).L) { init() }
        else {
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.onload = init
            document.head.appendChild(script)
        }

        return () => {
            markersRef.current.forEach((m) => m.remove())
            mapRef.current?.remove()
            mapRef.current = null
            markersRef.current = []
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (mapRef.current) refreshMarkers()
    }, [refreshMarkers])

    const isEmpty = outstandingSlips.length === 0

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Outstanding Locations</span>
                    <span className="text-xs text-muted-foreground">
                        {outstandingSlips.length} employee{outstandingSlips.length !== 1 ? "s" : ""} currently out
                    </span>
                </div>

                {/* Status counts */}
                <div className="flex items-center gap-2 text-xs">
                    {toReturnCount > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 px-2.5 py-0.5 text-amber-700 dark:text-amber-400 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            {toReturnCount} still out
                        </span>
                    )}
                    {notReturnedCount > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-700 px-2.5 py-0.5 text-red-700 dark:text-red-400 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            {notReturnedCount} not returned
                        </span>
                    )}
                    {isEmpty && (
                        <span className="text-muted-foreground italic">All employees have returned</span>
                    )}
                </div>

                {/* Legend */}
                <div className="hidden md:flex items-center gap-4 text-[11px] text-muted-foreground border-l border-border pl-4">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                        Personal — still out
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Official — still out
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                        Not Returned (past work hours)
                    </span>
                </div>
            </div>

            {/* Map */}
            <div className="relative">
                <div ref={containerRef} className="w-full h-[360px]" style={{ zIndex: 0 }} />
                {isEmpty && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm pointer-events-none">
                        <MapPinned className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No outstanding slips to display</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── GeoCombobox ──────────────────────────────────────────────────────────────

interface GeoComboboxProps {
    id?: string; placeholder: string; value: string
    onChange: (option: GeoOption) => void
    options: GeoOption[]; disabled?: boolean; loading?: boolean
}

function GeoCombobox({ id, placeholder, value, onChange, options, disabled = false, loading = false }: GeoComboboxProps) {
    const [open, setOpen] = useState(false)
    const selected = options.find((o) => o.code === value)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled || loading} className="w-full justify-between font-normal text-sm">
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                        {loading ? "Loading…" : selected ? selected.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command filter={(v, s) => v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0}>
                    <CommandInput placeholder="Search…" className="text-sm" />
                    <CommandList className="max-h-52 overflow-y-auto">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem key={option.code} value={option.name} onSelect={() => { onChange(option); setOpen(false) }} className="text-sm">
                                    <Check className={cn("mr-2 h-4 w-4", value === option.code ? "opacity-100" : "opacity-0")} />
                                    {option.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── EmployeeCombobox ─────────────────────────────────────────────────────────

interface EmployeeComboboxProps {
    id?: string; placeholder?: string; value: string
    onChange: (value: string) => void; employees: Employee[]
}

function EmployeeCombobox({ id, placeholder = "Select employee…", value, onChange, employees }: EmployeeComboboxProps) {
    const [open, setOpen] = useState(false)
    const selected = employees.find((e) => String(e.employee_id) === value)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal text-sm">
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                        {selected ? getFullName(selected) : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command filter={(v, s) => v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0}>
                    <CommandInput placeholder="Search employee…" className="text-sm" />
                    <CommandList className="max-h-52 overflow-y-auto">
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                            {employees.map((employee) => {
                                const fullName = getFullName(employee)
                                const empId = String(employee.employee_id)
                                return (
                                    <CommandItem key={empId} value={fullName} onSelect={() => { onChange(value === empId ? "" : empId); setOpen(false) }} className="text-sm">
                                        <Check className={cn("mr-2 h-4 w-4", value === empId ? "opacity-100" : "opacity-0")} />
                                        {fullName}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

function TimeInput({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
    return (
        <Input id={id} type="time" value={value ? value.slice(0, 5) : ""} onChange={(e) => onChange(e.target.value ? `${e.target.value}:00` : "")} className="w-32 text-sm" />
    )
}

// ─── useLocationCascade ───────────────────────────────────────────────────────

function useLocationCascade() {
    const [provinces, setProvinces] = useState<GeoOption[]>([])
    const [municipalities, setMunis] = useState<GeoOption[]>([])
    const [barangays, setBrgys] = useState<GeoOption[]>([])
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingMunicipalities, setLoadingMunis] = useState(false)
    const [loadingBarangays, setLoadingBrgys] = useState(false)
    const [selectedProvince, setSelProv] = useState<GeoOption | null>(null)
    const [selectedMunicipality, setSelMuni] = useState<GeoOption | null>(null)
    const [selectedBarangay, setSelBrgy] = useState<GeoOption | null>(null)

    useEffect(() => {
        setLoadingProvinces(true)
        fetch(`${ARCGIS_PROV}/query?f=json&where=1%3D1&outFields=*&returnGeometry=false`)
            .then((r) => r.json())
            .then((data) => {
                const opts: GeoOption[] = (data.features ?? []).map((f: any) => ({ code: String(f.attributes.prov_code), name: f.attributes.prov_name as string }))
                setProvinces(opts.sort((a, b) => a.name.localeCompare(b.name)))
            })
            .catch(console.error)
            .finally(() => setLoadingProvinces(false))
    }, [])

    const fetchMunis = useCallback(async (provCode: string): Promise<GeoOption[]> => {
        const data = await fetch(`${ARCGIS_MUNI}/query?f=json&where=${encodeURIComponent(`prov_code='${provCode}'`)}&outFields=*&returnGeometry=false`).then((r) => r.json())
        return (data.features ?? []).map((f: any) => ({ code: String(f.attributes.city_code), name: f.attributes.city_name as string })).sort((a: GeoOption, b: GeoOption) => a.name.localeCompare(b.name))
    }, [])

    const fetchBrgys = useCallback(async (cityCode: string): Promise<GeoOption[]> => {
        const data = await fetch(`${ARCGIS_BRGY}/query?f=json&where=${encodeURIComponent(`city_code='${cityCode}'`)}&outFields=*&returnGeometry=false`).then((r) => r.json())
        return (data.features ?? []).map((f: any) => ({ code: String(f.attributes.brgy_code), name: f.attributes.brgy_name as string })).sort((a: GeoOption, b: GeoOption) => a.name.localeCompare(b.name))
    }, [])

    const selectProvince = useCallback(async (opt: GeoOption) => {
        setSelProv(opt); setSelMuni(null); setSelBrgy(null); setMunis([]); setBrgys([])
        setLoadingMunis(true)
        try { setMunis(await fetchMunis(opt.code)) } catch (e) { console.error(e) } finally { setLoadingMunis(false) }
    }, [fetchMunis])

    const selectMunicipality = useCallback(async (opt: GeoOption) => {
        setSelMuni(opt); setSelBrgy(null); setBrgys([])
        setLoadingBrgys(true)
        try { setBrgys(await fetchBrgys(opt.code)) } catch (e) { console.error(e) } finally { setLoadingBrgys(false) }
    }, [fetchBrgys])

    const selectBarangay = useCallback((opt: GeoOption) => setSelBrgy(opt), [])

    const hydrateFromMap = useCallback(async (provCode: string, provName: string, cityCode: string, cityName: string, brgyCode: string, brgyName: string) => {
        setSelProv({ code: provCode, name: provName }); setSelMuni({ code: cityCode, name: cityName }); setSelBrgy({ code: brgyCode, name: brgyName })
        setLoadingMunis(true); setLoadingBrgys(true)
        try {
            const [munis, brgys] = await Promise.all([fetchMunis(provCode), fetchBrgys(cityCode)])
            setMunis(munis); setBrgys(brgys)
        } catch (e) { console.error(e) } finally { setLoadingMunis(false); setLoadingBrgys(false) }
    }, [fetchMunis, fetchBrgys])

    const reset = useCallback(() => { setSelProv(null); setSelMuni(null); setSelBrgy(null); setMunis([]); setBrgys([]) }, [])

    return { provinces, municipalities, barangays, loadingProvinces, loadingMunicipalities, loadingBarangays, selectedProvince, selectedMunicipality, selectedBarangay, selectProvince, selectMunicipality, selectBarangay, hydrateFromMap, reset }
}

// ─── MapPicker (form) ─────────────────────────────────────────────────────────

interface MapPickerProps {
    onPick: (r: MapPickedResult) => void
    commandRef: React.MutableRefObject<((cmd: MapCommand) => void) | null>
}

function MapPicker({ onPick, commandRef }: MapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const onPickRef = useRef(onPick)
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => { onPickRef.current = onPick }, [onPick])

    const handleClick = useCallback(async (e: any) => {
        const L = (window as any).L
        const { lat, lng } = e.latlng
        markerRef.current?.remove()
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)
        setStatus("Detecting location…")
        try {
            const url = `${ARCGIS_BRGY}/query?f=json&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false`
            const data = await fetch(url).then((r) => r.json())
            if (!data.features?.length) { setStatus("⚠ No barangay found at this point."); return }
            const a = data.features[0].attributes
            setStatus(`📍 ${a.brgy_name}, ${a.city_name}, ${a.prov_name}`)
            onPickRef.current({ lat, lng, prov_code: String(a.prov_code), prov_name: String(a.prov_name), city_code: String(a.city_code), city_name: String(a.city_name), brgy_code: String(a.brgy_code), brgy_name: String(a.brgy_name) })
        } catch { setStatus("⚠ Failed to detect location — try again.") }
    }, [])

    useEffect(() => {
        commandRef.current = async (cmd: MapCommand) => {
            const map = mapRef.current; if (!map) return
            const bounds = cmd.type === "fitProvince" ? await fetchBounds(ARCGIS_PROV, `prov_code='${cmd.code}'`) : await fetchBounds(ARCGIS_MUNI, `city_code='${cmd.code}'`)
            if (bounds) map.fitBounds(bounds, { padding: [20, 20], animate: true })
        }
        return () => { commandRef.current = null }
    }, [commandRef])

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return
        const init = () => {
            const L = (window as any).L
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })
            const map = L.map(containerRef.current!).setView([12.8797, 121.774], 6)
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map)
            map.on("click", handleClick)
            mapRef.current = map
        }
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link)
        }
        if ((window as any).L) { init() } else {
            const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = init; document.head.appendChild(script)
        }
        return () => { mapRef.current?.remove(); mapRef.current = null; markerRef.current = null }
    }, [handleClick])

    return (
        <div className="space-y-1.5">
            <div ref={containerRef} className="w-full h-[240px] rounded-md border border-border" style={{ zIndex: 0 }} />
            <p className="text-xs text-muted-foreground flex items-center gap-1 min-h-[1rem]">
                <MapPin className="w-3 h-3 shrink-0" />
                {status ?? "Click on the map to pin your exact location and auto-fill the fields below."}
            </p>
        </div>
    )
}

// ─── SlipModal ────────────────────────────────────────────────────────────────

interface SlipModalProps {
    open: boolean; editingSlip: WhereaboutSlip | null; employees: Employee[]; onClose: () => void
}

function SlipModal({ open, editingSlip, employees, onClose }: SlipModalProps) {
    const isEdit = editingSlip !== null

    const { data, setData, post, put, processing, errors, reset } = useForm<SlipFormData>({
        employee_id: editingSlip ? String(editingSlip.employee_id) : "",
        reviewed_and_noted_by_id: editingSlip ? String(editingSlip.reviewed_and_noted_by_id) : "",
        approved_by_id: editingSlip ? String(editingSlip.approved_by_id) : "",
        attested_by_id: editingSlip ? String(editingSlip.attested_by_id) : "",
        date_filed: editingSlip?.date_filed ?? "",
        purpose_type: editingSlip?.purpose_type ?? "",
        purpose_description: editingSlip?.purpose_description ?? "",
        time_out: editingSlip?.time_out ?? "",
        prov_code: editingSlip?.prov_code ?? "",
        city_code: editingSlip?.city_code ?? "",
        brgy_code: editingSlip?.brgy_code ?? "",
        latitude: editingSlip?.latitude ?? "",
        longitude: editingSlip?.longitude ?? "",
    })

    const geo = useLocationCascade()
    const mapCommandRef = useRef<((cmd: MapCommand) => void) | null>(null)
    const hydrateRef = useRef(geo.hydrateFromMap)
    useEffect(() => { hydrateRef.current = geo.hydrateFromMap }, [geo.hydrateFromMap])

    function handleClose() { reset(); geo.reset(); onClose() }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) { put(route("whereabout-slip.update", editingSlip!.whereabout_slip_id), { onSuccess: handleClose }) }
        else { post(route("whereabout-slip.store"), { onSuccess: handleClose }) }
    }

    const handleMapPick = useCallback(async (result: MapPickedResult) => {
        setData((prev) => ({ ...prev, prov_code: result.prov_code, city_code: result.city_code, brgy_code: result.brgy_code, latitude: result.lat.toFixed(7), longitude: result.lng.toFixed(7) }))
        await hydrateRef.current(result.prov_code, result.prov_name, result.city_code, result.city_name, result.brgy_code, result.brgy_name)
    }, [setData])

    const handleProvinceChange = useCallback(async (opt: GeoOption) => {
        await geo.selectProvince(opt)
        setData((prev) => ({ ...prev, prov_code: opt.code, city_code: "", brgy_code: "" }))
        mapCommandRef.current?.({ type: "fitProvince", code: opt.code })
    }, [geo, setData])

    const handleMunicipalityChange = useCallback(async (opt: GeoOption) => {
        await geo.selectMunicipality(opt)
        setData((prev) => ({ ...prev, city_code: opt.code, brgy_code: "" }))
        mapCommandRef.current?.({ type: "fitMunicipality", code: opt.code })
    }, [geo, setData])

    const pinDropped = data.latitude !== "" && data.longitude !== ""

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        {isEdit ? "Edit Whereabout Slip" : "Create Whereabout Slip"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="employee_id" className="block text-xs font-medium text-foreground mb-1.5">Employee <span className="text-destructive">*</span></label>
                            <EmployeeCombobox id="employee_id" value={data.employee_id} onChange={(v) => setData("employee_id", v)} employees={employees} />
                            <FieldError message={errors.employee_id} />
                        </div>
                        <div>
                            <label htmlFor="date_filed" className="block text-xs font-medium text-foreground mb-1.5">Date Filed <span className="text-destructive">*</span></label>
                            <Input id="date_filed" type="date" value={data.date_filed} onChange={(e) => setData("date_filed", e.target.value)} className="text-sm" />
                            <FieldError message={errors.date_filed} />
                        </div>
                        <div>
                            <label htmlFor="purpose_type" className="block text-xs font-medium text-foreground mb-1.5">Purpose Type <span className="text-destructive">*</span></label>
                            <Select value={data.purpose_type} onValueChange={(v) => setData("purpose_type", v)}>
                                <SelectTrigger id="purpose_type" className="text-sm"><SelectValue placeholder="Select type…" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="official">Official</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.purpose_type} />
                        </div>
                        <div>
                            <label htmlFor="purpose_description" className="block text-xs font-medium text-foreground mb-1.5">Purpose Description <span className="text-destructive">*</span></label>
                            <Textarea id="purpose_description" value={data.purpose_description} onChange={(e) => setData("purpose_description", e.target.value)} placeholder="Describe the purpose of leaving…" rows={3} className="text-sm resize-none" />
                            <FieldError message={errors.purpose_description} />
                        </div>
                        <div>
                            <label htmlFor="time_out" className="block text-xs font-medium text-foreground mb-1.5">Time Out <span className="text-destructive">*</span></label>
                            <TimeInput id="time_out" value={data.time_out} onChange={(v) => setData("time_out", v)} />
                            <FieldError message={errors.time_out} />
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Location</span>
                                <div className="flex-1 h-px bg-border" />
                                {!pinDropped && (
                                    <span className="text-xs text-destructive font-medium flex items-center gap-1">
                                        <Navigation className="w-3 h-3" /> Pin required
                                    </span>
                                )}
                            </div>
                            {open && <MapPicker onPick={handleMapPick} commandRef={mapCommandRef} />}
                            <div>
                                <label htmlFor="prov_code" className="block text-xs font-medium text-foreground mb-1.5">Province <span className="text-destructive">*</span></label>
                                <GeoCombobox id="prov_code" placeholder="Select province…" value={data.prov_code} options={geo.provinces} loading={geo.loadingProvinces} onChange={handleProvinceChange} />
                                <FieldError message={errors.prov_code} />
                            </div>
                            <div>
                                <label htmlFor="city_code" className="block text-xs font-medium text-foreground mb-1.5">Municipality / City <span className="text-destructive">*</span></label>
                                <GeoCombobox id="city_code" placeholder={data.prov_code ? "Select municipality…" : "Select province first"} value={data.city_code} options={geo.municipalities} loading={geo.loadingMunicipalities} disabled={!data.prov_code} onChange={handleMunicipalityChange} />
                                <FieldError message={errors.city_code} />
                            </div>
                            <div>
                                <label htmlFor="brgy_code" className="block text-xs font-medium text-foreground mb-1.5">Barangay <span className="text-destructive">*</span></label>
                                <GeoCombobox id="brgy_code" placeholder={data.city_code ? "Select barangay…" : "Select municipality first"} value={data.brgy_code} options={geo.barangays} loading={geo.loadingBarangays} disabled={!data.city_code} onChange={(opt) => { geo.selectBarangay(opt); setData((prev) => ({ ...prev, brgy_code: opt.code })) }} />
                                <FieldError message={errors.brgy_code} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">Latitude <span className="text-destructive">*</span></label>
                                    <Input readOnly value={data.latitude} placeholder="Drop a pin on the map" className={cn("text-sm font-mono bg-muted/40 cursor-default", !data.latitude && "text-muted-foreground")} />
                                    <FieldError message={errors.latitude} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">Longitude <span className="text-destructive">*</span></label>
                                    <Input readOnly value={data.longitude} placeholder="Drop a pin on the map" className={cn("text-sm font-mono bg-muted/40 cursor-default", !data.longitude && "text-muted-foreground")} />
                                    <FieldError message={errors.longitude} />
                                </div>
                            </div>
                        </div>

                        {/* Signatories */}
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Signatories</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div>
                            <label htmlFor="reviewed_and_noted_by_id" className="block text-xs font-medium text-foreground mb-1.5">Reviewed & Noted By <span className="text-destructive">*</span></label>
                            <EmployeeCombobox id="reviewed_and_noted_by_id" value={data.reviewed_and_noted_by_id} onChange={(v) => setData("reviewed_and_noted_by_id", v)} employees={employees} />
                            <FieldError message={errors.reviewed_and_noted_by_id} />
                        </div>
                        <div>
                            <label htmlFor="approved_by_id" className="block text-xs font-medium text-foreground mb-1.5">Approved By <span className="text-destructive">*</span></label>
                            <EmployeeCombobox id="approved_by_id" value={data.approved_by_id} onChange={(v) => setData("approved_by_id", v)} employees={employees} />
                            <FieldError message={errors.approved_by_id} />
                        </div>
                        <div>
                            <label htmlFor="attested_by_id" className="block text-xs font-medium text-foreground mb-1.5">Attested By <span className="text-destructive">*</span></label>
                            <EmployeeCombobox id="attested_by_id" value={data.attested_by_id} onChange={(v) => setData("attested_by_id", v)} employees={employees} />
                            <FieldError message={errors.attested_by_id} />
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing || !pinDropped} title={!pinDropped ? "Drop a pin on the map before submitting" : undefined} className="text-xs">
                            {processing ? "Saving…" : isEdit ? "Update Slip" : "Create Slip"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhereaboutSlipIndex({ slips, employees }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()

    const [modalOpen, setModalOpen] = useState(false)
    const [editingSlip, setEditingSlip] = useState<WhereaboutSlip | null>(null)

    function openCreate() { setEditingSlip(null); setModalOpen(true) }
    function openEdit(slip: WhereaboutSlip) { setEditingSlip(slip); setModalOpen(true) }
    function closeModal() { setModalOpen(false); setEditingSlip(null) }

    const columns = getColumns({ onDelete: () => { } })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Whereabout Slips" />

            <div className="flex h-full flex-1 flex-col gap-5 py-4 px-6">
                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                <SlipDashboard slips={slips} />
                <SlipMapView slips={slips} />

                <DataTable
                    columns={columns}
                    data={slips}
                    getRowId={(row) => String(row.whereabout_slip_id)}
                    searchColumnId="employee"
                    searchPlaceholder="Search employee…"
                    filters={[
                        {
                            columnId: "purpose_type",
                            title: "Purpose Type",
                            options: [
                                { value: "official", label: "Official" },
                                { value: "personal", label: "Personal" },
                            ],
                        },
                        {
                            columnId: "status",
                            title: "Status",
                            options: [
                                { value: "still_out", label: "Still Out" },
                                { value: "not_returned", label: "Not Returned" },
                                { value: "returned", label: "Returned" },
                            ],
                        },
                    ]}
                    addButton={{ label: "Create Slip", onClick: openCreate }}
                    bulkDelete={{
                        route: route("whereabout-slip.bulk-destroy"),
                        entityName: "Whereabout Slip",
                        getId: (row) => (row as WhereaboutSlip).whereabout_slip_id,
                    }}
                />
            </div>

            <SlipModal
                key={editingSlip?.whereabout_slip_id ?? "create"}
                open={modalOpen}
                editingSlip={editingSlip}
                employees={employees}
                onClose={closeModal}
                
            />
        </AppLayout>
    )
}