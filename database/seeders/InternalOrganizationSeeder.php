<?php

namespace Database\Seeders;

use App\Models\InternalOrganization;
use App\Models\InternalOrgType;
use Illuminate\Database\Seeder;

class InternalOrganizationSeeder extends Seeder
{
    public function run(): void
    {
        // Resolve type IDs once — assumes InternalOrgTypeSeeder / migration seeding ran first
        $typeIds = InternalOrgType::pluck('internal_org_type_id', 'internal_org_type');

        $organizations = [
            // ── Unions ───────────────────────────────────────────────────────────
            [
                'code'                     => 'UN-001',
                'name'                     => 'General Workers Union',
                'internal_org_type_id'     => $typeIds['Union'],
                'head'                     => 'Ricardo Santos',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'UN-002',
                'name'                     => 'Technical Employees Union',
                'internal_org_type_id'     => $typeIds['Union'],
                'head'                     => 'Maria Dela Cruz',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'UN-003',
                'name'                     => 'Administrative Staff Union',
                'internal_org_type_id'     => $typeIds['Union'],
                'head'                     => 'Jose Reyes',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],

            // ── Cooperatives ─────────────────────────────────────────────────────
            [
                'code'                     => 'CO-001',
                'name'                     => 'Employees Multi-Purpose Cooperative',
                'internal_org_type_id'     => $typeIds['Cooperative'],
                'head'                     => 'Lorna Bautista',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-002',
                'name'                     => 'Staff Savings and Credit Cooperative',
                'internal_org_type_id'     => $typeIds['Cooperative'],
                'head'                     => 'Antonio Villanueva',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-003',
                'name'                     => 'Workers Consumer Cooperative',
                'internal_org_type_id'     => $typeIds['Cooperative'],
                'head'                     => 'Carla Mendoza',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-004',
                'name'                     => 'Health Services Cooperative',
                'internal_org_type_id'     => $typeIds['Cooperative'],
                'head'                     => 'Benjamin Torres',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],

            // ── Associations ─────────────────────────────────────────────────────
            [
                'code'                     => 'AS-001',
                'name'                     => 'Employees Welfare Association',
                'internal_org_type_id'     => $typeIds['Association'],
                'head'                     => 'Gloria Ramos',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-002',
                'name'                     => 'Retired Employees Association',
                'internal_org_type_id'     => $typeIds['Association'],
                'head'                     => 'Eduardo Flores',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-003',
                'name'                     => 'Women in the Workplace Association',
                'internal_org_type_id'     => $typeIds['Association'],
                'head'                     => 'Sophia Garcia',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-004',
                'name'                     => 'Sports and Recreation Association',
                'internal_org_type_id'     => $typeIds['Association'],
                'head'                     => 'Ramon Castillo',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],
            [
                'code'                     => 'AS-005',
                'name'                     => 'Professional Development Association',
                'internal_org_type_id'     => $typeIds['Association'],
                'head'                     => 'Patricia Navarro',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
        ];

        foreach ($organizations as $org) {
            InternalOrganization::updateOrCreate(
                ['code' => $org['code']],
                $org
            );
        }
    }
}