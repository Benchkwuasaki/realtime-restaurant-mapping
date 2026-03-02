import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ChevronLeft } from 'lucide-react';
import type { Department, Division, Unit, Position, Employee } from './data/schema';
import { EmployeeModal } from './components/employee-modal';
import type { BreadcrumbItem } from '@/types';

interface Props {
    department: Department;
}

interface EmployeeData extends Employee {
    positionName?: string;
}

const DivisionCard: React.FC<{
    division: Division;
    onUnitClick: (unit: Unit) => void;
    isDarkMode: boolean;
}> = ({ division, onUnitClick, isDarkMode }) => {
    const divisionHead = division.positions?.[0]?.employees?.[0];
    const headFullName = divisionHead
        ? [divisionHead.firstName, divisionHead.middleName, divisionHead.lastName]
            .filter(Boolean)
            .join(' ')
        : 'Division Head';

    return (
        <div className="flex flex-col items-center">
            {/* Division Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-4 border-blue-300 mb-4">
                {divisionHead?.profilePicture ? (
                    <img
                        src={divisionHead.profilePicture}
                        alt={headFullName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-2xl">{division.acronym?.substring(0, 2).toUpperCase() || 'D'}</span>
                )}
            </div>

            {/* Division Info Card */}
            <div className="bg-blue-50 dark:bg-gray-800 px-6 py-4 rounded-lg border-t-4 border-blue-300 text-center min-w-max max-w-xs">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{division.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{headFullName}</p>
                {division.units && division.units.length > 0 && (
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">
                        {division.units.length} Unit{division.units.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Units Below Division */}
            {division.units && division.units.length > 0 && (
                <div className="mt-6">
                    {/* Connector line from division to units */}
                    <div className="flex justify-center mb-4">
                        <div className="w-0.5 h-6 bg-gray-400 dark:bg-gray-600"></div>
                    </div>

                    {/* Horizontal line connecting units */}
                    <div className="flex justify-center items-start relative">
                        {division.units.length > 1 && (
                            <svg
                                className="absolute -top-6 left-0 right-0"
                                height="12"
                                style={{ width: '100%' }}
                            >
                                <line
                                    x1="0%"
                                    y1="6"
                                    x2="100%"
                                    y2="6"
                                    stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                                    strokeWidth="2"
                                />
                            </svg>
                        )}

                        {/* Units Container */}
                        <div className="flex justify-center gap-8 flex-wrap relative px-4">
                            {division.units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => onUnitClick(unit)}
                                >
                                    {/* Vertical connector from horizontal line */}
                                    <div className="w-0.5 h-6 bg-gray-400 dark:bg-gray-600 mb-2"></div>

                                    {/* Unit Card - Styled like a division card */}
                                    <div className="group">
                                        {/* Unit Avatar */}
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-4 border-indigo-300 mb-3 group-hover:scale-110 transition-transform">
                                            {unit.acronym?.substring(0, 2).toUpperCase() || 'U'}
                                        </div>

                                        {/* Unit Info Card */}
                                        <div className="bg-indigo-50 dark:bg-gray-800 px-4 py-3 rounded-lg border-t-4 border-indigo-300 text-center min-w-max group-hover:bg-indigo-100 dark:group-hover:bg-gray-700 transition-colors">
                                            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{unit.name}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {unit.positions?.reduce((sum, pos) => sum + (pos.employees?.length || 0), 0) || 0} Employees
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function DepartmentDetail({ department }: Props) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    React.useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Organization", href: "#" },
        { title: "Organisational Chart", href: "/organization/organizational_chart" },
        { title: department.name, href: "#" },
    ];

    const svgStrokeColor = isDarkMode ? '#4b5563' : '#d1d5db';

    const handleUnitClick = (unit: Unit) => {
        setSelectedUnit(unit);
        setShowEmployeeModal(true);
    };

    const closeEmployeeModal = () => {
        setShowEmployeeModal(false);
        setSelectedUnit(null);
    };

    // Get employees for the selected unit
    const selectedUnitEmployees: EmployeeData[] = selectedUnit
        ? selectedUnit.positions
            ?.flatMap((pos) =>
                pos.employees?.map((emp) => ({
                    ...emp,
                    positionName: pos.name,
                })) || []
            )
            .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || '')) || []
        : [];

    const departmentHead = department.topPositions?.[0]?.employees?.[0];
    const headFullName = departmentHead
        ? [departmentHead.firstName, departmentHead.middleName, departmentHead.lastName]
            .filter(Boolean)
            .join(' ')
        : 'Department Head';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${department.name} - Organizational Chart`} />

            <div className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Back Button */}
                <div className="mb-8 flex justify-start">
                    <Link
                        href="/organization/organizational_chart"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium transition-colors rounded-lg"
                    >
                        <ChevronLeft size={20} />
                        Back to Chart
                    </Link>
                </div>

                {/* Main Hierarchical Tree */}
                <div className="flex flex-col items-center">
                    {/* Department at Top */}
                    <div className="flex flex-col items-center mb-8">
                        {/* Department Avatar Circle */}
                        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-4 border-purple-300 mb-6">
                            {departmentHead?.profilePicture ? (
                                <img
                                    src={departmentHead.profilePicture}
                                    alt={headFullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-5xl">
                                    {department.acronym?.substring(0, 2).toUpperCase() || 'D'}
                                </span>
                            )}
                        </div>

                        {/* Department Info Card */}
                        <div className="bg-purple-50 dark:bg-gray-800 px-8 py-6 rounded-lg border-t-4 border-purple-300 text-center min-w-max max-w-sm">
                            <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{department.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{headFullName}</p>
                            {department.divisions && (
                                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-3">
                                    {department.divisions.length} Division{department.divisions.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Connector from Department to Divisions */}
                    {department.divisions && department.divisions.length > 0 && (
                        <div className="flex flex-col items-center w-full">
                            {/* Vertical line from department */}
                            <div className="w-1 h-12 bg-gray-400 dark:bg-gray-600"></div>

                            {/* Horizontal line connecting all divisions */}
                            <div className="flex justify-center items-start relative w-full px-8">
                                {department.divisions.length > 1 && (
                                    <svg
                                        className="absolute top-0 left-0 right-0"
                                        height="12"
                                        style={{ width: '100%' }}
                                    >
                                        <line
                                            x1="0%"
                                            y1="6"
                                            x2="100%"
                                            y2="6"
                                            stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                                            strokeWidth="2"
                                        />
                                    </svg>
                                )}

                                {/* Divisions Container */}
                                <div className="flex justify-center gap-12 flex-wrap relative pt-6">
                                    {department.divisions.map((division) => (
                                        <div
                                            key={division.id}
                                            className="flex flex-col items-center relative"
                                        >
                                            {/* Vertical connector from horizontal line to division */}
                            <div className="w-1 h-6 bg-gray-400 dark:bg-gray-600 mb-4 absolute -top-6"></div>
                                            {/* Division Card */}
                                            <div className="pt-2">
                                                <DivisionCard
                                                    division={division}
                                                    onUnitClick={handleUnitClick}
                                                    isDarkMode={isDarkMode}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Employee Modal */}
            <EmployeeModal
                isOpen={showEmployeeModal}
                onClose={closeEmployeeModal}
                title={`${department.name} / ${selectedUnit?.name || ''}`}
                employees={selectedUnitEmployees}
            />
        </AppLayout>
    );
}
