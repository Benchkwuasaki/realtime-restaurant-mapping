<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\LeaveApplicationDetail;
use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveApplicationSeeder extends Seeder
{
    public function run(): void
    {
        // Requires at least one employee and one leave type to exist
        $employees  = Employee::with('basicInfo')->get();
        $leaveTypes = LeaveType::all();

        if ($employees->isEmpty() || $leaveTypes->isEmpty()) {
            $this->command->warn('Skipping LeaveApplicationSeeder — no employees or leave types found.');
            return;
        }

        // Helper: pick a random item from a collection
        $pick = fn($collection) => $collection->random();

        // ── Approved (status: 'Approval') ─────────────────────────────────────
        // Past leaves that have been fully approved
        $approvedLeaves = [
            ['start' => '2026-01-06', 'end' => '2026-01-10', 'filing' => '2025-12-20'],
            ['start' => '2026-01-20', 'end' => '2026-01-21', 'filing' => '2026-01-07'],
            ['start' => '2026-02-03', 'end' => '2026-02-07', 'filing' => '2026-01-20'],
            ['start' => '2026-02-16', 'end' => '2026-02-17', 'filing' => '2026-02-03'],
            ['start' => '2026-02-23', 'end' => '2026-02-27', 'filing' => '2026-02-10'],
            ['start' => '2026-03-02', 'end' => '2026-03-06', 'filing' => '2026-02-17'],
            ['start' => '2026-03-10', 'end' => '2026-03-13', 'filing' => '2026-02-24'],
            ['start' => '2026-03-16', 'end' => '2026-03-18', 'filing' => '2026-03-03'],
        ];

        foreach ($approvedLeaves as $leave) {
            $leaveType = $pick($leaveTypes);

            $application = LeaveApplication::create([
                'employee_id'             => $pick($employees)->employee_id,
                'leave_type_id'           => $leaveType->leave_type_id,
                'recommendation_officer'  => $pick($employees)->employee_id,
                'approval_officer'        => $pick($employees)->employee_id,
                'leave_type_availed'      => $leaveType->name,
                'date_of_filing'          => $leave['filing'],
                'start_date'              => $leave['start'],
                'end_date'                => $leave['end'],
                'is_requested'            => true,
                'is_with_pay'             => true,
                'approved_for_specifics'  => null,
                'status'                  => 'Approval',
            ]);

            LeaveApplicationDetail::create([
                'leave_application_id' => $application->leave_application_id,
                'leave_location'       => 'Home',
                'illness_details'      => null,
                'study_leave_purpose'  => null,
            ]);
        }

        // ── Pending ───────────────────────────────────────────────────────────
        // Recently submitted, awaiting recommendation officer action
        $pendingLeaves = [
            ['start' => '2026-03-20', 'end' => '2026-03-20', 'filing' => '2026-03-13'],
            ['start' => '2026-03-23', 'end' => '2026-03-24', 'filing' => '2026-03-14'],
            ['start' => '2026-03-25', 'end' => '2026-03-27', 'filing' => '2026-03-15'],
            ['start' => '2026-04-01', 'end' => '2026-04-04', 'filing' => '2026-03-18'],
            ['start' => '2026-04-07', 'end' => '2026-04-11', 'filing' => '2026-03-20'],
        ];

        foreach ($pendingLeaves as $leave) {
            $leaveType = $pick($leaveTypes);

            $application = LeaveApplication::create([
                'employee_id'            => $pick($employees)->employee_id,
                'leave_type_id'          => $leaveType->leave_type_id,
                'recommendation_officer' => $pick($employees)->employee_id,
                'approval_officer'       => $pick($employees)->employee_id,
                'leave_type_availed'     => $leaveType->name,
                'date_of_filing'         => $leave['filing'],
                'start_date'             => $leave['start'],
                'end_date'               => $leave['end'],
                'is_requested'           => true,
                'is_with_pay'            => false,
                'status'                 => 'Pending',
            ]);

            LeaveApplicationDetail::create([
                'leave_application_id' => $application->leave_application_id,
                'leave_location'       => null,
                'illness_details'      => null,
                'study_leave_purpose'  => null,
            ]);
        }

        // ── For Approval ──────────────────────────────────────────────────────
        // Recommended by officer, now awaiting final approval
        $forApprovalLeaves = [
            ['start' => '2026-03-28', 'end' => '2026-03-31', 'filing' => '2026-03-14'],
            ['start' => '2026-04-14', 'end' => '2026-04-17', 'filing' => '2026-03-28'],
        ];

        foreach ($forApprovalLeaves as $leave) {
            $leaveType = $pick($leaveTypes);

            $application = LeaveApplication::create([
                'employee_id'            => $pick($employees)->employee_id,
                'leave_type_id'          => $leaveType->leave_type_id,
                'recommendation_officer' => $pick($employees)->employee_id,
                'approval_officer'       => $pick($employees)->employee_id,
                'leave_type_availed'     => $leaveType->name,
                'date_of_filing'         => $leave['filing'],
                'start_date'             => $leave['start'],
                'end_date'               => $leave['end'],
                'is_requested'           => true,
                'is_with_pay'            => true,
                'status'                 => 'For Approval',
            ]);

            LeaveApplicationDetail::create([
                'leave_application_id' => $application->leave_application_id,
                'leave_location'       => 'Province',
                'illness_details'      => null,
                'study_leave_purpose'  => null,
            ]);
        }

        // ── For Disapproval ───────────────────────────────────────────────────
        // Flagged for disapproval, pending final decision
        $forDisapprovalLeaves = [
            ['start' => '2026-02-09', 'end' => '2026-02-13', 'filing' => '2026-01-27'],
            ['start' => '2026-02-24', 'end' => '2026-02-25', 'filing' => '2026-02-10'],
        ];

        foreach ($forDisapprovalLeaves as $leave) {
            $leaveType = $pick($leaveTypes);

            $application = LeaveApplication::create([
                'employee_id'              => $pick($employees)->employee_id,
                'leave_type_id'            => $leaveType->leave_type_id,
                'recommendation_officer'   => $pick($employees)->employee_id,
                'approval_officer'         => $pick($employees)->employee_id,
                'leave_type_availed'       => $leaveType->name,
                'date_of_filing'           => $leave['filing'],
                'start_date'               => $leave['start'],
                'end_date'                 => $leave['end'],
                'is_requested'             => true,
                'is_with_pay'              => false,
                'status'                   => 'For Disapproval',
                'for_disapproval_reason'   => 'Insufficient leave balance / operational requirements.',
            ]);

            LeaveApplicationDetail::create([
                'leave_application_id' => $application->leave_application_id,
                'leave_location'       => null,
                'illness_details'      => null,
                'study_leave_purpose'  => null,
            ]);
        }

        // ── Disapproved ───────────────────────────────────────────────────────
        // Fully disapproved leaves
        $disapprovedLeaves = [
            ['start' => '2026-03-03', 'end' => '2026-03-04', 'filing' => '2026-02-18'],
            ['start' => '2026-03-09', 'end' => '2026-03-09', 'filing' => '2026-02-24'],
        ];

        foreach ($disapprovedLeaves as $leave) {
            $leaveType = $pick($leaveTypes);

            $application = LeaveApplication::create([
                'employee_id'            => $pick($employees)->employee_id,
                'leave_type_id'          => $leaveType->leave_type_id,
                'recommendation_officer' => $pick($employees)->employee_id,
                'approval_officer'       => $pick($employees)->employee_id,
                'leave_type_availed'     => $leaveType->name,
                'date_of_filing'         => $leave['filing'],
                'start_date'             => $leave['start'],
                'end_date'               => $leave['end'],
                'is_requested'           => true,
                'is_with_pay'            => false,
                'status'                 => 'Disapproved',
                'disapproved_reason'     => 'Insufficient leave balance / operational requirements.',
            ]);

            LeaveApplicationDetail::create([
                'leave_application_id' => $application->leave_application_id,
                'leave_location'       => null,
                'illness_details'      => null,
                'study_leave_purpose'  => null,
            ]);
        }

        $this->command->info('LeaveApplicationSeeder: seeded ' . LeaveApplication::count() . ' leave applications.');
    }
}