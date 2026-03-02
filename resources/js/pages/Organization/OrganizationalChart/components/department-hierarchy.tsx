import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Department } from '../data/schema';
import { DepartmentCard } from './department-card';

interface DepartmentHierarchyProps {
    departments: Department[];
    parentDepartment?: Department;
    level?: number;
}

interface ExpandedState {
    [key: number]: boolean;
}

export const DepartmentHierarchy: React.FC<DepartmentHierarchyProps> = ({
    departments,
    parentDepartment,
    level = 0,
}) => {
    const [expanded, setExpanded] = useState<ExpandedState>(
        departments.reduce((acc, dept) => {
            acc[dept.id] = level === 0; // Expand first level by default
            return acc;
        }, {} as ExpandedState)
    );

    const toggleExpand = (deptId: number) => {
        setExpanded(prev => ({
            ...prev,
            [deptId]: !prev[deptId],
        }));
    };

    if (departments.length === 0) return null;

    return (
        <div className="w-full">
            {/* Parent Department (if exists) */}
            {parentDepartment && level > 0 && (
                <div className="flex flex-col items-center mb-8">
                    <DepartmentCard 
                        department={parentDepartment} 
                        level={level - 1}
                        isHighlighted={true}
                    />
                    
                    {/* Connector line */}
                    {departments.length > 0 && (
                        <div className="w-0.5 h-12 bg-gray-300 my-4"></div>
                    )}
                </div>
            )}

            {/* Render departments */}
            <div className="space-y-12">
                {departments.map((department, index) => {
                    const hasDivisions = department.divisions && department.divisions.length > 0;
                    const isExpanded = expanded[department.id];
                    const divisionsCount = department.divisions?.length || 0;

                    return (
                        <div key={department.id} className="flex flex-col items-center">
                            {/* Department Card with optional expand button */}
                            <div className="flex items-center gap-2">
                                <DepartmentCard 
                                    department={department}
                                    level={level}
                                    isHighlighted={level === 0}
                                    isClickable={level === 0}
                                />
                                
                                {/* Expand/Collapse button */}
                                {hasDivisions && (
                                    <button
                                        onClick={() => toggleExpand(department.id)}
                                        className="ml-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
                                        title={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <ChevronDown 
                                            size={20} 
                                            className={`transition-transform text-gray-600 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Subdivisions/Divisions */}
                            {hasDivisions && isExpanded && (
                                <div className="mt-8 w-full">
                                    {/* Vertical connector line from department to divisions */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-0.5 h-8 bg-gray-300"></div>
                                    </div>

                                    {/* Horizontal line connecting all divisions */}
                                    <div className="flex justify-center items-start relative">
                                        {/* SVG for horizontal connector line */}
                                        {divisionsCount > 1 && (
                                            <svg 
                                                className="absolute -top-4 left-0 right-0"
                                                height="16"
                                                style={{ width: '100%' }}
                                            >
                                                <line 
                                                    x1="0%" 
                                                    y1="0" 
                                                    x2="100%" 
                                                    y2="0" 
                                                    stroke="#d1d5db" 
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        )}

                                        {/* Divisions Container */}
                                        <div className="flex justify-center items-start gap-8 flex-wrap relative px-8">
                                            {department.divisions!.map((division, idx) => {
                                                // Transform division to department-like structure
                                                const divisionDept: Department = {
                                                    id: division.id,
                                                    name: division.name,
                                                    acronym: division.acronym,
                                                    description: division.description,
                                                    divisions: [],
                                                    topPositions: division.positions || [],
                                                };

                                                return (
                                                    <div key={division.id} className="flex flex-col items-center relative">
                                                        {/* Vertical connector from horizontal line to division */}
                                                        <div className="w-0.5 h-8 bg-gray-300 mb-2"></div>
                                                        
                                                        <DepartmentCard 
                                                            department={divisionDept}
                                                            level={level + 1}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
