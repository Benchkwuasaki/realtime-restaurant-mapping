<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\LeaveApplication;
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

        // ── Approved ──────────────────────────────────────────────────────────
        // Past leaves that have already been approved by both supervisor & manager
        $approvedLeaves = [
            ['start' => '2026-01-06', 'end' => '2026-01-10', 'days' => 5],
            ['start' => '2026-01-20', 'end' => '2026-01-21', 'days' => 2],
            ['start' => '2026-02-03', 'end' => '2026-02-07', 'days' => 5],
            ['start' => '2026-02-16', 'end' => '2026-02-17', 'days' => 2],
            ['start' => '2026-02-23', 'end' => '2026-02-27', 'days' => 5],
            ['start' => '2026-03-02', 'end' => '2026-03-06', 'days' => 5],
            ['start' => '2026-03-10', 'end' => '2026-03-13', 'days' => 4],
            ['start' => '2026-03-16', 'end' => '2026-03-18', 'days' => 3],
        ];

        foreach ($approvedLeaves as $leave) {
            $approver  = $pick($employees);
            $manager   = $pick($employees);

            LeaveApplication::create([
                'employee_id'              => $pick($employees)->employee_id,
                'leave_type_id'            => $pick($leaveTypes)->leave_type_id,
                'start_date'               => $leave['start'],
                'end_date'                 => $leave['end'],
                'days_requested'           => $leave['days'],
                'reason'                   => 'Personal leave.',
                'status'                   => 'approved',
                'approved_by_supervisor'   => $approver->employee_id,
                'supervisor_approved_at'   => now()->subDays(rand(3, 10)),
                'approved_by_manager'      => $manager->employee_id,
                'manager_approved_at'      => now()->subDays(rand(1, 3)),
            ]);
        }

        // ── Pending ───────────────────────────────────────────────────────────
        // Recently submitted, not yet acted on
        $pendingLeaves = [
            ['start' => '2026-03-20', 'end' => '2026-03-20', 'days' => 1],
            ['start' => '2026-03-23', 'end' => '2026-03-24', 'days' => 2],
            ['start' => '2026-03-25', 'end' => '2026-03-27', 'days' => 3],
            ['start' => '2026-04-01', 'end' => '2026-04-04', 'days' => 4],
            ['start' => '2026-04-07', 'end' => '2026-04-11', 'days' => 5],
        ];

        foreach ($pendingLeaves as $leave) {
            LeaveApplication::create([
                'employee_id'    => $pick($employees)->employee_id,
                'leave_type_id'  => $pick($leaveTypes)->leave_type_id,
                'start_date'     => $leave['start'],
                'end_date'       => $leave['end'],
                'days_requested' => $leave['days'],
                'reason'         => 'Leave request pending approval.',
                'status'         => 'pending',
            ]);
        }

        // ── Rejected ──────────────────────────────────────────────────────────
        $rejectedLeaves = [
            ['start' => '2026-02-09', 'end' => '2026-02-13', 'days' => 5],
            ['start' => '2026-02-24', 'end' => '2026-02-25', 'days' => 2],
            ['start' => '2026-03-03', 'end' => '2026-03-04', 'days' => 2],
        ];

        foreach ($rejectedLeaves as $leave) {
            $rejector = $pick($employees);

            LeaveApplication::create([
                'employee_id'      => $pick($employees)->employee_id,
                'leave_type_id'    => $pick($leaveTypes)->leave_type_id,
                'start_date'       => $leave['start'],
                'end_date'         => $leave['end'],
                'days_requested'   => $leave['days'],
                'reason'           => 'Requested time off.',
                'status'           => 'rejected',
                'rejection_reason' => 'Insufficient leave balance / operational requirements.',
                'rejected_by'      => $rejector->employee_id,
                'rejected_at'      => now()->subDays(rand(2, 7)),
            ]);
        }

        // ── Cancelled ─────────────────────────────────────────────────────────
        $cancelledLeaves = [
            ['start' => '2026-02-18', 'end' => '2026-02-18', 'days' => 1],
            ['start' => '2026-03-09', 'end' => '2026-03-09', 'days' => 1],
        ];

        foreach ($cancelledLeaves as $leave) {
            LeaveApplication::create([
                'employee_id'    => $pick($employees)->employee_id,
                'leave_type_id'  => $pick($leaveTypes)->leave_type_id,
                'start_date'     => $leave['start'],
                'end_date'       => $leave['end'],
                'days_requested' => $leave['days'],
                'reason'         => 'Plans changed.',
                'status'         => 'cancelled',
            ]);
        }

        // ── Draft ─────────────────────────────────────────────────────────────
        $draftLeaves = [
            ['start' => '2026-04-14', 'end' => '2026-04-17', 'days' => 4],
            ['start' => '2026-04-20', 'end' => '2026-04-20', 'days' => 1],
        ];

        foreach ($draftLeaves as $leave) {
            LeaveApplication::create([
                'employee_id'    => $pick($employees)->employee_id,
                'leave_type_id'  => $pick($leaveTypes)->leave_type_id,
                'start_date'     => $leave['start'],
                'end_date'       => $leave['end'],
                'days_requested' => $leave['days'],
                'reason'         => null,
                'status'         => 'draft',
            ]);
        }

        $this->command->info('LeaveApplicationSeeder: seeded ' . LeaveApplication::count() . ' leave applications.');
    }
}