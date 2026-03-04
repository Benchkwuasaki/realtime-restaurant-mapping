<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use App\Models\LeaveTypeRequirement;
use App\Models\LeaveEntitlement;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypes = [

            // ── Vacation Leave ─────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Vacation Leave',
                'leave_type_description' => 'Leave granted to employees for personal rest and recreation.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'First year of service.'],
                ],
            ],

            // ── Sick Leave ─────────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Sick Leave',
                'leave_type_description' => 'Leave granted when the employee is unable to work due to illness or injury.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Medical Certificate'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'Per year.'],
                ],
            ],

            // ── Maternity Leave ────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Maternity Leave',
                'leave_type_description' => 'Leave granted to female employees for childbirth, miscarriage, or emergency termination of pregnancy.',
                'eligible_sex'           => 'female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Medical Certificate'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 105.0, 'leave_entitlement_description' => '105 days per childbirth.'],
                ],
            ],

            // ── Paternity Leave ────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Paternity Leave',
                'leave_type_description' => 'Leave granted to married male employees upon the delivery of their legitimate spouse.',
                'eligible_sex'           => 'male',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Marriage Certificate'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 working days per childbirth.'],
                ],
            ],

            // ── Solo Parent Leave ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Solo Parent Leave',
                'leave_type_description' => 'Leave granted to solo parents to perform parental duties.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Solo Parent ID'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 days per year.'],
                ],
            ],

            // ── Study Leave ────────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Study Leave',
                'leave_type_description' => 'Leave granted for academic or professional studies.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Enrollment Slip'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 6.0, 'leave_entitlement_description' => 'Subject to approval.'],
                ],
            ],

            // ── Rehabilitation Leave ───────────────────────────────────────────
            [
                'leave_type_name'        => 'Rehabilitation Leave',
                'leave_type_description' => 'Leave granted for work-related injuries.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                    ['requirement_name' => 'Medical Certificate'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 180.0, 'leave_entitlement_description' => 'Up to 6 months.'],
                ],
            ],

            // ── Leave Without Pay ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Leave Without Pay',
                'leave_type_description' => 'Leave granted when all leave credits are exhausted.',
                'eligible_sex'           => 'all',
                'is_paid'                => false,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form'],
                ],
                'entitlements' => [],
            ],
        ];

        foreach ($leaveTypes as $data) {
            $requirements = $data['requirements'];
            $entitlements = $data['entitlements'];

            unset($data['requirements'], $data['entitlements']);

            $leaveType = LeaveType::create($data);

            foreach ($requirements as $req) {
                LeaveTypeRequirement::create([
                    'leave_type_id'    => $leaveType->leave_type_id,
                    'requirement_name' => $req['requirement_name'],
                ]);
            }

            foreach ($entitlements as $ent) {
                LeaveEntitlement::create([
                    'leave_type_id'                 => $leaveType->leave_type_id,
                    'years_of_service'              => $ent['years_of_service'],
                    'days_entitled'                 => $ent['days_entitled'],
                    'leave_entitlement_description' => $ent['leave_entitlement_description'],
                ]);
            }
        }

        $this->command->info('LeaveTypeSeeder: seeded ' . LeaveType::count() . ' leave types.');
    }
}