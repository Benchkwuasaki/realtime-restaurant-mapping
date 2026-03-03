import React, { useState } from 'react';
import type { Department, Position, Employee } from '../data/schema';

interface EmployeeAvatarProps {
    employee: Employee;
    position: string;
    level: number;
}

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({ employee, position, level }) => {
    const fullName = [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(' ') || 'Unknown';

    // Color scheme based on hierarchy level
    const colors = [
        { circle: 'w-24 h-24 bg-gradient-to-b from-pink-500 to-pink-600 border-pink-400' },
        { circle: 'w-20 h-20 bg-gradient-to-b from-orange-500 to-orange-600 border-orange-400' },
        { circle: 'w-20 h-20 bg-gradient-to-b from-green-500 to-green-600 border-green-400' },
        { circle: 'w-16 h-16 bg-gradient-to-b from-blue-500 to-blue-600 border-blue-400' },
    ];

    const boxColors = [
        'bg-pink-500 text-white',
        'bg-orange-500 text-white',
        'bg-green-500 text-white',
        'bg-blue-500 text-white',
    ];

    const color = colors[Math.min(level, 3)];
    const boxColor = boxColors[Math.min(level, 3)];

    return (
        <div className="flex flex-col items-center">
            <div className={`${color.circle} rounded-full border-4 flex items-center justify-center overflow-hidden shadow-lg`}>
                {employee.profilePicture ? (
                    <img
                        src={employee.profilePicture}
                        alt={fullName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-3xl font-bold text-white" style={{ fontSize: level === 0 ? '2.5rem' : '1.5rem' }}>
                        {fullName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className={`${boxColor} px-4 py-2 rounded shadow-md text-center mt-3 min-w-max`}>
                <div className={`font-bold ${level === 0 ? 'text-lg' : 'text-sm'}`}>
                    {fullName.toUpperCase()}
                </div>
                <div className={`${level === 0 ? 'text-sm' : 'text-xs'}`}>
                    ({position.toUpperCase()})
                </div>
            </div>
        </div>
    );
};

interface PositionGroupProps {
    positions: Position[];
    level: number;
}

const PositionGroup: React.FC<PositionGroupProps> = ({ positions, level }) => {
    if (!positions || positions.length === 0) return null;

    // Filter positions with employees
    const positionsWithEmployees = positions.filter(p => p.employees && p.employees.length > 0);

    if (positionsWithEmployees.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-8 justify-center items-start">
            {positionsWithEmployees.map((position) => (
                <div key={position.id} className="flex flex-col items-center">
                    {/* Connector line from top */}
                    {level > 0 && (
                        <div className="w-0.5 h-8 bg-gray-400 mb-2"></div>
                    )}

                    {position.employees.map((employee) => (
                        <div key={employee.id}>
                            <EmployeeAvatar
                                employee={employee}
                                position={position.name}
                                level={level}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

interface DivisionHierarchyProps {
    divisionName: string;
    positions: Position[];
    level: number;
}

const DivisionHierarchy: React.FC<DivisionHierarchyProps> = ({ divisionName, positions, level }) => {
    const [expanded, setExpanded] = useState(true);

    if (!positions || positions.length === 0) return null;

    const positionsWithEmployees = positions.filter(p => p.employees && p.employees.length > 0);
    if (positionsWithEmployees.length === 0) return null;

    return (
        <div className="mb-16">
            {expanded && (
                <div className="flex flex-col items-center">
                    <PositionGroup positions={positionsWithEmployees} level={level} />
                </div>
            )}
        </div>
    );
};

interface DepartmentOrgChartProps {
    department: Department;
}

export const DepartmentOrgChart: React.FC<DepartmentOrgChartProps> = ({ department }) => {
    const [expanded, setExpanded] = useState(true);

    if (!expanded) return null;

    const topPositionsWithEmployees = department.topPositions?.filter(
        p => p.employees && p.employees.length > 0
    ) || [];

    const divisionsWithData = department.divisions?.filter(d => 
        d.positions && d.positions.some(p => p.employees && p.employees.length > 0)
    ) || [];

    return (
        <div className="w-full p-8 bg-white rounded-lg">
            {/* Department Title */}
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-gray-800">{department.name}</h2>
                <p className="text-gray-600 mt-2">{department.acronym}</p>
                {department.description && (
                    <p className="text-gray-500 text-sm mt-2 italic">{department.description}</p>
                )}
            </div>

            {/* CEO Level */}
            {topPositionsWithEmployees.length > 0 && (
                <div className="mb-16 flex justify-center">
                    <div className="flex flex-wrap gap-12 justify-center">
                        {topPositionsWithEmployees.map((position) => (
                            <div key={position.id}>
                                {position.employees.map((employee) => (
                                    <EmployeeAvatar
                                        key={employee.id}
                                        employee={employee}
                                        position={position.name}
                                        level={0}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Connector lines and management structure */}
            {divisionsWithData.length > 0 && (
                <div className="relative">
                    {/* Top connector line */}
                    {topPositionsWithEmployees.length > 0 && divisionsWithData.length > 0 && (
                        <div className="flex justify-center mb-12">
                            <div className="relative w-full flex justify-center">
                                <div className="w-0.5 h-8 bg-gray-300"></div>
                            </div>
                        </div>
                    )}

                    {/* Divisions */}
                    <div className="space-y-20">
                        {divisionsWithData.map((division, idx) => {
                            const managerPositions = division.positions?.filter(
                                p => p.employees && p.employees.length > 0
                            ) || [];

                            if (managerPositions.length === 0) return null;

                            return (
                                <div key={division.id}>
                                    {/* Manager level */}
                                    <div className="flex flex-wrap gap-12 justify-center items-start mb-12">
                                        {managerPositions.map((position) => (
                                            <div key={position.id} className="flex flex-col items-center">
                                                {/* Connector from CEO to manager */}
                                                <div className="w-0.5 h-10 bg-gray-300 mb-2"></div>

                                                {position.employees.map((employee) => (
                                                    <div key={employee.id} className="flex flex-col items-center">
                                                        <EmployeeAvatar
                                                            employee={employee}
                                                            position={position.name}
                                                            level={1}
                                                        />

                                                        {/* Connector lines to team members */}
                                                        <div className="relative mt-8">
                                                            <div className="w-0.5 h-8 bg-gray-400 mx-auto"></div>

                                                            {/* Horizontal line connecting to all team members */}
                                                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full bg-gray-300" style={{
                                                                height: '0.5px',
                                                                width: '100%',
                                                                top: '1rem',
                                                            }}></div>

                                                            {/* Team members (division employees) */}
                                                            <div className="flex flex-wrap gap-8 justify-center mt-8 flex-col sm:flex-row">
                                                                {division.positions
                                                                    ?.filter(p => p.id !== position.id)
                                                                    .flatMap(p => 
                                                                        p.employees?.map(emp => ({
                                                                            ...emp,
                                                                            positionName: p.name
                                                                        })) || []
                                                                    )
                                                                    .map((employee, empIdx) => (
                                                                        <div key={`${employee.id}-${empIdx}`} className="flex flex-col items-center">
                                                                            {/* Connector to individual */}
                                                                            <div className="w-0.5 h-6 bg-gray-300 mb-2"></div>
                                                                            <EmployeeAvatar
                                                                                employee={employee}
                                                                                position={employee.positionName}
                                                                                level={2}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};