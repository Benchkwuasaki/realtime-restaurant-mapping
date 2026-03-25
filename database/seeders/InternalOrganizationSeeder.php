<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\InternalOrganization;
use App\Models\InternalOrgType;
use Illuminate\Database\Seeder;

class InternalOrganizationSeeder extends Seeder
{
    public function run(): void
    {
        // Resolve type IDs once — assumes InternalOrgTypeSeeder / migration seeding ran first
        $typeIds = InternalOrgType::pluck('internal_org_type_id', 'internal_org_type');

        // The EmployeeSeeder creates 100 employees assigned work_id EMP-0001 through EMP-0100.
        // We resolve their employee_ids by work_id so the mapping is deterministic regardless
        // of auto-increment state.
        $empByWorkId = Employee::pluck('employee_id', 'work_id');

        // Helper: resolve employee_id from 1-based seeder index (EMP-0001 = index 1)
        $emp = fn (int $n) => $empByWorkId[sprintf('EMP-%04d', $n)] ?? null;

        // Pick heads that are spread across departments and position types:
        //   EMP-0001  → HR Officer (i=0)
        //   EMP-0005  → HR Division Chief (i=4)
        //   EMP-0009  → Operations Coordinator (i=6, 1-based offset)
        //   EMP-0015  → Accountant (i=14)
        //   EMP-0019  → Finance Manager (i=18)
        //   EMP-0020  → Records Officer (i=19)
        //   EMP-0025  → Legal Officer (i=24)
        //   EMP-0027  → Legal Division Chief (i=26)
        //   EMP-0014  → IT Manager (i=13)
        //   EMP-0008  → Public Affairs Officer (i=7)
        //   EMP-0022  → Procurement Officer (i=21)
        //   EMP-0024  → Admin Division Chief (i=23)
        //   EMP-0010  → Senior Developer (i=9)

        $organizations = [
            // ── Unions ───────────────────────────────────────────────────────────
            [
                'code' => 'UN-001',
                'name' => 'General Workers Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head_employee_id' => $emp(1),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'UN-002',
                'name' => 'Technical Employees Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head_employee_id' => $emp(14),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'UN-003',
                'name' => 'Administrative Staff Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head_employee_id' => $emp(24),
                'payroll_deduction_linked' => false,
                'status' => false,
            ],

            // ── Cooperatives ─────────────────────────────────────────────────────
            [
                'code' => 'CO-001',
                'name' => 'Employees Multi-Purpose Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head_employee_id' => $emp(5),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'CO-002',
                'name' => 'Staff Savings and Credit Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head_employee_id' => $emp(15),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'CO-003',
                'name' => 'Workers Consumer Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head_employee_id' => $emp(19),
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'CO-004',
                'name' => 'Health Services Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head_employee_id' => $emp(22),
                'payroll_deduction_linked' => false,
                'status' => false,
            ],

            // ── Associations ─────────────────────────────────────────────────────
            [
                'code' => 'AS-001',
                'name' => 'Employees Welfare Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head_employee_id' => $emp(8),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'AS-002',
                'name' => 'Retired Employees Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head_employee_id' => $emp(25),
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'AS-003',
                'name' => 'Women in the Workplace Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head_employee_id' => $emp(10),
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'AS-004',
                'name' => 'Sports and Recreation Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head_employee_id' => $emp(20),
                'payroll_deduction_linked' => false,
                'status' => false,
            ],
            [
                'code' => 'AS-005',
                'name' => 'Professional Development Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head_employee_id' => $emp(27),
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
        ];

        foreach ($organizations as $org) {
            $record = InternalOrganization::updateOrCreate(
                ['code' => $org['code']],
                $org
            );

            // The head is automatically a member of their organization
            if ($org['head_employee_id']) {
                $record->members()->syncWithoutDetaching([$org['head_employee_id']]);
            }
        }
    }
}
