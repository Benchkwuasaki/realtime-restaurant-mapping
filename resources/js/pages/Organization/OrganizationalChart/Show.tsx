import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Building2, Layers, Users, FileText, Smartphone, Search, X } from 'lucide-react';
import React, { useRef, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { OrgChart, type OrgChartHandle } from './components/org_chart';
import type { Department, Employee } from './data/schema';

interface Props { department?: Department }

const SafeAvatar: React.FC<{
    src?: string | null; alt: string; fallback: string; className?: string;
}> = ({ src, alt, fallback, className = '' }) => (
    <Avatar className={className}>
        {src ? <AvatarImage src={src} alt={alt} /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

// Collect every employee in the department with their context
interface EmployeeEntry {
    id: number;
    fullName: string;
    position: string;
    location: string;
    initials: string;
    avatarUrl?: string | null;
}

function collectEmployees(dept: Department): EmployeeEntry[] {
    const entries: EmployeeEntry[] = [];

    const addEmp = (emp: Employee, position: string, location: string) => {
        entries.push({
            id: emp.id,
            fullName: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '),
            position,
            location,
            initials: [emp.firstName, emp.lastName].filter(Boolean).map(n => n[0].toUpperCase()).join(''),
            avatarUrl: emp.avatarUrl,
        });
    };

    (dept.topPositions ?? []).forEach(p =>
        (p.employees ?? []).forEach(e => addEmp(e, p.name, dept.name))
    );

    (dept.divisions ?? []).forEach(div => {
        (div.positions ?? []).forEach(p =>
            (p.employees ?? []).forEach(e => addEmp(e, p.name, `${div.name}`))
        );
        (div.units ?? []).forEach(unit =>
            (unit.positions ?? []).forEach(p =>
                (p.employees ?? []).forEach(e => addEmp(e, p.name, `${unit.name} · ${div.name}`))
            )
        );
    });

    return entries;
}

function countEmployees(dept: Department): number {
    return collectEmployees(dept).length;
}

export default function OrganizationalChartShow({ department }: Props) {
    const chartRef   = useRef<OrgChartHandle>(null);
    const inputRef   = useRef<HTMLInputElement>(null);
    const searchWrap = useRef<HTMLDivElement>(null);

    const [query, setQuery]             = useState('');
    const [showDropdown, setDropdown]   = useState(false);
    const [highlightIds, setHighlight]  = useState<Set<number>>(new Set());
    const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

    // Reposition dropdown to fixed coords whenever it opens
    useLayoutEffect(() => {
        if (showDropdown && searchWrap.current) {
            const r = searchWrap.current.getBoundingClientRect();
            setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
        }
    }, [showDropdown, query]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organization', href: '#' },
        { title: 'Organizational Chart', href: '/organization/organizational_chart' },
        { title: department?.name ?? '', href: '#' },
    ];

    const head     = department?.topPositions?.[0]?.employees?.[0];
    const headName = head ? [head.firstName, head.middleName, head.lastName].filter(Boolean).join(' ') : null;
    const headPos  = department?.topPositions?.[0]?.name;
    const divCount = department?.divisions?.length ?? 0;
    const empCount = department ? countEmployees(department) : 0;
    const acronym  = department?.acronym?.substring(0, 2) || 'DP';
    const hasData  = (department?.divisions?.length ?? 0) > 0 || (department?.topPositions?.length ?? 0) > 0;

    const allEmployees = useMemo(() => department ? collectEmployees(department) : [], [department]);

    const results = useMemo(() => {
        if (query.trim().length < 2) return [];
        const q = query.toLowerCase();
        return allEmployees.filter(e =>
            e.fullName.toLowerCase().includes(q) ||
            e.position.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [query, allEmployees]);

    const handleSelect = (emp: EmployeeEntry) => {
        setQuery(emp.fullName);
        setDropdown(false);
        setHighlight(new Set([emp.id]));
        chartRef.current?.panToEmployee(emp.id);
    };

    const clearSearch = () => {
        setQuery('');
        setHighlight(new Set());
        setDropdown(false);
    };

    if (!department) return null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${department.name} — Organizational Chart`} />

            <div className="min-h-screen bg-background overflow-x-hidden w-full">
                <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 w-full max-w-full">

                    {/* Back link */}
                    <Link
                        href="/organization/organizational_chart"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                            hover:text-foreground transition-colors font-medium"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        All Departments
                    </Link>

                    {/* ── Department header card ─────────────────────────────── */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm">
                        <div className="p-4 sm:p-5">

                            {/* Avatar + info */}
                            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                <div className="relative shrink-0">
                                    <SafeAvatar
                                        src={head?.avatarUrl}
                                        alt={headName ?? department.name}
                                        fallback={acronym}
                                        className="h-14 w-14 sm:h-20 sm:w-20 ring-2 sm:ring-4 ring-border
                                            bg-accent text-accent-foreground font-bold text-xl sm:text-2xl"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-base sm:text-xl font-bold text-foreground leading-tight">
                                            {department.name}
                                        </h1>
                                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                                            {department.acronym}
                                        </Badge>
                                    </div>
                                    {headName && (
                                        <div className="mb-1.5">
                                            <p className="text-xs sm:text-sm font-medium text-foreground">{headName}</p>
                                            {headPos && <p className="text-xs text-primary mt-0.5">{headPos}</p>}
                                        </div>
                                    )}
                                    {department.description && (
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                            {department.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Stats — full width stretched cards ─────────── */}
                            <div className="grid grid-cols-2 gap-2 max-w-full sm:gap-3 pt-3 border-t border-border">
                                <StatCard
                                    title="Divisions"
                                    value={divCount}
                                    description="Divisions with units"
                                    icon={<Layers className="h-4 w-4" />}
                                />
                                <StatCard
                                    title="Employees"
                                    value={empCount}
                                    description='All registered employees'
                                    icon={<Users className="h-4 w-4" />}
                                />
                            </div>

                            {/* ── Search bar ──────────────────────────────── */}
                            <div className="relative mt-3" ref={searchWrap}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                    h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    placeholder="Search employee by name, position or unit…"
                                    onChange={e => { setQuery(e.target.value); setDropdown(true); }}
                                    onFocus={() => setDropdown(true)}
                                    onBlur={() => setTimeout(() => setDropdown(false), 200)}
                                    className="w-full h-10 pl-9 pr-9 text-sm rounded-xl
                                        bg-background/60 border border-border
                                        text-foreground placeholder:text-muted-foreground/60
                                        focus:outline-none focus:ring-2 focus:ring-primary/40
                                        focus:border-primary/50 transition-all"
                                />
                                {query && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                                            text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* ── Org chart canvas ───────────────────────────────────── */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border
                        shadow-sm overflow-hidden"
                        style={{ height: 'calc(100svh - 360px)', minHeight: '320px' }}
                    >
                        {/* Toolbar — simple title + hint only */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5
                            border-b border-border bg-muted/30">
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Organizational Tree
                                </span>
                            </div>
                            <p className="hidden sm:block text-xs text-muted-foreground/70">
                                Scroll to zoom · Drag to pan · Click nodes to view employees
                            </p>
                            <p className="sm:hidden text-xs text-muted-foreground/70 flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                Pinch · Drag · Tap
                            </p>
                        </div>

                        <div className="relative w-full h-[calc(100%-41px)]">
                            {!hasData ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center px-4">
                                        <Building2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No hierarchy data available
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <OrgChart
                                    ref={chartRef}
                                    department={department}
                                    highlightIds={highlightIds}
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {/* ── Fixed dropdown portal — renders outside all overflow:hidden parents ── */}
            {showDropdown && dropdownRect && (results.length > 0 || query.trim().length >= 2) && (
                <div
                    style={{
                        position: 'fixed',
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 9999,
                    }}
                    className="bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
                    onMouseDown={e => e.preventDefault()}
                >
                    {results.length > 0 ? results.map((emp, i) => (
                        <button
                            key={emp.id}
                            onMouseDown={() => handleSelect(emp)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5
                                hover:bg-accent transition-colors text-left
                                ${i > 0 ? 'border-t border-border/40' : ''}`}
                        >
                            {emp.avatarUrl ? (
                                <img src={emp.avatarUrl} alt={emp.fullName}
                                    className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0" />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-accent shrink-0
                                    flex items-center justify-center
                                    text-xs font-bold text-accent-foreground ring-1 ring-border">
                                    {emp.initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {emp.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {emp.position} · {emp.location}
                                </p>
                            </div>
                            <Search className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        </button>
                    )) : (
                        <div className="px-4 py-3">
                            <p className="text-sm text-muted-foreground text-center">
                                No employees found for "{query}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}