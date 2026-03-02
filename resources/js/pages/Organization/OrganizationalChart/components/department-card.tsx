import React from 'react';
import { Link } from '@inertiajs/react';
import type { Department } from '../data/schema';

interface DepartmentCardProps {
    department: Department;
    level?: number;
    isHighlighted?: boolean;
    isClickable?: boolean;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
    department,
    level = 0,
    isHighlighted = false,
    isClickable = false,
}) => {
    const departmentHead = department.topPositions?.[0]?.employees?.[0];
    
    const headFullName = departmentHead
        ? [departmentHead.firstName, departmentHead.middleName, departmentHead.lastName]
            .filter(Boolean)
            .join(' ')
        : 'Department Head';

    // Color scheme based on hierarchy level
    const colorSchemes = [
        { bg: 'from-purple-500 to-purple-600', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
        { bg: 'from-blue-500 to-blue-600', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
        { bg: 'from-indigo-500 to-indigo-600', border: 'border-indigo-300', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
        { bg: 'from-slate-500 to-slate-600', border: 'border-slate-300', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
    ];

    const colors = colorSchemes[Math.min(level, 3)];

    const sizeClasses = level === 0 && isHighlighted 
        ? 'w-32 h-32' 
        : 'w-24 h-24';
    
    const textSize = level === 0 && isHighlighted ? 'text-lg' : 'text-sm';

    const card = (
        <div className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''} transition-transform ${isClickable ? 'hover:scale-105' : ''}`}>
            {/* Avatar Circle */}
            <div className={`${sizeClasses} rounded-full bg-gradient-to-b ${colors.bg} border-4 ${colors.border} flex items-center justify-center shadow-lg overflow-hidden text-white font-bold`}>
                {departmentHead?.profilePicture ? (
                    <img
                        src={departmentHead.profilePicture}
                        alt={headFullName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className={`${textSize} font-bold text-white`}>
                        {department.acronym?.substring(0, 2).toUpperCase() || 'D'}
                    </div>
                )}
            </div>

            {/* Department Info Card */}
            <div className={`${colors.badge} px-4 py-3 rounded-lg shadow-md text-center mt-3 min-w-max border-t-4 ${colors.border}`}>
                <div className={`${textSize} font-bold ${colors.text}`}>
                    {department.name}
                </div>
                <div className={`text-xs ${colors.text} opacity-75 mt-1`}>
                    {headFullName}
                </div>
                {department.divisions && department.divisions.length > 0 && (
                    <div className={`text-xs font-semibold ${colors.text} mt-2 pt-2 border-t ${colors.border}`}>
                        {department.divisions.length} {department.divisions.length === 1 ? 'Division' : 'Divisions'}
                    </div>
                )}
            </div>
        </div>
    );

    if (isClickable) {
        return (
            <Link
                href={`/organization/organizational_chart/${department.id}`}
                className="no-underline"
            >
                {card}
            </Link>
        );
    }

    return card;
};
