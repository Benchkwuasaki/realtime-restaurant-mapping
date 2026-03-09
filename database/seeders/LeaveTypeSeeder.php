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
        LeaveTypeRequirement::query()->delete();
        LeaveEntitlement::query()->delete();
        LeaveType::query()->delete();

        $leaveTypes = [

            // ── Vacation Leave ─────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Vacation Leave',
                'leave_type_description' => 'Leave granted to employees for personal rest, recreation, and other personal matters. Accrued at 1.25 days per month of service.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => '15 days per year (1.25 days/month accrual).'],
                ],
            ],

            // ── Sick Leave ─────────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Sick Leave',
                'leave_type_description' => 'Leave granted when the employee is incapacitated from the performance of duty due to illness or injury, or when the employee needs medical consultation. Accrued at 1.25 days per month.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Medical Certificate (for absences of more than 5 days)',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 15.0, 'leave_entitlement_description' => '15 days per year (1.25 days/month accrual).'],
                ],
            ],

            // ── Maternity Leave ────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Maternity Leave',
                'leave_type_description' => 'Leave granted to female government employees for every instance of pregnancy, miscarriage, or emergency termination of pregnancy regardless of frequency. Granted under RA 11210 (105-Day Expanded Maternity Leave Law).',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Medical Certificate',
                    'Birth Certificate (after delivery)',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 105.0, 'leave_entitlement_description' => '105 days for live birth; additional 15 days if the female employee is a solo parent under RA 8972.'],
                    ['years_of_service' => 0, 'days_entitled' => 60.0,  'leave_entitlement_description' => '60 days for miscarriage or emergency termination of pregnancy.'],
                ],
            ],

            // ── Paternity Leave ────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Paternity Leave',
                'leave_type_description' => 'Leave granted to all married male employees in the government for the first four deliveries of the legitimate spouse. Granted under RA 8187 (Paternity Leave Act of 1996).',
                'eligible_sex'           => 'Male',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Marriage Certificate',
                    'Birth Certificate of Child',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 working days for each of the first four deliveries of the legitimate spouse.'],
                ],
            ],

            // ── Solo Parent Leave ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Solo Parent Leave',
                'leave_type_description' => 'Leave granted to solo parents to perform parental duties and responsibilities where the physical presence of the parent is required. Granted under RA 8972 (Solo Parents\' Welfare Act).',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Solo Parent Identification Card issued by the DSWD',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 7.0, 'leave_entitlement_description' => '7 working days per year.'],
                ],
            ],

            // ── Special Leave Benefit for Women ───────────────────────────────
            [
                'leave_type_name'        => 'Special Leave Benefit for Women',
                'leave_type_description' => 'Leave benefit granted to female employees who have rendered at least six months of continuous aggregate employment service for surgery caused by gynecological disorders. Granted under RA 9710 (Magna Carta of Women).',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Medical Certificate with diagnosis and recommendation for surgery',
                    'Operative Record / Discharge Summary (after surgery)',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 60.0, 'leave_entitlement_description' => 'Up to 2 months per year for gynecological surgery, non-cumulative.'],
                ],
            ],

            // ── Violence Against Women and their Children Leave ────────────────
            [
                'leave_type_name'        => 'VAWC Leave',
                'leave_type_description' => 'Leave granted to women employees who are victims of violence under RA 9262 (Anti-Violence Against Women and Their Children Act of 2004) to attend to medical, legal, and other needs.',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Barangay Protection Order (BPO) or Temporary/Permanent Protection Order (TPO/PPO)',
                    'Certificate from DSWD, court, or other government agency',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 10.0, 'leave_entitlement_description' => '10 days paid leave, non-cumulative and non-convertible to cash.'],
                ],
            ],

            // ── Study Leave ────────────────────────────────────────────────────
            [
                'leave_type_name'        => 'Study Leave',
                'leave_type_description' => 'Leave granted to employees to take a licensure examination or complete a master\'s degree in a field related to their work. Granted under CSC MC No. 41 s. 1998.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Proof of Enrollment or Examination Schedule',
                    'Agency Head Approval',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 6.0,   'leave_entitlement_description' => 'Up to 6 days for bar or board licensure examinations.'],
                    ['years_of_service' => 0, 'days_entitled' => 180.0, 'leave_entitlement_description' => 'Up to 6 months for completion of master\'s degree (subject to agency head approval and service obligation).'],
                ],
            ],

            // ── Rehabilitation Leave ───────────────────────────────────────────
            [
                'leave_type_name'        => 'Rehabilitation Leave',
                'leave_type_description' => 'Leave granted to employees who suffered injury while in the performance of duty. Intended to enable the employee to recuperate and restore full health and capacity. Granted under CSC rules.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Medical Certificate with doctor\'s recommendation',
                    'Accident / Incident Report',
                    'Agency Head Approval',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 180.0, 'leave_entitlement_description' => 'Up to 6 months without charge to leave credits, subject to approval.'],
                ],
            ],

            // ── Special Emergency Leave ────────────────────────────────────────
            [
                'leave_type_name'        => 'Special Emergency Leave',
                'leave_type_description' => 'Leave granted to employees in areas declared under state of calamity or those affected by natural or man-made disasters, epidemics, or public health emergencies. Granted under CSC Resolution or Executive Order.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Proof of Residency in Affected Area (if required)',
                ],
                'entitlements' => [
                    ['years_of_service' => 0, 'days_entitled' => 5.0, 'leave_entitlement_description' => 'Up to 5 days per calamity/disaster occurrence as authorized by the CSC or relevant authority.'],
                ],
            ],

            // ── Leave Without Pay ──────────────────────────────────────────────
            [
                'leave_type_name'        => 'Leave Without Pay',
                'leave_type_description' => 'Leave granted when the employee has exhausted all accumulated leave credits or is not yet entitled to any leave. May also cover absences for personal reasons beyond available credits.',
                'eligible_sex'           => 'All',
                'is_paid'                => false,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements' => [
                    'Leave Application Form',
                    'Agency Head Approval',
                ],
                'entitlements' => [],
            ],
        ];

        foreach ($leaveTypes as $data) {
            $requirements = $data['requirements'];
            $entitlements = $data['entitlements'];

            unset($data['requirements'], $data['entitlements']);

            $leaveType = LeaveType::create($data);

            foreach ($requirements as $requirementName) {
                LeaveTypeRequirement::create([
                    'leave_type_id'    => $leaveType->leave_type_id,
                    'requirement_name' => $requirementName,
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