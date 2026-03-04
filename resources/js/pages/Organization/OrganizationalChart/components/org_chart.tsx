import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Users, Building2, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDetailModal, type EmployeeWithContext } from './employee_detail_card';
import type { Department, Division, Position, Unit } from '../data/schema';

// ─── Utilities ────────────────────────────────────────────────────────────────
function initials(first?: string, last?: string) {
    return [first, last].filter(Boolean).map(n => n![0].toUpperCase()).join('');
}
function fullName(first?: string, mid?: string, last?: string) {
    return [first, mid, last].filter(Boolean).join(' ');
}

// ─── Safe Avatar ──────────────────────────────────────────────────────────────
const SafeAvatar: React.FC<{
    src?: string | null;
    alt: string;
    fallback: string;
    className?: string;
}> = ({ src, alt, fallback, className = '' }) => (
    <Avatar className={className}>
        {src ? <AvatarImage src={src} alt={alt} /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

// ─── CSS Tree Connector ───────────────────────────────────────────────────────
const TreeChildren: React.FC<{
    children: React.ReactNode[];
    lineColor?: string;
    gap?: string;
}> = ({ children, lineColor = 'var(--border)', gap = '2rem' }) => {
    const count = children.length;
    if (count === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: 28, background: lineColor, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'row', gap, alignItems: 'flex-start' }}>
                {children.map((child, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {count > 1 && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                height: 2,
                                background: lineColor,
                                left:  i === 0         ? '50%' : 0,
                                right: i === count - 1 ? '50%' : 0,
                            }} />
                        )}
                        <div style={{ width: 2, height: 24, background: lineColor, flexShrink: 0 }} />
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Position Node ────────────────────────────────────────────────────────────
const PositionNode: React.FC<{
    position: Position;
    onEmployeeClick: (employees: EmployeeWithContext[], title: string) => void;
    contextDept?: string;
    contextDiv?: string;
    highlightIds?: Set<number>;
}> = ({ position, onEmployeeClick, contextDept, contextDiv, highlightIds }) => {
    const employees = position.employees ?? [];
    if (employees.length === 0) return null;

    const isHighlighted = highlightIds && employees.some(e => highlightIds.has(e.id));

    const handleClick = () => {
        onEmployeeClick(
            employees.map(e => ({
                ...e,
                positionName: position.name,
                departmentName: contextDept,
                divisionName: contextDiv,
            })),
            position.name,
        );
    };

    return (
        <div
            data-position-id={position.id}
            data-employee-ids={employees.map(e => e.id).join(',')}
            onClick={handleClick}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl
                border bg-card text-card-foreground
                shadow-sm cursor-pointer transition-all duration-200
                min-w-[130px] max-w-[160px]
                ${isHighlighted
                    ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20'
                    : 'border-border hover:shadow-md hover:border-primary/40'
                }`}
        >
            <div className="flex -space-x-2.5">
                {employees.slice(0, 3).map(emp => (
                    <SafeAvatar
                        key={emp.id}
                        src={emp.avatarUrl}
                        alt={fullName(emp.firstName, emp.middleName, emp.lastName)}
                        fallback={initials(emp.firstName, emp.lastName)}
                        className={`h-10 w-10 ring-2 ring-background bg-muted
                            text-muted-foreground text-xs font-semibold
                            ${isHighlighted && highlightIds?.has(emp.id) ? 'ring-primary' : ''}`}
                    />
                ))}
                {employees.length > 3 && (
                    <div className="h-10 w-10 rounded-full bg-muted ring-2 ring-background
                        flex items-center justify-center text-xs font-bold text-muted-foreground">
                        +{employees.length - 3}
                    </div>
                )}
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-foreground leading-tight">{position.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {employees.length} {employees.length === 1 ? 'person' : 'people'}
                </p>
            </div>
        </div>
    );
};

// ─── Unit Node ────────────────────────────────────────────────────────────────
const UnitNode: React.FC<{
    unit: Unit;
    onEmployeeClick: (employees: EmployeeWithContext[], title: string) => void;
    contextDept?: string;
    contextDiv?: string;
    highlightIds?: Set<number>;
}> = ({ unit, onEmployeeClick, contextDept, contextDiv, highlightIds }) => {
    const positions    = unit.positions ?? [];
    const allEmployees = positions.flatMap(p => p.employees ?? []);
    const empCount     = allEmployees.length;
    const isHighlighted = highlightIds && allEmployees.some(e => highlightIds.has(e.id));

    const handleClick = () => {
        onEmployeeClick(
            positions.flatMap(p =>
                (p.employees ?? []).map(e => ({
                    ...e,
                    positionName: p.name,
                    unitName: unit.name,
                    divisionName: contextDiv,
                    departmentName: contextDept,
                }))
            ),
            unit.name,
        );
    };

    return (
        <div
            data-unit-id={unit.id}
            data-employee-ids={allEmployees.map(e => e.id).join(',')}
            onClick={handleClick}
            className={`group flex flex-col items-center gap-2 p-3 rounded-xl
                border bg-card text-card-foreground
                shadow-sm cursor-pointer transition-all duration-200
                min-w-[130px] max-w-[160px] text-center
                ${isHighlighted
                    ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20'
                    : 'border-border hover:shadow-md hover:border-primary/40'
                }`}
        >
            {allEmployees.length > 0 ? (
                <div className="flex -space-x-2.5">
                    {allEmployees.slice(0, 3).map(emp => (
                        <SafeAvatar
                            key={emp.id}
                            src={emp.avatarUrl}
                            alt={fullName(emp.firstName, emp.middleName, emp.lastName)}
                            fallback={initials(emp.firstName, emp.lastName)}
                            className="h-10 w-10 ring-2 ring-background bg-muted
                                text-muted-foreground text-xs font-semibold"
                        />
                    ))}
                    {allEmployees.length > 3 && (
                        <div className="h-10 w-10 rounded-full bg-muted ring-2 ring-background
                            flex items-center justify-center text-xs font-bold text-muted-foreground">
                            +{allEmployees.length - 3}
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Layers className="h-4 w-4 text-accent-foreground" />
                </div>
            )}
            <div className="text-center">
                <p className="text-xs font-semibold text-foreground leading-tight">{unit.name}</p>
                {unit.acronym && (
                    <span className="text-xs font-mono text-muted-foreground">{unit.acronym}</span>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                    {empCount} {empCount === 1 ? 'employee' : 'employees'}
                </p>
            </div>
        </div>
    );
};

// ─── Division Node ────────────────────────────────────────────────────────────
const DivisionNode: React.FC<{
    division: Division;
    onEmployeeClick: (employees: EmployeeWithContext[], title: string) => void;
    contextDept?: string;
    lineColor: string;
    highlightIds?: Set<number>;
}> = ({ division, onEmployeeClick, contextDept, lineColor, highlightIds }) => {
    const [expanded, setExpanded] = useState(true);

    const divPositions = (division.positions ?? []).filter(p => (p.employees?.length ?? 0) > 0);
    const units        = division.units ?? [];
    const children     = [...divPositions, ...units];

    const allEmployees = [
        ...divPositions.flatMap(p => p.employees ?? []),
        ...units.flatMap(u => (u.positions ?? []).flatMap(p => p.employees ?? [])),
    ];
    const totalEmp = allEmployees.length;
    const isHighlighted = highlightIds && allEmployees.some(e => highlightIds.has(e.id));

    const handleDivClick = () => {
        const employees: EmployeeWithContext[] = [
            ...divPositions.flatMap(p =>
                (p.employees ?? []).map(e => ({
                    ...e,
                    positionName: p.name,
                    divisionName: division.name,
                    departmentName: contextDept,
                }))
            ),
            ...units.flatMap(u =>
                (u.positions ?? []).flatMap(p =>
                    (p.employees ?? []).map(e => ({
                        ...e,
                        positionName: p.name,
                        unitName: u.name,
                        divisionName: division.name,
                        departmentName: contextDept,
                    }))
                )
            ),
        ];
        onEmployeeClick(employees, division.name);
    };

    return (
        <div className="flex flex-col items-center">
            <div
                data-division-id={division.id}
                data-employee-ids={allEmployees.map(e => e.id).join(',')}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl
                    border bg-card text-card-foreground
                    shadow-sm transition-all duration-200 min-w-[160px] max-w-[200px]
                    ${isHighlighted
                        ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20'
                        : 'border-border hover:shadow-md hover:border-primary/40'
                    }`}
            >
                {children.length > 0 && (
                    <button
                        onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
                        className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-10
                            w-7 h-7 rounded-full bg-secondary border border-border
                            flex items-center justify-center shadow-sm
                            hover:bg-accent transition-colors"
                    >
                        {expanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-secondary-foreground" />
                            : <ChevronRight className="h-3.5 w-3.5 text-secondary-foreground" />
                        }
                    </button>
                )}

                <div onClick={handleDivClick} className="flex flex-col items-center gap-2.5 cursor-pointer w-full">
                    <div className="text-center w-full">
                        <p className="text-xs font-bold text-foreground leading-tight break-words">
                            {division.name}
                        </p>
                        {division.acronym && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-mono
                                font-medium bg-accent text-accent-foreground">
                                {division.acronym}
                            </span>
                        )}
                    </div>

                    {allEmployees.length > 0 && (
                        <div className="flex -space-x-2.5">
                            {allEmployees.slice(0, 5).map(emp => (
                                <SafeAvatar
                                    key={emp.id}
                                    src={emp.avatarUrl}
                                    alt={fullName(emp.firstName, emp.middleName, emp.lastName)}
                                    fallback={initials(emp.firstName, emp.lastName)}
                                    className="h-8 w-8 ring-2 ring-background
                                        bg-muted text-muted-foreground text-xs font-semibold"
                                />
                            ))}
                            {allEmployees.length > 5 && (
                                <div className="h-8 w-8 rounded-full bg-muted ring-2 ring-background
                                    flex items-center justify-center
                                    text-xs font-bold text-muted-foreground">
                                    +{allEmployees.length - 5}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        {totalEmp} {totalEmp === 1 ? 'employee' : 'employees'}
                    </p>
                </div>
            </div>

            {expanded && children.length > 0 && (
                <div style={{ paddingTop: '1rem' }}>
                    <TreeChildren lineColor={lineColor} gap="1.25rem">
                        {[
                            ...divPositions.map(pos => (
                                <PositionNode
                                    key={`pos-${pos.id}`}
                                    position={pos}
                                    onEmployeeClick={onEmployeeClick}
                                    contextDept={contextDept}
                                    contextDiv={division.name}
                                    highlightIds={highlightIds}
                                />
                            )),
                            ...units.map(unit => (
                                <UnitNode
                                    key={`unit-${unit.id}`}
                                    unit={unit}
                                    onEmployeeClick={onEmployeeClick}
                                    contextDept={contextDept}
                                    contextDiv={division.name}
                                    highlightIds={highlightIds}
                                />
                            )),
                        ]}
                    </TreeChildren>
                </div>
            )}
        </div>
    );
};

// ─── OrgChart public handle ───────────────────────────────────────────────────
export interface OrgChartHandle {
    panToEmployee: (employeeId: number) => void;
    fitToCanvas: () => void;
}

// ─── Main OrgChart ────────────────────────────────────────────────────────────
interface OrgChartProps {
    department: Department;
    highlightIds?: Set<number>;
}

export const OrgChart = forwardRef<OrgChartHandle, OrgChartProps>(
    ({ department, highlightIds }, ref) => {
    const canvasRef             = useRef<HTMLDivElement>(null);
    const contentRef            = useRef<HTMLDivElement>(null);
    const [scale, setScale]     = useState(0.65);
    const scaleRef              = useRef(0.65);
    const [translate, setTrans] = useState({ x: 0, y: 0 });
    const isPanning             = useRef(false);
    const startPos              = useRef({ x: 0, y: 0 });
    const startTrans            = useRef({ x: 0, y: 0 });
    const lastPinchDist         = useRef<number | null>(null);

    const [modal, setModal] = useState<{ open: boolean; title: string; employees: EmployeeWithContext[] }>(
        { open: false, title: '', employees: [] },
    );
    const openModal = useCallback((employees: EmployeeWithContext[], title: string) => {
        setModal({ open: true, title, employees });
    }, []);

    // ── Fit-to-canvas ────────────────────────────────────────────────────────
    // Measures the actual rendered content and computes the scale that fits it
    // inside the canvas with a small padding margin. Fully dynamic — re-runs
    // whenever `department` changes (new divisions / units added / removed).
    const minScaleRef = useRef(0.2);

    const fitToCanvas = useCallback(() => {
        if (!canvasRef.current || !contentRef.current) return;

        const canvasW = canvasRef.current.offsetWidth;
        const canvasH = canvasRef.current.offsetHeight;
        const contentW = contentRef.current.scrollWidth;
        const contentH = contentRef.current.scrollHeight;

        if (contentW === 0 || contentH === 0) return;

        const PADDING = 48; // px breathing room on each side
        const fitScale = Math.min(
            (canvasW - PADDING * 2) / contentW,
            (canvasH - PADDING * 2) / contentH,
            1.0,   // never auto-zoom in past 100%
        );
        const clamped = Math.max(0.1, fitScale);

        minScaleRef.current = clamped;
        scaleRef.current    = clamped;
        setScale(clamped);
        setTrans({ x: 0, y: 0 }); // content is centred by the transform already
    }, []);

    // Fit on first render and whenever department structure changes
    useEffect(() => {
        // Use rAF to wait for the DOM to finish layout after React render
        const id = requestAnimationFrame(() => fitToCanvas());
        return () => cancelAnimationFrame(id);
    }, [department, fitToCanvas]);

    // Re-fit on window resize
    useEffect(() => {
        const onResize = () => requestAnimationFrame(() => fitToCanvas());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [fitToCanvas]);

    // ── Expose panToEmployee ────────────────────────────────────────────────
    // Uses current getBoundingClientRect to find where the node is on screen RIGHT NOW,
    // then computes the delta translate needed to move it to the canvas centre.
    // This is transform-agnostic: it works regardless of current scale/translate.
    useImperativeHandle(ref, () => ({
        panToEmployee(employeeId: number) {
            if (!canvasRef.current || !contentRef.current) return;

            // Find the node whose data-employee-ids contains this id
            const allNodes = Array.from(
                contentRef.current.querySelectorAll('[data-employee-ids]')
            ) as HTMLElement[];
            const node = allNodes.find(n => {
                const ids = (n.getAttribute('data-employee-ids') ?? '').split(',').map(Number);
                return ids.includes(employeeId);
            }) ?? null;
            if (!node) return;

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const nodeRect   = node.getBoundingClientRect();

            // Current node centre relative to canvas (in screen pixels)
            const nodeCxOnScreen = nodeRect.left + nodeRect.width  / 2 - canvasRect.left;
            const nodeCyOnScreen = nodeRect.top  + nodeRect.height / 2 - canvasRect.top;

            // Canvas centre in canvas-local coords
            const canvasCx = canvasRect.width  / 2;
            const canvasCy = canvasRect.height / 2;

            // Screen delta → content-space delta (divide by current scale)
            const curScale = scaleRef.current;
            const dx = (canvasCx - nodeCxOnScreen) / curScale;
            const dy = (canvasCy - nodeCyOnScreen) / curScale;

            // Apply new scale=1 and compute the translate that keeps node centred.
            // With scale 1: screenX = canvasW/2 + tx + (contentX - contentW/2)
            // We sidestep content-width by using the delta approach:
            // new translate = old translate + delta * newScale
            const targetScale = 1.0;
            setScale(targetScale);
            setTrans(prev => ({
                x: prev.x + dx * targetScale,
                y: prev.y + dy * targetScale,
            }));
        },
        fitToCanvas() { fitToCanvas(); },
    }), [fitToCanvas]);

    const lineColor = 'var(--border)';
    const MAX  = 2.5;
    const STEP = 0.1;

    // ── Pan bounds ───────────────────────────────────────────────────────────
    // The content div sits at left:50% with transform translate(calc(-50%+tx), ty+40) scale(s).
    // After scaling, the rendered content is:
    //   width  = contentW * s   (centred horizontally because of -50% + tx)
    //   height = contentH * s   (starts at top: ty+40)
    //
    // We allow panning until only MARGIN px of content remains visible on each edge.
    // That gives:   -maxTx <= tx <= maxTx   and   minTy <= ty <= maxTy
    const MARGIN = 80; // px of content that must remain visible

    const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
        if (!canvasRef.current || !contentRef.current) return { x: tx, y: ty };

        const canvasW  = canvasRef.current.offsetWidth;
        const canvasH  = canvasRef.current.offsetHeight;
        const contentW = contentRef.current.scrollWidth  * s;
        const contentH = contentRef.current.scrollHeight * s;

        // Horizontal: content is centred. The left edge of content on screen is:
        //   canvasW/2 + tx - contentW/2
        // We want left edge >= -(contentW - MARGIN), i.e. most of it can slide left
        // and right edge <= canvasW + contentW - MARGIN
        const maxTx = contentW / 2 - MARGIN;
        const minTx = -(contentW / 2 - MARGIN);

        // Vertical: content top on screen = ty + 40
        // Allow scrolling so at least MARGIN of content remains in view vertically
        const maxTy = MARGIN - 40;                        // top edge can move down this far
        const minTy = canvasH - contentH - 40 - MARGIN;  // bottom edge stays visible

        return {
            x: Math.min(maxTx, Math.max(minTx, tx)),
            y: Math.min(maxTy, Math.max(minTy, ty)),
        };
    }, []);

    // Keep scaleRef in sync and re-clamp translate when scale changes
    // (must be after clampTranslate definition)
    useEffect(() => {
        scaleRef.current = scale;
        setTrans(prev => clampTranslate(prev.x, prev.y, scale));
    }, [scale, clampTranslate]);

    // ── Mouse handlers ──────────────────────────────────────────────────────
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setScale(s => Math.min(MAX, Math.max(minScaleRef.current, s + (e.deltaY < 0 ? STEP : -STEP))));
    }, []);
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        isPanning.current  = true;
        startPos.current   = { x: e.clientX, y: e.clientY };
        startTrans.current = { ...translate };
    }, [translate]);
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        const raw = {
            x: startTrans.current.x + (e.clientX - startPos.current.x),
            y: startTrans.current.y + (e.clientY - startPos.current.y),
        };
        setTrans(clampTranslate(raw.x, raw.y, scaleRef.current));
    }, [clampTranslate]);
    const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

    // ── Touch handlers ──────────────────────────────────────────────────────
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isPanning.current  = true;
            startPos.current   = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            startTrans.current = { ...translate };
            lastPinchDist.current = null;
        } else if (e.touches.length === 2) {
            isPanning.current = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDist.current = Math.hypot(dx, dy);
        }
    }, [translate]);
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && isPanning.current) {
            const raw = {
                x: startTrans.current.x + (e.touches[0].clientX - startPos.current.x),
                y: startTrans.current.y + (e.touches[0].clientY - startPos.current.y),
            };
            setTrans(clampTranslate(raw.x, raw.y, scaleRef.current));
        } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
            const dx   = e.touches[0].clientX - e.touches[1].clientX;
            const dy   = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const delta = (dist - lastPinchDist.current) * 0.005;
            lastPinchDist.current = dist;
            setScale(s => Math.min(MAX, Math.max(minScaleRef.current, s + delta)));
        }
    }, [clampTranslate]);
    const handleTouchEnd = useCallback(() => {
        isPanning.current     = false;
        lastPinchDist.current = null;
    }, []);

    const topPositions   = (department.topPositions ?? []).filter(p => (p.employees?.length ?? 0) > 0);
    const divisions      = department.divisions ?? [];
    const deptHead       = topPositions[0]?.employees?.[0];
    const deptHeadName   = deptHead ? fullName(deptHead.firstName, deptHead.middleName, deptHead.lastName) : null;
    const allDeptEmployees = [
        ...topPositions.flatMap(p => p.employees ?? []),
        ...divisions.flatMap(d => (d.positions ?? []).flatMap(p => p.employees ?? [])),
        ...divisions.flatMap(d => (d.units ?? []).flatMap(u => (u.positions ?? []).flatMap(p => p.employees ?? []))),
    ];
    const totalEmployees = allDeptEmployees.length;

    const handleDeptClick = () => {
        openModal(
            topPositions.flatMap(p =>
                (p.employees ?? []).map(e => ({ ...e, positionName: p.name, departmentName: department.name }))
            ),
            department.name,
        );
    };

    return (
        <div className="relative w-full h-full overflow-hidden">

            {/* Zoom controls */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
                {[
                    { icon: <ZoomIn className="h-3.5 w-3.5" />,    action: () => setScale(s => Math.min(MAX, s + STEP)), title: 'Zoom In' },
                    { icon: <ZoomOut className="h-3.5 w-3.5" />,   action: () => setScale(s => Math.max(minScaleRef.current, s - STEP)), title: 'Zoom Out' },
                    { icon: <RotateCcw className="h-3.5 w-3.5" />, action: () => fitToCanvas(), title: 'Reset' },
                ].map(({ icon, action, title }) => (
                    <button key={title} onClick={action} title={title}
                        className="w-8 h-8 bg-card border border-border rounded-lg shadow-sm
                            flex items-center justify-center text-muted-foreground
                            hover:bg-accent hover:text-accent-foreground
                            hover:border-primary/40 transition-all">
                        {icon}
                    </button>
                ))}
                <div className="bg-card border border-border rounded-lg shadow-sm
                    px-2 py-1 text-center text-xs text-muted-foreground font-mono">
                    {Math.round(scale * 100)}%
                </div>
            </div>

            {/* Stats overlay */}
            <div className="absolute top-3 left-3 z-20 flex flex-row sm:flex-col gap-1.5">
                <div className="bg-card/90 backdrop-blur-sm border border-border
                    rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{totalEmployees}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground">employees</span>
                </div>
                <div className="bg-card/90 backdrop-blur-sm border border-border
                    rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{divisions.length}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground">divisions</span>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none isolate"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    ref={contentRef}
                    style={{
                        transform: `translate(calc(-50% + ${translate.x}px), ${translate.y + 40}px) scale(${scale})`,
                        transformOrigin: 'top center',
                        transition: isPanning.current ? 'none' : 'transform 0.15s ease',
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        paddingBottom: '5rem',
                        // width:0 + overflow:visible means this element never contributes
                        // to the parent's scroll/layout width — prevents mobile page blowout
                        width: 0,
                        overflow: 'visible',
                    }}
                >
                    <div className="flex flex-col items-center">

                        {/* Department root node */}
                        <div
                            onClick={handleDeptClick}
                            className="group flex flex-col items-center gap-3 p-5 rounded-2xl
                                border-2 border-primary/30 bg-card text-card-foreground
                                shadow-md hover:shadow-lg hover:border-primary/60
                                cursor-pointer transition-all duration-200
                                min-w-[200px] max-w-[230px]"
                        >
                            <div className="relative">
                                <SafeAvatar
                                    src={deptHead?.avatarUrl}
                                    alt={deptHeadName ?? department.name}
                                    fallback={department.acronym?.substring(0, 2) || 'DP'}
                                    className="h-20 w-20 ring-4 ring-primary/20
                                        group-hover:ring-primary/40 transition-all
                                        bg-accent text-accent-foreground font-bold text-2xl"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary
                                    rounded-full ring-2 ring-background
                                    flex items-center justify-center">
                                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-foreground leading-tight">
                                    {department.name}
                                </p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono font-medium
                                    bg-accent text-accent-foreground">
                                    {department.acronym}
                                </span>
                                {deptHeadName && (
                                    <p className="text-xs text-primary mt-1 font-medium">{deptHeadName}</p>
                                )}
                                {topPositions[0]?.name && (
                                    <p className="text-xs text-muted-foreground">{topPositions[0].name}</p>
                                )}
                            </div>
                        </div>

                        {/* Dept → Divisions */}
                        {divisions.length > 0 && (
                            <TreeChildren lineColor={lineColor} gap="2.5rem">
                                {divisions.map(div => (
                                    <DivisionNode
                                        key={div.id}
                                        division={div}
                                        onEmployeeClick={openModal}
                                        contextDept={department.name}
                                        lineColor={lineColor}
                                        highlightIds={highlightIds}
                                    />
                                ))}
                            </TreeChildren>
                        )}

                        {/* Top-level positions only */}
                        {divisions.length === 0 && topPositions.length > 0 && (
                            <TreeChildren lineColor={lineColor} gap="1.5rem">
                                {topPositions.map(pos => (
                                    <PositionNode
                                        key={pos.id}
                                        position={pos}
                                        onEmployeeClick={openModal}
                                        contextDept={department.name}
                                        highlightIds={highlightIds}
                                    />
                                ))}
                            </TreeChildren>
                        )}

                    </div>
                </div>
            </div>

            <EmployeeDetailModal
                isOpen={modal.open}
                onClose={() => setModal(m => ({ ...m, open: false }))}
                title={modal.title}
                subtitle={department.name}
                employees={modal.employees}
            />
        </div>
    );
});

OrgChart.displayName = 'OrgChart';