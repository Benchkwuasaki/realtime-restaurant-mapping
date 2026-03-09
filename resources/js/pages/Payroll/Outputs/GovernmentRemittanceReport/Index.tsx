// Government Remittance Reports Index.tsx

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
import { Download, Calendar, Landmark, AlertCircle } from 'lucide-react';

import type { BreadcrumbItem } from '@/types';

const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 1.5cm;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Hide everything by default in print */
    body * {
      visibility: hidden;
    }
    
    /* Show only print-only section */
    .print-only, .print-only * {
      visibility: visible;
    }
    
    .print-only {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      display: block !important;
    }
    
    /* Hide UI elements */
    .no-print, .breadcrumbs, nav, header, footer, [data-radix-ui-dialog-close] {
      display: none !important;
    }
    
    /* Payroll Register style header */
    .print-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.print-header .logo-container {
  width: 80px;
  height: 80px;
}

.print-header .logo-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.print-header .header-text {
  text-align: left;
}

.print-header h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.print-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 5px 0;
  color: #333;
}

.print-header .period-info {
  font-size: 14px;
  color: #555;
  margin-top: 5px;
  font-weight: 500;
}
    
    /* Agency header with logo */
    .agency-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 20px 0 15px 0;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #0066cc;
    }
    
    .agency-header .agency-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    
    .agency-header .agency-details {
      flex: 1;
    }
    
    .agency-header .agency-details h3 {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    
    .agency-header .agency-details p {
      font-size: 12px;
      color: #666;
      margin: 2px 0;
    }
    
    /* Table styling matching payroll register */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10px;
    }
    
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
    }
    
    tfoot tr {
      background: #f8f9fa;
      font-weight: 600;
    }
    
    /* Signature section */
    .print-signature {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    
    .signature-block {
      width: 30%;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
      padding-top: 5px;
      font-size: 10px;
      text-align: center;
    }
    
    /* Agency separator */
    .agency-separator {
      margin: 20px 0;
      border-top: 1px dashed #999;
    }
  }
`;

interface Props {
    auth: {
        user: any;
    };
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

// const breadcrumbs = [
//     { title: 'Payroll', href: '/payroll' },
//     { title: 'Outputs', href: '/payroll/outputs' },
//     {
//         title: 'Government Remittance Report',
//         href: '/payroll/outputs/government-remittance',
//     },
// ];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: route('payroll.index') },
    { title: 'Outputs', href: '#' },
    {
        title: 'Government Remittance Report',
        href: route('governmentremittancereport.index'),
    },
];

const AGENCY_COLORS = {
    gsis: 'bg-blue-600',
    philhealth: 'bg-green-600',
    pagibig: 'bg-red-600',
    bir: 'bg-purple-600',
};

const AGENCY_LOGOS = {
    gsis: '/images/gsis.png',
    philhealth: '/images/philhealth.png',
    pagibig: '/images/pagibig.png',
    bir: '/images/bir.png',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

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
    const color =
        AGENCY_COLORS[agencyId as keyof typeof AGENCY_COLORS] || 'bg-gray-600';
    const logo = AGENCY_LOGOS[agencyId as keyof typeof AGENCY_LOGOS];
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
                        <p>{agencyData.full_name}</p>
                        <p className="text-xs">{agencyData.rate_description}</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Employee Name</th>
                            <th>Position</th>
                            <th>Classification</th>
                            <th>Basic Pay</th>
                            <th>Employee Share</th>
                            <th>Employer Share</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((row, index) => (
                            <tr key={row.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.position}</td>
                                <td>{row.classification}</td>
                                <td className="text-right">
                                    {formatCurrency(row.basic_pay)}
                                </td>
                                <td className="text-right">
                                    {formatCurrency(row.employee_share)}
                                </td>
                                <td className="text-right">
                                    {formatCurrency(row.employer_share)}
                                </td>
                                <td className="text-right">
                                    {formatCurrency(row.subtotal)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={5} className="text-right font-bold">
                                TOTAL:
                            </td>
                            <td className="text-right font-bold">
                                {formatCurrency(totals.employee)}
                            </td>
                            <td className="text-right font-bold">
                                {formatCurrency(totals.employer)}
                            </td>
                            <td className="text-right font-bold">
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
                            className={`${agencyId === 'philhealth' ? 'h-16 w-16' : 'h-14 w-14'} flex items-center justify-center overflow-hidden rounded-lg border bg-muted`}
                        >
                            {logo ? (
                                <img
                                    src={logo}
                                    alt={agencyData.agency_name}
                                    className="h-full w-full object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add(
                                            'flex',
                                            'items-center',
                                            'justify-center',
                                        );
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
                        <p className="text-2xl font-bold">
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
                                    className={`${!isPrintView ? 'cursor-pointer transition-colors hover:bg-muted/40' : ''}`}
                                    onClick={() =>
                                        !isPrintView &&
                                        onEmployeeClick &&
                                        onEmployeeClick(row, agencyId)
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
                                    <TableCell className="text-right">
                                        {formatCurrency(row.basic_pay)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(row.employee_share)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(row.employer_share)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(row.subtotal)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {employees.length > 0 && (
                        <tfoot>
                            <TableRow className="bg-muted/50">
                                <TableCell colSpan={5} className="font-bold">
                                    TOTAL:
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {formatCurrency(totals.employee)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {formatCurrency(totals.employer)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
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
    showPrepared?: boolean;
    showReviewed?: boolean;
    showApproved?: boolean;
    isPrintView?: boolean;
}

function SignatureSection({
    showPrepared = true,
    showReviewed = true,
    showApproved = true,
    isPrintView = false,
}: SignatureSectionProps) {
    if (isPrintView) {
        return (
            <div className="print-signature">
                {showPrepared && (
                    <div className="signature-block">
                        <div className="signature-line">
                            Prepared by: ____________________
                        </div>
                        <div className="mt-1 text-center text-xs">
                            Signature over Printed Name
                        </div>
                        <div className="text-center text-xs">
                            Date: _______________
                        </div>
                    </div>
                )}
                {showReviewed && (
                    <div className="signature-block">
                        <div className="signature-line">
                            Reviewed by: ____________________
                        </div>
                        <div className="mt-1 text-center text-xs">
                            Signature over Printed Name
                        </div>
                        <div className="text-center text-xs">
                            Date: _______________
                        </div>
                    </div>
                )}
                {showApproved && (
                    <div className="signature-block">
                        <div className="signature-line">
                            Approved by: ____________________
                        </div>
                        <div className="mt-1 text-center text-xs">
                            Signature over Printed Name
                        </div>
                        <div className="text-center text-xs">
                            Date: _______________
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const columns = [showPrepared, showReviewed, showApproved].filter(
        Boolean,
    ).length;

    return (
        <div
            className={`mt-8 grid grid-cols-${columns} signature-section gap-8`}
        >
            {showPrepared && (
                <div>
                    <p className="text-sm font-medium">Prepared by:</p>
                    <div className="mt-8 border-t border-gray-300 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Signature over Printed Name
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Date: _______________
                        </p>
                    </div>
                </div>
            )}
            {showReviewed && (
                <div>
                    <p className="text-sm font-medium">Reviewed by:</p>
                    <div className="mt-8 border-t border-gray-300 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Signature over Printed Name
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Date: _______________
                        </p>
                    </div>
                </div>
            )}
            {showApproved && (
                <div>
                    <p className="text-sm font-medium">Approved by:</p>
                    <div className="mt-8 border-t border-gray-300 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Signature over Printed Name
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Date: _______________
                        </p>
                    </div>
                </div>
            )}
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

    // Using router.get instead of window.location.href to prevent page refresh
    const handlePeriodChange = (periodLabel: string) => {
        const period = periods.find((p) => p.label === periodLabel);
        if (period) {
            router.get(
                route('governmentremittancereport.index', {
                    period_id: period.id,
                    agency: activeTab,
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }
    };

    // Using router.get instead of window.location.href to prevent page refresh
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (selectedPeriod) {
            router.get(
                route('governmentremittancereport.index', {
                    period_id: selectedPeriod.id,
                    agency: value,
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
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

    // Check if a period is selected
    const hasSelectedPeriod = selectedPeriod !== null;

    // Get the current summary based on active tab
    const getCurrentSummary = () => {
        if (!hasSelectedPeriod) {
            return {
                employee_deductions: 0,
                employer_payment: 0,
                total_remit: 0,
                employees_covered: 0,
            };
        }

        if (activeTab === 'all') {
            return summary;
        } else {
            const agencyData = remittances[activeTab];
            if (agencyData) {
                return {
                    employee_deductions: agencyData.total_employee_share,
                    employer_payment: agencyData.total_employer_share,
                    total_remit: agencyData.total,
                    employees_covered: agencyData.employees?.length || 0,
                };
            }
        }
        return {
            employee_deductions: 0,
            employer_payment: 0,
            total_remit: 0,
            employees_covered: 0,
        };
    };

    const currentSummary = getCurrentSummary();

    // Get agency display name for modal
    const getAgencyDisplayName = (agency: string) => {
        switch (agency) {
            case 'gsis':
                return 'GSIS';
            case 'philhealth':
                return 'PhilHealth';
            case 'pagibig':
                return 'Pag-IBIG';
            case 'bir':
                return 'BIR';
            default:
                return agency;
        }
    };

    // Get rate description for modal
    const getRateDescription = (agency: string) => {
        switch (agency) {
            case 'gsis':
                return '9% Employee / 12% Employer';
            case 'philhealth':
                return '2.5% Employee / 2.5% Employer';
            case 'pagibig':
                return '₱50 Employee / ₱50 Employer per payroll';
            case 'bir':
                return 'Withholding Tax';
            default:
                return '';
        }
    };

    // Determine which signature sections to show based on agency
    const getSignatureProps = (agency: string) => {
        switch (agency) {
            case 'pagibig':
                return {
                    showPrepared: false,
                    showReviewed: true,
                    showApproved: true,
                };
            default:
                return {
                    showPrepared: true,
                    showReviewed: true,
                    showApproved: true,
                };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Remittance Report" />
            <style>{printStyles}</style>

            <div className="flex flex-1 flex-col gap-8 p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Government Remittance Report
                    </h1>
                    <Button
                        className={`no-print export-button ${hasSelectedPeriod ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400'} text-white`}
                        onClick={handleExport}
                        disabled={!hasSelectedPeriod}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {/* Export error message - hide in print */}
                {exportError && (
                    <div className="no-print mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <p className="text-base text-gray-800">{exportError}</p>
                    </div>
                )}

                {/* Period selector - hide in print */}
                <div className="no-print period-selector flex items-center gap-4">
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

                {/* Document header card - visible on screen only */}
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

                {/* Show message if no period selected */}
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
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const selectButton =
                                            document.querySelector(
                                                'button[role="combobox"]',
                                            );
                                        if (selectButton) {
                                            (
                                                selectButton as HTMLButtonElement
                                            ).click();
                                        }
                                    }}
                                    className="gap-2"
                                >
                                    <Calendar className="h-4 w-4" />
                                    Select Period
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Summary cards - will be hidden in print */}
                        <div className="no-print summary-cards-print grid grid-cols-1 gap-4 md:grid-cols-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground">
                                        {activeTab === 'all'
                                            ? 'Total Employee Deductions'
                                            : `${remittances[activeTab]?.agency_name} Employee Share`}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatCurrency(
                                            currentSummary.employee_deductions,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground">
                                        {activeTab === 'all'
                                            ? 'Total Employer Payment'
                                            : `${remittances[activeTab]?.agency_name} Employer Share`}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatCurrency(
                                            currentSummary.employer_payment,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground">
                                        {activeTab === 'all'
                                            ? 'Total Remittance'
                                            : `${remittances[activeTab]?.agency_name} Total`}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {formatCurrency(
                                            currentSummary.total_remit,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground">
                                        Employees Covered
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {currentSummary.employees_covered}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs - hide in print */}
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
                                {remittances.gsis &&
                                    remittances.gsis.employees?.length > 0 && (
                                        <AgencyTable
                                            agencyId="gsis"
                                            agencyData={remittances.gsis}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                        />
                                    )}
                                {remittances.philhealth &&
                                    remittances.philhealth.employees?.length >
                                        0 && (
                                        <AgencyTable
                                            agencyId="philhealth"
                                            agencyData={remittances.philhealth}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
                                        />
                                    )}
                                {remittances.pagibig &&
                                    remittances.pagibig.employees?.length >
                                        0 && (
                                        <AgencyTable
                                            agencyId="pagibig"
                                            agencyData={remittances.pagibig}
                                            onEmployeeClick={
                                                handleEmployeeClick
                                            }
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
                                    showPrepared={true}
                                    showReviewed={true}
                                    showApproved={true}
                                />
                            </TabsContent>

                            <TabsContent value="gsis" className="mt-6">
                                {remittances.gsis &&
                                remittances.gsis.employees?.length > 0 ? (
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
                                <SignatureSection
                                    showPrepared={true}
                                    showReviewed={true}
                                    showApproved={true}
                                />
                            </TabsContent>

                            <TabsContent value="philhealth" className="mt-6">
                                {remittances.philhealth &&
                                remittances.philhealth.employees?.length > 0 ? (
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
                                <SignatureSection
                                    showPrepared={true}
                                    showReviewed={true}
                                    showApproved={true}
                                />
                            </TabsContent>

                            <TabsContent value="pagibig" className="mt-6">
                                {remittances.pagibig &&
                                remittances.pagibig.employees?.length > 0 ? (
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
                                <SignatureSection
                                    showPrepared={false}
                                    showReviewed={true}
                                    showApproved={true}
                                />
                            </TabsContent>

                            <TabsContent value="bir" className="mt-6">
                                {remittances.bir &&
                                remittances.bir.employees?.length > 0 ? (
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
                                            <div className="mx-auto max-w-md">
                                                <p className="rounded-lg border border-purple-200 bg-white/50 p-4 text-sm text-muted-foreground">
                                                    The BIR withholding tax
                                                    remittance module is
                                                    currently under development.
                                                    This feature will allow you
                                                    to generate and manage tax
                                                    remittance reports for all
                                                    employees.
                                                </p>
                                            </div>
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
                                    showPrepared={true}
                                    showReviewed={true}
                                    showApproved={true}
                                />
                            </TabsContent>
                        </Tabs>

                        {/* Print-only section - Payroll Register style header with logo */}
                        <div className="print-only hidden">
                            <div className="print-header">
                                <div className="logo-container">
                                    <img
                                        src="/images/logo.svg"
                                        alt="Metro Kidapawan Water District Logo"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                </div>

                                <div className="header-text">
                                    <h1>METRO KIDAPAWAN WATER DISTRICT</h1>
                                    <h2>
                                        GOVERNMENT CONTRIBUTION REMITTANCE
                                        REPORT
                                    </h2>

                                    <div className="period-info">
                                        {selectedPeriod?.label} ·{' '}
                                        {activeTab === 'all'
                                            ? 'All Agencies'
                                            : remittances[activeTab]
                                                  ?.agency_name}
                                    </div>
                                </div>
                            </div>

                            {/* Agency Data with Logos - Single agency or all agencies */}
                            {activeTab !== 'all' && remittances[activeTab] && (
                                <AgencyTable
                                    agencyId={activeTab}
                                    agencyData={remittances[activeTab]}
                                    isPrintView={true}
                                />
                            )}

                            {activeTab === 'all' && (
                                <>
                                    {remittances.gsis &&
                                        remittances.gsis.employees?.length >
                                            0 && (
                                            <>
                                                <AgencyTable
                                                    agencyId="gsis"
                                                    agencyData={
                                                        remittances.gsis
                                                    }
                                                    isPrintView={true}
                                                />
                                                <div className="agency-separator"></div>
                                            </>
                                        )}
                                    {remittances.philhealth &&
                                        remittances.philhealth.employees
                                            ?.length > 0 && (
                                            <>
                                                <AgencyTable
                                                    agencyId="philhealth"
                                                    agencyData={
                                                        remittances.philhealth
                                                    }
                                                    isPrintView={true}
                                                />
                                                <div className="agency-separator"></div>
                                            </>
                                        )}
                                    {remittances.pagibig &&
                                        remittances.pagibig.employees?.length >
                                            0 && (
                                            <AgencyTable
                                                agencyId="pagibig"
                                                agencyData={remittances.pagibig}
                                                isPrintView={true}
                                            />
                                        )}
                                </>
                            )}

                            {/* Signature Section */}
                            <SignatureSection
                                {...getSignatureProps(
                                    activeTab === 'all' ? 'gsis' : activeTab,
                                )}
                                isPrintView={true}
                            />
                        </div>
                    </>
                )}

                {/* Employee Breakdown Modal - No X Button */}
                {selectedEmployee && (
                    <Dialog
                        open={true}
                        onOpenChange={() => setSelectedEmployee(null)}
                    >
                        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
                            {/* Header - No X button */}
                            <div className="border-b px-6 py-4">
                                <DialogTitle className="text-xl font-semibold">
                                    {selectedEmployee.name}
                                </DialogTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedEmployee.position} ·{' '}
                                    {selectedEmployee.classification}
                                </p>
                            </div>

                            {/* Two-column layout */}
                            <div className="grid grid-cols-2 divide-x">
                                {/* Left Column - Employee Info & Earnings */}
                                <div className="space-y-6 p-6">
                                    <div>
                                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            EMPLOYEE INFORMATION
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
                                            <div className="flex items-start justify-between border-t pt-4">
                                                <span className="text-sm text-muted-foreground">
                                                    Position
                                                </span>
                                                <span className="max-w-[200px] text-right text-sm font-medium">
                                                    {selectedEmployee.position}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t pt-4">
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

                                    <div className="pt-2">
                                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            EARNINGS
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
                                                <span className="text-2xl font-bold text-blue-700">
                                                    {formatCurrency(
                                                        selectedEmployee.basicPay,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 border-t-2 border-blue-100 pt-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    Total Monthly Earnings
                                                </span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    {formatCurrency(
                                                        selectedEmployee.basicPay,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Government Shares */}
                                <div className="space-y-6 p-6">
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                {getAgencyDisplayName(
                                                    selectedEmployee.agency,
                                                )}{' '}
                                                CONTRIBUTION
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
                                            {/* Employee Share Card */}
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
                                                    <span className="text-2xl font-bold text-red-600">
                                                        {formatCurrency(
                                                            selectedEmployee.employeeShare,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Employer Share Card */}
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
                                                    <span className="text-2xl font-bold text-amber-600">
                                                        {formatCurrency(
                                                            selectedEmployee.employerShare,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Total Contribution */}
                                            <div className="mt-4 border-t-2 border-purple-100 pt-4">
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
                                                    <span className="text-2xl font-bold text-purple-600">
                                                        {formatCurrency(
                                                            selectedEmployee.subtotal,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer with period info */}
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
