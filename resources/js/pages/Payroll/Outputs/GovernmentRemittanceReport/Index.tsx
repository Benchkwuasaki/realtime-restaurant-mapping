import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { StatCard as SharedStatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    Printer,
    Calendar,
    Landmark,
    AlertCircle,
    Filter,
    TrendingUp,
    TrendingDown,
    Users,
    Receipt,
    Info,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const printStyles = `
  @media screen {
    .print-only { display: none !important; }
  }

  @media print {
    @page {
      size: landscape;
      margin: 1.5cm;
    }

    html, body, #app, main, [data-page],
    [class*="overflow"], [style*="overflow"] {
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }

    body {
      -webkit-print-color-adjust: #f8f9fa;
      print-color-adjust: #f8f9fa;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
    }

    .no-print,
    .tabs-container,
    .period-selector,
    .export-button,
    .summary-cards-print,
    nav, header, footer,
    [data-radix-ui-dialog-close] {
      display: none !important;
    }

    .print-only {
      display: block !important;
      visibility: visible !important;
      overflow: visible !important;
      height: auto !important;
    }

    .report-main-header {
      text-align: center;
      margin-bottom: 20px;
      page-break-after: avoid;
    }

    .report-header-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .report-logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .report-header-text { text-align: left; }

    .report-main-header h1 {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .report-main-header h2 {
      font-size: 15px;
      font-weight: bold;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }

    .report-main-header .period {
      font-size: 13px;
      font-weight: normal;
      margin: 0;
      color: #333;
    }

    .agency-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 20px 0 15px 0;
      padding: 10px;
      background: #f8f9fa;
      page-break-inside: avoid;
    }

    .agency-header .agency-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .agency-header .agency-details h3 {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 2px 0;
    }

    .agency-header .agency-details .full-name {
      font-size: 12px;
      color: #666;
      margin: 0 0 2px 0;
    }

    .agency-header .agency-details .rate-desc {
      font-size: 11px;
      color: #666;
      margin: 0;
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10px;
      page-break-inside: auto;
      overflow: visible !important;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }

    th {
      background: #f0f0f0;
      font-weight: 600;
      text-align: center;
      padding: 6px 3px;
      border: 1px solid #999;
      font-size: 9px;
      text-transform: uppercase;
    }

    td {
      padding: 4px 3px;
      border: 1px solid #999;
      font-variant-numeric: tabular-nums;
    }

    td:first-child { text-align: center; }
    td:nth-child(5), td:nth-child(6),
    td:nth-child(7), td:nth-child(8) {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    tfoot tr { background: #f8f9fa; font-weight: 600; }
    tfoot td { text-align: right; font-weight: bold; font-variant-numeric: tabular-nums; }
    tfoot td:first-child { text-align: right; }

    .print-agency-section {
      page-break-inside: auto;
      overflow: visible !important;
      height: auto !important;
      margin-bottom: 30px;
    }

    .print-signature {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      width: 100%;
      border-top: 1px dashed #ccc;
      padding-top: 30px;
    }

    .signature-block {
      width: 30%;
      text-align: center;
      page-break-inside: avoid;
    }

    .signature-block p { margin: 5px 0; font-size: 12px; }

    .signature-label {
      font-weight: 600;
      margin-bottom: 10px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .signature-field {
      border-top: 1px solid #000;
      width: 100%;
      margin: 30px 0 5px 0;
    }

    .signature-field + p { font-size: 10px; color: #666; }
    .date-field { margin-top: 10px; font-size: 11px; }
  }
`;

interface Props {
    auth: { user: any };
    periods: Array<{
        id: number;
        label: string;
        start_date: string;
        end_date: string;
    }>;
    selectedPeriod: {
        id: number;
        label: string;
        start_date: string;
        end_date: string;
    } | null;
    remittances: Record<string, AgencyData>;
    currentAgency: string;
    summary: {
        employee_deductions: number;
        employer_payment: number;
        total_remit: number;
        employees_covered: number;
        by_employee_type?: {
            regular: {
                count: number;
                deductions: number;
                employer: number;
                total: number;
            };
            casual: {
                count: number;
                deductions: number;
                employer: number;
                total: number;
            };
        };
    };
    settings: {
        gsis_employee_rate: number;
        gsis_employer_rate: number;
        philhealth_rate: number;
        philhealth_employer_rate: number;
        pagibig_per_payroll: number;
    };
    employeeTypeCounts?: {
        regular: number;
        casual: number;
        total: number;
    };
    currentEmployeeTypeFilter?: string;
}

interface AgencyData {
    agency: string;
    agency_name: string;
    full_name: string;
    tagline: string;
    rate_description: string;
    total_employee_share: number;
    total_employer_share: number;
    total: number;
    logo?: string;
    employees: Array<{
        id: number;
        name: string;
        position: string;
        classification: string;
        basic_pay: number;
        employee_share: number;
        employer_share: number;
        subtotal: number;
        employee_type?: string;
    }>;
    employee_count?: number;
    regular_count?: number;
    casual_count?: number;
    regular_totals?: {
        employee: number;
        employer: number;
        total: number;
    };
    casual_totals?: {
        employee: number;
        employer: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    {
        title: 'Government Remittance Report',
        href: route('governmentremittancereport.index'),
    },
];

const AGENCY_COLORS: Record<string, string> = {
    gsis: 'bg-blue-600',
    philhealth: 'bg-green-600',
    pagibig: 'bg-red-600',
    bir: 'bg-purple-600',
};

const AGENCY_LOGOS: Record<string, string> = {
    gsis: '/images/gsis.png',
    philhealth: '/images/philhealth.png',
    pagibig: '/images/pagibig.png',
    bir: '/images/bir.png',
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

// Local wrapper — lets us pass formatted currency strings without touching the
// shared StatCard component (which expects value: number).
function StatCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number | string;
    description?: string;
    icon: React.ReactNode;
}) {
    return (
        <SharedStatCard
            title={title}
            value={typeof value === 'number' ? value : (value as any)}
            description={description}
            icon={icon}
        />
    );
}

interface AgencyTableProps {
    agencyId: string;
    agencyData: AgencyData;
    onEmployeeClick?: (employee: any, agencyId: string) => void;
    isPrintView?: boolean;
    employeeTypeFilter?: string;
}

function AgencyTable({
    agencyId,
    agencyData,
    onEmployeeClick,
    isPrintView = false,
    employeeTypeFilter = 'all',
}: AgencyTableProps) {
    const color = AGENCY_COLORS[agencyId] || 'bg-gray-600';
    const logo = AGENCY_LOGOS[agencyId];
    const employees = agencyData.employees || [];

    const filteredEmployees = useMemo(() => {
        if (employeeTypeFilter === 'all' || isPrintView) return employees;
        return employees.filter(
            (emp) => (emp as any).employee_type === employeeTypeFilter,
        );
    }, [employees, employeeTypeFilter, isPrintView]);

    const totals = filteredEmployees.reduce(
        (acc, row) => ({
            employee: acc.employee + row.employee_share,
            employer: acc.employer + row.employer_share,
            subtotal: acc.subtotal + row.subtotal,
        }),
        { employee: 0, employer: 0, subtotal: 0 },
    );

    if (isPrintView) {
        const regularEmployees = employees.filter(
            (emp) => (emp as any).employee_type === 'regular',
        );
        const casualEmployees = employees.filter(
            (emp) => (emp as any).employee_type === 'casual',
        );

        return (
            <div className="print-agency-section">
                <div className="agency-header">
                    {logo && (
                        <img
                            src={logo}
                            alt={agencyData.agency_name}
                            className="agency-logo"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    )}
                    <div className="agency-details">
                        <h3>{agencyData.agency_name}</h3>
                        <p className="full-name">{agencyData.full_name}</p>
                        <p className="rate-desc">
                            {agencyData.rate_description}
                        </p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>EMPLOYEE NAME</th>
                            <th>POSITION</th>
                            <th>CLASSIFICATION</th>
                            <th>BASIC PAY</th>
                            <th>EMPLOYEE SHARE</th>
                            <th>EMPLOYER SHARE</th>
                            <th>SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {regularEmployees.length > 0 && (
                            <>
                                <tr style={{ backgroundColor: '#e5f6e5' }}>
                                    <td
                                        colSpan={8}
                                        style={{
                                            textAlign: 'left',
                                            fontWeight: 'bold',
                                            padding: '8px',
                                            borderBottom: '2px solid #2e7d32',
                                        }}
                                    >
                                        REGULAR EMPLOYEES (
                                        {regularEmployees.length})
                                    </td>
                                </tr>
                                {regularEmployees.map((row, index) => (
                                    <tr key={row.id}>
                                        <td>{index + 1}</td>
                                        <td>{row.name}</td>
                                        <td>{row.position}</td>
                                        <td>
                                            <span
                                                style={{
                                                    backgroundColor: '#e5f6e5',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {row.classification}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(row.basic_pay)}</td>
                                        <td>
                                            {formatCurrency(row.employee_share)}
                                        </td>
                                        <td>
                                            {formatCurrency(row.employer_share)}
                                        </td>
                                        <td>{formatCurrency(row.subtotal)}</td>
                                    </tr>
                                ))}
                            </>
                        )}

                        {casualEmployees.length > 0 && (
                            <>
                                <tr style={{ backgroundColor: '#fff3e0' }}>
                                    <td
                                        colSpan={8}
                                        style={{
                                            textAlign: 'left',
                                            fontWeight: 'bold',
                                            padding: '8px',
                                            borderTop: '2px solid #999',
                                            borderBottom: '2px solid #ed6c02',
                                        }}
                                    >
                                        CASUAL EMPLOYEES (
                                        {casualEmployees.length})
                                    </td>
                                </tr>
                                {casualEmployees.map((row, index) => (
                                    <tr key={row.id}>
                                        <td>
                                            {regularEmployees.length +
                                                index +
                                                1}
                                        </td>
                                        <td>{row.name}</td>
                                        <td>{row.position}</td>
                                        <td>
                                            <span
                                                style={{
                                                    backgroundColor: '#fff3e0',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {row.classification}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(row.basic_pay)}</td>
                                        <td>
                                            {formatCurrency(row.employee_share)}
                                        </td>
                                        <td>
                                            {formatCurrency(row.employer_share)}
                                        </td>
                                        <td>{formatCurrency(row.subtotal)}</td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td
                                colSpan={5}
                                style={{
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                }}
                            >
                                TOTAL:
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                                {formatCurrency(totals.employee)}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                                {formatCurrency(totals.employer)}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                                {formatCurrency(totals.subtotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    }

    return (
        <Card className="card mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`${
                                agencyId === 'philhealth'
                                    ? 'h-16 w-16'
                                    : 'h-14 w-14'
                            } flex items-center justify-center overflow-hidden rounded-lg border bg-muted`}
                        >
                            {logo ? (
                                <img
                                    src={logo}
                                    alt={agencyData.agency_name}
                                    className="h-full w-full object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div
                                    className={`h-full w-full ${color} bg-opacity-10 flex items-center justify-center`}
                                >
                                    <Landmark
                                        className={`h-6 w-6 ${color.replace('bg-', 'text-')}`}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {agencyData.agency_name}
                            </CardTitle>
                            {agencyData.tagline && (
                                <p className="text-sm text-muted-foreground italic">
                                    {agencyData.tagline}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {agencyData.full_name}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            TOTAL TO REMIT
                        </p>
                        <p className="text-2xl font-bold tabular-nums">
                            {formatCurrency(agencyData.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {agencyData.rate_description}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead className="text-right">
                                Basic Pay (Monthly)
                            </TableHead>
                            <TableHead className="text-right">
                                Employee Share (Monthly)
                            </TableHead>
                            <TableHead className="text-right">
                                Employer Share (Monthly)
                            </TableHead>
                            <TableHead className="text-right">
                                Subtotal
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    No data available for this agency
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer transition-colors hover:bg-muted/40"
                                    onClick={() =>
                                        onEmployeeClick?.(row, agencyId)
                                    }
                                >
                                    <TableCell className="font-medium text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{row.position}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                (row as any).employee_type ===
                                                'regular'
                                                    ? 'border-green-200 bg-green-50 text-green-700'
                                                    : (row as any)
                                                            .employee_type ===
                                                        'casual'
                                                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                      : 'border-blue-200 bg-blue-50 text-blue-700'
                                            }
                                        >
                                            {row.classification}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatCurrency(row.basic_pay)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatCurrency(row.employee_share)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatCurrency(row.employer_share)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {formatCurrency(row.subtotal)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {filteredEmployees.length > 0 && (
                        <tfoot>
                            <TableRow className="bg-muted/50">
                                <TableCell
                                    colSpan={5}
                                    className="text-right font-bold"
                                >
                                    TOTAL:
                                </TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    {formatCurrency(totals.employee)}
                                </TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    {formatCurrency(totals.employer)}
                                </TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    {formatCurrency(totals.subtotal)}
                                </TableCell>
                            </TableRow>
                        </tfoot>
                    )}
                </Table>
            </CardContent>
        </Card>
    );
}

interface SignatureSectionProps {
    isPrintView?: boolean;
    userName?: string;
    preparedDate?: string;
}

function SignatureSection({
    isPrintView = false,
    userName = 'Admin User',
    preparedDate = '',
}: SignatureSectionProps) {
    if (isPrintView) {
        return (
            <div className="print-signature">
                <div className="signature-block">
                    <p className="signature-label">PREPARED BY:</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', margin: '30px 0 0 0' }}>{userName}</p>
                    <div style={{ borderTop: '1px solid #000', width: '100%', margin: '2px 0 5px 0' }} />
                    <p style={{ fontSize: '10px', color: '#666' }}>Signature over Printed Name</p>
                    <p className="date-field">Date: {preparedDate}</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">REVIEWED BY:</p>
                    <p style={{ fontSize: '12px', margin: '30px 0 0 0', visibility: 'hidden' }}>placeholder</p>
                    <div style={{ borderTop: '1px solid #000', width: '100%', margin: '2px 0 5px 0' }} />
                    <p style={{ fontSize: '10px', color: '#666' }}>Signature over Printed Name</p>
                    <p className="date-field">Date: _______________</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">APPROVED BY:</p>
                    <p style={{ fontSize: '12px', margin: '30px 0 0 0', visibility: 'hidden' }}>placeholder</p>
                    <div style={{ borderTop: '1px solid #000', width: '100%', margin: '2px 0 5px 0' }} />
                    <p style={{ fontSize: '10px', color: '#666' }}>Signature over Printed Name</p>
                    <p className="date-field">Date: _______________</p>
                </div>
            </div>
        );
    }

    return (
        <div className="no-print mt-10">
            <Separator className="mb-8" />
            <div className="grid grid-cols-3 gap-8">
                {[
                    { label: 'Prepared by', name: userName, showDate: true },
                    { label: 'Reviewed by', name: '', showDate: false },
                    { label: 'Approved by', name: '', showDate: false },
                ].map(({ label, name, showDate }) => (
                    <div key={label} className="flex flex-col">
                        <p className="text-sm font-semibold text-foreground mb-6">
                            {label}:
                        </p>
                        <div className="flex-1" />
                        {name && (
                            <p className="text-sm font-medium text-foreground mb-0.5">
                                {name}
                            </p>
                        )}
                        <div style={{ borderTop: '1.5px solid #000' }} className="w-full" />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Signature over Printed Name
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Date: {showDate ? preparedDate : '_______________'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function GovernmentRemittanceReport({
    auth,
    periods,
    selectedPeriod,
    remittances,
    currentAgency,
    summary,
    settings,
    employeeTypeCounts = { regular: 0, casual: 0, total: 0 },
    currentEmployeeTypeFilter = 'all',
}: Props) {
    const [activeTab, setActiveTab] = useState(currentAgency || 'all');
    const [exportError, setExportError] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<{
        id: number;
        name: string;
        agency: string;
        basicPay: number;
        employeeShare: number;
        employerShare: number;
        subtotal: number;
        position: string;
        classification: string;
        employee_type?: string;
    } | null>(null);
    const [employeeTypeFilter, setEmployeeTypeFilter] = useState(
        currentEmployeeTypeFilter,
    );

    useEffect(() => {
        setEmployeeTypeFilter(currentEmployeeTypeFilter);
    }, [currentEmployeeTypeFilter]);

    // ── CHANGE: deduplicate by monthLabel instead of id ──────────────────────
    const monthPeriods = useMemo(() => {
        const seen = new Set<string>();
        return periods
            .filter((p) => {
                const label = new Date(
                    p.end_date + 'T00:00:00',
                ).toLocaleDateString('en-PH', {
                    month: 'long',
                    year: 'numeric',
                });
                if (seen.has(label)) return false;
                seen.add(label);
                return true;
            })
            .map((p) => ({
                ...p,
                monthLabel: new Date(
                    p.end_date + 'T00:00:00',
                ).toLocaleDateString('en-PH', {
                    month: 'long',
                    year: 'numeric',
                }),
            }));
    }, [periods]);

    const handlePeriodChange = (periodId: string) => {
        const period = monthPeriods.find((p) => p.id.toString() === periodId);
        if (period) {
            setEmployeeTypeFilter('all');
            router.get(
                route('governmentremittancereport.index', {
                    period_id: period.id,
                    agency: activeTab,
                    employee_type: 'all',
                }),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (selectedPeriod) {
            router.get(
                route('governmentremittancereport.index', {
                    period_id: selectedPeriod.id,
                    agency: value,
                    employee_type: employeeTypeFilter,
                }),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }
    };

    const handleEmployeeTypeFilter = (type: string) => {
        setEmployeeTypeFilter(type);
        if (selectedPeriod) {
            router.get(
                route('governmentremittancereport.index', {
                    period_id: selectedPeriod.id,
                    agency: activeTab,
                    employee_type: type,
                }),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }
    };

    const handleEmployeeClick = (employee: any, agencyId: string) => {
        setSelectedEmployee({
            id: employee.id,
            name: employee.name,
            agency: agencyId,
            basicPay: employee.basic_pay,
            employeeShare: employee.employee_share,
            employerShare: employee.employer_share,
            subtotal: employee.subtotal,
            position: employee.position,
            classification: employee.classification,
            employee_type: (employee as any).employee_type,
        });
    };

    const handleExport = () => {
        if (!selectedPeriod) {
            setExportError('Please select a payroll period before exporting.');
            setTimeout(() => setExportError(''), 3000);
            return;
        }
        window.print();
    };

    const dateGenerated =
        new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) +
        ' ' +
        new Date().toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
        });

    const preparedDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hasSelectedPeriod = selectedPeriod !== null;

    const monthLabel = selectedPeriod
        ? new Date(selectedPeriod.end_date + 'T00:00:00').toLocaleDateString(
              'en-PH',
              {
                  month: 'long',
                  year: 'numeric',
              },
          )
        : '';

    const getCurrentSummary = () => {
        if (!hasSelectedPeriod)
            return {
                employee_deductions: 0,
                employer_payment: 0,
                total_remit: 0,
                employees_covered: 0,
            };
        if (activeTab === 'all') return summary;
        const d = remittances[activeTab];
        if (d)
            return {
                employee_deductions: d.total_employee_share,
                employer_payment: d.total_employer_share,
                total_remit: d.total,
                employees_covered: d.employees?.length || 0,
            };
        return {
            employee_deductions: 0,
            employer_payment: 0,
            total_remit: 0,
            employees_covered: 0,
        };
    };

    const currentSummary = getCurrentSummary();

    const getAgencyDisplayName = (agency: string) =>
        ({
            gsis: 'GSIS',
            philhealth: 'PhilHealth',
            pagibig: 'Pag-IBIG',
            bir: 'BIR',
        })[agency] ?? agency;

    const getRateDescription = (agency: string) =>
        ({
            gsis: `${settings.gsis_employee_rate}% Employee / ${settings.gsis_employer_rate}% Employer`,
            philhealth: `${settings.philhealth_rate}% Employee / ${settings.philhealth_employer_rate}% Employer`,
            pagibig: `₱${settings.pagibig_per_payroll?.toFixed(2) ?? '50.00'} Employee / ₱${settings.pagibig_per_payroll?.toFixed(2) ?? '50.00'} Employer per payroll`,
            bir: 'Withholding Tax',
        })[agency] ?? '';

    const activeAgenciesForPrint = (
        ['gsis', 'philhealth', 'pagibig'] as const
    ).filter((id) => (remittances[id]?.employees?.length ?? 0) > 0);

    const hasBothEmployeeTypes =
        (employeeTypeCounts?.regular || 0) > 0 &&
        (employeeTypeCounts?.casual || 0) > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Remittance Report" />
            <style>{printStyles}</style>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="no-print flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Government Remittance Report
                    </h1>
                    <Button
                        variant="default"
                        onClick={handleExport}
                        disabled={!hasSelectedPeriod}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>

                {exportError && (
                    <div className="no-print flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <p className="text-base text-gray-800">{exportError}</p>
                    </div>
                )}

                <div className="no-print flex flex-col gap-4">
                    <div className="period-selector flex items-center gap-4">
                        <Select
                            value={selectedPeriod?.id?.toString() || ''}
                            onValueChange={handlePeriodChange}
                        >
                            <SelectTrigger className="w-[220px]">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select a month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthPeriods.map((period) => (
                                    <SelectItem
                                        key={period.id}
                                        value={period.id.toString()}
                                    >
                                        {period.monthLabel}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {hasSelectedPeriod && hasBothEmployeeTypes && (
                            <div className="ml-2 flex items-center gap-3">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Filter className="h-3.5 w-3.5" />
                                    <span>Show:</span>
                                </div>
                                <div className="flex gap-1">
                                    {(['all', 'regular', 'casual'] as const).map((type) => (
                                        <Button
                                            key={type}
                                            size="sm"
                                            variant={employeeTypeFilter === type ? 'secondary' : 'ghost'}
                                            onClick={() => handleEmployeeTypeFilter(type)}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Card className="no-print">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                    <img
                                        src="/images/logo.svg"
                                        alt="Metro Kidapawan Water District Logo"
                                        className="h-full w-full object-contain p-2"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Metro Kidapawan Water District
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Government Contribution Remittance
                                        Report
                                    </p>
                                    <p className="mt-1 text-sm">
                                        Payroll Period:{' '}
                                        <span className="font-medium">
                                            {monthLabel || 'No period selected'}
                                        </span>
                                    </p>
                                    {hasSelectedPeriod &&
                                        employeeTypeFilter !== 'all' && (
                                            <p className="mt-1 text-sm">
                                                Employee Type:{' '}
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        employeeTypeFilter ===
                                                        'regular'
                                                            ? 'border-green-200 bg-green-50 text-green-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }
                                                >
                                                    {employeeTypeFilter ===
                                                    'regular'
                                                        ? 'Regular Only'
                                                        : 'Casual Only'}
                                                </Badge>
                                            </p>
                                        )}
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <p>Date Generated: {dateGenerated}</p>
                                <p>
                                    Generated by:{' '}
                                    {auth.user?.name || 'Admin User'}
                                </p>
                                <p>
                                    Document Reference No. GR-
                                    {selectedPeriod?.id || '0000'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!hasSelectedPeriod ? (
                    <Card className="no-print border border-dashed py-16">
                        <CardContent className="text-center">
                            <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
                            <p className="mb-2 text-xl font-medium text-muted-foreground">
                                No Payroll Period Selected
                            </p>
                            <p className="mb-6 text-muted-foreground">
                                Please select a payroll period from the dropdown
                                above to view remittance data.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const btn = document.querySelector(
                                        'button[role="combobox"]',
                                    );
                                    if (btn) (btn as HTMLButtonElement).click();
                                }}
                                className="gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Select Period
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="no-print grid grid-cols-1 gap-4 md:grid-cols-4">
                            <StatCard
                                icon={<TrendingDown className="h-4 w-4" />}
                                title={
                                    activeTab === 'all'
                                        ? 'Total Employee Deductions'
                                        : `${remittances[activeTab]?.agency_name} Employee Share`
                                }
                                value={formatCurrency(currentSummary.employee_deductions)}
                                description={`Monthly — ${monthLabel}`}
                            />
                            <StatCard
                                icon={<TrendingUp className="h-4 w-4" />}
                                title={
                                    activeTab === 'all'
                                        ? 'Total Employer Payment'
                                        : `${remittances[activeTab]?.agency_name} Employer Share`
                                }
                                value={formatCurrency(currentSummary.employer_payment)}
                                description={`Monthly — ${monthLabel}`}
                            />
                            <StatCard
                                icon={<Receipt className="h-4 w-4" />}
                                title={
                                    activeTab === 'all'
                                        ? 'Total Remittance'
                                        : `${remittances[activeTab]?.agency_name} Total`
                                }
                                value={formatCurrency(currentSummary.total_remit)}
                                description={`Monthly — ${monthLabel}`}
                            />
                            <StatCard
                                icon={<Users className="h-4 w-4" />}
                                title="Employees Covered"
                                value={currentSummary.employees_covered}
                                description={monthLabel}
                            />
                        </div>

                        <Tabs
                            value={activeTab}
                            onValueChange={handleTabChange}
                            className="no-print tabs-container w-full"
                        >
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="all">
                                    All Agencies
                                </TabsTrigger>
                                <TabsTrigger value="gsis">GSIS</TabsTrigger>
                                <TabsTrigger value="philhealth">
                                    PhilHealth
                                </TabsTrigger>
                                <TabsTrigger value="pagibig">
                                    Pag-IBIG
                                </TabsTrigger>
                                <TabsTrigger value="bir">BIR</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="mt-6">
                                {remittances.gsis?.employees?.length > 0 && (
                                    <AgencyTable
                                        agencyId="gsis"
                                        agencyData={remittances.gsis}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                )}
                                {remittances.philhealth?.employees?.length >
                                    0 && (
                                    <AgencyTable
                                        agencyId="philhealth"
                                        agencyData={remittances.philhealth}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                )}
                                {remittances.pagibig?.employees?.length > 0 && (
                                    <AgencyTable
                                        agencyId="pagibig"
                                        agencyData={remittances.pagibig}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                )}
                                {!remittances.gsis?.employees?.length &&
                                    !remittances.philhealth?.employees
                                        ?.length &&
                                    !remittances.pagibig?.employees?.length && (
                                        <Card>
                                            <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                                <p className="text-lg font-medium">
                                                    No remittance data available
                                                </p>
                                                <p className="text-sm">
                                                    There are no government
                                                    contribution records for
                                                    this period.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                <SignatureSection
                                    userName={auth.user?.name || 'Admin User'} preparedDate={preparedDate}
                                />
                            </TabsContent>

                            <TabsContent value="gsis" className="mt-6">
                                {remittances.gsis?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="gsis"
                                        agencyData={remittances.gsis}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                            <p className="text-lg font-medium">
                                                No GSIS Data
                                            </p>
                                            <p className="text-sm">
                                                There are no GSIS contribution
                                                records for this period.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                                <SignatureSection
                                    userName={auth.user?.name || 'Admin User'} preparedDate={preparedDate}
                                />
                            </TabsContent>

                            <TabsContent value="philhealth" className="mt-6">
                                {remittances.philhealth?.employees?.length >
                                0 ? (
                                    <AgencyTable
                                        agencyId="philhealth"
                                        agencyData={remittances.philhealth}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                            <p className="text-lg font-medium">
                                                No PhilHealth Data
                                            </p>
                                            <p className="text-sm">
                                                There are no PhilHealth
                                                contribution records for this
                                                period.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                                <SignatureSection
                                    userName={auth.user?.name || 'Admin User'} preparedDate={preparedDate}
                                />
                            </TabsContent>

                            <TabsContent value="pagibig" className="mt-6">
                                {remittances.pagibig?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="pagibig"
                                        agencyData={remittances.pagibig}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                            <p className="text-lg font-medium">
                                                No Pag-IBIG Data
                                            </p>
                                            <p className="text-sm">
                                                There are no Pag-IBIG
                                                contribution records for this
                                                period.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                                <SignatureSection
                                    userName={auth.user?.name || 'Admin User'} preparedDate={preparedDate}
                                />
                            </TabsContent>

                            <TabsContent value="bir" className="mt-6">
                                {remittances.bir?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="bir"
                                        agencyData={remittances.bir}
                                        onEmployeeClick={handleEmployeeClick}
                                        employeeTypeFilter={employeeTypeFilter}
                                    />
                                ) : (
                                    <Card className="border-purple-200 bg-purple-50/30">
                                        <CardContent className="py-12 pt-12 text-center">
                                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                                                <Landmark className="h-10 w-10 text-purple-600" />
                                            </div>
                                            <p className="mb-2 text-2xl font-semibold text-purple-800">
                                                BIR (Tax) Remittance
                                            </p>
                                            <p className="mb-4 text-purple-600">
                                                Coming Soon
                                            </p>
                                            <p className="mx-auto max-w-md rounded-lg border border-purple-200 bg-white/50 p-4 text-sm text-muted-foreground">
                                                The BIR withholding tax
                                                remittance module is currently
                                                under development. This feature
                                                will allow you to generate and
                                                manage tax remittance reports
                                                for all employees.
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="mt-6 border-purple-300 bg-purple-100 px-4 py-1 text-purple-700"
                                            >
                                                Expected Release: Q2 2026
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                )}
                                <SignatureSection
                                    userName={auth.user?.name || 'Admin User'} preparedDate={preparedDate}
                                />
                            </TabsContent>
                        </Tabs>

                        <div className="print-only">
                            <div className="report-main-header">
                                <div className="report-header-inner">
                                    <img
                                        src="/images/logo.svg"
                                        alt="Metro Kidapawan Water District"
                                        className="report-logo"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                    <div className="report-header-text">
                                        <h1>METRO KIDAPAWAN WATER DISTRICT</h1>
                                        <h2>
                                            GOVERNMENT CONTRIBUTION REMITTANCE
                                            REPORT
                                        </h2>
                                        <p className="period">
                                            {selectedPeriod?.label || ''} —{' '}
                                            {activeTab === 'all'
                                                ? 'All Agencies'
                                                : getAgencyDisplayName(
                                                      activeTab,
                                                  )}
                                        </p>
                                        <p
                                            className="period"
                                            style={{
                                                fontSize: '11px',
                                                marginTop: '4px',
                                                color: '#555',
                                            }}
                                        >
                                            Monthly contributions for{' '}
                                            {monthLabel} (1st &amp; 2nd cut-off
                                            combined)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {activeTab !== 'all' && remittances[activeTab] && (
                                <>
                                    <AgencyTable
                                        agencyId={activeTab}
                                        agencyData={remittances[activeTab]}
                                        isPrintView={true}
                                    />
                                    <SignatureSection
                                        isPrintView={true}
                                        preparedDate={preparedDate}
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                    />
                                </>
                            )}

                            {activeTab === 'all' && (
                                <>
                                    {activeAgenciesForPrint.map((id, i) => (
                                        <div
                                            key={id}
                                            style={
                                                i > 0
                                                    ? {
                                                          pageBreakBefore:
                                                              'always',
                                                          breakBefore: 'always',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <AgencyTable
                                                agencyId={id}
                                                agencyData={remittances[id]}
                                                isPrintView={true}
                                            />
                                        </div>
                                    ))}
                                    <SignatureSection
                                        isPrintView={true}
                                        preparedDate={preparedDate}
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}

                {selectedEmployee && (
                    <Dialog
                        open={true}
                        onOpenChange={() => setSelectedEmployee(null)}
                    >
                        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
                            {/* Header */}
                            <DialogHeader className="border-b px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-base font-semibold">
                                        {selectedEmployee.name}
                                    </DialogTitle>
                                    <Badge
                                        variant="outline"
                                        className={
                                            selectedEmployee.employee_type === 'regular'
                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                        }
                                    >
                                        {selectedEmployee.employee_type ?? selectedEmployee.classification}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {selectedEmployee.position}
                                </p>
                            </DialogHeader>

                            <div className="grid grid-cols-2 divide-x">
                                {/* Left — Employee & Earnings */}
                                <div className="p-6 space-y-4">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Details
                                    </p>
                                    {[
                                        { label: 'Employee ID', value: String(selectedEmployee.id) },
                                        { label: 'Position', value: selectedEmployee.position },
                                        { label: 'Basic Pay (Monthly)', value: formatCurrency(selectedEmployee.basicPay) },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                            <span className="text-sm text-muted-foreground">{label}</span>
                                            <span className="text-sm font-medium text-foreground tabular-nums">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Right — Contribution */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {getAgencyDisplayName(selectedEmployee.agency)} Contribution
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {getRateDescription(selectedEmployee.agency)}
                                        </span>
                                    </div>
                                    {[
                                        { label: 'Employee Share', sub: 'deducted from salary', value: formatCurrency(selectedEmployee.employeeShare) },
                                        { label: 'Employer Share', sub: 'company contribution', value: formatCurrency(selectedEmployee.employerShare) },
                                    ].map(({ label, sub, value }) => (
                                        <div key={label} className="flex items-center justify-between py-2 border-b border-border/50">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{label}</p>
                                                <p className="text-xs text-muted-foreground">{sub}</p>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums">{value}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Total</p>
                                            <p className="text-xs text-muted-foreground">employee + employer</p>
                                        </div>
                                        <span className="text-base font-bold tabular-nums">
                                            {formatCurrency(selectedEmployee.subtotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="border-t bg-muted/20 px-6 py-3">
                                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                                    <span>Payroll Period: {selectedPeriod?.label || 'N/A'}</span>
                                    <span className="font-medium">
                                        {getAgencyDisplayName(selectedEmployee.agency)} Remittance
                                    </span>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}