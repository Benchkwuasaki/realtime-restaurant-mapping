import { Head, Link, router } from "@inertiajs/react"
import { route } from "ziggy-js"
import {
    Pencil, Mail, Phone, Calendar, MapPin, User, Heart, Home,
    Briefcase, Clock, Award, FileText, Landmark, Camera, XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import AppLayout from "@/layouts/app-layout"
import { type BreadcrumbItem } from "@/types"

// ─── Types (snake_case to match Laravel JSON serialization) ───────────────────

interface Department { department_name: string }
interface Division   { division_name: string }
interface Unit       { unit_name: string }

interface Position {
    position_name: string
    department?: Department
    division?: Division
    unit?: Unit
}

interface Item { position?: Position }

interface SalaryGradeStep {
    salary_grade: number
    step: number
    monthly_salary: number
}

interface Address {
    street_address?: string
    city?: string
    state?: string
    zip_code?: string
}

interface Education {
    level?: string
    school_name: string
    degree?: string
    graduation_date?: string
}

interface FamilyMember {
    full_name: string
    relationship?: string
    contact_number?: string
}

// Laravel sends relationship as "basic_info" (snake_case)
interface BasicInfo {
    first_name: string
    last_name: string
    middle_name?: string
    name_extension?: string
    full_name: string          // appended accessor
    birth_date?: string
    sex?: boolean
    civil_status?: string
    place_of_birth?: string
    personal_email?: string
    phone_number?: string
    addresses?: Address[]      // hasMany → "addresses"
    educations?: Education[]   // hasMany → "educations"
    family_info?: FamilyMember[] // hasMany → "family_info"
}

interface GovernmentAccount {
    account_type: string
    account_number: string
}

interface EligibilityInfo {
    eligibility_name: string
    year_passed?: string
}

interface Allowance {
    allowance_type: string
    amount: number
}

interface Employee {
    employee_id: number
    work_email: string
    employment_classification: string
    date_applied?: string
    date_hired?: string
    work_schedule_start?: string
    work_schedule_end?: string
    status: boolean
    // All relationships come in as snake_case from Laravel
    basic_info?: BasicInfo
    item?: Item
    salary_grade_step?: SalaryGradeStep
    allowances?: Allowance[]
    eligibility_information?: EligibilityInfo[]
    government_accounts?: GovernmentAccount[]
}

interface Props { employee: Employee }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string) {
    if (!date) return undefined
    return new Date(date).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
    })
}

function cap(str?: string) {
    if (!str) return undefined
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: {
    icon: React.ElementType
    label: string
    value?: string
}) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    {label}
                </p>
                <p className="text-sm text-foreground font-medium leading-snug break-words">
                    {value || (
                        <span className="text-muted-foreground/40 font-normal italic text-xs">Not provided</span>
                    )}
                </p>
            </div>
        </div>
    )
}

// ─── DetailCard ───────────────────────────────────────────────────────────────

function DetailCard({
    title, value, isStatus = false, statusValue, onToggleStatus, onEdit,
}: {
    title: string
    value?: string
    isStatus?: boolean
    statusValue?: boolean
    onToggleStatus?: () => void
    onEdit?: () => void
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">{title}</span>
                {isStatus ? (
                    <Switch checked={statusValue} onCheckedChange={onToggleStatus} className="scale-90" />
                ) : (
                    <button
                        onClick={onEdit}
                        className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent flex items-center justify-center transition-all text-muted-foreground hover:text-primary"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground/30" />
                </div>
                <span className="text-xs text-muted-foreground flex-1 truncate font-medium">
                    {value ?? "Not set"}
                </span>
                <Badge className="text-[10px] font-semibold bg-accent text-accent-foreground border-0 rounded-md px-2 py-0.5 shrink-0">
                    Present
                </Badge>
            </div>
        </div>
    )
}

// ─── Employment Tab ───────────────────────────────────────────────────────────

function EmploymentDetailsTab({ employee }: { employee: Employee }) {
    const position = employee.item?.position

    const handleToggleStatus = () => {
        router.patch(route("employee.toggleStatus", employee.employee_id), {}, { preserveScroll: true })
    }

    return (
        <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
                <DetailCard title="Position"                   value={position?.position_name} />
                <DetailCard title="Date Hired"                 value={fmt(employee.date_hired)} />
                <DetailCard title="Status" isStatus            statusValue={employee.status} onToggleStatus={handleToggleStatus} />
                <DetailCard title="Unit"                       value={position?.unit?.unit_name} />
                <DetailCard title="Division"                   value={position?.division?.division_name} />
                <DetailCard title="Department"                 value={position?.department?.department_name} />
                <DetailCard title="Employment Classification"  value={employee.employment_classification} />
                <DetailCard title="Date Applied"               value={fmt(employee.date_applied)} />
                <DetailCard
                    title="Work Schedule"
                    value={
                        employee.work_schedule_start && employee.work_schedule_end
                            ? `${employee.work_schedule_start} – ${employee.work_schedule_end}`
                            : undefined
                    }
                />
            </div>
        </div>
    )
}

// ─── Compensation Tab ─────────────────────────────────────────────────────────

function CompensationTab({ employee }: { employee: Employee }) {
    const sgs = employee.salary_grade_step   // ← snake_case
    const allowances = employee.allowances ?? []

    return (
        <div className="p-5 space-y-4">
            {sgs && (
                <div className="bg-accent/40 border border-accent rounded-xl p-5">
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">
                        Salary Grade & Step
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                        SG {sgs.salary_grade} — Step {sgs.step}
                    </p>
                    <p className="text-sm text-primary/70 mt-1 font-medium">
                        ₱{Number(sgs.monthly_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        <span className="font-normal text-primary/50"> / month</span>
                    </p>
                </div>
            )}
            {allowances.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Allowances</p>
                    <div className="space-y-2">
                        {allowances.map((a, i) => (
                            <div key={i} className="flex justify-between items-center bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/20 transition-colors">
                                <span className="text-sm text-foreground">{a.allowance_type}</span>
                                <span className="text-sm font-bold text-foreground">
                                    ₱{Number(a.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!sgs && allowances.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm italic">No compensation data available.</p>
                </div>
            )}
        </div>
    )
}

// ─── Government & Eligibility Tab ─────────────────────────────────────────────

function GovernmentEligibilityTab({ employee }: { employee: Employee }) {
    const govAccounts  = employee.government_accounts ?? []    // ← snake_case
    const eligibilities = employee.eligibility_information ?? [] // ← snake_case

    return (
        <div className="p-5 space-y-6">
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Government Accounts
                </p>
                {govAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No government accounts on file.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {govAccounts.map((g, i) => (
                            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                    <Landmark className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{g.account_type}</p>
                                    <p className="text-sm font-bold text-foreground">{g.account_number}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Eligibilities
                </p>
                {eligibilities.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No eligibility records on file.</p>
                ) : (
                    <div className="space-y-2">
                        {eligibilities.map((e, i) => (
                            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                    <Award className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-sm text-foreground flex-1 font-medium">{e.eligibility_name}</span>
                                {e.year_passed && (
                                    <span className="text-xs text-muted-foreground font-medium">{fmt(e.year_passed)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Placeholder Tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Icon className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm italic text-muted-foreground">{label} coming soon.</p>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowEmployee({ employee }: Props) {
    const basic    = employee.basic_info          // ← snake_case
    const position = employee.item?.position
    const firstAddress = (basic?.addresses ?? [])[0]

    const addressStr = firstAddress
        ? [firstAddress.street_address, firstAddress.city, firstAddress.state].filter(Boolean).join(", ")
        : undefined

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Employee", href: route("employee.index") },
        { title: "Employee Profile", href: "#" },
    ]

    const tabs = [
        { value: "employment",   label: "Employment Details",       icon: Briefcase },
        { value: "compensation", label: "Compensation",             icon: FileText  },
        { value: "leave",        label: "Leave Information",        icon: Calendar  },
        { value: "time",         label: "Time Records",             icon: Clock     },
        { value: "government",   label: "Government & Eligibility", icon: Landmark  },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${basic?.full_name ?? "Employee"} — Profile`} />

            <div className="flex gap-5 p-5 min-h-full bg-background">

                {/* ── Left Panel ── */}
                <div className="w-72 shrink-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">

                    {/* Avatar & Identity */}
                    <div className="relative flex flex-col items-center pt-8 pb-5 px-5 bg-gradient-to-b from-accent/30 to-card border-b border-border">
                        <div className="absolute top-3 right-3">
                            <Link href={route("employee.edit", employee.employee_id)}>
                                <button className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-card shadow-lg ring-2 ring-primary/20">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(basic?.full_name ?? "E")}&background=5854cc&color=fff&size=96`}
                                    alt={basic?.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity border-2 border-card">
                                <Camera className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <h1 className="text-base font-bold text-foreground leading-tight">
                                {basic?.full_name ?? "—"}
                            </h1>
                            <p className="text-xs text-primary font-semibold mt-0.5">
                                {position?.position_name ?? "No Position Assigned"}
                            </p>
                        </div>

                        <Badge
                            className={`mt-2.5 text-[10px] font-bold border-0 rounded-full px-3 py-0.5 ${
                                employee.status
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "bg-destructive/10 text-destructive"
                            }`}
                        >
                            {employee.status ? "● Active" : "● Inactive"}
                        </Badge>
                    </div>

                    {/* Basic Info rows */}
                    <div className="flex-1 px-4 py-3 overflow-y-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Basic Information
                        </p>
                        <InfoRow icon={Mail}     label="Email"          value={basic?.personal_email} />
                        <InfoRow icon={Phone}    label="Contact Number" value={basic?.phone_number} />
                        <InfoRow icon={Calendar} label="Date of Birth"  value={fmt(basic?.birth_date)} />
                        <InfoRow icon={MapPin}   label="Place of Birth" value={basic?.place_of_birth} />
                        <InfoRow icon={User}     label="Sex"            value={basic?.sex !== undefined ? (basic.sex ? "Male" : "Female") : undefined} />
                        <InfoRow icon={Heart}    label="Civil Status"   value={cap(basic?.civil_status)} />
                        <InfoRow icon={Home}     label="Address"        value={addressStr} />
                    </div>

                    {/* Work Email footer */}
                    <div className="px-4 pb-4 pt-2 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Work Email</p>
                        <p className="text-xs text-foreground/70 font-medium truncate">{employee.work_email}</p>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-w-0">
                    <Tabs defaultValue="employment" className="flex flex-col flex-1">

                        <div className="border-b border-border px-4 pt-1 shrink-0">
                            <TabsList className="h-auto bg-transparent gap-0 p-0 flex-wrap">
                                {tabs.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="employment"   className="flex-1 mt-0 overflow-y-auto"><EmploymentDetailsTab employee={employee} /></TabsContent>
                        <TabsContent value="compensation" className="flex-1 mt-0 overflow-y-auto"><CompensationTab employee={employee} /></TabsContent>
                        <TabsContent value="leave"        className="flex-1 mt-0 overflow-y-auto"><PlaceholderTab icon={Calendar} label="Leave information" /></TabsContent>
                        <TabsContent value="time"         className="flex-1 mt-0 overflow-y-auto"><PlaceholderTab icon={Clock} label="Time records" /></TabsContent>
                        <TabsContent value="government"   className="flex-1 mt-0 overflow-y-auto"><GovernmentEligibilityTab employee={employee} /></TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    )
}