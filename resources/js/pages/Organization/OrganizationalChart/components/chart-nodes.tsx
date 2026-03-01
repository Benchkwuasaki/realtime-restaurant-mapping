import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { type Department, type Division, type Position, type Employee } from '../data/schema';

interface EmployeeCardProps {
    employee: Employee;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
    const fullName = [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="bg-white border border-gray-200 rounded p-2 mb-2 ml-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
                {employee.profilePicture ? (
                    <img
                        src={employee.profilePicture}
                        alt={fullName}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-white">
                        {fullName.charAt(0)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate text-sm">
                        {fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                    {employee.dateHired && (
                        <p className="text-xs text-gray-400">
                            Hired: {new Date(employee.dateHired).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PositionNodeProps {
    position: Position;
    isExpanded: boolean;
    onToggle: () => void;
    level: number;
}

export const PositionNode: React.FC<PositionNodeProps> = ({ position, isExpanded, onToggle, level }) => {
    const marginLeft = level * 12;
    const hasEmployees = position.employees && position.employees.length > 0;

    return (
        <div style={{ marginLeft: `${marginLeft}px` }} className="mb-2">
            <button
                onClick={onToggle}
                disabled={!hasEmployees}
                className={`flex items-center font-medium mb-1 w-full text-left ${
                    hasEmployees
                        ? 'text-green-700 hover:text-green-900 cursor-pointer'
                        : 'text-gray-500 cursor-default'
                }`}
            >
                {hasEmployees && (
                    <>
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 mr-2" />
                        ) : (
                            <ChevronRight className="w-4 h-4 mr-2" />
                        )}
                    </>
                )}
                {!hasEmployees && <span className="w-4 h-4 mr-2"></span>}
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm">
                    {position.name}
                </span>
                {hasEmployees && (
                    <span className="text-xs text-gray-500 ml-2">
                        ({position.employees.length})
                    </span>
                )}
            </button>

            {isExpanded && hasEmployees && (
                <div className="mt-1">
                    {position.employees.map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface DivisionNodeProps {
    division: Division;
    isExpanded: boolean;
    onToggle: () => void;
    expandedPositions: Set<number>;
    onTogglePosition: (id: number) => void;
    expandedEmployees: Set<number>;
    onToggleEmployees: (id: number) => void;
}

export const DivisionNode: React.FC<DivisionNodeProps> = ({
    division,
    isExpanded,
    onToggle,
    expandedPositions,
    onTogglePosition,
    expandedEmployees,
    onToggleEmployees,
}) => {
    return (
        <div className="mb-4 ml-4 border-l-2 border-blue-300 pl-4">
            <button
                onClick={onToggle}
                className="flex items-center text-blue-700 hover:text-blue-900 font-semibold mb-2 w-full text-left"
            >
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5 mr-2" />
                ) : (
                    <ChevronRight className="w-5 h-5 mr-2" />
                )}
                <span>{division.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                    {division.acronym}
                </span>
            </button>

            {isExpanded && (
                <div className="mt-2">
                    {division.description && (
                        <p className="text-sm text-gray-600 mb-3 italic">
                            {division.description}
                        </p>
                    )}

                    {division.positions && division.positions.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Positions & Members
                            </h4>
                            {division.positions.map((position) => (
                                <PositionNode
                                    key={position.id}
                                    position={position}
                                    isExpanded={expandedEmployees.has(position.id)}
                                    onToggle={() => onToggleEmployees(position.id)}
                                    level={2}
                                />
                            ))}
                        </div>
                    )}

                    {division.units && division.units.length > 0 && (
                        <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Units
                            </h4>
                            {division.units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded mb-1"
                                >
                                    📁 {unit.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface DepartmentNodeProps {
    department: Department;
}

export const DepartmentNode: React.FC<DepartmentNodeProps> = ({ department }) => {
    const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(
        new Set()
    );
    const [expandedPositions, setExpandedPositions] = useState<Set<number>>(
        new Set()
    );
    const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(
        new Set()
    );

    const toggleDivision = (divisionId: number) => {
        const newSet = new Set(expandedDivisions);
        if (newSet.has(divisionId)) {
            newSet.delete(divisionId);
        } else {
            newSet.add(divisionId);
        }
        setExpandedDivisions(newSet);
    };

    const togglePosition = (positionId: number) => {
        const newSet = new Set(expandedPositions);
        if (newSet.has(positionId)) {
            newSet.delete(positionId);
        } else {
            newSet.add(positionId);
        }
        setExpandedPositions(newSet);
    };

    const toggleEmployees = (positionId: number) => {
        const newSet = new Set(expandedEmployees);
        if (newSet.has(positionId)) {
            newSet.delete(positionId);
        } else {
            newSet.add(positionId);
        }
        setExpandedEmployees(newSet);
    };

    return (
        <div className="mb-6 border rounded-lg overflow-hidden shadow-md">
            <div className="bg-blue-600 text-white p-4">
                <h2 className="text-2xl font-bold">{department.name}</h2>
                <p className="text-sm text-blue-100">({department.acronym})</p>
                {department.description && (
                    <p className="text-sm text-blue-100 mt-2">{department.description}</p>
                )}
            </div>

            <div className="p-4 bg-gray-50">
                {/* Top-level Positions (Directors, Heads, etc.) */}
                {department.topPositions && department.topPositions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Department Leadership
                        </h3>
                        {department.topPositions.map((position) => (
                            <PositionNode
                                key={position.id}
                                position={position}
                                isExpanded={expandedEmployees.has(position.id)}
                                onToggle={() => toggleEmployees(position.id)}
                                level={1}
                            />
                        ))}
                    </div>
                )}

                {/* Divisions */}
                {department.divisions && department.divisions.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Divisions
                        </h3>
                        {department.divisions.map((division) => (
                            <DivisionNode
                                key={division.id}
                                division={division}
                                isExpanded={expandedDivisions.has(division.id)}
                                onToggle={() => toggleDivision(division.id)}
                                expandedPositions={expandedPositions}
                                onTogglePosition={togglePosition}
                                expandedEmployees={expandedEmployees}
                                onToggleEmployees={toggleEmployees}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
