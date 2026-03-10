import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Download, Calendar, Landmark, AlertCircle } from 'lucide-react';
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
    };
    settings: {
        gsis_employee_rate: number;
        gsis_employer_rate: number;
        philhealth_rate: number;
        philhealth_employer_rate: number;
        pagibig_per_payroll: number;
    };
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
    }>;
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

// ── Agency Table ──────────────────────────────────────────────────────────────

interface AgencyTableProps {
    agencyId: string;
    agencyData: AgencyData;
    onEmployeeClick?: (employee: any, agencyId: string) => void;
    isPrintView?: boolean;
}

function AgencyTable({
    agencyId,
    agencyData,
    onEmployeeClick,
    isPrintView = false,
}: AgencyTableProps) {
    const color = AGENCY_COLORS[agencyId] || 'bg-gray-600';
    const logo = AGENCY_LOGOS[agencyId];
    const employees = agencyData.employees || [];

    const totals = employees.reduce(
        (acc, row) => ({
            employee: acc.employee + row.employee_share,
            employer: acc.employer + row.employer_share,
            subtotal: acc.subtotal + row.subtotal,
        }),
        { employee: 0, employer: 0, subtotal: 0 },
    );

    if (isPrintView) {
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
                        {employees.map((row, index) => (
                            <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.position}</td>
                                <td>{row.classification}</td>
                                <td>{formatCurrency(row.basic_pay)}</td>
                                <td>{formatCurrency(row.employee_share)}</td>
                                <td>{formatCurrency(row.employer_share)}</td>
                                <td>{formatCurrency(row.subtotal)}</td>
                            </tr>
                        ))}
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
        <Card className="mb-6">
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
                                Basic Pay
                            </TableHead>
                            <TableHead className="text-right">
                                Employee Share
                            </TableHead>
                            <TableHead className="text-right">
                                Employer Share
                            </TableHead>
                            <TableHead className="text-right">
                                Subtotal
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    No data available for this agency
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((row, index) => (
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
                                            className="border-blue-200 bg-blue-50 text-blue-700"
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
                    {employees.length > 0 && (
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

// ── Signature Section ─────────────────────────────────────────────────────────

function SignatureSection({ isPrintView = false }: { isPrintView?: boolean }) {
    if (isPrintView) {
        return (
            <div className="print-signature">
                <div className="signature-block">
                    <p className="signature-label">Prepared by:</p>
                    <div className="signature-field" />
                    <p>Signature over Printed Name</p>
                    <p className="date-field">Date: _______________</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">Reviewed by:</p>
                    <div className="signature-field" />
                    <p>Signature over Printed Name</p>
                    <p className="date-field">Date: _______________</p>
                </div>
                <div className="signature-block">
                    <p className="signature-label">Approved by:</p>
                    <div className="signature-field" />
                    <p>Signature over Printed Name</p>
                    <p className="date-field">Date: _______________</p>
                </div>
            </div>
        );
    }

    return (
        <div className="no-print mt-10">
            <Separator className="mb-8" />
            <div className="grid grid-cols-3 gap-8">
                {['Prepared by', 'Reviewed by', 'Approved by'].map((label) => (
                    <div key={label} className="flex flex-col gap-2">
                        <p className="text-sm font-semibold text-foreground">
                            {label}:
                        </p>
                        <div className="mt-8 border-t border-gray-400 pt-1">
                            <p className="text-xs text-muted-foreground">
                                Signature over Printed Name
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Date: _______________
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GovernmentRemittanceReport({
    auth,
    periods,
    selectedPeriod,
    remittances,
    currentAgency,
    summary,
    settings,
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
    } | null>(null);

    const handlePeriodChange = (periodLabel: string) => {
        const period = periods.find((p) => p.label === periodLabel);
        if (period) {
            router.get(
                route('governmentremittancereport.index', {
                    period_id: period.id,
                    agency: activeTab,
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

    const hasSelectedPeriod = selectedPeriod !== null;

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
            gsis: '9% Employee / 12% Employer',
            philhealth: '2.5% Employee / 2.5% Employer',
            pagibig: '₱50 Employee / ₱50 Employer per payroll',
            bir: 'Withholding Tax',
        })[agency] ?? '';

    const activeAgenciesForPrint = (
        ['gsis', 'philhealth', 'pagibig'] as const
    ).filter((id) => (remittances[id]?.employees?.length ?? 0) > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Remittance Report" />
            <style>{printStyles}</style>

            <div className="flex flex-1 flex-col gap-8 p-8">
                {/* Header */}
                <div className="no-print flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Government Remittance Report
                    </h1>
                    <Button
                        className={`${hasSelectedPeriod ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400'} text-white`}
                        onClick={handleExport}
                        disabled={!hasSelectedPeriod}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {exportError && (
                    <div className="no-print flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <p className="text-base text-gray-800">{exportError}</p>
                    </div>
                )}

                {/* Period selector */}
                <div className="no-print flex items-center gap-4">
                    <Select
                        value={selectedPeriod?.label || ''}
                        onValueChange={handlePeriodChange}
                    >
                        <SelectTrigger className="w-[280px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select a payroll period" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map((period) => (
                                <SelectItem
                                    key={period.id}
                                    value={period.label}
                                >
                                    {period.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Document header card */}
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
                                            {selectedPeriod?.label ||
                                                'No period selected'}
                                        </span>
                                    </p>
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

                {/* No period selected */}
                {!hasSelectedPeriod ? (
                    <Card className="no-print border-2 border-dashed py-16">
                        <CardContent className="text-center">
                            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
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
                        {/* Summary cards */}
                        <div className="no-print grid grid-cols-1 gap-4 md:grid-cols-4">
                            {[
                                {
                                    label:
                                        activeTab === 'all'
                                            ? 'Total Employee Deductions'
                                            : `${remittances[activeTab]?.agency_name} Employee Share`,
                                    value: currentSummary.employee_deductions,
                                    isCount: false,
                                },
                                {
                                    label:
                                        activeTab === 'all'
                                            ? 'Total Employer Payment'
                                            : `${remittances[activeTab]?.agency_name} Employer Share`,
                                    value: currentSummary.employer_payment,
                                    isCount: false,
                                },
                                {
                                    label:
                                        activeTab === 'all'
                                            ? 'Total Remittance'
                                            : `${remittances[activeTab]?.agency_name} Total`,
                                    value: currentSummary.total_remit,
                                    isCount: false,
                                },
                                {
                                    label: 'Employees Covered',
                                    value: currentSummary.employees_covered,
                                    isCount: true,
                                },
                            ].map(({ label, value, isCount }) => (
                                <Card key={label}>
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground">
                                            {label}
                                        </p>
                                        <p className="mt-2 text-2xl font-bold tabular-nums">
                                            {isCount
                                                ? value
                                                : formatCurrency(
                                                      value as number,
                                                  )}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Tabs */}
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

                            {/* All */}
                            <TabsContent value="all" className="mt-6">
                                {remittances.gsis?.employees?.length > 0 && (
                                    <AgencyTable
                                        agencyId="gsis"
                                        agencyData={remittances.gsis}
                                        onEmployeeClick={handleEmployeeClick}
                                    />
                                )}
                                {remittances.philhealth?.employees?.length >
                                    0 && (
                                    <AgencyTable
                                        agencyId="philhealth"
                                        agencyData={remittances.philhealth}
                                        onEmployeeClick={handleEmployeeClick}
                                    />
                                )}
                                {remittances.pagibig?.employees?.length > 0 && (
                                    <AgencyTable
                                        agencyId="pagibig"
                                        agencyData={remittances.pagibig}
                                        onEmployeeClick={handleEmployeeClick}
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
                                <SignatureSection />
                            </TabsContent>

                            {/* GSIS */}
                            <TabsContent value="gsis" className="mt-6">
                                {remittances.gsis?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="gsis"
                                        agencyData={remittances.gsis}
                                        onEmployeeClick={handleEmployeeClick}
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
                                <SignatureSection />
                            </TabsContent>

                            {/* PhilHealth */}
                            <TabsContent value="philhealth" className="mt-6">
                                {remittances.philhealth?.employees?.length >
                                0 ? (
                                    <AgencyTable
                                        agencyId="philhealth"
                                        agencyData={remittances.philhealth}
                                        onEmployeeClick={handleEmployeeClick}
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
                                <SignatureSection />
                            </TabsContent>

                            {/* Pag-IBIG */}
                            <TabsContent value="pagibig" className="mt-6">
                                {remittances.pagibig?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="pagibig"
                                        agencyData={remittances.pagibig}
                                        onEmployeeClick={handleEmployeeClick}
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
                                <SignatureSection />
                            </TabsContent>

                            {/* BIR */}
                            <TabsContent value="bir" className="mt-6">
                                {remittances.bir?.employees?.length > 0 ? (
                                    <AgencyTable
                                        agencyId="bir"
                                        agencyData={remittances.bir}
                                        onEmployeeClick={handleEmployeeClick}
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
                                <SignatureSection />
                            </TabsContent>
                        </Tabs>

                        {/* Print-only section */}
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
                                    </div>
                                </div>
                            </div>

                            {/* Single-agency print */}
                            {activeTab !== 'all' && remittances[activeTab] && (
                                <>
                                    <AgencyTable
                                        agencyId={activeTab}
                                        agencyData={remittances[activeTab]}
                                        isPrintView={true}
                                    />
                                    <SignatureSection isPrintView={true} />
                                </>
                            )}

                            {/* All-agencies print */}
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
                                    <SignatureSection isPrintView={true} />
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* Employee Breakdown Modal */}
                {selectedEmployee && (
                    <Dialog
                        open={true}
                        onOpenChange={() => setSelectedEmployee(null)}
                    >
                        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
                            <div className="border-b px-6 py-4">
                                <DialogTitle className="text-xl font-semibold">
                                    {selectedEmployee.name}
                                </DialogTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedEmployee.position} ·{' '}
                                    {selectedEmployee.classification}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 divide-x">
                                {/* Left */}
                                <div className="space-y-6 p-6">
                                    <div>
                                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Employee Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Employee ID
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-slate-100"
                                                >
                                                    {selectedEmployee.id}
                                                </Badge>
                                            </div>
                                            <Separator />
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Position
                                                </span>
                                                <span className="max-w-[200px] text-right text-sm font-medium">
                                                    {selectedEmployee.position}
                                                </span>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Classification
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-blue-200 bg-blue-50 text-blue-700"
                                                >
                                                    {
                                                        selectedEmployee.classification
                                                    }
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Earnings
                                        </h3>
                                        <div className="rounded-lg bg-blue-50/30 p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Basic Pay
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Monthly
                                                    </p>
                                                </div>
                                                <span className="text-2xl font-bold text-blue-700 tabular-nums">
                                                    {formatCurrency(
                                                        selectedEmployee.basicPay,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Total Monthly Earnings
                                            </span>
                                            <span className="text-xl font-bold text-blue-600 tabular-nums">
                                                {formatCurrency(
                                                    selectedEmployee.basicPay,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right */}
                                <div className="space-y-6 p-6">
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                {getAgencyDisplayName(
                                                    selectedEmployee.agency,
                                                )}{' '}
                                                Contribution
                                            </h3>
                                            <Badge
                                                variant="outline"
                                                className="border-purple-200 bg-purple-50 text-purple-700"
                                            >
                                                {getRateDescription(
                                                    selectedEmployee.agency,
                                                )}
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="rounded-lg bg-red-50/30 p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-red-700">
                                                            Employee Share
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            deducted from salary
                                                        </p>
                                                    </div>
                                                    <span className="text-2xl font-bold text-red-600 tabular-nums">
                                                        {formatCurrency(
                                                            selectedEmployee.employeeShare,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-lg bg-amber-50/30 p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-700">
                                                            Employer Share
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            company contribution
                                                        </p>
                                                    </div>
                                                    <span className="text-2xl font-bold text-amber-600 tabular-nums">
                                                        {formatCurrency(
                                                            selectedEmployee.employerShare,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Total Monthly
                                                        Contribution
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        employee + employer
                                                    </p>
                                                </div>
                                                <span className="text-2xl font-bold text-purple-600 tabular-nums">
                                                    {formatCurrency(
                                                        selectedEmployee.subtotal,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t bg-muted/20 px-6 py-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
