<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
        ]);
        // TODO: refactor to separate seeder files

        // ── 0. Government Account Types ───────────────────────────────────
        $gsisTypeId = DB::table('government_acc_types')->insertGetId([
            'code' => 'GSIS',
            'name' => 'Government Service Insurance System',
            'has_employer_share' => true,
            'computation_type' => 'rate',
            'employee_rate' => 9.00,
            'employer_rate' => 12.00,
            'fixed_amount' => null,
            'min_contribution' => null,
            'max_contribution' => null,
            'lower_salary_threshold' => null,
            'lower_rate' => null,
            'upper_rate' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $philhealthTypeId = DB::table('government_acc_types')->insertGetId([
            'code' => 'PHILHEALTH',
            'name' => 'Philippine Health Insurance Corporation',
            'has_employer_share' => true,
            'computation_type' => 'rate',
            'employee_rate' => 2.50,
            'employer_rate' => 2.50,
            'fixed_amount' => null,
            'min_contribution' => 250.00,
            'max_contribution' => 2500.00,
            'lower_salary_threshold' => null,
            'lower_rate' => null,
            'upper_rate' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $pagibigTypeId = DB::table('government_acc_types')->insertGetId([
            'code' => 'PAGIBIG',
            'name' => 'Pag-IBIG Fund',
            'has_employer_share' => false,
            'computation_type' => 'fixed',
            'employee_rate' => null,
            'employer_rate' => null,
            'fixed_amount' => 100.00,
            'min_contribution' => null,
            'max_contribution' => null,
            'lower_salary_threshold' => 1500.00,
            'lower_rate' => 1.0,
            'upper_rate' => 2.0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sssTypeId = DB::table('government_acc_types')->insertGetId([
            'code' => 'SSS',
            'name' => 'Social Security System',
            'has_employer_share' => true,
            'computation_type' => 'rate',
            'employee_rate' => 4.50,
            'employer_rate' => 9.50,
            'fixed_amount' => null,
            'min_contribution' => null,
            'max_contribution' => null,
            'lower_salary_threshold' => null,
            'lower_rate' => null,
            'upper_rate' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 0b. Payroll Deduction Priority Order ──────────────────────────
        DB::table('payroll_deduction_priority_order')->insert([
            [
                'priority' => 1,
                'deduction_category' => 'government_contribution',
                'government_acc_type_id' => $gsisTypeId,
                'label' => "Gov't Contributions",
                'examples' => 'GSIS, PhilHealth, Pag-IBIG, Withholding Tax',
                'cuttability' => 'Never',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 2,
                'deduction_category' => 'government_loan',
                'government_acc_type_id' => null,
                'label' => "Gov't Loans",
                'examples' => 'GSIS MPL, GSIS Emergency Loan, Pag-IBIG MPL',
                'cuttability' => 'Rarely',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 3,
                'deduction_category' => 'internal_org_savings',
                'government_acc_type_id' => null,
                'label' => 'Org Savings & Share Capital',
                'examples' => 'Cooperative Savings, Share Capital Contributions',
                'cuttability' => 'Rarely',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 4,
                'deduction_category' => 'internal_org_loan',
                'government_acc_type_id' => null,
                'label' => 'Internal Org Loans',
                'examples' => 'Cooperative Loans, Union Emergency Loans',
                'cuttability' => 'Yes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 5,
                'deduction_category' => 'internal_org_dues',
                'government_acc_type_id' => null,
                'label' => 'Org Dues & Premiums',
                'examples' => 'Union Dues, Association Membership Dues',
                'cuttability' => 'First_to_Cut',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 6,
                'deduction_category' => 'water_bill',
                'government_acc_type_id' => null,
                'label' => 'Water Bill',
                'examples' => 'Monthly water consumption charges',
                'cuttability' => 'First_to_Cut',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'priority' => 7,
                'deduction_category' => 'other_miscellaneous',
                'government_acc_type_id' => null,
                'label' => 'Other Miscellaneous',
                'examples' => 'NS & ND (COA), One-time deductions',
                'cuttability' => 'First_to_Cut',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // ── 0c. Payroll Deduction Settings ────────────────────────────────
        DB::table('payroll_deduction_settings')->insertOrIgnore([
            'id' => 1,
            'working_days_divisor' => 22,
            'minimum_take_home_pay' => 3000.00,
            'salary_threshold' => 6000.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 1. Salary Grade Steps (via seeder) ────────────────────────────
        $this->call(SalaryGradeStepSeeder::class);

        $sgIdxToGrade = [
            0 => 7,
            1 => 8,
            2 => 10,
            3 => 11,
            4 => 12,
            5 => 13,
            6 => 14,
            7 => 15,
            8 => 16,
            9 => 18,
            10 => 20,
            11 => 22,
            12 => 24,
        ];

        $sgRows = DB::table('salary_grade_steps')->get();
        $sgLookup = [];
        foreach ($sgRows as $row) {
            $sgLookup[$row->salary_grade][$row->step] = $row;
        }

        // Helper: get the step-1 row for a given sg_idx
        $getSgRow = function (int $sgIdx) use ($sgIdxToGrade, $sgLookup) {
            $grade = $sgIdxToGrade[$sgIdx] ?? 7;

            return $sgLookup[$grade][1] ?? null;
        };

        // ── 2. Departments ─────────────────────────────────────────────────
        $deptId = DB::table('departments')->insertGetId([
            'department_name' => 'Office of Business Excellence',
            'department_acronym' => 'OBE',
            'department_description' => 'Handles overall business operations and excellence.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Department #2 (NEW)
        $deptOpsId = DB::table('departments')->insertGetId([
            'department_name' => 'Operations and Services Department',
            'department_acronym' => 'OSD',
            'department_description' => 'Oversees daily operations, facilities, and customer-facing services.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Department #3 (NEW)
        $deptGovId = DB::table('departments')->insertGetId([
            'department_name' => 'Governance and Public Affairs Department',
            'department_acronym' => 'GPAD',
            'department_description' => 'Manages governance initiatives, public information, and stakeholder relations.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 3. Divisions (each gets a JO position + item) ─────────
        $divHrId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Human Resources Division',
            'division_acronym' => 'HRD',
            'division_description' => 'Manages recruitment, payroll, and employee relations.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptId, $divHrId);

        $divItId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Information Technology Division',
            'division_acronym' => 'ITD',
            'division_description' => 'Manages all IT infrastructure and software systems.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptId, $divItId);

        $divFinId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Finance and Budget Division',
            'division_acronym' => 'FBD',
            'division_description' => 'Manages financial planning, budget allocation, and accounting.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptId, $divFinId);

        $divAdminId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Administrative Services Division',
            'division_acronym' => 'ASD',
            'division_description' => 'Handles general administrative support and records management.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptId, $divAdminId);

        $divLegalId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Legal and Compliance Division',
            'division_acronym' => 'LCD',
            'division_description' => 'Provides legal counsel and ensures regulatory compliance.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptId, $divLegalId);

        $divOpsFieldId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Field Operations Division',
            'division_acronym' => 'FOD',
            'division_description' => 'Coordinates field activities and service delivery operations.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptOpsId, $divOpsFieldId);

        $divFacilitiesId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Facilities Management Division',
            'division_acronym' => 'FMD',
            'division_description' => 'Manages facilities, assets, and building maintenance.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptOpsId, $divFacilitiesId);

        $divCustomerId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Customer Support Division',
            'division_acronym' => 'CSD',
            'division_description' => 'Handles client support, service desk, and feedback resolution.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptOpsId, $divCustomerId);

        $divPolicyId = DB::table('divisions')->insertGetId([
            'department_id' => $deptGovId,
            'division_name' => 'Policy and Standards Division',
            'division_acronym' => 'PSD',
            'division_description' => 'Develops policies, standards, and governance frameworks.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptGovId, $divPolicyId);

        $divPublicAffairsId = DB::table('divisions')->insertGetId([
            'department_id' => $deptGovId,
            'division_name' => 'Public Affairs Division',
            'division_acronym' => 'PAD',
            'division_description' => 'Leads public information, communications, and stakeholder engagement.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->seedJoPosition($deptGovId, $divPublicAffairsId);

        // ── 4. Units ───────────────────────────────────────────────────────
        $unitRecruitId = DB::table('units')->insertGetId([
            'division_id' => $divHrId,
            'unit_name' => 'Recruitment Unit',
            'unit_acronym' => 'RU',
            'unit_description' => 'Handles hiring and onboarding of new employees.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitPayrollId = DB::table('units')->insertGetId([
            'division_id' => $divHrId,
            'unit_name' => 'Payroll and Benefits Unit',
            'unit_acronym' => 'PBU',
            'unit_description' => 'Processes payroll, benefits, and leave administration.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitDevId = DB::table('units')->insertGetId([
            'division_id' => $divItId,
            'unit_name' => 'Software Development Unit',
            'unit_acronym' => 'SDU',
            'unit_description' => 'Develops and maintains internal software systems.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitInfraId = DB::table('units')->insertGetId([
            'division_id' => $divItId,
            'unit_name' => 'Infrastructure and Networks Unit',
            'unit_acronym' => 'INU',
            'unit_description' => 'Manages servers, networks, and IT infrastructure.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitAccountingId = DB::table('units')->insertGetId([
            'division_id' => $divFinId,
            'unit_name' => 'Accounting Unit',
            'unit_acronym' => 'AU',
            'unit_description' => 'Handles general accounting, ledger, and audit support.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitBudgetId = DB::table('units')->insertGetId([
            'division_id' => $divFinId,
            'unit_name' => 'Budget Unit',
            'unit_acronym' => 'BU',
            'unit_description' => 'Prepares and monitors budget allocations and utilization.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitRecordsId = DB::table('units')->insertGetId([
            'division_id' => $divAdminId,
            'unit_name' => 'Records Management Unit',
            'unit_acronym' => 'RMU',
            'unit_description' => 'Manages official documents and records.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitProcurementId = DB::table('units')->insertGetId([
            'division_id' => $divAdminId,
            'unit_name' => 'Procurement Unit',
            'unit_acronym' => 'PU',
            'unit_description' => 'Handles procurement of supplies and services.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitLegalId = DB::table('units')->insertGetId([
            'division_id' => $divLegalId,
            'unit_name' => 'Legal Affairs Unit',
            'unit_acronym' => 'LAU',
            'unit_description' => 'Handles legal documentation and case management.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Field Operations Division
        $unitDispatchId = DB::table('units')->insertGetId([
            'division_id' => $divOpsFieldId,
            'unit_name' => 'Dispatch and Coordination Unit',
            'unit_acronym' => 'DCU',
            'unit_description' => 'Coordinates schedules, dispatch, and field assignments.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitServiceDeliveryId = DB::table('units')->insertGetId([
            'division_id' => $divOpsFieldId,
            'unit_name' => 'Service Delivery Unit',
            'unit_acronym' => 'SDU2',
            'unit_description' => 'Ensures delivery of services to end-users and stakeholders.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitQualityOpsId = DB::table('units')->insertGetId([
            'division_id' => $divOpsFieldId,
            'unit_name' => 'Operations Quality Unit',
            'unit_acronym' => 'OQU',
            'unit_description' => 'Monitors operational KPIs and compliance to procedures.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Facilities Management Division
        $unitMaintenanceId = DB::table('units')->insertGetId([
            'division_id' => $divFacilitiesId,
            'unit_name' => 'Maintenance Unit',
            'unit_acronym' => 'MU',
            'unit_description' => 'Handles repairs, upkeep, and preventive maintenance.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitAssetId = DB::table('units')->insertGetId([
            'division_id' => $divFacilitiesId,
            'unit_name' => 'Asset and Inventory Unit',
            'unit_acronym' => 'AIU',
            'unit_description' => 'Manages fixed assets, supplies, and inventory records.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Customer Support Division
        $unitHelpdeskId = DB::table('units')->insertGetId([
            'division_id' => $divCustomerId,
            'unit_name' => 'Helpdesk Unit',
            'unit_acronym' => 'HDU',
            'unit_description' => 'Handles tickets, inquiries, and first-level support.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitFeedbackId = DB::table('units')->insertGetId([
            'division_id' => $divCustomerId,
            'unit_name' => 'Feedback and Resolution Unit',
            'unit_acronym' => 'FRU',
            'unit_description' => 'Manages feedback processing, escalation, and resolution.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Policy and Standards Division
        $unitPolicyDevId = DB::table('units')->insertGetId([
            'division_id' => $divPolicyId,
            'unit_name' => 'Policy Development Unit',
            'unit_acronym' => 'PDU',
            'unit_description' => 'Drafts policies, circulars, and internal guidelines.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitComplianceAuditId = DB::table('units')->insertGetId([
            'division_id' => $divPolicyId,
            'unit_name' => 'Compliance and Audit Unit',
            'unit_acronym' => 'CAU',
            'unit_description' => 'Performs compliance checks and internal audits.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitStandardsId = DB::table('units')->insertGetId([
            'division_id' => $divPolicyId,
            'unit_name' => 'Standards and Documentation Unit',
            'unit_acronym' => 'SDU3',
            'unit_description' => 'Maintains standards library, templates, and documentation.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Public Affairs Division
        $unitCommsId = DB::table('units')->insertGetId([
            'division_id' => $divPublicAffairsId,
            'unit_name' => 'Communications Unit',
            'unit_acronym' => 'CU',
            'unit_description' => 'Handles announcements, press releases, and internal comms.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitStakeholderId = DB::table('units')->insertGetId([
            'division_id' => $divPublicAffairsId,
            'unit_name' => 'Stakeholder Relations Unit',
            'unit_acronym' => 'SRU',
            'unit_description' => 'Manages external coordination and stakeholder engagement.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 5. Positions (plantilla) ───────────────────────────────
        $positions = [
            // HR
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => $unitRecruitId,     'name' => 'HR Officer',             'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => $unitRecruitId,     'name' => 'Recruitment Specialist', 'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => $unitPayrollId,     'name' => 'Payroll Officer',        'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => $unitPayrollId,     'name' => 'Benefits Administrator', 'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => null,               'name' => 'HR Division Chief',      'sg_idx' => 9],
            ['dept' => $deptId,    'div' => $divHrId,            'unit' => null,               'name' => 'HR Manager',             'sg_idx' => 9],
            // Operations
            ['dept' => $deptOpsId, 'div' => $divOpsFieldId,      'unit' => $unitRecruitId,     'name' => 'Operations Coordinator', 'sg_idx' => 5],
            // Governance
            ['dept' => $deptGovId, 'div' => $divPublicAffairsId, 'unit' => $unitCommsId,       'name' => 'Public Affairs Officer', 'sg_idx' => 5],
            // IT
            ['dept' => $deptId,    'div' => $divItId,            'unit' => $unitDevId,         'name' => 'Software Developer',     'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divItId,            'unit' => $unitDevId,         'name' => 'Senior Developer',       'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,            'unit' => $unitDevId,         'name' => 'Systems Analyst',        'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divItId,            'unit' => $unitInfraId,       'name' => 'Systems Administrator',  'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divItId,            'unit' => $unitInfraId,       'name' => 'Network Engineer',       'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,            'unit' => null,               'name' => 'IT Manager',             'sg_idx' => 12],
            // Finance
            ['dept' => $deptId,    'div' => $divFinId,           'unit' => $unitAccountingId,  'name' => 'Accountant',             'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divFinId,           'unit' => $unitAccountingId,  'name' => 'Senior Accountant',      'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divFinId,           'unit' => $unitBudgetId,      'name' => 'Budget Officer',         'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divFinId,           'unit' => $unitBudgetId,      'name' => 'Budget Analyst',         'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divFinId,           'unit' => null,               'name' => 'Finance Manager',        'sg_idx' => 11],
            // Admin
            ['dept' => $deptId,    'div' => $divAdminId,         'unit' => $unitRecordsId,     'name' => 'Records Officer',        'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divAdminId,         'unit' => $unitRecordsId,     'name' => 'Administrative Aide',    'sg_idx' => 0],
            ['dept' => $deptId,    'div' => $divAdminId,         'unit' => $unitProcurementId, 'name' => 'Procurement Officer',    'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divAdminId,         'unit' => $unitProcurementId, 'name' => 'Procurement Specialist', 'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divAdminId,         'unit' => null,               'name' => 'Admin Division Chief',   'sg_idx' => 9],
            // Legal
            ['dept' => $deptId,    'div' => $divLegalId,         'unit' => $unitLegalId,       'name' => 'Legal Officer',          'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divLegalId,         'unit' => $unitLegalId,       'name' => 'Compliance Officer',     'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divLegalId,         'unit' => null,               'name' => 'Legal Division Chief',   'sg_idx' => 10],
        ];

        $positionIds = [];
        foreach ($positions as $pos) {
            $positionIds[] = DB::table('positions')->insertGetId([
                'department_id' => $pos['dept'],
                'division_id' => $pos['div'],
                'unit_id' => $pos['unit'],
                'position_name' => $pos['name'],
                'position_type' => 'Regular',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── 6. Items (plantilla slots) ─────────────────────────────
        $positionsWithVacantSlot = [1, 4, 7, 10, 13, 16, 19, 21, 23, 24];
        $positionIds = DB::table('positions')
            ->where('position_type', 'Regular')
            ->orderBy('position_id')
            ->pluck('position_id')
            ->toArray();

        foreach ($positionIds as $idx => $posId) {
            $posName = $positions[$idx]['name'];
            $hasVacantSlot = in_array($idx, $positionsWithVacantSlot, true);
            $slotLimit = $hasVacantSlot ? 5 : 4;

            for ($slot = 1; $slot <= $slotLimit; $slot++) {
                $isVacant = $hasVacantSlot && $slot === $slotLimit;
                $newId = DB::table('items')->insertGetId([
                    'position_id' => $posId,
                    'item_name' => "{$posName} Item {$slot}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $itemIds[] = ['id' => $newId, 'pos_idx' => $idx, 'is_vacant_slot' => $isVacant];
            }
        }

        $fillableItemIds = array_values(array_filter(
            $itemIds,
            fn (array $item): bool => ! $item['is_vacant_slot']
        ));

        $this->call([
            UserSeeder::class,
            EmployeeSeeder::class,
            DocumentTrackingSeeder::class,
            InternalOrganizationSeeder::class,
            HolidaySeeder::class,
            FaceEmbeddingSeeder::class,
            RecognitionLogSeeder::class,
            AttendanceSeeder::class,
            LeaveTypeSeeder::class,
            LeaveBalanceSeeder::class,
            LeaveApplicationSeeder::class,
            MandatoryAllowanceSeeder::class,
            // LeaveEntitlementSeeder::class,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: seed a Job Order position + item for a division
    // ─────────────────────────────────────────────────────────────────────────
    private function seedJoPosition(int $departmentId, int $divisionId): void
    {
        $positionId = DB::table('positions')->insertGetId([
            'department_id' => $departmentId,
            'division_id' => $divisionId,
            'unit_id' => null,
            'position_name' => 'Job Order',
            'position_type' => 'Job Order',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('items')->insertGetId([
            'position_id' => $positionId,
            'item_name' => 'Job Order Item 1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
