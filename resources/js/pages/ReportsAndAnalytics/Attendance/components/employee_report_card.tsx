import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Area, AreaChart, Legend, LineChart, Line,
} from "recharts";
import { Card } from "@/components/ui/card";

import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const today = new Date();
const fullDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
const shortDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
