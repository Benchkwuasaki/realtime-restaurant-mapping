<?php

namespace Database\Seeders;

use App\Models\InternalOrganization;
use Illuminate\Database\Seeder;

class InternalOrganizationSeeder extends Seeder
{
    public function run(): void
    {
        $organizations = [
            // ── Unions ──────────────────────────────────────────────────────────
            [
                'code'                     => 'UN-001',
                'name'                     => 'General Workers Union',
                'type'                     => 'Union',
                'head'                     => 'Ricardo Santos',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'UN-002',
                'name'                     => 'Technical Employees Union',
                'type'                     => 'Union',
                'head'                     => 'Maria Dela Cruz',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'UN-003',
                'name'                     => 'Administrative Staff Union',
                'type'                     => 'Union',
                'head'                     => 'Jose Reyes',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],

            // ── Cooperatives ─────────────────────────────────────────────────────
            [
                'code'                     => 'CO-001',
                'name'                     => 'Employees Multi-Purpose Cooperative',
                'type'                     => 'Cooperative',
                'head'                     => 'Lorna Bautista',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-002',
                'name'                     => 'Staff Savings and Credit Cooperative',
                'type'                     => 'Cooperative',
                'head'                     => 'Antonio Villanueva',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-003',
                'name'                     => 'Workers Consumer Cooperative',
                'type'                     => 'Cooperative',
                'head'                     => 'Carla Mendoza',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'CO-004',
                'name'                     => 'Health Services Cooperative',
                'type'                     => 'Cooperative',
                'head'                     => 'Benjamin Torres',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],

            // ── Associations ─────────────────────────────────────────────────────
            [
                'code'                     => 'AS-001',
                'name'                     => 'Employees Welfare Association',
                'type'                     => 'Association',
                'head'                     => 'Gloria Ramos',
                'payroll_deduction_linked' => true,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-002',
                'name'                     => 'Retired Employees Association',
                'type'                     => 'Association',
                'head'                     => 'Eduardo Flores',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-003',
                'name'                     => 'Women in the Workplace Association',
                'type'                     => 'Association',
                'head'                     => 'Sophia Garcia',
                'payroll_deduction_linked' => false,
                'status'                   => true,
            ],
            [
                'code'                     => 'AS-004',
                'name'                     => 'Sports and Recreation Association',
                'type'                     => 'Association',
                'head'                     => 'Ramon Castillo',
                'payroll_deduction_linked' => false,
                'status'                   => false,
            ],
            [
                'code'                     => 'AS-005',
                'name'                     => 'Professional Development Association',
                'type'                     => 'Association',
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