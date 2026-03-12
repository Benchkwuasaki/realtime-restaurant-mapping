/* ─────────────────────────────────────────────────────────────
   components/employee-masterlist-columns.tsx
   TanStack column definitions for the Employee Masterlist table.
───────────────────────────────────────────────────────────── */

import { type ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import {
    type Employee,
    DEPT_COLOR_POOL,
    TYPE_COLORS,
} from '@/pages/ReportsAndAnalytics/Employees/data/employee-report';

/* ── Badge helpers ───────────────────────────────────────────────────────── */

const STATUS_VARIANT: Record<string, 'green' | 'destructive'> = {
    Active:   'green',
    Inactive: 'destructive',
};

const TYPE_VARIANT: Record<string, 'outline' | 'default' | 'secondary'> = {
    Regular:     'default',
    Casual:      'secondary',
    'Job Order': 'outline',
};

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>{status}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
    return <Badge variant={TYPE_VARIANT[type] ?? 'secondary'}>{type}</Badge>;
}

/* ── Dept colour — hashed so the same department always gets the same colour ── */
function deptColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_COLOR_POOL[Math.abs(hash) % DEPT_COLOR_POOL.length];
}

/* ── Column definitions ──────────────────────────────────────────────────── */

export const employeeMasterlistColumns: ColumnDef<Employee>[] = [
    {
        accessorKey: 'workId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Work ID" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold text-blue-500">
                {row.getValue('workId')}
            </span>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
            const name = row.getValue<string>('name');
            const color = deptColor(row.original.department);
            return (
                <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                        <AvatarFallback className="text-white text-xs font-black" style={{ background: color }}>
                            {name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{name}</span>
                </div>
            );
        },
        mobileCard: (row) => {
            const color = deptColor(row.department);
            return (
                <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                        <AvatarFallback className="text-white text-xs font-black" style={{ background: color }}>
                            {row.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-semibold text-sm text-foreground leading-tight truncate">{row.name}</span>
                        <span className="text-xs text-muted-foreground">{row.position} · {row.department}</span>
                        <div className="flex gap-1.5 mt-0.5">
                            <StatusBadge status={row.status} />
                            <TypeBadge type={row.type} />
                        </div>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-blue-500">{row.workId}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.salaryGrade}</div>
                        <div className="text-xs text-muted-foreground">{row.dateHired}</div>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => <span className="text-foreground">{row.getValue('department')}</span>,
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'position',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('position')}</span>,
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => <TypeBadge type={row.getValue('type')} />,
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'dateHired',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date Hired" />,
        cell: ({ row }) => (
            <span className="text-muted-foreground text-xs">{row.getValue('dateHired')}</span>
        ),
    },
    {
        accessorKey: 'salaryGrade',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salary Grade" />,
        cell: ({ row }) => (
            <span className="font-semibold text-foreground">{row.getValue('salaryGrade')}</span>
        ),
    },
];

/* ── Toolbar filter builder — takes dynamic department list from server ───── */
export function buildEmployeeTableFilters(departments: string[]) {
    return [
        {
            columnId: 'department',
            title: 'Department',
            options: departments.map(d => ({ label: d, value: d })),
        },
        {
            columnId: 'type',
            title: 'Type',
            options: ['Regular', 'Casual', 'Job Order'].map(t => ({ label: t, value: t })),
        },
        {
            columnId: 'status',
            title: 'Status',
            options: ['Active', 'Inactive'].map(s => ({ label: s, value: s })),
        },
    ];
}