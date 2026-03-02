import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Department, Division, Position, Employee } from '../data/schema';

interface EmployeeNodeProps {
    employee: Employee;
    position: string;
    level: number;
}

const EmployeeNode: React.FC<EmployeeNodeProps> = ({ employee, position, level }) => {
    const fullName = [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(' ') || 'Unknown';

    const colors = [
        'from-pink-500 to-pink-600',
        'from-orange-500 to-orange-600',
        'from-green-500 to-green-600',
        'from-blue-500 to-blue-600',
    ];

    const color = colors[level % colors.length];
    const borderColor = [
        'border-pink-300',
        'border-orange-300',
        'border-green-300',
        'border-blue-300',
    ][level % borderColor.length];

    return (
        <div className="flex flex-col items-center">
            <div
                className={`w-20 h-20 rounded-full bg-gradient-to-b ${color} flex items-center justify-center border-4 ${borderColor} shadow-lg overflow-hidden`}
            >
                {employee.profilePicture ? (
                    <img
                        src={employee.profilePicture}
                        alt={fullName}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="text-2xl font-bold text-white">
                        {fullName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className={`${borderColor} border-t-4 w-1 h-4`}></div>
            <div className="bg-pink-500 text-white px-3 py-2 rounded shadow-md text-center whitespace-nowrap">
                <div className="text-xs font-semibold line-clamp-2">{fullName}</div>
                <div className="text-xs line-clamp-1">{position}</div>
            </div>
        </div>
    );
};

interface PositionTreeProps {
    position: Position;
    level: number;
}

const PositionTree: React.FC<PositionTreeProps> = ({ position, level }) => {
    const [expanded, setExpanded] = useState(false);
    const hasEmployees = position.employees && position.employees.length > 0;

    if (!hasEmployees) {
        return (
            <div className="text-sm text-gray-500">
                {position.name} (No employees)
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 px-3 py-2 rounded"
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
                {position.name} ({position.employees.length})
            </button>

            {expanded && (
                <div className="flex gap-8 justify-center flex-wrap">
                    {position.employees.map((employee) => (
                        <div key={employee.id}>
                            <EmployeeNode
                                employee={employee}
                                position={position.name}
                                level={level + 1}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface DivisionTreeProps {
    division: Division;
}

const DivisionTree: React.FC<DivisionTreeProps> = ({ division }) => {
    const [expanded, setExpanded] = useState(false);

    const positionCount = division.positions?.length || 0;
    const memberCount = division.positions?.reduce((sum, p) => sum + (p.employees?.length || 0), 0) || 0;

    return (
        <div className="border-l-4 border-blue-400 pl-4 py-4 mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 mb-2 text-lg font-bold text-blue-700 hover:text-blue-900"
            >
                {expanded ? (
                    <ChevronDown className="w-5 h-5" />
                ) : (
                    <ChevronRight className="w-5 h-5" />
                )}
                {division.name}
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ml-2">
                    {division.acronym}
                </span>
                <span className="text-xs text-gray-500">({positionCount} positions, {memberCount} members)</span>
            </button>

            {expanded && (
                <div className="ml-4 space-y-4">
                    {division.description && (
                        <p className="text-sm text-gray-600 italic">{division.description}</p>
                    )}

                    {division.positions && division.positions.length > 0 ? (
                        division.positions.map((position) => (
                            <div key={position.id}>
                                <PositionTree position={position} level={1} />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No positions found</p>
                    )}

                    {division.units && division.units.length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Units:</h4>
                            <div className="flex flex-wrap gap-2">
                                {division.units.map((unit) => (
                                    <span
                                        key={unit.id}
                                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                    >
                                        📁 {unit.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface DepartmentTreeProps {
    department: Department;
}

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({ department }) => {
    const [expanded, setExpanded] = useState(true);

    console.log('DepartmentTree rendering:', department);

    const divisionCount = department.divisions?.length || 0;
    const totalPositions = 
        (department.topPositions?.length || 0) +
        (department.divisions?.reduce((sum, d) => sum + (d.positions?.length || 0), 0) || 0);
    
    const totalMembers =
        (department.topPositions?.reduce((sum, p) => sum + (p.employees?.length || 0), 0) || 0) +
        (department.divisions?.reduce((sum, d) => sum + (d.positions?.reduce((s, p) => s + (p.employees?.length || 0), 0) || 0), 0) || 0);

    return (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-600">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 mb-4 text-2xl font-bold text-gray-800 hover:text-gray-600"
            >
                {expanded ? (
                    <ChevronDown className="w-6 h-6" />
                ) : (
                    <ChevronRight className="w-6 h-6" />
                )}
                {department.name}
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm ml-2">
                    {department.acronym}
                </span>
                <span className="text-sm text-gray-500">({divisionCount} divisions, {totalPositions} positions, {totalMembers} members)</span>
            </button>

            {expanded && (
                <div>
                    {department.description && (
                        <p className="text-gray-600 mb-6">{department.description}</p>
                    )}

                    {/* Department Leadership */}
                    {department.topPositions && department.topPositions.length > 0 && (
                        <div className="mb-8 pb-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                👔 Department Leadership
                            </h3>
                            <div className="flex flex-wrap gap-8">
                                {department.topPositions.map((position) => (
                                    <div key={position.id}>
                                        <PositionTree position={position} level={0} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Divisions */}
                    {department.divisions && department.divisions.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                📊 Divisions
                            </h3>
                            {department.divisions.map((division) => (
                                <DivisionTree
                                    key={division.id}
                                    division={division}
                                />
                            ))}
                        </div>
                    )}

                    {!department.divisions?.length && !department.topPositions?.length && (
                        <p className="text-gray-500 italic">No divisions or positions found for this department</p>
                    )}
                </div>
            )}
        </div>
    );
};
