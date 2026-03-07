import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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
import { Download, Calendar, Landmark } from 'lucide-react';

interface Props {
    auth: {
        user: any;
    };
}

const breadcrumbs = [
    { title: 'Payroll', href: '/payroll' },
    { title: 'Outputs', href: '/payroll/outputs' },
    {
        title: 'Government Remittance Report',
        href: '/payroll/outputs/government-remittance',
    },
    { title: 'All Government Agencies', href: '#' },
];

const PERIODS = [
    'February 1 - 15, 2026',
    'February 16 - 28, 2026',
    'January 1 - 15, 2026',
    'January 16 - 31, 2026',
];

const AGENCIES = {
    gsis: {
        id: 'gsis',
        name: 'GSIS',
        fullName: 'Government Service Insurance System',
        tagline: '',
        rateDescription: 'Employee: 9% · Employer: 12% of basic salary',
        color: 'bg-blue-600',
        logo: '/images/gsis.png',
    },
    philhealth: {
        id: 'philhealth',
        name: 'PhilHealth',
        fullName: 'Philippine Health Insurance Corporation',
        tagline: 'Tiger Partner in Health',
        rateDescription: 'Employee: 2.5% · Employer: 2.5% of basic salary',
        color: 'bg-green-600',
        logo: '/images/philhealth.png',
    },
    pagibig: {
        id: 'pagibig',
        name: 'Pag-IBIG',
        fullName: 'Home Development Mutual Fund',
        tagline:
            'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno',
        rateDescription: 'Employee ₱100 fixed · Employer ₱100 fixed',
        color: 'bg-red-600',
        logo: '/images/pagibig.png',
    },
    bir: {
        id: 'bir',
        name: 'BIR',
        fullName: 'Bureau of Internal Revenue',
        tagline: '',
        rateDescription: 'Withholding Tax',
        color: 'bg-purple-600',
        logo: '/images/bir.png',
    },
};

const SAMPLE_EMPLOYEES = [
    {
        id: 1,
        name: 'Buligan, Melbert',
        position: 'Frontend Developer',
        classification: 'Regular',
        basicPay: 33575.0,
    },
    {
        id: 2,
        name: 'Santos, Maria Luz',
        position: 'Accountant II',
        classification: 'Regular',
        basicPay: 37240.0,
    },
    {
        id: 3,
        name: 'Reyes, Jose Ramon',
        position: 'Engineer I',
        classification: 'Regular',
        basicPay: 40300.0,
    },
    {
        id: 4,
        name: 'Dela Cruz, Ana',
        position: 'Admin Aide VI',
        classification: 'Regular',
        basicPay: 25000.0,
    },
    {
        id: 5,
        name: 'Mendoza, Carlo',
        position: 'Plumber III',
        classification: 'Regular',
        basicPay: 28400.0,
    },
    {
        id: 6,
        name: 'Flores, Natividad',
        position: 'Cashier II',
        classification: 'Regular',
        basicPay: 31600.0,
    },
    {
        id: 7,
        name: 'Garcia, Rodrigo',
        position: 'Utility Worker I',
        classification: 'Regular',
        basicPay: 22400.0,
    },
];

const RATES = {
    gsis: { employee: 0.09, employer: 0.12, type: 'percentage' },
    philhealth: { employee: 0.025, employer: 0.025, type: 'percentage' },
    pagibig: { employee: 100, employer: 100, type: 'fixed' },
    bir: { employee: 0.15, employer: 0, type: 'percentage' },
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface AgencyTableProps {
    agencyId: keyof typeof AGENCIES;
    employees: typeof SAMPLE_EMPLOYEES;
}

function AgencyTable({ agencyId, employees }: AgencyTableProps) {
    const agency = AGENCIES[agencyId];
    const rates = RATES[agencyId];

    if (!agency || !rates) return null;

    const computedRows = employees.map((emp) => {
        const employeeShare =
            rates.type === 'fixed'
                ? rates.employee
                : emp.basicPay * (rates.employee as number);

        const employerShare =
            rates.type === 'fixed'
                ? rates.employer
                : emp.basicPay * (rates.employer as number);

        return {
            ...emp,
            employeeShare,
            employerShare,
            subtotal: employeeShare + employerShare,
        };
    });

    const totals = computedRows.reduce(
        (acc, row) => ({
            employee: acc.employee + row.employeeShare,
            employer: acc.employer + row.employerShare,
            subtotal: acc.subtotal + row.subtotal,
        }),
        { employee: 0, employer: 0, subtotal: 0 },
    );

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`${agencyId === 'philhealth' ? 'h-16 w-16' : 'h-14 w-14'} flex items-center justify-center overflow-hidden rounded-lg border bg-muted`}
                        >
                            {agency.logo ? (
                                <img
                                    src={agency.logo}
                                    alt={agency.name}
                                    className="h-full w-full object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div
                                    className={`h-full w-full ${agency.color} bg-opacity-10 flex items-center justify-center`}
                                >
                                    <Landmark
                                        className={`h-6 w-6 ${agency.color.replace('bg-', 'text-')}`}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {agency.name}
                            </CardTitle>
                            {agency.tagline && (
                                <p className="text-sm text-muted-foreground italic">
                                    {agency.tagline}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {agency.fullName}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            TOTAL TO REMIT
                        </p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(totals.subtotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {agency.rateDescription}
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
                        {computedRows.map((row, index) => (
                            <TableRow key={row.id}>
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
                                    {formatCurrency(row.basicPay)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(row.employeeShare)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(row.employerShare)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(row.subtotal)}
                                </TableCell>
                            </TableRow>
                        ))}
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
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

interface SignatureSectionProps {
    showPrepared?: boolean;
    showReviewed?: boolean;
    showApproved?: boolean;
}

function SignatureSection({
    showPrepared = true,
    showReviewed = true,
    showApproved = true,
}: SignatureSectionProps) {
    const columns = [showPrepared, showReviewed, showApproved].filter(
        Boolean,
    ).length;

    return (
        <div className={`mt-8 grid grid-cols-${columns} gap-8`}>
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

export default function GovernmentRemittanceReport({ auth }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
    const [activeTab, setActiveTab] = useState('all');

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

    const allAgenciesData = ['gsis', 'philhealth', 'pagibig'].map((agencyId) =>
        SAMPLE_EMPLOYEES.map((emp) => {
            const rates = RATES[agencyId as keyof typeof RATES];
            const employeeShare =
                rates.type === 'fixed'
                    ? rates.employee
                    : emp.basicPay * (rates.employee as number);
            const employerShare =
                rates.type === 'fixed'
                    ? rates.employer
                    : emp.basicPay * (rates.employer as number);
            return { employeeShare, employerShare };
        }),
    );

    const totalEmployeeDeductions = allAgenciesData
        .flat()
        .reduce((sum, item) => sum + item.employeeShare, 0);
    const totalEmployerPayment = allAgenciesData
        .flat()
        .reduce((sum, item) => sum + item.employerShare, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Government Remittance Report" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Government Remittance Report
                    </h1>
                    {/* ✅ Export button now blue */}
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => window.print()}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {/* Period selector */}
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
                    >
                        <SelectTrigger className="w-[280px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIODS.map((period) => (
                                <SelectItem key={period} value={period}>
                                    {period}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Document header card — default color */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                    <img
                                        src="/images/logo.svg"
                                        alt="Metro Kidapawan Water District Logo"
                                        className="h-full w-full object-contain p-2"
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
                                            {selectedPeriod}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <p>Date Generated: {dateGenerated}</p>
                                <p>Generated by: M. Buligan</p>
                                <p>Document Reference No. GR-2026-02-02</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary cards */}
                {activeTab === 'all' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">
                                    Employee Deductions
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(totalEmployeeDeductions)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">
                                    Employer Payment
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(totalEmployerPayment)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">
                                    Total Remit (Employer)
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {formatCurrency(
                                        totalEmployeeDeductions +
                                            totalEmployerPayment,
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
                                    {SAMPLE_EMPLOYEES.length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <Tabs
                    defaultValue="all"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">
                            All Government Agencies
                        </TabsTrigger>
                        <TabsTrigger value="gsis">GSIS</TabsTrigger>
                        <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
                        <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
                        <TabsTrigger value="bir">BIR</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                        <AgencyTable
                            agencyId="gsis"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <AgencyTable
                            agencyId="philhealth"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <AgencyTable
                            agencyId="pagibig"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <SignatureSection
                            showPrepared={true}
                            showReviewed={true}
                            showApproved={true}
                        />
                    </TabsContent>

                    <TabsContent value="gsis" className="mt-6">
                        <AgencyTable
                            agencyId="gsis"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <SignatureSection
                            showPrepared={true}
                            showReviewed={true}
                            showApproved={true}
                        />
                    </TabsContent>

                    <TabsContent value="philhealth" className="mt-6">
                        <AgencyTable
                            agencyId="philhealth"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <SignatureSection
                            showPrepared={true}
                            showReviewed={true}
                            showApproved={true}
                        />
                    </TabsContent>

                    <TabsContent value="pagibig" className="mt-6">
                        <AgencyTable
                            agencyId="pagibig"
                            employees={SAMPLE_EMPLOYEES}
                        />
                        <SignatureSection
                            showPrepared={false}
                            showReviewed={true}
                            showApproved={true}
                        />
                    </TabsContent>

                    <TabsContent value="bir" className="mt-6">
                        <Card>
                            <CardContent className="py-12 pt-6 text-center text-muted-foreground">
                                BIR (Tax) remittance data coming soon.
                            </CardContent>
                        </Card>
                        <SignatureSection
                            showPrepared={true}
                            showReviewed={true}
                            showApproved={true}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
