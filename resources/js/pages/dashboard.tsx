import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Area, AreaChart, Legend, LineChart, Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
    X, Sun, Calendar,
    UserCheck, Clock, UserX,
    Users, Briefcase, ClipboardList,
    CalendarClock, Banknote, Landmark,
    TrendingUp
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const today = new Date();
const fullDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
const shortDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const attendanceData = [
    { label: "Present", value: 200, icon: UserCheck, bg: "bg-green-100", color: "text-green-500", fill: "#22c55e" },
    { label: "Late", value: 100, icon: Clock, bg: "bg-amber-100", color: "text-amber-500", fill: "#f59e0b" },
    { label: "Absent", value: 100, icon: UserX, bg: "bg-red-100", color: "text-red-500", fill: "#ef4444" },
];

const employeeData = [
    { label: "Regular", value: 180, icon: Users, bg: "bg-blue-100", color: "text-blue-500", fill: "#3b82f6" },
    { label: "Casual", value: 95, icon: Briefcase, bg: "bg-violet-100", color: "text-violet-500", fill: "#8b5cf6" },
    { label: "Job Order", value: 125, icon: ClipboardList, bg: "bg-orange-100", color: "text-orange-500", fill: "#f97316" },
];

const weeklyTrend = [
    { day: "Mon", present: 185, late: 90, absent: 125 },
    { day: "Tue", present: 195, late: 85, absent: 120 },
    { day: "Wed", present: 210, late: 75, absent: 115 },
    { day: "Thu", present: 190, late: 110, absent: 100 },
    { day: "Fri", present: 200, late: 100, absent: 100 },
];

const leaveTypeData = [
    { label: "Vacation", value: 24, fill: "#3b82f6" },
    { label: "Sick", value: 18, fill: "#ef4444" },
    { label: "Special Privilege", value: 9, fill: "#8b5cf6" },
    { label: "Maternity/Paternity", value: 6, fill: "#ec4899" },
    { label: "Other", value: 12, fill: "#f97316" },
];

const leavePendingKPI = [
    { label: "Total Pending", value: 36, sub: "across all types", bg: "bg-blue-100", color: "text-blue-500", icon: CalendarClock },
    { label: "Urgent (>3 days)", value: 12, sub: "awaiting over 3 days", bg: "bg-red-100", color: "text-red-500", icon: UserX },
    { label: "Approved Today", value: 8, sub: "processed today", bg: "bg-green-100", color: "text-green-500", icon: UserCheck },
    { label: "Avg. Wait Time", value: "2d", sub: "average approval time", bg: "bg-amber-100", color: "text-amber-500", icon: Clock },
];


const leaveData = [
    { label: "on leave", value: 20, fill: "#3b82f6" },
];

{/*on leave trend*/ }
const leaveTrend = [
    { month: "January", leave: 12 },
    { month: "February", leave: 19 },
    { month: "March", leave: 21 },
    { month: "April", leave: 19 },
    { month: "May", leave: 20 },
    { month: "June", leave: 20 },
    { month: "July", leave: 20 },
    { month: "August", leave: 10 },
    { month: "September", leave: 20 },
    { month: "October", leave: 20 },
    { month: "November", leave: 20 },
    { month: "December", leave: 20 },
];

const employeeLeaveData = [
    { name: "Earl Francis Philip Amoy", days: 12, type: "Vacation", fill: "#3b82f6" },
    { name: "Liam Christian Papasin", days: 8, type: "Sick", fill: "#ef4444" },
    { name: "Melbert Buligan", days: 5, type: "Special", fill: "#8b5cf6" },
    { name: "Glizzy Go", days: 14, type: "Maternity", fill: "#ec4899" },
    { name: "Klein Allen", days: 3, type: "Vacation", fill: "#3b82f6" },
    { name: "Lucia Torres", days: 7, type: "Sick", fill: "#ef4444" },
    { name: "Ramon Castillo", days: 2, type: "Other", fill: "#f97316" },
];


const remittanceData = [
    { label: "SSS", value: 45000, fill: "#3b82f6" },
    { label: "PhilHealth", value: 28000, fill: "#22c55e" },
    { label: "Pag-IBIG", value: 18000, fill: "#f59e0b" },
    { label: "BIR/Tax", value: 62000, fill: "#ef4444" },
];

const remittanceTrend = [
    { month: "Oct", sss: 42000, philhealth: 26000, pagibig: 17000, tax: 58000 },
    { month: "Nov", sss: 43000, philhealth: 27000, pagibig: 17500, tax: 60000 },
    { month: "Dec", sss: 44000, philhealth: 27500, pagibig: 18000, tax: 61000 },
    { month: "Jan", sss: 44500, philhealth: 27800, pagibig: 18000, tax: 61500 },
    { month: "Feb", sss: 44800, philhealth: 28000, pagibig: 18000, tax: 62000 },
    { month: "Mar", sss: 45000, philhealth: 28000, pagibig: 18000, tax: 62000 },
];

const payrollKPI = [
    { label: "Total Headcount", value: 400, sub: "employees for payroll", bg: "bg-blue-100", color: "text-blue-500", icon: Users },
    { label: "Next Payroll Date", value: "Mar 15", sub: "upcoming cutoff", bg: "bg-green-100", color: "text-green-500", icon: Calendar },
];

const payrollStackedData = [
    { month: "Oct", Regular: 175, Casual: 90, JobOrder: 120 },
    { month: "Nov", Regular: 178, Casual: 92, JobOrder: 122 },
    { month: "Dec", Regular: 180, Casual: 94, JobOrder: 124 },
    { month: "Jan", Regular: 178, Casual: 93, JobOrder: 123 },
    { month: "Feb", Regular: 179, Casual: 94, JobOrder: 124 },
    { month: "Mar", Regular: 180, Casual: 95, JobOrder: 125 },
];

const payrollDates = [15, 30]; // twice a month

const RADIAN = Math.PI / 180;

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

function AttendancePieChart({ data }) {
    const [activeIndex, setActiveIndex] = useState(null);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
        <div className="flex flex-col gap-3">
            <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data} dataKey="value" nameKey="label"
                            cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                            paddingAngle={3} labelLine={false} label={<CustomPieLabel />}
                            onMouseEnter={(_, i) => setActiveIndex(i)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {data.map((entry, index) => (
                                <Cell key={entry.label} fill={entry.fill}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    stroke="white" strokeWidth={2}
                                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {data.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeIndex === index;
                    return (
                        <div key={item.label}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-150 cursor-pointer
                                ${isActive ? "border-gray-300 shadow-sm scale-[1.03]" : "border-gray-100"}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <div className={`${item.bg} p-1.5 rounded-md`}>
                                <Icon className={`size-3.5 ${item.color}`} />
                            </div>
                            <p className="text-xs text-gray-400">{item.label}</p>
                            <p className="text-lg font-bold text-gray-800">{item.value}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmployeeBarChart({ data }) {
    return (
        <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                        cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((entry) => (
                            <Cell key={entry.label} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function WeeklyTrendChart({ data }) {
    return (
        <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} fill="url(#presentGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fill="url(#lateGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="url(#absentGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function LeaveTypeChart({ data }) {
    return (
        <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(value) => [`${value} employees`]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                        cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((entry) => (
                            <Cell key={entry.label} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function LeaveTrendChart({ data }) {
    return (
        <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v.slice(0, 3)} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(value) => [`${value} employees`]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                    />
                    <Area type="monotone" dataKey="leave" stroke="#3b82f6" strokeWidth={2}
                        fill="url(#leaveGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
function EmployeeLeaveHeatmap({ data }) {
    const maxDays = Math.max(...data.map(d => d.days));
    const getColor = (days, type) => {
        const intensity = days / maxDays;
        if (type === "Vacation") return `rgba(59, 130, 246, ${0.15 + intensity * 0.85})`;
        if (type === "Sick") return `rgba(239, 68, 68, ${0.15 + intensity * 0.85})`;
        if (type === "Special") return `rgba(139, 92, 246, ${0.15 + intensity * 0.85})`;
        if (type === "Maternity") return `rgba(236, 72, 153, ${0.15 + intensity * 0.85})`;
        return `rgba(249, 115, 22, ${0.15 + intensity * 0.85})`;
    };

    const getTextColor = (days, maxDays) => days / maxDays > 0.5 ? "text-white" : "text-gray-700";

    return (
        <div className="flex flex-col gap-1.5">
            {/* Header */}
            <div className="grid grid-cols-3 gap-1.5 mb-1">
                <p className="text-xs font-medium text-gray-400 col-span-1">Employee</p>
                <p className="text-xs font-medium text-gray-400 text-center">Type</p>
                <p className="text-xs font-medium text-gray-400 text-right">Days</p>
            </div>

            {/* Rows */}
            {data.map((item) => (
                <div
                    key={item.name}
                    className={`grid grid-cols-3 gap-1.5 items-center px-3 py-2 rounded-lg transition-all duration-150 ${getTextColor(item.days, maxDays)}`}
                    style={{ backgroundColor: getColor(item.days, item.type) }}
                >
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-center opacity-80">{item.type}</p>
                    <p className="text-xs font-black text-right">{item.days}d</p>
                </div>
            ))}

        </div>
    );
}


function RemittanceDonut({ data }) {
    const [activeIndex, setActiveIndex] = useState(null);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
        <div className="flex flex-col gap-3">
            <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data} dataKey="value" nameKey="label"
                            cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                            paddingAngle={3} labelLine={false} label={<CustomPieLabel />}
                            onMouseEnter={(_, i) => setActiveIndex(i)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {data.map((entry, index) => (
                                <Cell key={entry.label} fill={entry.fill}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    stroke="white" strokeWidth={2}
                                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [`₱${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`, name]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}

function RemittanceTrendChart({ data }) {
    return (
        <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                        formatter={(value, name) => [`₱${value.toLocaleString()}`, name.toUpperCase()]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                    />
                    <Line type="monotone" dataKey="sss" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="philhealth" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="pagibig" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="tax" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function PayrollStackedBar({ data }) {
    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", padding: "6px 12px" }}
                        cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="Regular" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Casual" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="JobOrder" stackId="a" fill="#f97316" radius={[6, 6, 0, 0]} name="Job Order" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function Page() {
    const { user } = useAuth();

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-6 pt-2">

                {/* Welcome + Date */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-normal text-gray-800">
                        Welcome back, <span className="font-bold">{user?.name}</span>
                    </h1>
                    <span className="text-lg font-normal text-gray-700">{fullDate}</span>
                </div>

                {/* Row 1: Today + Attendance Pie + Employee Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5 border border-gray-200 flex flex-col gap-3">
                        <p className="text-3xl font-black tracking-widest text-gray-900">TODAY</p>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Sun className="size-5" />
                            <span className="text-xl font-semibold">8:00 AM</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="size-5" />
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold">{dayName}</span>
                                <span className="text-sm text-gray-400">{shortDate}</span>
                            </div>
                        </div>

                    </Card>

                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Attendance Today</span>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>
                        <AttendancePieChart data={attendanceData} />
                    </Card>

                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Total Employees</span>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>
                        <EmployeeBarChart data={employeeData} />
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {employeeData.map(item => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100">
                                        <div className={`${item.bg} p-1.5 rounded-md`}>
                                            <Icon className={`size-3.5 ${item.color}`} />
                                        </div>
                                        <p className="text-xs text-gray-400">{item.label}</p>
                                        <p className="text-base font-bold text-gray-800">{item.value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Weekly Trend */}
                <Card className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <TrendingUp className="size-4 text-blue-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Weekly Attendance Trend</span>
                        </div>
                        <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                    </div>
                    <WeeklyTrendChart data={weeklyTrend} />
                </Card>

                {/* Employees on Leave */}
                <Card className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <CalendarClock className="size-4 text-blue-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Employees on Leave</span>
                        </div>
                        <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">By Leave Type</p>
                            <LeaveTypeChart data={leaveTypeData} />
                        </div>
                        {/* Per Employee */}

                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Top 5 — Leave Days per Employee</p>
                            <EmployeeLeaveHeatmap data={[...employeeLeaveData].sort((a, b) => b.days - a.days).slice(0, 5)} />
                        </div>
                    </div>
                </Card>

                {/* Pending Leave + Monthly Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded-md">
                                    <CalendarClock className="size-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Pending Leave Request</span>
                            </div>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex flex-col gap-1 p-3 rounded-lg border border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">Total Pending</p>
                                    <div className="bg-blue-100 p-1 rounded-md">
                                        <CalendarClock className="size-3 text-blue-500" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-800">36</p>
                                <p className="text-xs text-gray-400">across all types</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {leavePendingKPI.slice(1).map((kpi) => {
                                    const Icon = kpi.icon;
                                    return (
                                        <div key={kpi.label} className="flex flex-col gap-1 p-3 rounded-lg border border-gray-100 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-400">{kpi.label}</p>
                                                <div className={`${kpi.bg} p-1 rounded-md`}>
                                                    <Icon className={`size-3 ${kpi.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-gray-800">{kpi.value}</p>
                                            <p className="text-xs text-gray-400">{kpi.sub}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded-md">
                                    <TrendingUp className="size-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Monthly Leave Trend</span>
                            </div>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>
                        <LeaveTrendChart data={leaveTrend} />
                    </Card>

                </div>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">


                    {/* Upcoming Payroll */}
                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-md">
                                    <Banknote className="size-4 text-green-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Upcoming Payroll Processing</span>
                            </div>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>



                        <div className="flex flex-col gap-4">

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                                {payrollKPI.map((kpi) => {
                                    const Icon = kpi.icon;
                                    return (
                                        <div key={kpi.label} className="flex flex-col gap-1 p-3 rounded-lg border border-gray-100 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-400">{kpi.label}</p>
                                                <div className={`${kpi.bg} p-1 rounded-md`}>
                                                    <Icon className={`size-3 ${kpi.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-gray-800">{kpi.value}</p>
                                            <p className="text-xs text-gray-400">{kpi.sub}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Calendar below KPI */}
                            {(() => {
                                const now = new Date();
                                const year = now.getFullYear();
                                const month = now.getMonth();
                                const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const todayDate = now.getDate();
                                const blanks = Array(firstDay).fill(null);
                                const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                                const allCells = [...blanks, ...days];

                                return (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-3">{monthName}</p>
                                        <div className="grid grid-cols-7 mb-1">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {allCells.map((day, i) => {
                                                if (!day) return <div key={`blank-${i}`} />;
                                                const isToday = day === todayDate;
                                                const isPayroll = payrollDates.includes(day);
                                                return (
                                                    <div key={day}
                                                        className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-all
                                                        ${isPayroll ? "bg-green-500 text-white font-bold" : ""}
                                                        ${isToday && !isPayroll ? "bg-blue-100 text-blue-600 font-bold" : ""}
                                                        ${!isPayroll && !isToday ? "text-gray-600 hover:bg-gray-100" : ""}
                                                    `}
                                                    >
                                                        {day}
                                                        {isPayroll && (
                                                            <span className="text-[9px] leading-tight font-medium opacity-90">Salary</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-green-500" />
                                                <span className="text-xs text-gray-500">Salary Release</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-blue-100" />
                                                <span className="text-xs text-gray-500">Today</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}




                        </div>
                    </Card>

                    <Card className="p-4 border border-gray-200">
                        {/* Stacked Bar — takes 1 col */}
                        <div>
                            <section className="p-4  h-full">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 p-1.5 rounded-md">
                                            <Users className="size-4 text-blue-500" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Number of Employees per Category</span>
                                    </div>
                                    <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-4 ml-8">6-month breakdown</p>
                                <PayrollStackedBar data={payrollStackedData} />
                                <div className="flex items-center justify-center gap-4 mt-3 pt-3 ">
                                    {[
                                        { label: "Regular", fill: "#3b82f6" },
                                        { label: "Casual", fill: "#8b5cf6" },
                                        { label: "Job Order", fill: "#f97316" },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />
                                            <span className="text-xs text-gray-500">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </Card>

                </section>

                {/* Government Remittance */}
                <Card className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1.5 rounded-md">
                                <Landmark className="size-4 text-purple-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Government Remittance Summary</span>
                        </div>
                        <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Distribution this month</p>
                            <RemittanceDonut data={remittanceData} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">6-month trend</p>
                            <RemittanceTrendChart data={remittanceTrend} />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-center gap-6 pt-2 border-t border-gray-100">
                            {remittanceData.map(item => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span className="text-xs text-gray-500">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

            </div>
        </AppLayout>
    );
}