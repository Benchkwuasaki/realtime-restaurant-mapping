<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Services\LeaveBalanceService;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * CheckLeaveEntitlements
 *
 * Scheduled to run DAILY. Handles two automatic leave grant rules:
 *
 * 1. VL THRESHOLD GRANTS (Forced Leave + Special Privilege Leave)
 *    Checks every active employee's current Vacation Leave balance.
 *    If VL ≥ 10 days and the grant rows don't yet exist for this cycle year,
 *    they are created automatically.
 *
 * 2. (SLB for Women is NOT handled here — it uses a rolling 12-month lookback
 *    relative to the surgery date, so it cannot be pre-granted. It is instead
 *    validated and granted at leave filing time via LeaveBalanceService::applySLBGrant().)
 *
 * Register in app/Console/Kernel.php:
 *   $schedule->command('leave:check-entitlements')->daily();
 *
 * Or in routes/console.php (Laravel 10+):
 *   Schedule::command('leave:check-entitlements')->daily();
 */
class CheckLeaveEntitlements extends Command
{
    protected $signature = 'leave:check-entitlements
                            {--year= : Cycle year to check (defaults to current year)}
                            {--employee= : Run for a single employee ID only}
                            {--dry-run : Preview what would be granted without writing to DB}';

    protected $description = 'Apply automatic leave grants: Forced Leave and Special Privilege Leave when VL balance ≥ 10 days.';

    public function __construct(private readonly LeaveBalanceService $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $cycleYear  = (int) ($this->option('year') ?: date('Y'));
        $employeeId = $this->option('employee') ? (int) $this->option('employee') : null;
        $dryRun     = (bool) $this->option('dry-run');

        $this->info("Leave entitlement check — cycle year: {$cycleYear}" . ($dryRun ? ' [DRY RUN]' : ''));
        $this->newLine();

        // ── 1. VL Threshold Grants ────────────────────────────────────────────

        $this->info('── Step 1: VL Threshold Grants (Forced Leave + Special Privilege Leave) ──');

        if ($employeeId) {
            $this->processThresholdForEmployee($employeeId, $cycleYear, $dryRun);
        } else {
            $this->processThresholdForAllEmployees($cycleYear, $dryRun);
        }

        $this->newLine();
        $this->info('Done.');

        return Command::SUCCESS;
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function processThresholdForEmployee(int $employeeId, int $cycleYear, bool $dryRun): void
    {
        $employee = Employee::with('basicInfo')->find($employeeId);

        if (! $employee) {
            $this->error("Employee ID {$employeeId} not found.");
            return;
        }

        $name = $employee->basicInfo?->full_name ?? "Employee #{$employeeId}";

        if ($dryRun) {
            $this->line("  [DRY RUN] Would check threshold grants for: {$name}");
            return;
        }

        $granted = $this->service->applyThresholdGrants($employeeId, $cycleYear);

        if (empty($granted)) {
            $this->line("  {$name} — no new grants (VL < 10 or already granted).");
        } else {
            $this->line("  <fg=green>✓</> {$name} — granted: " . implode(', ', $granted));
        }
    }

    private function processThresholdForAllEmployees(int $cycleYear, bool $dryRun): void
    {
        if ($dryRun) {
            // In dry-run mode, just show who WOULD receive grants
            $employees = Employee::with(['basicInfo', 'leaveBalances' => fn($q) => $q->where('cycle_year', $cycleYear)])
                ->where('status', true)
                ->get();

            $wouldGrant = 0;

            foreach ($employees as $employee) {
                $name = $employee->basicInfo?->full_name ?? "Employee #{$employee->employee_id}";

                // Check VL balance manually without writing
                $vlBalance = $employee->leaveBalances
                    ->first(fn($b) => $b->leaveType?->leave_type_name === 'Vacation Leave');

                if ($vlBalance && (float) $vlBalance->balance >= 10.0) {
                    $this->line("  [DRY RUN] Would grant Forced Leave + Special Privilege Leave → {$name} (VL: {$vlBalance->balance})");
                    $wouldGrant++;
                }
            }

            $this->info("  Dry run complete — {$wouldGrant} employee(s) would receive grants.");
            return;
        }

        // Live run — delegate entirely to the service
        $summary    = $this->service->applyThresholdGrantsForYear($cycleYear);
        $totalGrants = count($summary);

        if ($totalGrants === 0) {
            $this->line('  No new threshold grants needed — all qualifying employees are already up to date.');
        } else {
            foreach ($summary as $empId => $grantedTypes) {
                $employee = Employee::with('basicInfo')->find($empId);
                $name     = $employee?->basicInfo?->full_name ?? "Employee #{$empId}";
                $this->line("  <fg=green>✓</> {$name} — granted: " . implode(', ', $grantedTypes));
            }

            $this->newLine();
            $this->info("  Total: {$totalGrants} employee(s) received new grants.");
        }
    }
}