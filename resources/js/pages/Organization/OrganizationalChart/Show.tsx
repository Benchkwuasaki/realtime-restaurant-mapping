import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import type { Department, Division, Unit, Position, Employee } from './data/schema';
import { EmployeeModal } from './components/employee-modal';
import type { BreadcrumbItem } from '@/types';

interface Props {
    department: Department;
}

interface ExpandedState {
    [key: number]: boolean;
}

interface EmployeeData extends Employee {
    positionName?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Organization", href: "#" },
    { title: "Organisational Chart", href: "/organization/organizational_chart" },
];

const DivisionCard: React.FC<{
    division: Division;
    expanded: boolean;
    onToggle: () => void;
    onUnitClick: (unit: Unit) => void;
}> = ({ division, expanded, onToggle, onUnitClick }) => {
    const divisionHead = division.positions?.[0]?.employees?.[0];
    const headFullName = divisionHead
        ? [divisionHead.firstName, divisionHead.middleName, divisionHead.lastName]
            .filter(Boolean)
            .join(' ')
        : 'Division Head';

    return (
        <div className="border-l-4 border-blue-300 pl-6 mb-8">
            {/* Division Header */}
            <div className="flex items-start gap-4 bg-blue-50 p-4 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {divisionHead?.profilePicture ? (
                        <img
                            src={divisionHead.profilePicture}
                            alt={headFullName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        division.acronym?.substring(0, 2).toUpperCase() || 'D'
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{division.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{headFullName}</p>
                    {division.acronym && (
                        <p className="text-xs text-gray-500 mt-1">{division.acronym}</p>
                    )}
                </div>

                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors mt-2"
                >
                    <ChevronDown
                        size={20}
                        className={`text-blue-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* Units */}
            {expanded && division.units && division.units.length > 0 && (
                <div className="mt-6 ml-6 space-y-4">
                    {division.units.map((unit) => (
                        <div
                            key={unit.id}
                            onClick={() => onUnitClick(unit)}
                            className="cursor-pointer group"
                        >
                            {/* Connector line */}
                            <div className="w-0.5 h-4 bg-gray-300 mb-2"></div>

                            {/* Unit Card */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-300 hover:border-indigo-500 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                                            {unit.name}
                                        </h4>
                                        {unit.acronym && (
                                            <p className="text-xs text-gray-600 mt-1">{unit.acronym}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Click to view</p>
                                        <p className="text-sm font-semibold text-indigo-600 mt-1">
                                            {unit.positions?.reduce((sum, pos) => sum + (pos.employees?.length || 0), 0) || 0} Employees
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DepartmentDetail({ department }: Props) {
    const [expandedDivisions, setExpandedDivisions] = useState<ExpandedState>(
        (department.divisions || []).reduce((acc, div) => {
            acc[div.id] = true;
            return acc;
        }, {} as ExpandedState)
    );

    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    const toggleDivision = (divisionId: number) => {
        setExpandedDivisions((prev) => ({
            ...prev,
            [divisionId]: !prev[divisionId],
        }));
    };

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

            <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        href="/organization/organizational_chart"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Back to Chart
                    </Link>
                </div>

                {/* Department Header */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <div className="flex items-start gap-6">
                        {/* Department Avatar */}
                        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden shadow-lg">
                            {departmentHead?.profilePicture ? (
                                <img
                                    src={departmentHead.profilePicture}
                                    alt={headFullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl">
                                    {department.acronym?.substring(0, 2).toUpperCase() || 'D'}
                                </span>
                            )}
                        </div>

                        {/* Department Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-gray-900">{department.name}</h1>
                            <p className="text-lg text-gray-600 mt-2">{headFullName}</p>
                            {department.description && (
                                <p className="text-gray-600 mt-3">{department.description}</p>
                            )}
                            <div className="flex gap-6 mt-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Acronym: </span>
                                    <span className="font-semibold text-gray-900">{department.acronym}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Divisions: </span>
                                    <span className="font-semibold text-purple-600">
                                        {department.divisions?.length || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divisions Section */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Divisions & Units</h2>

                    {department.divisions && department.divisions.length > 0 ? (
                        <div className="space-y-6">
                            {department.divisions.map((division) => (
                                <DivisionCard
                                    key={division.id}
                                    division={division}
                                    expanded={expandedDivisions[division.id] ?? true}
                                    onToggle={() => toggleDivision(division.id)}
                                    onUnitClick={handleUnitClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No divisions found for this department</p>
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
