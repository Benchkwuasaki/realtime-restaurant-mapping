import React from 'react';
import type { Department } from '../data/schema';

interface DepartmentCardProps {
    department: Department;
    level: number;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, level }) => {
    const headName = department.topPositions?.[0]?.employees?.[0]
        ? [
            department.topPositions[0].employees[0].firstName,
            department.topPositions[0].employees[0].lastName,
          ]
            .filter(Boolean)
            .join(' ')
        : 'Department Head';

    const sizeClasses = level === 0 ? 'w-32 h-32' : 'w-24 h-24';
    const textSizeClasses = level === 0 ? 'text-lg' : 'text-sm';

    return (
        <div className="flex flex-col items-center">
            <div className={`${sizeClasses} rounded-full bg-gray-300 border-4 border-gray-400 flex items-center justify-center shadow-md overflow-hidden`}>
                {department.topPositions?.[0]?.employees?.[0]?.profilePicture ? (
                    <img
                        src={department.topPositions[0].employees[0].profilePicture}
                        alt={headName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className={`${textSizeClasses} font-bold text-white`}>
                        {department.acronym.substring(0, 2)}
                    </div>
                )}
            </div>
            <div className="text-center mt-3">
                <h3 className={`${textSizeClasses} font-bold text-gray-800`}>{department.name}</h3>
                <p className="text-xs text-gray-600">{headName}</p>
            </div>
        </div>
    );
};

interface HierarchyLevelProps {
    departments: Department[];
    level: number;
}

const HierarchyLevel: React.FC<HierarchyLevelProps> = ({ departments, level }) => {
    if (!departments || departments.length === 0) return null;

    const itemCount = departments.length;
    const spacing = itemCount > 1 ? 'gap-16' : 'gap-0';

    return (
        <div className={`flex ${spacing} justify-center items-start relative mb-16`}>
            {itemCount > 1 && (
                <div
                    className="absolute top-0 h-12 border-t-2 border-gray-300"
                    style={{
                        left: `${(100 / itemCount / 2)}%`,
                        right: `${(100 / itemCount / 2)}%`,
                        top: '-3rem',
                    }}
                />
            )}

            {departments.map((dept, idx) => (
                <div key={dept.id} className="flex flex-col items-center relative">
                    {itemCount > 1 && (
                        <>
                            <div className="absolute w-0.5 h-12 bg-gray-300" style={{ top: '-3rem', left: '50%', transform: 'translateX(-50%)' }} />
                        </>
                    )}
                    <DepartmentCard department={dept} level={level} />
                </div>
            ))}
        </div>
    );
};

interface DepartmentTreeProps {
    department: Department;
}

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({ department }) => {
    // Get all departments for root level
    return (
        <div className="mb-8 p-8 bg-white rounded-lg shadow-sm">
            <HierarchyLevel departments={[department]} level={0} />

            {/* Divisions grouped by level */}
            {department.divisions && department.divisions.length > 0 && (
                <div className="mt-12">
                    <HierarchyLevel
                        departments={department.divisions.slice(0, 3).map((div) => ({
                            department_id: div.id,
                            department_name: div.name,
                            department_acronym: div.acronym,
                            department_description: div.description,
                            divisions: [],
                            topPositions: div.positions || [],
                        }))}
                        level={1}
                    />
                </div>
            )}
        </div>
    );
};

interface OrgChartHierarchyProps {
    departments: Department[];
}

export const OrgChartHierarchy: React.FC<OrgChartHierarchyProps> = ({ departments }) => {
    if (!departments || departments.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No departments found
            </div>
        );
    }

    // Group departments by levels
    const rootDepartments = departments.slice(0, 1);
    const secondaryDepartments = departments.slice(1, 3);
    const tertiaryDepartments = departments.slice(3);

    return (
        <div className="w-full p-8 bg-white rounded-lg shadow-sm">
            {/* Root Level */}
            {rootDepartments.length > 0 && (
                <HierarchyLevel departments={rootDepartments} level={0} />
            )}

            {/* Secondary Level */}
            {secondaryDepartments.length > 0 && (
                <HierarchyLevel departments={secondaryDepartments} level={1} />
            )}

            {/* Tertiary Level */}
            {tertiaryDepartments.length > 0 && (
                <HierarchyLevel departments={tertiaryDepartments} level={2} />
            )}
        </div>
    );
};