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
            // Accrues at 1.25 days/month (15 days/year) from day of hire.
            // Cumulative — unused balance carries over year to year.
            // Exception: the 5-day Forced Leave and 3-day Special Privilege Leave
            // portions are non-cumulative and forfeited if unused by year-end.
            [
                'leave_type_name'        => 'Vacation Leave',
                'leave_type_description' => 'Leave granted to employees for personal rest, recreation, and other personal matters. Accrued at 1.25 days per month of service. The remaining balance after mandatory Forced Leave (5 days) and Special Privilege Leave (3 days) is cumulative.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 15.0,
                        'leave_entitlement_description' => '15 days per year (1.25 days/month accrual) from day of hire. Cumulative except for the 5-day Forced Leave and 3-day Special Privilege Leave portions which are forfeited if unused.',
                    ],
                ],
            ],

            // ── Sick Leave ─────────────────────────────────────────────────────
            // Accrues at 1.25 days/month (15 days/year) from day of hire.
            // Fully cumulative — unused balance carries over year to year.
            [
                'leave_type_name'        => 'Sick Leave',
                'leave_type_description' => 'Leave granted when the employee is incapacitated from the performance of duty due to illness or injury, or when the employee needs medical consultation. Accrued at 1.25 days per month.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => true,
                'is_accrual'             => true,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Medical Certificate (for absences of more than 5 days)',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 15.0,
                        'leave_entitlement_description' => '15 days per year (1.25 days/month accrual) from day of hire. Fully cumulative — unused balance carries over indefinitely.',
                    ],
                ],
            ],

            // ── Forced Leave ───────────────────────────────────────────────────
            // Mandatory 5 days drawn from Vacation Leave.
            // Only granted when the employee's VL balance reaches ≥ 10 days.
            // Non-cumulative — forfeited at year-end if unused.
            // NOT pre-seeded as a balance row; granted dynamically by
            // LeaveBalanceService::applyThresholdGrants() when VL ≥ 10.
            [
                'leave_type_name'        => 'Forced Leave',
                'leave_type_description' => 'Mandatory vacation leave of at least 5 working days annually, required for all employees with 10 or more days of accumulated Vacation Leave credits. Charged against Vacation Leave. Non-cumulative — forfeited if unused at year-end.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 5.0,
                        'leave_entitlement_description' => '5 mandatory working days per year, charged against Vacation Leave. Granted automatically when VL balance reaches ≥ 10 days. Forfeited if not used within the cycle year.',
                    ],
                ],
            ],

            // ── Special Privilege Leave ────────────────────────────────────────
            // 3 days drawn from Vacation Leave for personal milestones and
            // family obligations (birthdays, anniversaries, school events, etc.).
            // Only granted when the employee's VL balance reaches ≥ 10 days.
            // Non-cumulative — forfeited at year-end if unused.
            // NOT pre-seeded as a balance row; granted dynamically by
            // LeaveBalanceService::applyThresholdGrants() when VL ≥ 10.
            [
                'leave_type_name'        => 'Special Privilege Leave',
                'leave_type_description' => 'Leave of up to 3 days per year for personal milestones and attendance to family obligations such as birthdays, wedding anniversaries, enrollment of children, graduation, and other similar events. Charged against Vacation Leave. Non-cumulative and non-commutative.',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 3.0,
                        'leave_entitlement_description' => '3 days per year for personal milestones and family obligations, charged against Vacation Leave. Granted automatically when VL balance reaches ≥ 10 days. Non-cumulative and non-convertible to cash.',
                    ],
                ],
            ],

            // ── Maternity Leave ────────────────────────────────────────────────
            // Two entitlement rows: live birth (105 days) and miscarriage (60 days).
            // No years-of-service requirement. Eligible: Female employees only.
            [
                'leave_type_name'        => 'Maternity Leave',
                'leave_type_description' => 'Leave granted to female government employees for every instance of pregnancy, miscarriage, or emergency termination of pregnancy regardless of frequency. Granted under RA 11210 (105-Day Expanded Maternity Leave Law).',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Medical Certificate',
                    'Birth Certificate (after delivery)',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 105.0,
                        'leave_entitlement_description' => '105 days for live birth; additional 15 days if the female employee is a solo parent under RA 8972. No minimum service requirement.',
                    ],
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 60.0,
                        'leave_entitlement_description' => '60 days for miscarriage or emergency termination of pregnancy. No minimum service requirement.',
                    ],
                ],
            ],

            // ── Paternity Leave ────────────────────────────────────────────────
            // 7 working days for first four deliveries of legitimate spouse.
            // No years-of-service requirement. Eligible: Married male employees.
            [
                'leave_type_name'        => 'Paternity Leave',
                'leave_type_description' => 'Leave granted to all married male employees in the government for the first four deliveries of the legitimate spouse. Granted under RA 8187 (Paternity Leave Act of 1996).',
                'eligible_sex'           => 'Male',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Marriage Certificate',
                    'Birth Certificate of Child',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 7.0,
                        'leave_entitlement_description' => '7 working days for each of the first four deliveries of the legitimate spouse. No minimum service requirement.',
                    ],
                ],
            ],

            // ── Solo Parent Leave ──────────────────────────────────────────────
            // 7 working days per year. Requires Solo Parent ID from DSWD.
            // Eligible: All employees with a valid Solo Parent ID.
            [
                'leave_type_name'        => 'Solo Parent Leave',
                'leave_type_description' => 'Leave granted to solo parents to perform parental duties and responsibilities where the physical presence of the parent is required. Granted under RA 8972 (Solo Parents\' Welfare Act).',
                'eligible_sex'           => 'All',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Solo Parent Identification Card issued by the DSWD',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 7.0,
                        'leave_entitlement_description' => '7 working days per year. Requires a valid Solo Parent ID from the DSWD.',
                    ],
                ],
            ],

            // ── Special Leave Benefit for Women ───────────────────────────────
            // Up to 60 working days (2 months) for gynecological surgery.
            // Eligibility: Female + at least 6 months aggregate service in the
            // last 12 months prior to surgery (rolling lookback, not annual reset).
            // NOT pre-seeded as a balance row — validated and granted at filing
            // time by LeaveBalanceService::checkSLBEligibility().
            [
                'leave_type_name'        => 'Special Leave Benefit for Women',
                'leave_type_description' => 'Leave benefit granted to female employees who have rendered at least six months of continuous aggregate employment service in the last 12 months for surgery caused by gynecological disorders. Granted under RA 9710 (Magna Carta of Women). Non-cumulative.',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Medical Certificate with diagnosis and recommendation for surgery',
                    'Operative Record / Discharge Summary (after surgery)',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 60.0,
                        'leave_entitlement_description' => 'Up to 60 working days (2 months) per year for gynecological surgery. Requires at least 6 months aggregate service in the last 12 months prior to surgery. Non-cumulative — not carried over to the next year.',
                    ],
                ],
            ],

            // ── VAWC Leave ─────────────────────────────────────────────────────
            // Up to 10 days paid leave. No years-of-service requirement.
            // Eligible: Female employees who are victims of violence under RA 9262.
            [
                'leave_type_name'        => 'VAWC Leave',
                'leave_type_description' => 'Leave granted to women employees who are victims of violence under RA 9262 (Anti-Violence Against Women and Their Children Act of 2004) to attend to medical, legal, and other needs.',
                'eligible_sex'           => 'Female',
                'is_paid'                => true,
                'is_convertible'         => false,
                'is_accrual'             => false,
                'status'                 => true,
                'requirements'           => [
                    'Leave Application Form',
                    'Barangay Protection Order (BPO) or Temporary/Permanent Protection Order (TPO/PPO)',
                    'Certificate from DSWD, court, or other government agency',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 10.0,
                        'leave_entitlement_description' => '10 days paid leave. Non-cumulative and non-convertible to cash. No minimum service requirement.',
                    ],
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
                'requirements'           => [
                    'Leave Application Form',
                    'Proof of Enrollment or Examination Schedule',
                    'Agency Head Approval',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 6.0,
                        'leave_entitlement_description' => 'Up to 6 days for bar or board licensure examinations.',
                    ],
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 180.0,
                        'leave_entitlement_description' => 'Up to 6 months for completion of master\'s degree (subject to agency head approval and service obligation).',
                    ],
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
                'requirements'           => [
                    'Leave Application Form',
                    'Medical Certificate with doctor\'s recommendation',
                    'Accident / Incident Report',
                    'Agency Head Approval',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 180.0,
                        'leave_entitlement_description' => 'Up to 6 months without charge to leave credits, subject to approval.',
                    ],
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
                'requirements'           => [
                    'Leave Application Form',
                    'Proof of Residency in Affected Area (if required)',
                ],
                'entitlements' => [
                    [
                        'years_of_service'              => 0,
                        'days_entitled'                 => 5.0,
                        'leave_entitlement_description' => 'Up to 5 days per calamity/disaster occurrence as authorized by the CSC or relevant authority.',
                    ],
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
                'requirements'           => [
                    'Leave Application Form',
                    'Agency Head Approval',
                ],
                'entitlements'           => [],
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

        $this->command->info('LeaveTypeSeeder: seeded ' . LeaveType::count() . ' leave types with entitlements.');
    }
}