import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentHierarchy } from './components/department-hierarchy';
import type { Department } from './data/schema';
import type { BreadcrumbItem } from '@/types';
import { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
    organizationalChart: Department[];
    departmentCount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Organisational Chart", href: "/organization/organizational_chart" },
];

export default function OrganizationalChart({ organizationalChart, departmentCount }: Props) {
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startTranslate = useRef({ x: 0, y: 0 });

    const MIN_SCALE = 0.3;
    const MAX_SCALE = 2.5;
    const ZOOM_STEP = 0.15;

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setScale(prev => {
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            return Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
        });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        isPanning.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startTranslate.current = { ...translate };
    }, [translate]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        setTranslate({
            x: startTranslate.current.x + dx,
            y: startTranslate.current.y + dy,
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    const zoomIn = () => setScale(prev => Math.min(MAX_SCALE, prev + ZOOM_STEP));
    const zoomOut = () => setScale(prev => Math.max(MIN_SCALE, prev - ZOOM_STEP));
    const reset = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizational Chart" />

            <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* Header with department count */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organizational Chart</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Total Departments: <span className="font-semibold text-purple-600 dark:text-purple-400">{organizationalChart?.length || 0}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    {organizationalChart && organizationalChart.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md relative overflow-hidden"
                            style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
                        >
                            {/* Zoom Controls */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                <button
                                    onClick={zoomIn}
                                    className="w-9 h-9 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={16} />
                                </button>
                                <button
                                    onClick={zoomOut}
                                    className="w-9 h-9 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <button
                                    onClick={reset}
                                    className="w-9 h-9 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-purple-600 transition-colors"
                                    title="Reset View"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow px-2 py-1 text-xs text-center text-gray-500 dark:text-gray-400 font-mono">
                                    {Math.round(scale * 100)}%
                                </div>
                            </div>

                            {/* Zoomable / Pannable Chart Area */}
                            <div
                                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                                onWheel={handleWheel}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <div
                                    style={{
                                        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                        transformOrigin: 'center center',
                                        transition: isPanning.current ? 'none' : 'transform 0.1s ease',
                                        padding: '2rem',
                                    }}
                                >
                                    <DepartmentHierarchy departments={organizationalChart} level={0} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    No departments found in the database
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}