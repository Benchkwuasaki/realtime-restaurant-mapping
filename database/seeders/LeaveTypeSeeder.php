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
                    ['requirement_name' => 'Leave Application Form', 'requirement_description' => 'Duly accomplished leave application form.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'First year of service.'],
                    ['years_of_service' => 1, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'Subsequent years of service.'],
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
                    ['requirement_name' => 'Leave Application Form',  'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Medical Certificate',      'requirement_description' => 'Required for absences of more than five consecutive days.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'First year of service.'],
                    ['years_of_service' => 1, 'days_entitled' => 15.0, 'leave_entitlement_description' => 'Subsequent years of service.'],
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
                    ['requirement_name' => 'Leave Application Form',   'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Medical Certificate',       'requirement_description' => 'Certified by an attending physician or midwife.'],
                    ['requirement_name' => 'Birth/Death Certificate',   'requirement_description' => 'Proof of live birth, stillbirth, or miscarriage.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 105.0, 'leave_entitlement_description' => '105 days for normal delivery; 120 days for solo parents.'],
                ],
            ],

            // ── Paternity Leave ────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Paternity Leave',
                'leave_type_description' => 'Leave granted to married male employees upon the delivery or miscarriage of their legitimate spouse.',
                'eligible_sex'           => 'male',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form',  'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Marriage Certificate',     'requirement_description' => 'Proof of legal marriage.'],
                    ['requirement_name' => 'Birth/Death Certificate',  'requirement_description' => 'Proof of delivery or miscarriage.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 working days per childbirth, up to 4 deliveries.'],
                ],
            ],

            // ── Special Leave Benefit for Women ───────────────────────────────
            [
                'leave_type_name'        => 'Special Leave Benefit for Women',
                'leave_type_description' => 'Leave for female employees who undergo surgery due to gynecological disorders.',
                'eligible_sex'           => 'female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form', 'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Medical Certificate',     'requirement_description' => 'Certified by a competent physician that the employee has undergone surgery.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 60.0, 'leave_entitlement_description' => 'Up to 2 months with full pay per surgery.'],
                ],
            ],

            // ── Solo Parent Leave ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Solo Parent Leave',
                'leave_type_description' => 'Leave granted to solo parents to perform parental duties and responsibilities.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form',  'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Solo Parent ID',           'requirement_description' => 'Valid Solo Parent ID issued by the DSWD.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 working days per year.'],
                ],
            ],

            // ── Study Leave ────────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Study Leave',
                'leave_type_description' => 'Leave granted for the pursuit of academic courses or professional review.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form',    'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Enrollment/Admission Slip', 'requirement_description' => 'Proof of enrollment or admission to the course.'],
                    ['requirement_name' => 'Approval from Head',        'requirement_description' => 'Written approval from the department head.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 6.0, 'leave_entitlement_description' => 'Up to 6 months for board exam review; up to 1 year for masteral/doctoral.'],
                ],
            ],

            // ── Rehabilitation Leave ───────────────────────────────────────────
            [
                'leave_type_name'        => 'Rehabilitation Leave',
                'leave_type_description' => 'Leave granted to employees injured while in the performance of duty.',
                'eligible_sex'           => 'all',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form', 'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Medical Certificate',     'requirement_description' => 'Certified by a government physician.'],
                    ['requirement_name' => 'Incident Report',         'requirement_description' => 'Official report of the work-related incident.'],
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 6.0, 'leave_entitlement_description' => 'Up to 6 months depending on injury severity.'],
                ],
            ],

            // ── Leave Without Pay ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Leave Without Pay',
                'leave_type_description' => 'Leave granted when the employee has exhausted all accrued leave credits.',
                'eligible_sex'           => 'all',
                'is_paid'                => false,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    ['requirement_name' => 'Leave Application Form', 'requirement_description' => 'Duly accomplished leave application form.'],
                    ['requirement_name' => 'Approval from Head',      'requirement_description' => 'Written approval from the department head.'],
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
                    'leave_type_id'           => $leaveType->leave_type_id,
                    'requirement_name'        => $req['requirement_name'],
                    'requirement_description' => $req['requirement_description'],
                ]);
            }

            foreach ($entitlements as $ent) {
                LeaveEntitlement::create([
                    'leave_type_id'                  => $leaveType->leave_type_id,
                    'years_of_service'               => $ent['years_of_service'],
                    'days_entitled'                  => $ent['days_entitled'],
                    'leave_entitlement_description'  => $ent['leave_entitlement_description'],
                ]);
            }
        }

        $this->command->info('LeaveTypeSeeder: seeded ' . LeaveType::count() . ' leave types.');
    }
}