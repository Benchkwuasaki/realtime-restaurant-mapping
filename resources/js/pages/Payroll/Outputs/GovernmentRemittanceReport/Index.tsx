// Government Remittance Index.tsx

import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { StatCard as SharedStatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import {
    useRemittanceColumns,
    type RemittanceEmployee,
} from '@/components/Payroll/Outputs/GovernmentRemittance/components/columns';
import RF1PrintView, {
    type RF1Employee,
    type RF1EmployerInfo,
} from './RF1PrintView';

// ── Print Styles ──────────────────────────────────────────────────────────────

const printStyles = `
  @media screen {
    .print-only { display: none !important; }
    .rf1-print-only { display: none !important; }
  }

  @media print {
    /* ── Mode: remittance (default) ── */
    body[data-print-mode="remittance"] .print-only,
    body:not([data-print-mode="rf1"]) .print-only {
      display: block !important;
      visibility: visible !important;
    }
    body[data-print-mode="rf1"] .print-only { display: none !important; }

    /* ── Mode: RF-1 ── */
    body[data-print-mode="rf1"] .rf1-print-only {
      display: block !important;
      visibility: visible !important;
      overflow: visible !important;
      height: auto !important;
    }
    body:not([data-print-mode="rf1"]) .rf1-print-only { display: none !important; }

    @page {
  size: landscape;
  margin: 0 0 1.2cm 0;
}

@page {
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 9px;
    color: #666;
    padding-right: 1.5cm;
  }
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
  padding: 1cm 1.5cm;
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
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

    .report-header-text { text-align: left; }

 .report-main-header h1 {
  font-size: 9px;
  font-weight: bold;
  margin: 0 0 2px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.report-main-header h2 {
  font-size: 8px;
  font-weight: bold;
  margin: 0 0 2px 0;
  text-transform: uppercase;
}

.report-main-header .period {
  font-size: 8px;
  font-weight: normal;
  margin: 0;
  color: #333;
}

.report-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
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
    html, body {
      height: auto !important;
      overflow: visible !important;
    }

    .print-agency-section:last-of-type {
      page-break-after: avoid !important;
    }

    .print-signature {
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

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
    employeeTypeCounts?: { regular: number; casual: number; total: number };
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
        // RF-1 fields — already returned by the backend
        last_name?: string;
        first_name?: string;
        middle_name?: string;
        name_ext?: string;
        date_of_birth?: string;
        sex?: string;
        philhealth_number?: string;
    }>;
    employee_count?: number;
    regular_count?: number;
    casual_count?: number;
    regular_totals?: { employee: number; employer: number; total: number };
    casual_totals?: { employee: number; employer: number; total: number };
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const EMPLOYEE_TYPE_FILTER_OPTIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'casual', label: 'Casual' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

// ── Local StatCard Wrapper ────────────────────────────────────────────────────

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

// ── Agency DataTable Card ─────────────────────────────────────────────────────

interface AgencyDataTableCardProps {
    agencyId: string;
    agencyData: AgencyData;
    onEmployeeClick?: (employee: any, agencyId: string) => void;
    employeeTypeFilter?: string;
}

function AgencyDataTableCard({
    agencyId,
    agencyData,
    onEmployeeClick,
    employeeTypeFilter = 'all',
}: AgencyDataTableCardProps) {
    const color = AGENCY_COLORS[agencyId] || 'bg-gray-600';
    const logo = AGENCY_LOGOS[agencyId];
    const employees = agencyData.employees || [];

    const filteredEmployees = useMemo((): RemittanceEmployee[] => {
        const base =
            employeeTypeFilter === 'all'
                ? employees
                : employees.filter(
                      (emp) =>
                          (emp as any).employee_type === employeeTypeFilter,
                  );
        return base as RemittanceEmployee[];
    }, [employees, employeeTypeFilter]);

    const totals = filteredEmployees.reduce(
        (acc, row) => ({
            employee: acc.employee + row.employee_share,
            employer: acc.employer + row.employer_share,
            subtotal: acc.subtotal + row.subtotal,
        }),
        { employee: 0, employer: 0, subtotal: 0 },
    );

    const columns = useRemittanceColumns({
        agencyId,
        onEmployeeClick,
    });

    return (
        <Card className="mb-6 border border-secondary">
            {/* Agency Header */}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`${
                                agencyId === 'philhealth'
                                    ? 'h-16 w-16'
                                    : 'h-14 w-14'
                            } flex items-center justify-center`}
                        >
                            {logo ? (
                                <img
                                    src={logo}
                                    alt={agencyData.agency_name}
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div
                                    className={`${color} bg-opacity-10 flex h-full w-full items-center justify-center`}
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

            <section className="gap-6 p-6">
                <DataTable
                    data={filteredEmployees}
                    columns={columns}
                    getRowId={(row) => String(row.id)}
                    searchColumnId="name"
                    searchPlaceholder="Search employees..."
                    filters={[
                        {
                            columnId: 'employee_type',
                            title: 'Type',
                            options: EMPLOYEE_TYPE_FILTER_OPTIONS,
                        },
                    ]}
                />
            </section>

            {filteredEmployees.length > 0 && (
                <div className="gap-6 border-t border-secondary pt-8 pr-8">
                    <div className="flex items-center justify-end gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                Employee Share:
                            </span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(totals.employee)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                Employer Share:
                            </span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(totals.employer)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 border-l pl-6">
                            <span className="font-semibold text-muted-foreground">
                                Total:
                            </span>
                            <span className="text-base font-bold tabular-nums">
                                {formatCurrency(totals.subtotal)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

// ── Agency Print Table (unchanged) ────────────────────────────────────────────

interface AgencyPrintTableProps {
    agencyId: string;
    agencyData: AgencyData;
}

function AgencyPrintTable({ agencyId, agencyData }: AgencyPrintTableProps) {
    const logo = AGENCY_LOGOS[agencyId];
    const employees = agencyData.employees || [];

    const regularEmployees = employees.filter(
        (emp) => (emp as any).employee_type === 'regular',
    );
    const casualEmployees = employees.filter(
        (emp) => (emp as any).employee_type === 'casual',
    );

    const totals = employees.reduce(
        (acc, row) => ({
            employee: acc.employee + row.employee_share,
            employer: acc.employer + row.employer_share,
            subtotal: acc.subtotal + row.subtotal,
        }),
        { employee: 0, employer: 0, subtotal: 0 },
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
                    <p className="rate-desc">{agencyData.rate_description}</p>
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
                            <tr>
                                <td
                                    colSpan={8}
                                    style={{
                                        textAlign: 'left',
                                        fontWeight: 'bold',
                                        padding: '8px',
                                        borderBottom: '1px solid #999',
                                    }}
                                >
                                    REGULAR EMPLOYEES ({regularEmployees.length}
                                    )
                                </td>
                            </tr>
                            {regularEmployees.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{index + 1}</td>
                                    <td>{row.name}</td>
                                    <td>{row.position}</td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {row.classification}
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
                            <tr>
                                <td
                                    colSpan={8}
                                    style={{
                                        textAlign: 'left',
                                        fontWeight: 'bold',
                                        padding: '8px',
                                        borderTop: '1px solid #999',
                                        borderBottom: '1px solid #999',
                                    }}
                                >
                                    CASUAL EMPLOYEES ({casualEmployees.length})
                                </td>
                            </tr>
                            {casualEmployees.map((row, index) => (
                                <tr key={row.id}>
                                    <td>
                                        {regularEmployees.length + index + 1}
                                    </td>
                                    <td>{row.name}</td>
                                    <td>{row.position}</td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {row.classification}
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
                            style={{ textAlign: 'right', fontWeight: 'bold' }}
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

// ── Signature Section (unchanged) ─────────────────────────────────────────────

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
                    <p
                        style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            margin: '30px 0 0 0',
                        }}
                    >
                        {userName}
                    </p>
                    <div
                        style={{
                            borderTop: '1px solid #000',
                            width: '100%',
                            margin: '2px 0 5px 0',
                        }}
                    />
                    <p style={{ fontSize: '10px', color: '#666' }}>
                        Signature over Printed Name
                    </p>
                    <p className="date-field">Date: {preparedDate}</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">REVIEWED BY:</p>
                    <p
                        style={{
                            fontSize: '12px',
                            margin: '30px 0 0 0',
                            visibility: 'hidden',
                        }}
                    >
                        placeholder
                    </p>
                    <div
                        style={{
                            borderTop: '1px solid #000',
                            width: '100%',
                            margin: '2px 0 5px 0',
                        }}
                    />
                    <p style={{ fontSize: '10px', color: '#666' }}>
                        Signature over Printed Name
                    </p>
                    <p className="date-field">Date: _______________</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">APPROVED BY:</p>
                    <p
                        style={{
                            fontSize: '12px',
                            margin: '30px 0 0 0',
                            visibility: 'hidden',
                        }}
                    >
                        placeholder
                    </p>
                    <div
                        style={{
                            borderTop: '1px solid #000',
                            width: '100%',
                            margin: '2px 0 5px 0',
                        }}
                    />
                    <p style={{ fontSize: '10px', color: '#666' }}>
                        Signature over Printed Name
                    </p>
                    <p className="date-field">Date: _______________</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-10">
            <Separator className="mb-8" />
            <div className="grid grid-cols-3 gap-8">
                {[
                    { label: 'Prepared by', name: userName, showDate: true },
                    { label: 'Reviewed by', name: '', showDate: false },
                    { label: 'Approved by', name: '', showDate: false },
                ].map(({ label, name, showDate }) => (
                    <div key={label} className="flex flex-col">
                        <p className="mb-6 text-sm font-semibold text-foreground">
                            {label}:
                        </p>
                        <div className="flex-1" />
                        {name && (
                            <p className="mb-0.5 text-sm font-medium text-foreground">
                                {name}
                            </p>
                        )}
                        <div
                            style={{ borderTop: '1.5px solid #000' }}
                            className="w-full"
                        />
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

// ── Page ──────────────────────────────────────────────────────────────────────

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
    const [printMode, setPrintMode] = useState<'remittance' | 'rf1'>(
        'remittance',
    );
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

    // ── Deduplicate periods by month label ────────────────────────────────────
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

    // ── Handlers ──────────────────────────────────────────────────────────────

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
        document.body.setAttribute('data-print-mode', 'remittance');
        setPrintMode('remittance');
        const cleanup = () => {
            document.body.removeAttribute('data-print-mode');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(() => window.print(), 50);
    };

    const handlePrintRF1 = () => {
        if (!selectedPeriod) {
            setExportError('Please select a payroll period before printing.');
            setTimeout(() => setExportError(''), 3000);
            return;
        }
        document.body.setAttribute('data-print-mode', 'rf1');
        setPrintMode('rf1');
        const cleanup = () => {
            document.body.removeAttribute('data-print-mode');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(() => window.print(), 50);
    };

    // ── Derived values ────────────────────────────────────────────────────────

    const preparedDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hasSelectedPeriod = selectedPeriod !== null;

    const monthLabel = selectedPeriod
        ? new Date(selectedPeriod.end_date + 'T00:00:00').toLocaleDateString(
              'en-PH',
              { month: 'long', year: 'numeric' },
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

    // ── RF-1 derived data (PhilHealth only) ───────────────────────────────────

    const rf1Employees = useMemo((): RF1Employee[] => {
        const phEmployees = remittances.philhealth?.employees ?? [];
        return phEmployees.map((emp) => ({
            id: emp.id,
            philhealth_number: emp.philhealth_number,
            last_name: emp.last_name ?? emp.name.split(',')[0]?.trim() ?? '',
            first_name: emp.first_name ?? emp.name.split(',')[1]?.trim() ?? '',
            middle_name: emp.middle_name,
            name_ext: emp.name_ext,
            date_of_birth: emp.date_of_birth,
            sex: emp.sex,
            monthly_salary_bracket: emp.basic_pay,
            employee_share: emp.employee_share,
            employer_share: emp.employer_share,
            employee_status: undefined,
        }));
    }, [remittances.philhealth]);

    const rf1EmployerInfo: RF1EmployerInfo = {
        employer_name: 'METRO KIDAPAWAN WATER DISTRICT',
        mailing_address: 'Kidapawan City, North Cotabato',
        employer_type: 'government',
    };

    const agencyTabItems = [
        { value: 'all', label: 'All Agencies' },
        { value: 'gsis', label: 'GSIS' },
        { value: 'philhealth', label: 'PhilHealth' },
        { value: 'pagibig', label: 'Pag-IBIG' },
        { value: 'bir', label: 'BIR' },
    ] as const;

    const getAgencyCount = (agencyValue: string) => {
        if (agencyValue === 'all') return summary?.employees_covered || 0;
        return remittances[agencyValue]?.employees?.length || 0;
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Remittance Report" />
            <style>{printStyles}</style>

            <div className="flex h-full flex-1 flex-col gap-4 p-8">
                {/* ── Stat Cards ─────────────────────────────────────────── */}
                {hasSelectedPeriod && (
                    <div className="no-print grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard
                            icon={<TrendingDown className="m-1.5 size-4" />}
                            title={
                                activeTab === 'all'
                                    ? 'Total Employee Deductions'
                                    : `${remittances[activeTab]?.agency_name ?? ''} Employee Share`
                            }
                            value={formatCurrency(
                                currentSummary.employee_deductions,
                            )}
                            description={`Monthly — ${monthLabel}`}
                        />
                        <StatCard
                            icon={<TrendingUp className="m-1.5 size-4" />}
                            title={
                                activeTab === 'all'
                                    ? 'Total Employer Payment'
                                    : `${remittances[activeTab]?.agency_name ?? ''} Employer Share`
                            }
                            value={formatCurrency(
                                currentSummary.employer_payment,
                            )}
                            description={`Monthly — ${monthLabel}`}
                        />
                        <StatCard
                            icon={<Receipt className="m-1.5 size-4" />}
                            title={
                                activeTab === 'all'
                                    ? 'Total Remittance'
                                    : `${remittances[activeTab]?.agency_name ?? ''} Total`
                            }
                            value={formatCurrency(currentSummary.total_remit)}
                            description={`Monthly — ${monthLabel}`}
                        />
                        <StatCard
                            icon={<Users className="m-1.5 size-4" />}
                            title="Employees Covered"
                            value={currentSummary.employees_covered}
                            description={monthLabel}
                        />
                    </div>
                )}

                {/* ── Main Section ───────────────────────────────────────── */}
                <section className="no-print rounded-lg border border-secondary bg-card p-6">
                    {/* Section Header */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold">
                                Government Remittance Report
                            </h2>
                            <Select
                                value={selectedPeriod?.id?.toString() || ''}
                                onValueChange={handlePeriodChange}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
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
                        </div>

                        <div className="flex items-center gap-2">
                            {hasSelectedPeriod && hasBothEmployeeTypes && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Filter className="h-3.5 w-3.5" />
                                        <span>Show:</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {(
                                            [
                                                'all',
                                                'regular',
                                                'casual',
                                            ] as const
                                        ).map((type) => (
                                            <Button
                                                key={type}
                                                size="sm"
                                                variant={
                                                    employeeTypeFilter === type
                                                        ? 'secondary'
                                                        : 'ghost'
                                                }
                                                onClick={() =>
                                                    handleEmployeeTypeFilter(
                                                        type,
                                                    )
                                                }
                                            >
                                                {type.charAt(0).toUpperCase() +
                                                    type.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="default"
                                onClick={handleExport}
                                disabled={!hasSelectedPeriod}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>

                            {activeTab === 'philhealth' && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrintRF1}
                                    disabled={!hasSelectedPeriod}
                                    className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print RF-1
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Error Alert */}
                    {exportError && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                            <p className="text-base text-gray-800">
                                {exportError}
                            </p>
                        </div>
                    )}

                    {/* ── Tabs ─────────────────────────────────────────────── */}
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="tabs-container w-full"
                    >
                        <div className="shrink-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <TabsList className="flex h-auto flex-nowrap gap-0 bg-transparent p-0">
                                {agencyTabItems.map(({ value, label }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                                    >
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* No period selected */}
                        {!hasSelectedPeriod ? (
                            <Card className="mt-4 border border-dashed py-16">
                                <CardContent className="text-center">
                                    <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
                                    <p className="mb-2 text-xl font-medium text-muted-foreground">
                                        No Payroll Period Selected
                                    </p>
                                    <p className="mb-6 text-muted-foreground">
                                        Please select a payroll period from the
                                        dropdown above to view remittance data.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const btn = document.querySelector(
                                                'button[role="combobox"]',
                                            );
                                            if (btn)
                                                (
                                                    btn as HTMLButtonElement
                                                ).click();
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
                                <TabsContent value="all" className="mt-6">
                                    {remittances.gsis?.employees?.length >
                                        0 && (
                                        <AgencyDataTableCard
                                            agencyId="gsis"
                                            agencyData={remittances.gsis}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
                                        />
                                    )}
                                    {remittances.philhealth?.employees?.length >
                                        0 && (
                                        <AgencyDataTableCard
                                            agencyId="philhealth"
                                            agencyData={remittances.philhealth}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
                                        />
                                    )}
                                    {remittances.pagibig?.employees?.length >
                                        0 && (
                                        <AgencyDataTableCard
                                            agencyId="pagibig"
                                            agencyData={remittances.pagibig}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
                                        />
                                    )}
                                    {!remittances.gsis?.employees?.length &&
                                        !remittances.philhealth?.employees
                                            ?.length &&
                                        !remittances.pagibig?.employees
                                            ?.length && (
                                            <Card>
                                                <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                                    <p className="text-lg font-medium">
                                                        No remittance data
                                                        available
                                                    </p>
                                                    <p className="text-sm">
                                                        There are no government
                                                        contribution records for
                                                        this period.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}
                                </TabsContent>

                                {/* GSIS */}
                                <TabsContent value="gsis" className="mt-6">
                                    {remittances.gsis?.employees?.length > 0 ? (
                                        <AgencyDataTableCard
                                            agencyId="gsis"
                                            agencyData={remittances.gsis}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
                                        />
                                    ) : (
                                        <Card>
                                            <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                                                <p className="text-lg font-medium">
                                                    No GSIS Data
                                                </p>
                                                <p className="text-sm">
                                                    There are no GSIS
                                                    contribution records for
                                                    this period.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <SignatureSection
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                        preparedDate={preparedDate}
                                    />
                                </TabsContent>

                                {/* PhilHealth */}
                                <TabsContent
                                    value="philhealth"
                                    className="mt-6"
                                >
                                    {remittances.philhealth?.employees?.length >
                                    0 ? (
                                        <AgencyDataTableCard
                                            agencyId="philhealth"
                                            agencyData={remittances.philhealth}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
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
                                                    contribution records for
                                                    this period.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <SignatureSection
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                        preparedDate={preparedDate}
                                    />
                                </TabsContent>

                                {/* Pag-IBIG */}
                                <TabsContent value="pagibig" className="mt-6">
                                    {remittances.pagibig?.employees?.length >
                                    0 ? (
                                        <AgencyDataTableCard
                                            agencyId="pagibig"
                                            agencyData={remittances.pagibig}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
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
                                                    contribution records for
                                                    this period.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <SignatureSection
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                        preparedDate={preparedDate}
                                    />
                                </TabsContent>

                                {/* BIR */}
                                <TabsContent value="bir" className="mt-6">
                                    {remittances.bir?.employees?.length > 0 ? (
                                        <AgencyDataTableCard
                                            agencyId="bir"
                                            agencyData={remittances.bir}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                            employeeTypeFilter={
                                                employeeTypeFilter
                                            }
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
                                                    remittance module is
                                                    currently under development.
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
                                        userName={
                                            auth.user?.name || 'Admin User'
                                        }
                                        preparedDate={preparedDate}
                                    />
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </section>

                {/* ── Print-Only Section (unchanged) ─────────────────────── */}
                <div className="print-only">
                    <div className="report-main-header">
                        <div className="report-header-inner">
                            <img
                                src="/images/logo.svg"
                                alt="Metro Kidapawan Water District"
                                className="report-logo"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div className="report-header-text">
                                <h1>METRO KIDAPAWAN WATER DISTRICT</h1>
                                <h2>
                                    GOVERNMENT CONTRIBUTION REMITTANCE REPORT
                                </h2>

                                <p
                                    className="period"
                                    style={{
                                        fontSize: '11px',
                                        marginTop: '4px',
                                        color: '#555',
                                    }}
                                >
                                    Monthly contributions for {monthLabel}
                                </p>
                            </div>
                        </div>
                    </div>

                    {activeTab !== 'all' && remittances[activeTab] && (
                        <>
                            <AgencyPrintTable
                                agencyId={activeTab}
                                agencyData={remittances[activeTab]}
                            />
                            <SignatureSection
                                isPrintView={true}
                                preparedDate={preparedDate}
                                userName={auth.user?.name || 'Admin User'}
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
                                                  pageBreakBefore: 'always',
                                                  breakBefore: 'always',
                                              }
                                            : undefined
                                    }
                                >
                                    <AgencyPrintTable
                                        agencyId={id}
                                        agencyData={remittances[id]}
                                    />
                                </div>
                            ))}
                            <SignatureSection
                                isPrintView={true}
                                preparedDate={preparedDate}
                                userName={auth.user?.name || 'Admin User'}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* ── RF-1 Print-Only Section ─────────────────────────────────── */}
            <div className="rf1-print-only">
                <RF1PrintView
                    employees={rf1Employees}
                    employerInfo={rf1EmployerInfo}
                    applicablePeriod={monthLabel}
                    reportType="regular"
                    preparedBy={auth.user?.name || 'Admin User'}
                    preparedDate={preparedDate}
                />
            </div>

            {/* ── Employee Detail Dialog (unchanged) ─────────────────────── */}
            {selectedEmployee && (
                <Dialog
                    open={true}
                    onOpenChange={() => setSelectedEmployee(null)}
                >
                    <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
                        <DialogHeader className="border-b px-6 py-4">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-base font-semibold">
                                    {selectedEmployee.name}
                                </DialogTitle>
                                <Badge
                                    variant={
                                        selectedEmployee.employee_type ===
                                        'regular'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="min-w-[60px] justify-center"
                                >
                                    {selectedEmployee.employee_type ??
                                        selectedEmployee.classification}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {selectedEmployee.position}
                            </p>
                        </DialogHeader>

                        <div className="grid grid-cols-2 divide-x">
                            {/* Left — Details */}
                            <div className="space-y-4 p-6">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Details
                                </p>
                                {[
                                    {
                                        label: 'Employee ID',
                                        value: String(selectedEmployee.id),
                                    },
                                    {
                                        label: 'Position',
                                        value: selectedEmployee.position,
                                    },
                                    {
                                        label: 'Basic Pay (Monthly)',
                                        value: formatCurrency(
                                            selectedEmployee.basicPay,
                                        ),
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
                                    >
                                        <span className="text-sm text-muted-foreground">
                                            {label}
                                        </span>
                                        <span className="text-sm font-medium text-foreground tabular-nums">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Right — Contribution */}
                            <div className="space-y-4 p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        {getAgencyDisplayName(
                                            selectedEmployee.agency,
                                        )}{' '}
                                        Contribution
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {getRateDescription(
                                            selectedEmployee.agency,
                                        )}
                                    </span>
                                </div>
                                {[
                                    {
                                        label: 'Employee Share',
                                        sub: 'deducted from salary',
                                        value: formatCurrency(
                                            selectedEmployee.employeeShare,
                                        ),
                                    },
                                    {
                                        label: 'Employer Share',
                                        sub: 'company contribution',
                                        value: formatCurrency(
                                            selectedEmployee.employerShare,
                                        ),
                                    },
                                ].map(({ label, sub, value }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between border-b border-border/50 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {sub}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold tabular-nums">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-1">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Total
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            employee + employer
                                        </p>
                                    </div>
                                    <span className="text-base font-bold tabular-nums">
                                        {formatCurrency(
                                            selectedEmployee.subtotal,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t bg-muted/20 px-6 py-3">
                            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Payroll Period:{' '}
                                    {selectedPeriod?.label || 'N/A'}
                                </span>
                                <span className="font-medium">
                                    {getAgencyDisplayName(
                                        selectedEmployee.agency,
                                    )}{' '}
                                    Remittance
                                </span>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
