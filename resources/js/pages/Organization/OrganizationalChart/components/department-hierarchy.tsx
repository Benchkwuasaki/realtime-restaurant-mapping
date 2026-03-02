import React from 'react';
import type { Department } from '../data/schema';
import { DepartmentCard } from './department-card';

interface DepartmentHierarchyProps {
    departments: Department[];
    level?: number;
}

export const DepartmentHierarchy: React.FC<DepartmentHierarchyProps> = ({
    departments,
    level = 0,
}) => {
    if (departments.length === 0) return null;

    return (
        <div className="w-full">
            {/* Render departments in a grid */}
            <div className="flex flex-wrap justify-center items-start gap-12">
                {departments.map((department) => (
                    <div key={department.id} className="flex flex-col items-center">
                        <DepartmentCard 
                            department={department}
                            level={level}
                            isHighlighted={level === 0}
                            isClickable={level === 0}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
