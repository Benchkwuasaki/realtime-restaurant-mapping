import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import {
    X, Sun, Calendar,
    UserCheck, Clock, UserX,
    Users, Briefcase, ClipboardList,
    CalendarClock, Banknote, Landmark
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";

const today = new Date();
const fullDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});
const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
const shortDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

const attendanceItems = [
    { label: "Present", value: 200, icon: UserCheck, bg: "bg-green-100", color: "text-green-500" },
    { label: "Late", value: 100, icon: Clock, bg: "bg-yellow-100", color: "text-yellow-500" },
    { label: "Absent", value: 100, icon: UserX, bg: "bg-red-100", color: "text-red-500" },
];

const employeeItems = [
    { label: "Regular", value: 100, icon: Users, bg: "bg-blue-100", color: "text-blue-500" },
    { label: "Casual", value: 100, icon: Briefcase, bg: "bg-purple-100", color: "text-purple-500" },
    { label: "Job Order", value: 100, icon: ClipboardList, bg: "bg-orange-100", color: "text-orange-500" },
];

export default function Page() {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-6 pt-2">

                {/* Welcome + Date Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-normal text-gray-800">
                        Welcome back, <span className="font-bold">User Name!</span>
                    </h1>
                    <span className="text-lg font-normal text-gray-700">{fullDate}</span>
                </div>

                {/* Top Section: Today + Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Today Card */}
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

                    {/* Attendance + Total Employees */}
                    <div className="md:col-span-2 flex flex-col gap-3">

                        {/* Attendance */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Attendance</span>
                                <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {attendanceItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Card key={item.label} className="p-3 border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs text-gray-400">{item.label}</p>
                                                <div className={`${item.bg} p-1.5 rounded-md`}>
                                                    <Icon className={`size-3.5 ${item.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-xl font-bold text-gray-800">{item.value}</p>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Total Employees */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Employees</span>
                                <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {employeeItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Card key={item.label} className="p-3 border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs text-gray-400">{item.label}</p>
                                                <div className={`${item.bg} p-1.5 rounded-md`}>
                                                    <Icon className={`size-3.5 ${item.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-xl font-bold text-gray-800">{item.value}</p>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Leave + Upcoming Payroll */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Pending Leave Request */}
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
                        <p className="text-xs text-gray-400 mb-3 ml-8">Descriptive title here</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: "Write something here", count: 10 },
                                { label: "Write something here", count: 12 },
                                { label: "Write something here", count: 14 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <button className="text-gray-300 hover:text-gray-500">
                                            <X className="size-4" />
                                        </button>
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Upcoming Payroll Processing */}
                    <Card className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-md">
                                    <Banknote className="size-4 text-green-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Upcoming Payroll Processing</span>
                            </div>
                            <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 ml-8">Descriptive title here</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: "Write something here", count: 10 },
                                { label: "Write something here", count: 10 },
                                { label: "Write something here", count: 12 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <button className="text-gray-300 hover:text-gray-500">
                                            <X className="size-4" />
                                        </button>
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Government Remittance Summary */}
                <Card className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1.5 rounded-md">
                                <Landmark className="size-4 text-purple-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Government Remittance Summary</span>
                        </div>
                        <span className="text-xs text-gray-400 cursor-pointer hover:underline">view</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-8">Descriptive title here</p>
                </Card>
            </div>
        </AppLayout>

    );
}
