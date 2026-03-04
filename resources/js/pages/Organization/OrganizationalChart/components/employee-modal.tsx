import React from 'react';
import { X } from 'lucide-react';
import type { Employee, Position } from '../data/schema';

interface Employee_Modal extends Employee {
    positionName?: string;
}

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    employees: Employee_Modal[];
    positions?: Position[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
    isOpen,
    onClose,
    title,
    employees,
    positions,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white truncate">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-purple-700 p-1 rounded transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Employee List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {employees && employees.length > 0 ? (
                        <div className="space-y-3">
                            {employees.map((employee) => {
                                const fullName = [
                                    employee.firstName,
                                    employee.middleName,
                                    employee.lastName,
                                ]
                                    .filter(Boolean)
                                    .join(' ') || 'Unknown';

                                return (
                                    <div
                                        key={employee.id}
                                        className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                                                {employee.profilePicture ? (
                                                    <img
                                                        src={employee.profilePicture}
                                                        alt={fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-bold text-sm">${fullName.charAt(0).toUpperCase()}</span>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="font-bold text-sm">
                                                        {fullName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {fullName}
                                                </h3>
                                                {employee.positionName && (
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {employee.positionName}
                                                    </p>
                                                )}
                                                {employee.email && (
                                                    <p className="text-xs text-gray-500 truncate mt-1">
                                                        {employee.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No employees found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Total: <span className="font-semibold text-purple-600">{employees?.length || 0}</span> Employee
                        {(employees?.length || 0) !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};