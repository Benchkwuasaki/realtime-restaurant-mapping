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

type MapStatusFilter = "all" | "pending" | "done"

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

// Module-level name cache for stat cards
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

// ─── Stat Cards ───────────────────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    accent?: "default" | "green" | "yellow" | "red" | "blue"
}

function StatCard({ icon, label, value, sub, accent = "default" }: StatCardProps) {
    const accentClass = {
        default: "text-primary",
        green: "text-emerald-500",
        yellow: "text-amber-500",
        red: "text-red-500",
        blue: "text-blue-500",
    }[accent]

    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3.5 flex items-start gap-3 min-w-0">
            <div className={cn("mt-0.5 shrink-0", accentClass)}>{icon}</div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
                <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
            </div>
        </div>
    )
}

function SlipDashboard({ slips }: { slips: WhereaboutSlip[] }) {
    const [topBrgyName, setTopBrgyName] = useState<string | null>(null)

    const stats = useMemo(() => {
        const withLocation = slips.filter((s) => s.latitude && s.longitude)
        const pending = slips.filter((s) => s.return_status === "not_returned")
        const official = slips.filter((s) => s.purpose_type === "official")
        const personal = slips.filter((s) => s.purpose_type === "personal")
        const uniqueEmployees = new Set(slips.map((s) => s.employee_id)).size

        const returnedPersonal = slips.filter((s) => s.purpose_type === "personal" && s.minutes_gone != null)
        const avgMinutes =
            returnedPersonal.length > 0
                ? Math.round(returnedPersonal.reduce((sum, s) => sum + (s.minutes_gone ?? 0), 0) / returnedPersonal.length)
                : null

        // Top barangay by visit count
        const brgyCount: Record<string, number> = {}
        withLocation.forEach((s) => {
            if (s.brgy_code) brgyCount[s.brgy_code] = (brgyCount[s.brgy_code] ?? 0) + 1
        })
        const topBrgyEntry = Object.entries(brgyCount).sort((a, b) => b[1] - a[1])[0]

        return { withLocation, pending, official, personal, uniqueEmployees, avgMinutes, topBrgyEntry }
    }, [slips])

    useEffect(() => {
        if (!stats.topBrgyEntry) return
        fetchBrgyName(stats.topBrgyEntry[0]).then(setTopBrgyName)
    }, [stats.topBrgyEntry])

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
                icon={<ClipboardList className="w-4 h-4" />}
                label="Total Slips"
                value={slips.length}
                sub={`${stats.withLocation.length} with location`}
            />
            <StatCard
                icon={<AlertCircle className="w-4 h-4" />}
                label="Still Out"
                value={stats.pending.length}
                sub={stats.pending.length > 0 ? "not yet returned" : "all returned"}
                accent={stats.pending.length > 0 ? "red" : "green"}
            />
            <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Employees"
                value={stats.uniqueEmployees}
                sub={`${stats.official.length} official · ${stats.personal.length} personal`}
                accent="blue"
            />
            <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Avg Time Away"
                value={stats.avgMinutes != null ? `${stats.avgMinutes}m` : "—"}
                sub="personal slips only"
                accent="yellow"
            />
            <StatCard
                icon={<MapPinned className="w-4 h-4" />}
                label="Top Destination"
                value={
                    topBrgyName
                        ? <span className="text-base leading-tight">{topBrgyName}</span>
                        : stats.topBrgyEntry
                            ? <span className="text-sm font-mono">{stats.topBrgyEntry[0]}</span>
                            : "—"
                }
                sub={stats.topBrgyEntry ? `${stats.topBrgyEntry[1]} visit${stats.topBrgyEntry[1] !== 1 ? "s" : ""}` : undefined}
                accent="green"
            />
        </div>
    )
}

// ─── SlipMapView ──────────────────────────────────────────────────────────────

function SlipMapView({ slips }: { slips: WhereaboutSlip[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const [filter, setFilter] = useState<MapStatusFilter>("all")

    const filteredSlips = useMemo(() => {
        const withCoords = slips.filter((s) => s.latitude && s.longitude)
        if (filter === "all") return withCoords
        if (filter === "pending") return withCoords.filter((s) => s.return_status === "not_returned")
        return withCoords.filter((s) => s.return_status === "returned")
    }, [slips, filter])

    function makeIcon(L: any, slip: WhereaboutSlip) {
        const isPending = slip.return_status === "not_returned"
        const isOfficial = slip.purpose_type === "official"
        const color = isPending ? "#ef4444" : isOfficial ? "#3b82f6" : "#10b981"
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        </svg>`
        return L.divIcon({ html: svg, className: "", iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -32] })
    }

    const refreshMarkers = useCallback(() => {
        const map = mapRef.current
        if (!map) return
        const L = (window as any).L

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        filteredSlips.forEach((slip) => {
            const lat = parseFloat(slip.latitude!)
            const lng = parseFloat(slip.longitude!)
            if (isNaN(lat) || isNaN(lng)) return

            const empName = slip.employee?.basic_info
                ? `${slip.employee.basic_info.first_name} ${slip.employee.basic_info.last_name}`
                : `Employee #${slip.employee_id}`

            const statusColor = slip.return_status === "not_returned" ? "#ef4444" : "#10b981"
            const statusLabel = slip.return_status === "not_returned" ? "Still Out" : "Returned"
            const typeLabel = slip.purpose_type === "official" ? "Official" : "Personal"

            const popup = `
                <div style="font-family:system-ui;font-size:12px;line-height:1.5;min-width:160px">
                    <div style="font-weight:700;font-size:13px;margin-bottom:4px">${empName}</div>
                    <div style="color:#6b7280;margin-bottom:2px">${slip.purpose_description ?? ""}</div>
                    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                        <span style="background:#f3f4f6;border-radius:4px;padding:1px 6px;font-size:11px">${typeLabel}</span>
                        <span style="background:${statusColor}20;color:${statusColor};border-radius:4px;padding:1px 6px;font-size:11px;font-weight:600">${statusLabel}</span>
                    </div>
                    ${slip.minutes_gone != null ? `<div style="color:#6b7280;margin-top:4px;font-size:11px">Away: ${slip.minutes_gone} min</div>` : ""}
                </div>`

            const marker = L.marker([lat, lng], { icon: makeIcon(L, slip) })
                .bindPopup(popup, { maxWidth: 220 })
                .addTo(map)

            markersRef.current.push(marker)
        })
    }, [filteredSlips])

    // Init map once
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

    // Refresh markers whenever filter or slips change
    useEffect(() => {
        if (mapRef.current) refreshMarkers()
    }, [refreshMarkers])

    const allCount = slips.filter((s) => s.latitude && s.longitude).length
    const pendingCount = slips.filter((s) => s.latitude && s.longitude && s.return_status === "not_returned").length
    const returnedCount = slips.filter((s) => s.latitude && s.longitude && s.return_status === "returned").length

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Location Map</span>
                    <span className="text-xs text-muted-foreground">
                        {filteredSlips.length} pin{filteredSlips.length !== 1 ? "s" : ""} shown
                    </span>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40">
                    {(["all", "pending", "done"] as const).map((f) => {
                        const count = f === "all" ? allCount : f === "pending" ? pendingCount : returnedCount
                        const labels = { all: "All", pending: "Still Out", done: "Returned" }
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded transition-colors",
                                    filter === f
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {labels[f]}
                                <span className={cn(
                                    "ml-1.5 tabular-nums",
                                    f === "pending" && count > 0 ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Still Out
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Personal
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Official
                    </span>
                </div>
            </div>

            {/* Map */}
            <div ref={containerRef} className="w-full h-[360px]" style={{ zIndex: 0 }} />
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

    const columns = getColumns({ onEdit: openEdit, onDelete: () => { } })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Whereabout Slips" />

            <div className="flex h-full flex-1 flex-col gap-5 py-4 px-6">

                {/* Page header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Whereabout Slips
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {slips.length} slip{slips.length !== 1 ? "s" : ""} on record
                        </p>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {props.flash.success}
                    </div>
                )}

                {/* Stat cards */}
                <SlipDashboard slips={slips} />

                {/* Map view */}
                <SlipMapView slips={slips} />

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={slips}
                    getRowId={(row) => String(row.whereabout_slip_id)}
                    searchColumnId="employee"
                    searchPlaceholder="Search employee…"
                    filters={[
                        { columnId: "purpose_type", title: "Purpose Type", options: [{ value: "official", label: "Official" }, { value: "personal", label: "Personal" }] },
                        { columnId: "status", title: "Status", options: [{ value: "pending", label: "Pending" }, { value: "done", label: "Done" }] },
                        { columnId: "return_status", title: "Return", options: [{ value: "not_returned", label: "Not Returned" }, { value: "returned", label: "Returned" }] },
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