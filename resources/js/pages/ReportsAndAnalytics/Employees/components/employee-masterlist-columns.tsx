/* ─────────────────────────────────────────────────────────────
   components/employee-masterlist-columns.tsx
───────────────────────────────────────────────────────────── */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { type DataTableColumnDef } from '@/components/shared/data-table/types/data-table-types';
import {
    type Employee,
    DEPT_COLOR_POOL,
    TYPE_COLORS,
} from '@/pages/ReportsAndAnalytics/Employees/data/employee-report';

/* ── Badge helpers ───────────────────────────────────────────────────────── */
const STATUS_VARIANT: Record<string, 'green' | 'destructive'> = { Active: 'green', Inactive: 'destructive' };
const TYPE_VARIANT:   Record<string, 'outline' | 'default' | 'secondary'> = { Regular: 'default', Casual: 'secondary', 'Job Order': 'outline' };

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>{status}</Badge>;
}
function TypeBadge({ type }: { type: string }) {
    return <Badge variant={TYPE_VARIANT[type] ?? 'secondary'}>{type}</Badge>;
}

/* ── Dept colour ─────────────────────────────────────────────────────────── */
function deptColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_COLOR_POOL[Math.abs(hash) % DEPT_COLOR_POOL.length];
}

/* ── Column definitions ──────────────────────────────────────────────────── */
export const employeeMasterlistColumns: DataTableColumnDef<Employee>[] = [
    {
        accessorKey: 'workId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Work ID" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold text-blue-500">{row.getValue('workId')}</span>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
            const name  = row.getValue<string>('name');
            const color = deptColor(row.original.department);
            return (
                <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                        <AvatarImage src={row.original.avatarUrl ?? undefined} alt={name} />
                        <AvatarFallback className="text-white text-xs font-black" style={{ background: color }}>
                            {name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{name}</span>
                </div>
            );
        },
        /* ── Mobile card: full row in one compact layout ── */
        mobileCard: (row) => {
            const color = deptColor(row.department);
            return (
                <div className="flex items-start gap-3 min-w-0 w-full">
                    <Avatar size="sm" className="shrink-0 mt-0.5">
                        <AvatarImage src={row.avatarUrl ?? undefined} alt={row.name} />
                        <AvatarFallback className="text-white text-xs font-black" style={{ background: color }}>
                            {row.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-bold leading-tight truncate">{row.name}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{row.position}</p>
                                <p className="text-xs text-muted-foreground truncate">{row.department}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-mono text-xs font-bold text-blue-500">{row.workId}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{row.salaryGrade}</p>
                                <p className="text-[11px] text-muted-foreground">{row.dateHired}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <StatusBadge status={row.status} />
                            <TypeBadge   type={row.type} />
                        </div>
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
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue('dateHired')}</span>,
    },
    {
        accessorKey: 'salaryGrade',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salary Grade" />,
        cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue('salaryGrade')}</span>,
    },
];

/* ── Toolbar filter builder ──────────────────────────────────────────────── */
export function buildEmployeeTableFilters(departments: string[]) {
    return [
        {
            columnId: 'department',
            title:    'Department',
            options:  departments.map(d => ({ label: d, value: d })),
        },
        {
            columnId: 'type',
            title:    'Type',
            options:  ['Regular', 'Casual', 'Job Order'].map(t => ({ label: t, value: t })),
        },
        {
            columnId: 'status',
            title:    'Status',
            options:  ['Active', 'Inactive'].map(s => ({ label: s, value: s })),
        },
    ];
}