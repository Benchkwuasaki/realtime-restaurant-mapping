import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Area, AreaChart, Legend, LineChart, Line,
} from "recharts";
import { Card } from "@/components/ui/card";

import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { useAuth } from "@/hooks/use-auth";
import { useState,useEffect, useRef } from "react";

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





