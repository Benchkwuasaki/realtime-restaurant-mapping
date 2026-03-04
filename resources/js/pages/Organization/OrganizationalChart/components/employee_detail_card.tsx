import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { EmployeeCardFull } from './employee_card';
import type { Employee } from '../data/schema';

export interface EmployeeWithContext extends Employee {
    positionName?: string;
    unitName?: string;
    divisionName?: string;
    departmentName?: string;
}

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    employees: EmployeeWithContext[];
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    employees,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* w-[calc(100vw-2rem)] keeps a 1rem margin on each side on mobile */}
            <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-0 overflow-hidden gap-0 rounded-2xl">

                {/* Header */}
                <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-border">
                    {/* pr-8 reserves space for the Dialog close button */}
                    <div className="flex items-start gap-3 pr-8">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center
                            justify-center shrink-0 mt-0.5">
                            <Users className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-sm font-semibold text-foreground
                                leading-snug break-words">
                                {title}
                            </DialogTitle>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {subtitle}
                                </p>
                            )}
                            {/* Badge sits under the title — safely away from the close button */}
                            <Badge variant="secondary" className="mt-2 text-xs">
                                {employees.length}{' '}
                                {employees.length === 1 ? 'employee' : 'employees'}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                {/* Employee list */}
                <ScrollArea className="max-h-[65vh]">
                    <div className="p-3 sm:p-4 space-y-2">
                        {employees.length > 0 ? (
                            employees.map(emp => (
                                <EmployeeCardFull
                                    key={emp.id}
                                    employee={emp}
                                    positionName={emp.positionName}
                                    department={emp.departmentName}
                                    division={emp.divisionName}
                                    unit={emp.unitName}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No employees assigned</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};