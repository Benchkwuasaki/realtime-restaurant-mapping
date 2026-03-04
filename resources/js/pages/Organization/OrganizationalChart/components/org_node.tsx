import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Collapsible Section ──────────────────────────────────────────────────────
interface CollapsibleSectionProps {
    title: string;
    count?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    count,
    defaultOpen = true,
    children,
    className,
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={cn('w-full', className)}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 mb-3 text-sm font-semibold
                    border-l-2 border-primary pl-3 py-0.5 text-primary
                    hover:opacity-80 transition-opacity"
            >
                {open
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronUp className="h-3.5 w-3.5" />
                }
                {title}
                {count !== undefined && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({count})</span>
                )}
            </button>
            {open && (
                <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Node Badge ────────────────────────────────────────────────────────────────
export const NodeBadge: React.FC<{ label: string }> = ({ label }) => (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
        bg-accent text-accent-foreground">
        {label}
    </span>
);