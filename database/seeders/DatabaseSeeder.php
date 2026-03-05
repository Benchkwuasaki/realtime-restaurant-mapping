<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // TODO: refactor to separate seeder files

        // ── 1. Salary Grade Steps ──────────────────────────────────
        $salaryGradeSteps = [
            ['salary_grade' => 7, 'step' => 1, 'salary_amount' => 17899.00],
            ['salary_grade' => 8, 'step' => 1, 'salary_amount' => 19077.00],
            ['salary_grade' => 10, 'step' => 1, 'salary_amount' => 22316.00],
            ['salary_grade' => 11, 'step' => 1, 'salary_amount' => 24887.00],
            ['salary_grade' => 12, 'step' => 1, 'salary_amount' => 27608.00],
            ['salary_grade' => 13, 'step' => 1, 'salary_amount' => 30531.00],
            ['salary_grade' => 14, 'step' => 1, 'salary_amount' => 33452.00],
            ['salary_grade' => 15, 'step' => 1, 'salary_amount' => 36619.00],
            ['salary_grade' => 16, 'step' => 1, 'salary_amount' => 40208.00],
            ['salary_grade' => 18, 'step' => 1, 'salary_amount' => 48597.00],
            ['salary_grade' => 20, 'step' => 1, 'salary_amount' => 60268.00],
            ['salary_grade' => 22, 'step' => 1, 'salary_amount' => 75406.00],
            ['salary_grade' => 24, 'step' => 1, 'salary_amount' => 97744.00],
            ['salary_grade' => 26, 'step' => 1, 'salary_amount' => 126462.00],
        ];

        $sgStepIds = [];
        foreach ($salaryGradeSteps as $sg) {
            $sgStepIds[] = DB::table('salary_grade_steps')->insertGetId(
                array_merge($sg, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // ── 2. Departments ─────────────────────────────────────────
        // Department #1 (existing)
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


        // ── 3. Divisions ───────────────────────────────────────────
        // Dept #1 divisions (existing)
        $divHrId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Human Resources Division',
            'division_acronym' => 'HRD',
            'division_description' => 'Manages recruitment, payroll, and employee relations.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divItId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Information Technology Division',
            'division_acronym' => 'ITD',
            'division_description' => 'Manages all IT infrastructure and software systems.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divFinId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Finance and Budget Division',
            'division_acronym' => 'FBD',
            'division_description' => 'Manages financial planning, budget allocation, and accounting.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divAdminId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Administrative Services Division',
            'division_acronym' => 'ASD',
            'division_description' => 'Handles general administrative support and records management.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divLegalId = DB::table('divisions')->insertGetId([
            'department_id' => $deptId,
            'division_name' => 'Legal and Compliance Division',
            'division_acronym' => 'LCD',
            'division_description' => 'Provides legal counsel and ensures regulatory compliance.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Dept #2 divisions (NEW) — 3 divisions
        $divOpsFieldId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Field Operations Division',
            'division_acronym' => 'FOD',
            'division_description' => 'Coordinates field activities and service delivery operations.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divFacilitiesId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Facilities Management Division',
            'division_acronym' => 'FMD',
            'division_description' => 'Manages facilities, assets, and building maintenance.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divCustomerId = DB::table('divisions')->insertGetId([
            'department_id' => $deptOpsId,
            'division_name' => 'Customer Support Division',
            'division_acronym' => 'CSD',
            'division_description' => 'Handles client support, service desk, and feedback resolution.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Dept #3 divisions (NEW) — 2 divisions
        $divPolicyId = DB::table('divisions')->insertGetId([
            'department_id' => $deptGovId,
            'division_name' => 'Policy and Standards Division',
            'division_acronym' => 'PSD',
            'division_description' => 'Develops policies, standards, and governance frameworks.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $divPublicAffairsId = DB::table('divisions')->insertGetId([
            'department_id' => $deptGovId,
            'division_name' => 'Public Affairs Division',
            'division_acronym' => 'PAD',
            'division_description' => 'Leads public information, communications, and stakeholder engagement.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Dept #2 divisions (NEW) — 3 divisions
        $divOpsFieldId = DB::table('divisions')->insertGetId([
            'department_id'        => $deptOpsId,
            'division_name'        => 'Field Operations Division',
            'division_acronym'     => 'FOD',
            'division_description' => 'Coordinates field activities and service delivery operations.',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        $divFacilitiesId = DB::table('divisions')->insertGetId([
            'department_id'        => $deptOpsId,
            'division_name'        => 'Facilities Management Division',
            'division_acronym'     => 'FMD',
            'division_description' => 'Manages facilities, assets, and building maintenance.',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        $divCustomerId = DB::table('divisions')->insertGetId([
            'department_id'        => $deptOpsId,
            'division_name'        => 'Customer Support Division',
            'division_acronym'     => 'CSD',
            'division_description' => 'Handles client support, service desk, and feedback resolution.',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        // Dept #3 divisions (NEW) — 2 divisions
        $divPolicyId = DB::table('divisions')->insertGetId([
            'department_id'        => $deptGovId,
            'division_name'        => 'Policy and Standards Division',
            'division_acronym'     => 'PSD',
            'division_description' => 'Develops policies, standards, and governance frameworks.',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        $divPublicAffairsId = DB::table('divisions')->insertGetId([
            'department_id'        => $deptGovId,
            'division_name'        => 'Public Affairs Division',
            'division_acronym'     => 'PAD',
            'division_description' => 'Leads public information, communications, and stakeholder engagement.',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        // ── 4. Units ───────────────────────────────────────────────
        // Dept #1 units (existing)
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

        // Dept #2 units (NEW) — each division 2–3 units
        // Field Operations Division (3 units)
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

        // Facilities Management Division (2 units)
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

        // Customer Support Division (2 units)
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

        // Dept #3 units (NEW) — each division 2–3 units
        // Policy and Standards Division (3 units)
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

        // Public Affairs Division (2 units)
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

        // Dept #2 units (NEW) — each division 2–3 units
        // Field Operations Division (3 units)
        $unitDispatchId = DB::table('units')->insertGetId([
            'division_id'      => $divOpsFieldId,
            'unit_name'        => 'Dispatch and Coordination Unit',
            'unit_acronym'     => 'DCU',
            'unit_description' => 'Coordinates schedules, dispatch, and field assignments.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitServiceDeliveryId = DB::table('units')->insertGetId([
            'division_id'      => $divOpsFieldId,
            'unit_name'        => 'Service Delivery Unit',
            'unit_acronym'     => 'SDU2',
            'unit_description' => 'Ensures delivery of services to end-users and stakeholders.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitQualityOpsId = DB::table('units')->insertGetId([
            'division_id'      => $divOpsFieldId,
            'unit_name'        => 'Operations Quality Unit',
            'unit_acronym'     => 'OQU',
            'unit_description' => 'Monitors operational KPIs and compliance to procedures.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Facilities Management Division (2 units)
        $unitMaintenanceId = DB::table('units')->insertGetId([
            'division_id'      => $divFacilitiesId,
            'unit_name'        => 'Maintenance Unit',
            'unit_acronym'     => 'MU',
            'unit_description' => 'Handles repairs, upkeep, and preventive maintenance.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitAssetId = DB::table('units')->insertGetId([
            'division_id'      => $divFacilitiesId,
            'unit_name'        => 'Asset and Inventory Unit',
            'unit_acronym'     => 'AIU',
            'unit_description' => 'Manages fixed assets, supplies, and inventory records.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Customer Support Division (2 units)
        $unitHelpdeskId = DB::table('units')->insertGetId([
            'division_id'      => $divCustomerId,
            'unit_name'        => 'Helpdesk Unit',
            'unit_acronym'     => 'HDU',
            'unit_description' => 'Handles tickets, inquiries, and first-level support.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitFeedbackId = DB::table('units')->insertGetId([
            'division_id'      => $divCustomerId,
            'unit_name'        => 'Feedback and Resolution Unit',
            'unit_acronym'     => 'FRU',
            'unit_description' => 'Manages feedback processing, escalation, and resolution.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Dept #3 units (NEW) — each division 2–3 units
        // Policy and Standards Division (3 units)
        $unitPolicyDevId = DB::table('units')->insertGetId([
            'division_id'      => $divPolicyId,
            'unit_name'        => 'Policy Development Unit',
            'unit_acronym'     => 'PDU',
            'unit_description' => 'Drafts policies, circulars, and internal guidelines.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitComplianceAuditId = DB::table('units')->insertGetId([
            'division_id'      => $divPolicyId,
            'unit_name'        => 'Compliance and Audit Unit',
            'unit_acronym'     => 'CAU',
            'unit_description' => 'Performs compliance checks and internal audits.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitStandardsId = DB::table('units')->insertGetId([
            'division_id'      => $divPolicyId,
            'unit_name'        => 'Standards and Documentation Unit',
            'unit_acronym'     => 'SDU3',
            'unit_description' => 'Maintains standards library, templates, and documentation.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Public Affairs Division (2 units)
        $unitCommsId = DB::table('units')->insertGetId([
            'division_id'      => $divPublicAffairsId,
            'unit_name'        => 'Communications Unit',
            'unit_acronym'     => 'CU',
            'unit_description' => 'Handles announcements, press releases, and internal comms.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitStakeholderId = DB::table('units')->insertGetId([
            'division_id'      => $divPublicAffairsId,
            'unit_name'        => 'Stakeholder Relations Unit',
            'unit_acronym'     => 'SRU',
            'unit_description' => 'Manages external coordination and stakeholder engagement.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ── 5. Positions ───────────────────────────────────────────
        $positions = [
            // HR
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => $unitRecruitId, 'name' => 'HR Officer', 'sg_idx' => 2],  // SG10
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => $unitRecruitId, 'name' => 'Recruitment Specialist', 'sg_idx' => 4],  // SG12
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => $unitPayrollId, 'name' => 'Payroll Officer', 'sg_idx' => 4],  // SG12
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => $unitPayrollId, 'name' => 'Benefits Administrator', 'sg_idx' => 3],  // SG11
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => null, 'name' => 'HR Division Chief', 'sg_idx' => 9],  // SG18
            ['dept' => $deptId, 'div' => $divHrId, 'unit' => null, 'name' => 'HR Manager', 'sg_idx' => 9],  // SG18
            // IT
            ['dept' => $deptId, 'div' => $divItId, 'unit' => $unitDevId, 'name' => 'Software Developer', 'sg_idx' => 4],  // SG12
            ['dept' => $deptId, 'div' => $divItId, 'unit' => $unitDevId, 'name' => 'Senior Developer', 'sg_idx' => 6],  // SG14
            ['dept' => $deptId, 'div' => $divItId, 'unit' => $unitDevId, 'name' => 'Systems Analyst', 'sg_idx' => 5],  // SG13
            ['dept' => $deptId, 'div' => $divItId, 'unit' => $unitInfraId, 'name' => 'Systems Administrator', 'sg_idx' => 7],  // SG15
            ['dept' => $deptId, 'div' => $divItId, 'unit' => $unitInfraId, 'name' => 'Network Engineer', 'sg_idx' => 6],  // SG14
            ['dept' => $deptId, 'div' => $divItId, 'unit' => null, 'name' => 'IT Manager', 'sg_idx' => 12], // SG24
            // Finance
            ['dept' => $deptId, 'div' => $divFinId, 'unit' => $unitAccountingId, 'name' => 'Accountant', 'sg_idx' => 4],  // SG12
            ['dept' => $deptId, 'div' => $divFinId, 'unit' => $unitAccountingId, 'name' => 'Senior Accountant', 'sg_idx' => 7],  // SG15
            ['dept' => $deptId, 'div' => $divFinId, 'unit' => $unitBudgetId, 'name' => 'Budget Officer', 'sg_idx' => 5],  // SG13
            ['dept' => $deptId, 'div' => $divFinId, 'unit' => $unitBudgetId, 'name' => 'Budget Analyst', 'sg_idx' => 3],  // SG11
            ['dept' => $deptId, 'div' => $divFinId, 'unit' => null, 'name' => 'Finance Manager', 'sg_idx' => 11], // SG22
            // Admin
            ['dept' => $deptId, 'div' => $divAdminId, 'unit' => $unitRecordsId,    'name' => 'Records Officer',         'sg_idx' => 2],  // SG10
            ['dept' => $deptId, 'div' => $divAdminId, 'unit' => $unitRecordsId,    'name' => 'Administrative Aide',     'sg_idx' => 0],  // SG7
            ['dept' => $deptId, 'div' => $divAdminId, 'unit' => $unitProcurementId, 'name' => 'Procurement Officer',     'sg_idx' => 5],  // SG13
            ['dept' => $deptId, 'div' => $divAdminId, 'unit' => $unitProcurementId, 'name' => 'Procurement Specialist',  'sg_idx' => 3],  // SG11
            ['dept' => $deptId, 'div' => $divAdminId, 'unit' => null,              'name' => 'Admin Division Chief',    'sg_idx' => 9],  // SG18
            // Legal
            ['dept' => $deptId, 'div' => $divLegalId, 'unit' => $unitLegalId, 'name' => 'Legal Officer', 'sg_idx' => 7],  // SG15
            ['dept' => $deptId, 'div' => $divLegalId, 'unit' => $unitLegalId, 'name' => 'Compliance Officer', 'sg_idx' => 6],  // SG14
            ['dept' => $deptId, 'div' => $divLegalId, 'unit' => null, 'name' => 'Legal Division Chief', 'sg_idx' => 10], // SG20
        ];

        $positionIds = [];
        foreach ($positions as $pos) {
            $positionIds[] = DB::table('positions')->insertGetId([
                'department_id' => $pos['dept'],
                'division_id' => $pos['div'],
                'unit_id' => $pos['unit'],
                'position_name' => $pos['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── 6. Items — 100 slots distributed across positions ──────
        // Distribution: spread 100 items across 25 positions (4 each)
        $itemIds = [];
        foreach ($positionIds as $idx => $posId) {
            $posName = $positions[$idx]['name'];
            for ($slot = 1; $slot <= 4; $slot++) {
                $itemIds[] = [
                    'id' => DB::table('items')->insertGetId([
                        'position_id' => $posId,
                        'item_name' => "{$posName} Item {$slot}",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]),
                    'pos_idx' => $idx,
                ];
            }
        }
        // $itemIds now has 100 entries

        // ── 7. Reference data pools ────────────────────────────────
        $firstNamesMale = [
            'Ramon',
            'Carlo',
            'Jose',
            'Miguel',
            'Eduardo',
            'Roberto',
            'Fernando',
            'Antonio',
            'Ricardo',
            'Emmanuel',
            'Rodrigo',
            'Alfredo',
            'Bernard',
            'Leonardo',
            'Danilo',
            'Renato',
            'Armando',
            'Cesar',
            'Victor',
            'Nelson',
            'Bryan',
            'Kevin',
            'Mark',
            'Christian',
            'Ronald',
            'Joel',
            'Jerome',
            'Patrick',
            'Dennis',
            'Alvin',
        ];
        $firstNamesFemale = [
            'Maria',
            'Ana',
            'Joanna',
            'Rosa',
            'Maricel',
            'Lourdes',
            'Teresita',
            'Corazon',
            'Josephine',
            'Erlinda',
            'Gina',
            'Rowena',
            'Charissa',
            'Kristine',
            'Patricia',
            'Melissa',
            'Diana',
            'Catherine',
            'Angela',
            'Sheila',
            'Vanessa',
            'Aileen',
            'Mylene',
            'Cheryl',
            'Fe',
            'Elvira',
            'Nora',
            'Cynthia',
            'Susan',
            'Marites',
        ];
        $lastNames = [
            'Santos',
            'Dela Cruz',
            'Reyes',
            'Mendoza',
            'Garcia',
            'Torres',
            'Villanueva',
            'Bautista',
            'Ramos',
            'Aquino',
            'Fernandez',
            'Flores',
            'Lopez',
            'Diaz',
            'Castro',
            'Aguilar',
            'Tolentino',
            'Espinosa',
            'Navarro',
            'Palma',
            'Morales',
            'Velasco',
            'Ibanez',
            'Ocampo',
            'Macapagal',
            'Pangilinan',
            'Mercado',
            'Bonifacio',
            'Luna',
            'Mabini',
            'Rizal',
            'Bonifacio',
            'Pascual',
            'Lucero',
            'Salazar',
            'Macaraeg',
        ];
        $middleNames = [
            'Cruz',
            'Gomez',
            'Lim',
            'Tan',
            'Ong',
            'Aquino',
            'Rivera',
            'Pascual',
            'Jimenez',
            'Reyes',
            'Santos',
            'Bautista',
            'Garcia',
            'Torres',
            'Ramos',
            'Fernandez',
            'Flores',
            'Soriano',
            'Valdez',
            'Manalo',
            'Bartolome',
            'Castillo',
            'Guevara',
            'Zabala',
        ];
        $cities = [
            'Quezon City',
            'Manila',
            'Pasig City',
            'Taguig City',
            'Mandaluyong City',
            'Marikina City',
            'Pasay City',
            'Makati City',
            'Paranaque City',
            'Caloocan City',
            'Valenzuela City',
            'Malabon City',
            'Las Pinas City',
            'Muntinlupa City',
            'Pateros',
        ];
        $streets = [
            'Rizal Street',
            'Mabini Avenue',
            'Luna Street',
            'Bonifacio Boulevard',
            'Aguinaldo Street',
            'Quezon Avenue',
            'Commonwealth Avenue',
            'España Boulevard',
            'Taft Avenue',
            'EDSA',
            'Ortigas Avenue',
            'Shaw Boulevard',
            'Aurora Boulevard',
            'C-5 Road',
            'Marcos Highway',
        ];
        $zipCodes = ['1100', '1200', '1300', '1400', '1500', '1550', '1600', '1634', '1700', '1800'];
        $schools = [
            ['school' => 'University of the Philippines Diliman',     'address' => 'Diliman, Quezon City'],
            ['school' => 'De La Salle University',                    'address' => 'Taft Avenue, Manila'],
            ['school' => 'Ateneo de Manila University',               'address' => 'Loyola Heights, Quezon City'],
            ['school' => 'University of Santo Tomas',                 'address' => 'España Blvd., Sampaloc, Manila'],
            ['school' => 'Mapúa University',                          'address' => 'Muralla Street, Intramuros, Manila'],
            ['school' => 'Far Eastern University',                    'address' => 'Nicanor Reyes Street, Manila'],
            ['school' => 'San Beda University',                       'address' => 'Mendiola Street, Manila'],
            ['school' => 'Polytechnic University of the Philippines', 'address' => 'Anonas Street, Santa Mesa, Manila'],
            ['school' => 'Pamantasan ng Lungsod ng Maynila',          'address' => 'Intramuros, Manila'],
            ['school' => 'Philippine Normal University',              'address' => 'Taft Avenue, Manila'],
            ['school' => 'Technological Institute of the Philippines', 'address' => 'Cubao, Quezon City'],
            ['school' => 'National University Philippines',           'address' => 'M.V. Delos Santos Street, Manila'],
        ];
        $degrees = [
            'Bachelor of Science in Computer Science',
            'Bachelor of Science in Information Technology',
            'Bachelor of Science in Business Administration',
            'Bachelor of Science in Accountancy',
            'Bachelor of Science in Psychology',
            'Bachelor of Science in Public Administration',
            'Bachelor of Laws',
            'Bachelor of Science in Office Administration',
            'Bachelor of Science in Electronics Engineering',
            'Bachelor of Science in Civil Engineering',
            'Master of Business Administration',
            'Master of Public Administration',
            'Master of Science in Information Systems',
        ];
        $eduLevels = ['College', 'Post-Graduate', 'College', 'College', 'College', 'Post-Graduate'];
        $eligibilities = [
            'Career Service Sub-professional',
            'Career Service Professional',
            'Career Service Executive',
            'Bar Examinations',
            'Certified Public Accountant',
            'Information Technology Officer Exam',
            'Civil Service Eligibility for Teachers',
        ];
        $govtSeminars = [
            ['name' => 'Strategic Planning Workshop',                  'venue' => 'PICC, Pasay City'],
            ['name' => 'Labor Law and Employee Relations Seminar',     'venue' => 'Makati City Hall'],
            ['name' => 'Cybersecurity Awareness Training',             'venue' => 'Online (Zoom)'],
            ['name' => 'Laravel Advanced Workshop',                    'venue' => 'BGC Tech Hub, Taguig'],
            ['name' => 'Leadership and Management',                    'venue' => 'Manila Hotel'],
            ['name' => 'Digital Transformation for Government',        'venue' => 'Sofitel Philippine Plaza, Pasay'],
            ['name' => 'Public Financial Management Seminar',          'venue' => 'COA Headquarters, Quezon City'],
            ['name' => 'Records and Documents Management',             'venue' => 'NEDA Pasig'],
            ['name' => 'Project Management Essentials',                'venue' => 'Online (MS Teams)'],
            ['name' => 'Anti-Corruption and Ethics in Public Service', 'venue' => 'CSC Regional Office, Manila'],
            ['name' => 'Gender and Development Awareness Program',     'venue' => 'DSWD Office, Diliman'],
            ['name' => 'Procurement Law and GPPB Guidelines',          'venue' => 'GPPB-TSO, Pasig City'],
            ['name' => 'Network Security Fundamentals',                'venue' => 'Online (MS Teams)'],
            ['name' => 'Executive Leadership Program',                 'venue' => 'Asian Institute of Management, Makati'],
            ['name' => 'Budget and Financial Reporting',               'venue' => 'DBM Conference Hall, Manila'],
        ];
        $allowanceTypes = [
            ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
            ['allowance_name' => 'Rice Subsidy', 'allowance_amount' => 1500.00],
            ['allowance_name' => 'Clothing Allowance', 'allowance_amount' => 6000.00],
            ['allowance_name' => 'Hazard Pay', 'allowance_amount' => 3000.00],
            ['allowance_name' => 'Representation Allowance', 'allowance_amount' => 5000.00],
            ['allowance_name' => 'Subsistence Allowance', 'allowance_amount' => 1800.00],
            ['allowance_name' => 'Laundry Allowance', 'allowance_amount' => 600.00],
        ];
        $employmentClassifications = ['Regular', 'Regular', 'Regular', 'Job Order', 'Casual'];
        $civStatuses = ['single', 'married', 'married', 'married', 'single', 'widowed'];
        $placesBirth = [
            'Manila, Philippines',
            'Cebu City, Philippines',
            'Davao City, Philippines',
            'Quezon City, Philippines',
            'Iloilo City, Philippines',
            'Cagayan de Oro, Philippines',
            'Zamboanga City, Philippines',
            'Bacolod City, Philippines',
            'General Santos City, Philippines',
            'Baguio City, Philippines',
            'Tacloban City, Philippines',
            'Butuan City, Philippines',
        ];
        $leaveTypes = ['Vacation Leave', 'Sick Leave'];



        // ── 8. Insert 100 employees ────────────────────────────────
        $createdEmployeeIds = [];
        srand(42); // reproducible randomness

        for ($i = 0; $i < 100; $i++) {
            $isSexFemale = ($i % 3 !== 0); // roughly 2/3 female, 1/3 male
            $sex = $isSexFemale ? 1 : 0;

            $firstName = $isSexFemale
                ? $firstNamesFemale[$i % count($firstNamesFemale)]
                : $firstNamesMale[$i % count($firstNamesMale)];
            $lastName = $lastNames[$i % count($lastNames)];
            $middleName = $middleNames[$i % count($middleNames)];

            $birthYear = 1975 + ($i % 25); // 1975–1999
            $birthMonth = str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT);
            $birthDay = str_pad(($i % 28) + 1, 2, '0', STR_PAD_LEFT);
            $birthDate = "{$birthYear}-{$birthMonth}-{$birthDay}";

            $hireYear = min(2023, 2000 + ($i % 24));
            $hireMonth = str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT);
            $hiredDate = "{$hireYear}-{$hireMonth}-01";
            $appliedDate = date('Y-m-d', strtotime($hiredDate . ' -1 month'));

            $city = $cities[$i % count($cities)];
            $street = $streets[$i % count($streets)];
            $streetNum = (($i + 1) * 7) % 200 + 1;
            $zipCode = $zipCodes[$i % count($zipCodes)];

            $schoolData = $schools[$i % count($schools)];
            $degree = $degrees[$i % count($degrees)];
            $eduLevel = $eduLevels[$i % count($eduLevels)];
            $gradYear = min($hireYear - 1, $birthYear + 20);
            $gradDate = "{$gradYear}-03-25";

            $classif = $employmentClassifications[$i % count($employmentClassifications)];
            $civStat = $civStatuses[$i % count($civStatuses)];
            $status = ($i % 10 !== 0); // 10% inactive

            // item slot
            $itemEntry = $itemIds[$i];
            $itemId = $itemEntry['id'];
            $posIdx = $itemEntry['pos_idx'];
            $sgIdx = $positions[$posIdx]['sg_idx'];

            $workEmail = strtolower(
                preg_replace('/[^a-z0-9]/', '', $firstName) . '.' .
                    preg_replace('/[^a-z0-9]/', '', $lastName) .
                    ($i > 0 ? $i : '') .
                    '@obx.gov.ph'
            );

            // Basic info
            $basicInfoId = DB::table('employee_basic_info')->insertGetId([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $middleName,
                'name_extension' => ($i % 15 === 0 && !$isSexFemale) ? 'Jr.' : null,
                'birth_date' => $birthDate,
                'sex' => $sex,
                'personal_email' => strtolower("{$firstName}.{$lastName}{$i}@gmail.com"),
                'phone_number' => '09' . str_pad((171000000 + $i * 1234567) % 900000000 + 100000000, 9, '0'),
                'civil_status' => $civStat,
                'place_of_birth' => $placesBirth[$i % count($placesBirth)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Employee
            $employeeId = DB::table('employees')->insertGetId([
                'employee_basic_info_id' => $basicInfoId,
                'item_id' => $itemId,
                'salary_grade_step_id' => $sgStepIds[$sgIdx],
                'employment_classification' => $classif,
                'work_email'                => $workEmail,
                'password'                  => Hash::make('password'),
                'date_applied'              => $appliedDate,
                'date_hired'                => $hiredDate,
                'work_schedule_start'       => '08:00:00',
                'work_schedule_end'         => '17:00:00',
                'status'                    => $status,
                'created_at'                => now(),
                'updated_at'                => now(),
            ]);

            $createdEmployeeIds[] = $employeeId;

            // Address
            DB::table('employee_addresses')->insert([
                'employee_basic_info_id' => $basicInfoId,
                'street_address' => "{$streetNum} {$street}",
                'city' => $city,
                'state' => 'Metro Manila',
                'zip_code' => $zipCode,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Education
            DB::table('employee_educations')->insert([
                'employee_basic_info_id' => $basicInfoId,
                'level' => $eduLevel,
                'school_name' => $schoolData['school'],
                'school_address' => $schoolData['address'],
                'graduation_date' => $gradDate,
                'degree' => $degree,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Family info (1 member)
            $spouseFirstName = $isSexFemale
                ? $firstNamesMale[$i % count($firstNamesMale)]
                : $firstNamesFemale[$i % count($firstNamesFemale)];

            $spouseBirthYear = 1975 + (($i + 3) % 25);
            $spouseBirthMonth = str_pad((($i + 3) % 12) + 1, 2, '0', STR_PAD_LEFT);
            $spouseBirthDay = str_pad((($i + 3) % 28) + 1, 2, '0', STR_PAD_LEFT);
            DB::table('family_info')->insert([
                'employee_basic_info_id' => $basicInfoId,
                'full_name' => "{$spouseFirstName} {$lastName}",
                'contact_number' => '09' . str_pad((281000000 + $i * 7654321) % 900000000 + 100000000, 9, '0'),
                'relationship' => 'Spouse',
                'sex' => !$isSexFemale, // opposite of employee
                'date_of_birth' => "{$spouseBirthYear}-{$spouseBirthMonth}-{$spouseBirthDay}",
                'place_of_birth' => $placesBirth[($i + 2) % count($placesBirth)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Government accounts
            $govAccounts = [
                ['account_type' => 'SSS', 'account_number' => sprintf('%02d-%07d-%d', ($i % 9) + 1, $i * 1234567 % 9999999, $i % 9)],
                ['account_type' => 'PhilHealth', 'account_number' => sprintf('%02d-%09d-%d', ($i % 9) + 11, $i * 9876543 % 999999999, $i % 9)],
                ['account_type' => 'Pag-IBIG', 'account_number' => sprintf('%04d-%04d-%04d', ($i * 7) % 9999, ($i * 3) % 9999, ($i * 11) % 9999)],
            ];
            if ($classif === 'Regular' && $hireYear < 2015) {
                $govAccounts[] = ['account_type' => 'GSIS', 'account_number' => sprintf('GSIS-%04d-%d', $i + 1, $hireYear)];
            }
            foreach ($govAccounts as $acct) {
                DB::table('government_accounts')->insert(array_merge($acct, [
                    'employee_id' => $employeeId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            // Allowances (everyone gets transportation + rice, some get extras)
            $empAllowances = [
                $allowanceTypes[0], // Transportation
                $allowanceTypes[1], // Rice Subsidy
            ];
            if ($i % 4 === 0)
                $empAllowances[] = $allowanceTypes[2]; // Clothing
            if ($i % 7 === 0)
                $empAllowances[] = $allowanceTypes[3]; // Hazard
            if ($sgIdx >= 9)
                $empAllowances[] = $allowanceTypes[4]; // Representation (senior)
            if ($i % 5 === 0)
                $empAllowances[] = $allowanceTypes[5]; // Subsistence

            foreach ($empAllowances as $alw) {
                DB::table('employee_allowances')->insert(array_merge($alw, [
                    'employee_id' => $employeeId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            // Service records (at least 1, sometimes 2)
            $positionName = $positions[$posIdx]['name'];
            $divName = match ($positions[$posIdx]['div']) {
                $divHrId    => 'Human Resources Division',
                $divItId    => 'Information Technology Division',
                $divFinId   => 'Finance and Budget Division',
                $divAdminId => 'Administrative Services Division',
                $divLegalId => 'Legal and Compliance Division',
                default => 'Office of Business Excellence',
            };
            DB::table('employee_service_records')->insert([
                'employee_id' => $employeeId,
                'department' => $divName,
                'service_title' => $positionName,
                'durationStart' => $hiredDate,
                'durationEnd' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if ($hireYear <= 2015) {
                $prevYear = $hireYear;
                $prevEnd = ($hireYear + 4) . "-12-31";
                DB::table('employee_service_records')->insert([
                    'employee_id' => $employeeId,
                    'department' => $divName,
                    'service_title' => 'Administrative Aide',
                    'durationStart' => "{$prevYear}-01-01",
                    'durationEnd' => $prevEnd,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Seminars (1–2 per employee)
            $seminar1 = $govtSeminars[$i % count($govtSeminars)];
            $semYear = min(2024, $hireYear + 2);
            DB::table('employee_seminars_and_trainings')->insert([
                'employee_id'            => $employeeId,
                'seminar_training_name'  => $seminar1['name'],
                'date_attended'          => "{$semYear}-06-15",
                'venue'                  => $seminar1['venue'],
                'created_at'             => now(),
                'updated_at'             => now(),
            ]);
            if ($i % 3 === 0) {
                $seminar2 = $govtSeminars[($i + 5) % count($govtSeminars)];
                DB::table('employee_seminars_and_trainings')->insert([
                    'employee_id'            => $employeeId,
                    'seminar_training_name'  => $seminar2['name'],
                    'date_attended'          => min(2024, $semYear + 1) . '-11-20',
                    'venue'                  => $seminar2['venue'],
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]);
            }

            // Eligibility
            $elig = $eligibilities[$i % count($eligibilities)];
            $eligYear = min($hireYear - 1, $birthYear + 22);
            DB::table('eligibility_information')->insert([
                'employee_id' => $employeeId,
                'eligibility_name' => $elig,
                'year_passed' => "{$eligYear}-08-01",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Leave information
            foreach ($leaveTypes as $lt) {
                DB::table('leave_information')->insert([
                    'employee_id'    => $employeeId,
                    'leave_type'     => $lt,
                    'leave_days'     => '2024-01-01',
                    'leave_balance'  => '2024-12-31',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            // Leave availments (most employees have at least one)
            if ($i % 5 !== 0) {
                $lvType = $leaveTypes[$i % 2];
                $lvMonth = str_pad(($i % 11) + 1, 2, '0', STR_PAD_LEFT);
                $lvDay = str_pad(($i % 20) + 1, 2, '0', STR_PAD_LEFT);
                DB::table('leave_availments')->insert([
                    'employee_id' => $employeeId,
                    'leave_type' => $lvType,
                    'leave_start_date' => "2024-{$lvMonth}-{$lvDay}",
                    'leave_end_date' => "2024-{$lvMonth}-" . str_pad(((int) $lvDay + 1) % 28 + 1, 2, '0', STR_PAD_LEFT),
                    'status' => 'approved',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Payroll
            $baseSalary = $salaryGradeSteps[$sgIdx]['salary_amount'];
            $deduction = round($baseSalary * 0.12, 2);
            $finalAmount = round($baseSalary - $deduction, 2);
            DB::table('employee_payroll_data')->insert([
                'employee_id'        => $employeeId,
                'initial_amount'     => $baseSalary,
                'deduction_amount'   => $deduction,
                'final_amount'       => $finalAmount,
                'date_processed'     => '2025-01-31',
                'payroll_status'     => 'Released',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            // Water bill
            DB::table('employee_water_bill')->insert([
                'employee_id' => $employeeId,
                'water_bill_number' => sprintf('WB-%03d-2024', $i + 1),
                'account_name' => "{$firstName} {$middleName[0]}. {$lastName}",
                'address' => "{$streetNum} {$street}, {$city}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            InternalOrganizationSeeder::class,
            HolidaySeeder::class,
            FaceEmbeddingSeeder::class,
            RecognitionLogSeeder::class,
            AttendanceRecordSeeder::class,
            LeaveTypeSeeder::class,
            LeaveApplicationSeeder::class,
            // LeaveEntitlementSeeder::class,
        ]);
    }
}
