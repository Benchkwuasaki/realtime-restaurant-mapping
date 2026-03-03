import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ChevronLeft, ChevronDown, ChevronRight, Users } from 'lucide-react';
import type { Department, Division, Unit, Employee } from './data/schema';
import { EmployeeModal } from './components/employee-modal';
import type { BreadcrumbItem } from '@/types';

interface Props { department: Department; }
interface EmployeeData extends Employee { positionName?: string; }

// ─── Constants ─────────────────────────────────────────────────────────────────
const UNIT_W    = 148;   // px width per unit card
const UNIT_GAP  = 12;    // px gap between unit cards
const DIV_MIN_W = 220;   // minimum division column width
const DIV_GAP   = 24;    // px gap between division columns

/** Calculate how wide a division column needs to be to fit all its units */
function divColWidth(unitCount: number): number {
    if (unitCount <= 0) return DIV_MIN_W;
    return Math.max(DIV_MIN_W, unitCount * UNIT_W + (unitCount - 1) * UNIT_GAP + 16);
}

// ─── Hook: detect mobile ───────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);
    return isMobile;
}

// ─── SVG Connector (desktop only) ─────────────────────────────────────────────
const SvgConnector: React.FC<{
    parentRef: React.RefObject<HTMLDivElement>;
    childRefs: React.RefObject<HTMLDivElement>[];
    containerRef: React.RefObject<HTMLDivElement>;
    color: string;
}> = ({ parentRef, childRefs, containerRef, color }) => {
    type Seg = { x1: number; y1: number; x2: number; y2: number };
    const [segs, setSegs] = useState<Seg[]>([]);
    const [box, setBox] = useState({ t: 0, l: 0, w: 0, h: 0 });

    const compute = useCallback(() => {
        const ct = containerRef.current;
        const pt = parentRef.current;
        if (!ct || !pt) return;
        const valid = childRefs.filter(r => r.current);
        if (!valid.length) return;

        const cr  = ct.getBoundingClientRect();
        const pr  = pt.getBoundingClientRect();
        const crs = valid.map(r => r.current!.getBoundingClientRect());

        const pCX = pr.left + pr.width  / 2 - cr.left;
        const pBY = pr.bottom - cr.top;
        const kids = crs.map(r => ({
            cx: r.left + r.width / 2 - cr.left,
            ty: r.top - cr.top,
        }));

        const allX = [pCX, ...kids.map(k => k.cx)];
        const minX = Math.min(...allX) - 2;
        const maxX = Math.max(...allX) + 2;
        const minY = pBY;
        const maxY = Math.max(...kids.map(k => k.ty));
        if (maxY <= minY + 2) return;

        const w = maxX - minX;
        const h = maxY - minY;
        setBox({ t: minY, l: minX, w, h });

        const ox   = minX;
        const px   = pCX - ox;
        const barY = h * 0.5;
        const lines: Seg[] = [];
        lines.push({ x1: px, y1: 0, x2: px, y2: barY });
        if (kids.length > 1) {
            lines.push({
                x1: kids[0].cx - ox, y1: barY,
                x2: kids[kids.length - 1].cx - ox, y2: barY,
            });
        }
        kids.forEach(k => lines.push({ x1: k.cx - ox, y1: barY, x2: k.cx - ox, y2: h }));
        setSegs(lines);
    }, [parentRef, childRefs, containerRef]);

    useEffect(() => {
        const id = requestAnimationFrame(() => setTimeout(compute, 0));
        const ro = new ResizeObserver(() => requestAnimationFrame(() => setTimeout(compute, 0)));
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', compute);
        return () => { cancelAnimationFrame(id); ro.disconnect(); window.removeEventListener('resize', compute); };
    }, [compute]);

    if (!segs.length || box.w < 2 || box.h < 2) return null;
    return (
        <svg style={{
            position: 'absolute', top: box.t, left: box.l,
            width: box.w, height: box.h,
            pointerEvents: 'none', overflow: 'visible', zIndex: 1,
        }}>
            {segs.map((s, i) => (
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke={color} strokeWidth={2} strokeLinecap="round" />
            ))}
        </svg>
    );
};

// ─── Unit Card (desktop) ───────────────────────────────────────────────────────
const UnitCard = React.forwardRef<HTMLDivElement, { unit: Unit; onClick: () => void }>(
    ({ unit, onClick }, ref) => {
        const empCount = unit.positions?.reduce((s, p) => s + (p.employees?.length || 0), 0) ?? 0;
        return (
            <div ref={ref} onClick={onClick}
                className="flex flex-col items-center cursor-pointer group shrink-0"
                style={{ width: UNIT_W }}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600
                    border-4 border-indigo-300 flex items-center justify-center text-white font-bold
                    shadow-lg overflow-hidden group-hover:scale-110 transition-transform text-base">
                    {unit.acronym?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="bg-indigo-50 dark:bg-gray-800 border-t-4 border-indigo-400
                    px-2 py-2 rounded-lg text-center mt-2 w-full
                    group-hover:bg-indigo-100 dark:group-hover:bg-gray-700 transition-colors">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400
                        leading-tight break-words">{unit.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{empCount} Employees</p>
                </div>
            </div>
        );
    }
);
UnitCard.displayName = 'UnitCard';

// ─── Division Column (desktop) ─────────────────────────────────────────────────
const DivisionColumn: React.FC<{
    division: Division;
    divCardRef: React.RefObject<HTMLDivElement>;
    onUnitClick: (u: Unit) => void;
    lineColor: string;
}> = ({ division, divCardRef, onUnitClick, lineColor }) => {
    const colRef = useRef<HTMLDivElement>(null);
    const divisionHead = division.positions?.[0]?.employees?.[0];
    const headName = divisionHead
        ? [divisionHead.firstName, divisionHead.middleName, divisionHead.lastName].filter(Boolean).join(' ')
        : 'Division Head';

    const units    = division.units ?? [];
    const colWidth = divColWidth(units.length);

    const unitRefs = useRef<React.RefObject<HTMLDivElement>[]>(
        units.map(() => React.createRef<HTMLDivElement>())
    );

    return (
        <div ref={colRef}
            className="relative flex flex-col items-center shrink-0"
            style={{ width: colWidth }}>

            {/* Division card */}
            <div ref={divCardRef} className="flex flex-col items-center z-10" style={{ width: DIV_MIN_W }}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-400 to-blue-600
                    border-4 border-blue-300 flex items-center justify-center text-white font-bold
                    shadow-lg overflow-hidden mb-3 text-2xl shrink-0">
                    {divisionHead?.profilePicture
                        ? <img src={divisionHead.profilePicture} alt={headName} className="w-full h-full object-cover" />
                        : division.acronym?.substring(0, 2).toUpperCase() || 'D'}
                </div>
                <div className="bg-blue-50 dark:bg-gray-800 border-t-4 border-blue-400
                    px-3 py-3 rounded-lg text-center w-full">
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-tight">{division.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{headName}</p>
                    {units.length > 0 && (
                        <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-2">
                            {units.length} Unit{units.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Units + connector */}
            {units.length > 0 && (
                <>
                    <SvgConnector
                        parentRef={divCardRef}
                        childRefs={unitRefs.current}
                        containerRef={colRef as React.RefObject<HTMLDivElement>}
                        color={lineColor}
                    />
                    <div
                        className="flex flex-row flex-nowrap justify-center mt-16"
                        style={{ gap: UNIT_GAP }}
                    >
                        {units.map((unit, i) => (
                            <UnitCard
                                key={unit.id}
                                ref={unitRefs.current[i]}
                                unit={unit}
                                onClick={() => onUnitClick(unit)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Mobile Unit Row ───────────────────────────────────────────────────────────
const MobileUnitRow: React.FC<{ unit: Unit; onClick: () => void }> = ({ unit, onClick }) => {
    const empCount = unit.positions?.reduce((s, p) => s + (p.employees?.length || 0), 0) ?? 0;
    return (
        <button onClick={onClick}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl
                bg-indigo-50 dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900
                hover:bg-indigo-100 dark:hover:bg-gray-700 active:scale-95 transition-all">
            <div className="w-11 h-11 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600
                border-2 border-indigo-300 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {unit.acronym?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-tight truncate">{unit.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <Users size={11} /> {empCount} Employees
                </p>
            </div>
            <ChevronRight size={16} className="text-indigo-400 shrink-0" />
        </button>
    );
};

// ─── Mobile Division Card (accordion) ─────────────────────────────────────────
const MobileDivisionCard: React.FC<{
    division: Division;
    onUnitClick: (u: Unit) => void;
    index: number;
}> = ({ division, onUnitClick, index }) => {
    const [open, setOpen] = useState(index === 0);
    const divisionHead = division.positions?.[0]?.employees?.[0];
    const headName = divisionHead
        ? [divisionHead.firstName, divisionHead.middleName, divisionHead.lastName].filter(Boolean).join(' ')
        : 'Division Head';
    const units = division.units ?? [];

    return (
        <div className="rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-900 bg-white dark:bg-gray-900 shadow-sm">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 px-4 py-4 bg-blue-50 dark:bg-gray-800
                    active:bg-blue-100 dark:active:bg-gray-700 transition-colors">
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-400 to-blue-600
                    border-2 border-blue-300 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                    {divisionHead?.profilePicture
                        ? <img src={divisionHead.profilePicture} alt={headName} className="w-full h-full object-cover rounded-full" />
                        : division.acronym?.substring(0, 2).toUpperCase() || 'D'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-tight">{division.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{headName}</p>
                    {units.length > 0 && (
                        <span className="inline-block mt-1 text-xs font-semibold text-blue-500 dark:text-blue-400
                            bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            {units.length} Unit{units.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-blue-400" />
                </div>
            </button>

            {open && units.length > 0 && (
                <div className="px-4 py-3 space-y-2 border-t border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Units</p>
                    {units.map(unit => (
                        <MobileUnitRow key={unit.id} unit={unit} onClick={() => onUnitClick(unit)} />
                    ))}
                </div>
            )}
            {open && units.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-400 dark:text-gray-500 border-t border-blue-100 dark:border-blue-900/50">
                    No units in this division
                </div>
            )}
        </div>
    );
};

// ─── Mobile Layout ─────────────────────────────────────────────────────────────
const MobileLayout: React.FC<{
    department: Department;
    onUnitClick: (u: Unit) => void;
}> = ({ department, onUnitClick }) => {
    const deptHead = department.topPositions?.[0]?.employees?.[0];
    const deptHeadName = deptHead
        ? [deptHead.firstName, deptHead.middleName, deptHead.lastName].filter(Boolean).join(' ')
        : 'Department Head';
    const divisions = department.divisions ?? [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center text-center bg-white dark:bg-gray-800
                rounded-2xl shadow-md border-t-4 border-purple-400 px-5 py-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-purple-500 to-purple-600
                    border-4 border-purple-300 flex items-center justify-center text-white font-bold
                    shadow-lg overflow-hidden text-2xl mb-3">
                    {deptHead?.profilePicture
                        ? <img src={deptHead.profilePicture} alt={deptHeadName} className="w-full h-full object-cover" />
                        : department.acronym?.substring(0, 2).toUpperCase() || 'D'}
                </div>
                <h1 className="text-lg font-bold text-purple-600 dark:text-purple-400 leading-tight">{department.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deptHeadName}</p>
                {divisions.length > 0 && (
                    <span className="inline-block mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400
                        bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                        {divisions.length} Division{divisions.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {divisions.length > 0 && (
                <div className="flex items-center gap-3 px-2">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Divisions</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
            )}

            {divisions.map((div, i) => (
                <MobileDivisionCard key={div.id} division={div} onUnitClick={onUnitClick} index={i} />
            ))}
        </div>
    );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DepartmentDetail({ department }: Props) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [showModal, setShowModal]       = useState(false);
    const [isDark, setIsDark]             = useState(false);
    const isMobile                        = useIsMobile(768);

    const containerRef = useRef<HTMLDivElement>(null);
    const deptRef      = useRef<HTMLDivElement>(null);
    const divisions    = department.divisions ?? [];

    // Total tree width = sum of each column's dynamic width + gaps
    const totalTreeWidth = divisions.reduce((sum, div) => sum + divColWidth((div.units ?? []).length), 0)
        + Math.max(0, divisions.length - 1) * DIV_GAP
        + 64; // side padding

    const divRefs = useRef<React.RefObject<HTMLDivElement>[]>(
        divisions.map(() => React.createRef<HTMLDivElement>())
    );

    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    const lineColor = isDark ? '#6b7280' : '#9ca3af';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organization', href: '#' },
        { title: 'Organisational Chart', href: '/organization/organizational_chart' },
        { title: department.name, href: '#' },
    ];

    const deptHead     = department.topPositions?.[0]?.employees?.[0];
    const deptHeadName = deptHead
        ? [deptHead.firstName, deptHead.middleName, deptHead.lastName].filter(Boolean).join(' ')
        : 'Department Head';

    const handleUnitClick = (u: Unit) => { setSelectedUnit(u); setShowModal(true); };
    const closeModal       = ()        => { setSelectedUnit(null); setShowModal(false); };

    const selectedUnitEmployees: EmployeeData[] = selectedUnit
        ? (selectedUnit.positions ?? [])
            .flatMap(p => (p.employees ?? []).map(e => ({ ...e, positionName: p.name })))
            .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
        : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${department.name} - Organizational Chart`} />

            <div className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/organization/organizational_chart"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700
                            hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
                            font-medium transition-colors rounded-lg text-sm">
                        <ChevronLeft size={18} />
                        Back to Chart
                    </Link>
                </div>

                {/* ── MOBILE ── */}
                {isMobile && (
                    <MobileLayout department={department} onUnitClick={handleUnitClick} />
                )}

                {/* ── DESKTOP ── */}
                {!isMobile && (
                    <div className="overflow-x-auto pb-8">
                        <div
                            ref={containerRef}
                            className="relative flex flex-col items-center"
                            style={{ minWidth: Math.max(600, totalTreeWidth) }}
                        >
                            {/* Department node */}
                            <div ref={deptRef} className="flex flex-col items-center z-10">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-b from-purple-500 to-purple-600
                                    border-4 border-purple-300 flex items-center justify-center text-white
                                    font-bold shadow-lg overflow-hidden mb-4 text-4xl shrink-0">
                                    {deptHead?.profilePicture
                                        ? <img src={deptHead.profilePicture} alt={deptHeadName} className="w-full h-full object-cover" />
                                        : department.acronym?.substring(0, 2).toUpperCase() || 'D'}
                                </div>
                                <div className="bg-purple-50 dark:bg-gray-800 border-t-4 border-purple-400
                                    px-8 py-5 rounded-lg text-center w-72">
                                    <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400 leading-tight">
                                        {department.name}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{deptHeadName}</p>
                                    {divisions.length > 0 && (
                                        <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 mt-2">
                                            {divisions.length} Division{divisions.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Dept → Divisions connector */}
                            {divisions.length > 0 && (
                                <SvgConnector
                                    parentRef={deptRef}
                                    childRefs={divRefs.current}
                                    containerRef={containerRef}
                                    color={lineColor}
                                />
                            )}

                            {/* Division row */}
                            {divisions.length > 0 && (
                                <div
                                    className="flex flex-row flex-nowrap justify-center mt-24 w-full px-8"
                                    style={{ gap: DIV_GAP }}
                                >
                                    {divisions.map((div, i) => (
                                        <DivisionColumn
                                            key={div.id}
                                            division={div}
                                            divCardRef={divRefs.current[i]}
                                            onUnitClick={handleUnitClick}
                                            lineColor={lineColor}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <EmployeeModal
                isOpen={showModal}
                onClose={closeModal}
                title={`${department.name} / ${selectedUnit?.name || ''}`}
                employees={selectedUnitEmployees}
            />
        </AppLayout>
    );
}