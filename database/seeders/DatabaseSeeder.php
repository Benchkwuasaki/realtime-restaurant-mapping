<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

use function Symfony\Component\Clock\now;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
        ]);

        // ── 1. Salary Grade Steps ──────────────────────────────────
        $salaryGradeSteps = [
            ['salary_grade' =>  7, 'step' => 1, 'salary_amount' =>  17899.00],
            ['salary_grade' =>  8, 'step' => 1, 'salary_amount' =>  19077.00],
            ['salary_grade' => 10, 'step' => 1, 'salary_amount' =>  22316.00],
            ['salary_grade' => 11, 'step' => 1, 'salary_amount' =>  24887.00],
            ['salary_grade' => 12, 'step' => 1, 'salary_amount' =>  27608.00],
            ['salary_grade' => 13, 'step' => 1, 'salary_amount' =>  30531.00],
            ['salary_grade' => 14, 'step' => 1, 'salary_amount' =>  33452.00],
            ['salary_grade' => 15, 'step' => 1, 'salary_amount' =>  36619.00],
            ['salary_grade' => 16, 'step' => 1, 'salary_amount' =>  40208.00],
            ['salary_grade' => 18, 'step' => 1, 'salary_amount' =>  48597.00],
            ['salary_grade' => 20, 'step' => 1, 'salary_amount' =>  60268.00],
            ['salary_grade' => 22, 'step' => 1, 'salary_amount' =>  75406.00],
            ['salary_grade' => 24, 'step' => 1, 'salary_amount' =>  97744.00],
            ['salary_grade' => 26, 'step' => 1, 'salary_amount' => 126462.00],
        ];

        foreach ($salaryGradeSteps as $sg) {
            DB::table('salary_grade_steps')->insertGetId(
                array_merge($sg, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // ── 2. Departments ─────────────────────────────────────────
        $deptId = DB::table('departments')->insertGetId([
            'department_name'        => 'Office of Business Excellence',
            'department_acronym'     => 'OBE',
            'department_description' => 'Handles overall business operations and excellence.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $deptOpsId = DB::table('departments')->insertGetId([
            'department_name'        => 'Operations and Services Department',
            'department_acronym'     => 'OSD',
            'department_description' => 'Oversees daily operations, facilities, and customer-facing services.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $deptGovId = DB::table('departments')->insertGetId([
            'department_name'        => 'Governance and Public Affairs Department',
            'department_acronym'     => 'GPAD',
            'department_description' => 'Manages governance initiatives, public information, and stakeholder relations.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── 3. Divisions ───────────────────────────────────────────
        // OBE
        $divHrId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptId,
            'division_name'      => 'Human Resources Division',
            'division_acronym'   => 'HRD',
            'division_description'=> 'Manages recruitment, payroll, and employee relations.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divItId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptId,
            'division_name'      => 'Information Technology Division',
            'division_acronym'   => 'ITD',
            'division_description'=> 'Manages all IT infrastructure and software systems.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divFinId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptId,
            'division_name'      => 'Finance and Budget Division',
            'division_acronym'   => 'FBD',
            'division_description'=> 'Manages financial planning, budget allocation, and accounting.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divAdminId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptId,
            'division_name'      => 'Administrative Services Division',
            'division_acronym'   => 'ASD',
            'division_description'=> 'Handles general administrative support and records management.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divLegalId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptId,
            'division_name'      => 'Legal and Compliance Division',
            'division_acronym'   => 'LCD',
            'division_description'=> 'Provides legal counsel and ensures regulatory compliance.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // OSD
        $divOpsFieldId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptOpsId,
            'division_name'      => 'Field Operations Division',
            'division_acronym'   => 'FOD',
            'division_description'=> 'Coordinates field activities and service delivery operations.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divFacilitiesId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptOpsId,
            'division_name'      => 'Facilities Management Division',
            'division_acronym'   => 'FMD',
            'division_description'=> 'Manages facilities, assets, and building maintenance.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divCustomerId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptOpsId,
            'division_name'      => 'Customer Support Division',
            'division_acronym'   => 'CSD',
            'division_description'=> 'Handles client support, service desk, and feedback resolution.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // GPAD
        $divPolicyId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptGovId,
            'division_name'      => 'Policy and Standards Division',
            'division_acronym'   => 'PSD',
            'division_description'=> 'Develops policies, standards, and governance frameworks.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $divPublicAffairsId = DB::table('divisions')->insertGetId([
            'department_id'      => $deptGovId,
            'division_name'      => 'Public Affairs Division',
            'division_acronym'   => 'PAD',
            'division_description'=> 'Leads public information, communications, and stakeholder engagement.',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── 4. Units ───────────────────────────────────────────────
        $units = [
            // HRD
            ['division_id' => $divHrId,          'unit_name' => 'Recruitment Unit',                'unit_acronym' => 'RU',   'unit_description' => 'Handles hiring and onboarding of new employees.'],
            ['division_id' => $divHrId,          'unit_name' => 'Payroll and Benefits Unit',       'unit_acronym' => 'PBU',  'unit_description' => 'Processes payroll, benefits, and leave administration.'],
            // ITD
            ['division_id' => $divItId,          'unit_name' => 'Software Development Unit',       'unit_acronym' => 'SDU',  'unit_description' => 'Develops and maintains internal software systems.'],
            ['division_id' => $divItId,          'unit_name' => 'Infrastructure and Networks Unit','unit_acronym' => 'INU',  'unit_description' => 'Manages servers, networks, and IT infrastructure.'],
            // FBD
            ['division_id' => $divFinId,         'unit_name' => 'Accounting Unit',                 'unit_acronym' => 'AU',   'unit_description' => 'Handles general accounting, ledger, and audit support.'],
            ['division_id' => $divFinId,         'unit_name' => 'Budget Unit',                     'unit_acronym' => 'BU',   'unit_description' => 'Prepares and monitors budget allocations and utilization.'],
            // ASD
            ['division_id' => $divAdminId,       'unit_name' => 'Records Management Unit',         'unit_acronym' => 'RMU',  'unit_description' => 'Manages official documents and records.'],
            ['division_id' => $divAdminId,       'unit_name' => 'Procurement Unit',                'unit_acronym' => 'PU',   'unit_description' => 'Handles procurement of supplies and services.'],
            // LCD
            ['division_id' => $divLegalId,       'unit_name' => 'Legal Affairs Unit',              'unit_acronym' => 'LAU',  'unit_description' => 'Handles legal documentation and case management.'],
            // FOD
            ['division_id' => $divOpsFieldId,    'unit_name' => 'Dispatch and Coordination Unit',  'unit_acronym' => 'DCU',  'unit_description' => 'Coordinates schedules, dispatch, and field assignments.'],
            ['division_id' => $divOpsFieldId,    'unit_name' => 'Service Delivery Unit',           'unit_acronym' => 'SDU2', 'unit_description' => 'Ensures delivery of services to end-users and stakeholders.'],
            ['division_id' => $divOpsFieldId,    'unit_name' => 'Operations Quality Unit',         'unit_acronym' => 'OQU',  'unit_description' => 'Monitors operational KPIs and compliance to procedures.'],
            // FMD
            ['division_id' => $divFacilitiesId,  'unit_name' => 'Maintenance Unit',                'unit_acronym' => 'MU',   'unit_description' => 'Handles repairs, upkeep, and preventive maintenance.'],
            ['division_id' => $divFacilitiesId,  'unit_name' => 'Asset and Inventory Unit',        'unit_acronym' => 'AIU',  'unit_description' => 'Manages fixed assets, supplies, and inventory records.'],
            // CSD
            ['division_id' => $divCustomerId,    'unit_name' => 'Helpdesk Unit',                   'unit_acronym' => 'HDU',  'unit_description' => 'Handles tickets, inquiries, and first-level support.'],
            ['division_id' => $divCustomerId,    'unit_name' => 'Feedback and Resolution Unit',    'unit_acronym' => 'FRU',  'unit_description' => 'Manages feedback processing, escalation, and resolution.'],
            // PSD
            ['division_id' => $divPolicyId,      'unit_name' => 'Policy Development Unit',         'unit_acronym' => 'PDU',  'unit_description' => 'Drafts policies, circulars, and internal guidelines.'],
            ['division_id' => $divPolicyId,      'unit_name' => 'Compliance and Audit Unit',       'unit_acronym' => 'CAU',  'unit_description' => 'Performs compliance checks and internal audits.'],
            ['division_id' => $divPolicyId,      'unit_name' => 'Standards and Documentation Unit','unit_acronym' => 'SDU3', 'unit_description' => 'Maintains standards library, templates, and documentation.'],
            // PAD
            ['division_id' => $divPublicAffairsId,'unit_name' => 'Communications Unit',            'unit_acronym' => 'CU',   'unit_description' => 'Handles announcements, press releases, and internal comms.'],
            ['division_id' => $divPublicAffairsId,'unit_name' => 'Stakeholder Relations Unit',     'unit_acronym' => 'SRU',  'unit_description' => 'Manages external coordination and stakeholder engagement.'],
        ];

        $unitIds = [];
        foreach ($units as $unit) {
            $unitIds[$unit['unit_acronym']] = DB::table('units')->insertGetId(
                array_merge($unit, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // ── 5. Positions ───────────────────────────────────────────
        $positions = [
            // HR
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitIds['RU'],   'name' => 'HR Officer',             'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitIds['RU'],   'name' => 'Recruitment Specialist',  'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitIds['PBU'],  'name' => 'Payroll Officer',         'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitIds['PBU'],  'name' => 'Benefits Administrator',  'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => null,             'name' => 'HR Division Chief',       'sg_idx' => 9],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => null,             'name' => 'HR Manager',              'sg_idx' => 9],
            // Operations
            ['dept' => $deptOpsId, 'div' => $divOpsFieldId,  'unit' => $unitIds['DCU'],  'name' => 'Operations Coordinator',  'sg_idx' => 5],
            // Governance
            ['dept' => $deptGovId, 'div' => $divPublicAffairsId, 'unit' => $unitIds['CU'], 'name' => 'Public Affairs Officer','sg_idx' => 5],
            // IT
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitIds['SDU'],  'name' => 'Software Developer',      'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitIds['SDU'],  'name' => 'Senior Developer',        'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitIds['SDU'],  'name' => 'Systems Analyst',         'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitIds['INU'],  'name' => 'Systems Administrator',   'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitIds['INU'],  'name' => 'Network Engineer',        'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => null,             'name' => 'IT Manager',              'sg_idx' => 12],
            // Finance
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitIds['AU'],   'name' => 'Accountant',              'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitIds['AU'],   'name' => 'Senior Accountant',       'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitIds['BU'],   'name' => 'Budget Officer',          'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitIds['BU'],   'name' => 'Budget Analyst',          'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => null,             'name' => 'Finance Manager',         'sg_idx' => 11],
            // Admin
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitIds['RMU'],  'name' => 'Records Officer',         'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitIds['RMU'],  'name' => 'Administrative Aide',     'sg_idx' => 0],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitIds['PU'],   'name' => 'Procurement Officer',     'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitIds['PU'],   'name' => 'Procurement Specialist',  'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => null,             'name' => 'Admin Division Chief',    'sg_idx' => 9],
            // Legal
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => $unitIds['LAU'],  'name' => 'Legal Officer',           'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => $unitIds['LAU'],  'name' => 'Compliance Officer',      'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => null,             'name' => 'Legal Division Chief',    'sg_idx' => 10],
        ];

        foreach ($positions as $pos) {
            DB::table('positions')->insertGetId([
                'department_id' => $pos['dept'],
                'division_id'   => $pos['div'],
                'unit_id'       => $pos['unit'],
                'position_name' => $pos['name'],
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        // ── 6. Items ───────────────────────────────────────────────
        $positionsWithVacantSlot = [1, 4, 7, 10, 13, 16, 19, 21, 23, 24];

        $positionIds = DB::table('positions')->orderBy('position_id')->pluck('position_id')->toArray();

        foreach ($positionIds as $idx => $posId) {
            $posName       = $positions[$idx]['name'];
            $hasVacantSlot = in_array($idx, $positionsWithVacantSlot, true);
            $slotLimit     = $hasVacantSlot ? 5 : 4;

            for ($slot = 1; $slot <= $slotLimit; $slot++) {
                DB::table('items')->insertGetId([
                    'position_id' => $posId,
                    'item_name'   => "{$posName} Item {$slot}",
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        // ── 7. Employees & everything that hangs off them ──────────
        $this->call([
            EmployeeSeeder::class,
            UserSeeder::class,
            InternalOrganizationSeeder::class,
            LeaveTypeSeeder::class,
            LeaveBalanceSeeder::class,
            LeaveApplicationSeeder::class,
            AttendanceSeeder::class,
            HolidaySeeder::class,
        ]);
    }
}