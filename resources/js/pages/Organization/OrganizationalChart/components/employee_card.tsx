import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar } from 'lucide-react';
import type { Employee } from '../data/schema';

// ─── Safe Avatar ──────────────────────────────────────────────────────────────
const SafeAvatar: React.FC<{
    src?: string | null;
    alt: string;
    fallback: string;
    className?: string;
}> = ({ src, alt, fallback, className = '' }) => (
    <Avatar className={className}>
        {src ? <AvatarImage src={src} alt={alt} /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

function getInitials(emp: Employee): string {
    return [emp.firstName, emp.lastName]
        .filter(Boolean)
        .map(n => n.charAt(0).toUpperCase())
        .join('');
}

function getFullName(emp: Employee): string {
    return [emp.firstName, emp.middleName, emp.lastName]
        .filter(Boolean)
        .join(' ');
}

// ─── Compact card — inside tree nodes ────────────────────────────────────────
export const EmployeeCardCompact: React.FC<{
    employee: Employee;
    positionName: string;
    onClick?: () => void;
}> = ({ employee, positionName, onClick }) => {
    const name = getFullName(employee);

    return (
        <div
            onClick={onClick}
            className={`group flex flex-col items-center gap-2 p-3 rounded-xl
                border border-border bg-card text-card-foreground shadow-sm
                hover:shadow-md hover:border-primary/40
                transition-all duration-200 min-w-[120px] max-w-[160px]
                ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="relative">
                {/* src = avatar_url from the employees table */}
                <SafeAvatar
                    src={employee.avatarUrl}
                    alt={name}
                    fallback={getInitials(employee)}
                    className="h-11 w-11 sm:h-14 sm:w-14 ring-2 ring-border group-hover:ring-primary/40
                        transition-all bg-accent text-accent-foreground font-bold text-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500
                    rounded-full ring-2 ring-background" />
            </div>
            <div className="text-center w-full">
                <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-full">
                    {name}
                </p>
                <p className="text-xs text-primary truncate max-w-full mt-0.5 leading-tight">
                    {positionName}
                </p>
            </div>
        </div>
    );
};

// ─── Full card — inside the employee detail modal ─────────────────────────────
export const EmployeeCardFull: React.FC<{
    employee: Employee;
    positionName?: string;
    department?: string;
    division?: string;
    unit?: string;
}> = ({ employee, positionName, department, division, unit }) => {
    const name = getFullName(employee);
    const formattedDate = employee.dateHired
        ? new Date(employee.dateHired).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
          })
        : null;

    return (
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl
            border border-border bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="relative shrink-0">
                {/* src = avatar_url from the employees table */}
                <SafeAvatar
                    src={employee.avatarUrl}
                    alt={name}
                    fallback={getInitials(employee)}
                    className="h-11 w-11 sm:h-14 sm:w-14 ring-2 ring-border
                        bg-accent text-accent-foreground font-bold text-xl"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500
                    rounded-full ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground break-words leading-snug">{name}</h3>
                {positionName && (
                    <Badge variant="secondary" className="mt-1 text-xs">{positionName}</Badge>
                )}
                <div className="mt-2 space-y-1">
                    {employee.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{employee.email}</span>
                        </div>
                    )}
                    {formattedDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Hired {formattedDate}</span>
                        </div>
                    )}
                    {(department || division || unit) && (
                        <p className="text-xs text-muted-foreground break-words leading-relaxed">
                            {[unit, division, department].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};