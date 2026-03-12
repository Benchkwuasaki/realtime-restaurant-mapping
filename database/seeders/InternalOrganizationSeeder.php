<?php

namespace Database\Seeders;

use App\Models\InternalOrganization;
use App\Models\InternalOrganizationService;
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
                'code' => 'UN-001',
                'name' => 'General Workers Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head' => 'Ricardo Santos',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'UN-002',
                'name' => 'Technical Employees Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head' => 'Maria Dela Cruz',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'UN-003',
                'name' => 'Administrative Staff Union',
                'internal_org_type_id' => $typeIds['Union'],
                'head' => 'Jose Reyes',
                'payroll_deduction_linked' => false,
                'status' => false,
            ],

            // ── Cooperatives ─────────────────────────────────────────────────────
            [
                'code' => 'CO-001',
                'name' => 'Employees Multi-Purpose Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head' => 'Lorna Bautista',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'CO-002',
                'name' => 'Staff Savings and Credit Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head' => 'Antonio Villanueva',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'CO-003',
                'name' => 'Workers Consumer Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head' => 'Carla Mendoza',
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'CO-004',
                'name' => 'Health Services Cooperative',
                'internal_org_type_id' => $typeIds['Cooperative'],
                'head' => 'Benjamin Torres',
                'payroll_deduction_linked' => false,
                'status' => false,
            ],

            // ── Associations ─────────────────────────────────────────────────────
            [
                'code' => 'AS-001',
                'name' => 'Employees Welfare Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head' => 'Gloria Ramos',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
            [
                'code' => 'AS-002',
                'name' => 'Retired Employees Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head' => 'Eduardo Flores',
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'AS-003',
                'name' => 'Women in the Workplace Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head' => 'Sophia Garcia',
                'payroll_deduction_linked' => false,
                'status' => true,
            ],
            [
                'code' => 'AS-004',
                'name' => 'Sports and Recreation Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head' => 'Ramon Castillo',
                'payroll_deduction_linked' => false,
                'status' => false,
            ],
            [
                'code' => 'AS-005',
                'name' => 'Professional Development Association',
                'internal_org_type_id' => $typeIds['Association'],
                'head' => 'Patricia Navarro',
                'payroll_deduction_linked' => true,
                'status' => true,
            ],
        ];

        foreach ($organizations as $org) {
            InternalOrganization::updateOrCreate(['code' => $org['code']], $org);
        }

        // ── Services ───────────────────────────────────────────────────────────
        // NOTE: Loans are intentionally excluded here.
        // Internal org loans are entered via the Loan Entry page and stored in
        // the loans table with internal_organization_id FK.
        // InternalOrgDeduction only handles: Savings, Share_Capital, Dues.

        $servicesByOrgCode = [

            // ── UN-001: General Workers Union ──────────────────────────────────
            'UN-001' => [
                ['name' => 'Union Membership Dues', 'category' => InternalOrganizationService::CATEGORY_DUES,    'deductable_from_payroll' => true],
                ['name' => 'Union Mutual Aid Fund', 'category' => InternalOrganizationService::CATEGORY_SAVINGS, 'deductable_from_payroll' => true],
            ],

            // ── UN-002: Technical Employees Union ──────────────────────────────
            'UN-002' => [
                ['name' => 'Union Membership Dues', 'category' => InternalOrganizationService::CATEGORY_DUES,    'deductable_from_payroll' => true],
                ['name' => 'Union Solidarity Fund', 'category' => InternalOrganizationService::CATEGORY_SAVINGS, 'deductable_from_payroll' => true],
            ],

            // ── CO-001: Employees Multi-Purpose Cooperative ────────────────────
            'CO-001' => [
                ['name' => 'Regular Savings',            'category' => InternalOrganizationService::CATEGORY_SAVINGS,       'deductable_from_payroll' => true],
                ['name' => 'Share Capital Contribution', 'category' => InternalOrganizationService::CATEGORY_SHARE_CAPITAL, 'deductable_from_payroll' => true],
                ['name' => 'Membership Dues',            'category' => InternalOrganizationService::CATEGORY_DUES,          'deductable_from_payroll' => true],
            ],

            // ── CO-002: Staff Savings and Credit Cooperative ───────────────────
            'CO-002' => [
                ['name' => 'Compulsory Savings',         'category' => InternalOrganizationService::CATEGORY_SAVINGS,       'deductable_from_payroll' => true],
                ['name' => 'Voluntary Savings',          'category' => InternalOrganizationService::CATEGORY_SAVINGS,       'deductable_from_payroll' => true],
                ['name' => 'Share Capital Contribution', 'category' => InternalOrganizationService::CATEGORY_SHARE_CAPITAL, 'deductable_from_payroll' => true],
                ['name' => 'Membership Dues',            'category' => InternalOrganizationService::CATEGORY_DUES,          'deductable_from_payroll' => true],
            ],

            // ── AS-001: Employees Welfare Association ──────────────────────────
            'AS-001' => [
                ['name' => 'Association Membership Dues', 'category' => InternalOrganizationService::CATEGORY_DUES,    'deductable_from_payroll' => true],
                ['name' => 'Welfare Fund Savings',        'category' => InternalOrganizationService::CATEGORY_SAVINGS, 'deductable_from_payroll' => true],
            ],

            // ── AS-005: Professional Development Association ───────────────────
            'AS-005' => [
                ['name' => 'Association Membership Dues',   'category' => InternalOrganizationService::CATEGORY_DUES,    'deductable_from_payroll' => true],
                ['name' => 'Professional Development Fund', 'category' => InternalOrganizationService::CATEGORY_SAVINGS, 'deductable_from_payroll' => true],
            ],
        ];

        foreach ($servicesByOrgCode as $orgCode => $services) {
            $org = InternalOrganization::where('code', $orgCode)->first();
            if (! $org) {
                continue;
            }

            foreach ($services as $service) {
                InternalOrganizationService::updateOrCreate(
                    [
                        'internal_organization_id' => $org->internal_organization_id,
                        'internal_organization_service_name' => $service['name'],
                    ],
                    [
                        'service_category' => $service['category'],
                        'deductable_from_payroll' => $service['deductable_from_payroll'],
                    ]
                );
            }
        }
    }
}
