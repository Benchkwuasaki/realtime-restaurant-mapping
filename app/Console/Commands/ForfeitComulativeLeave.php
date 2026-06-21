<?php

namespace App\Console\Commands;

use App\Services\LeaveBalanceService;
use Illuminate\Console\Command;

/**
 * Artisan command: leave:forfeit-non-cumulative {year?}
 *
 * Zeroes out unused balances for all non-cumulative leave types
 * (Forced Leave, Special Privilege Leave, VAWC Leave, Solo Parent Leave,
 * Special Leave Benefit for Women) for the given cycle year.
 *
 * Schedule this command to run on January 1 each year in
 * App\Console\Kernel (or routes/console.php for Laravel 11+):
 *
 *   Schedule::command('leave:forfeit-non-cumulative')->yearlyOn(1, 1, '00:05');
 *
 * It is fully idempotent — safe to run more than once for the same year.
 */
class ForfeitNonCumulativeLeave extends Command
{
    protected $signature = 'leave:forfeit-non-cumulative
                            {year? : Cycle year to forfeit (defaults to the previous calendar year)}
                            {--dry-run : Preview how many rows would be affected without writing}';

    protected $description = 'Zero out unused non-cumulative leave balances at year-end (CSC Rule XVI)';

    public function __construct(private readonly LeaveBalanceService $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        // Default to the previous year — this command normally runs on Jan 1
        // to close out the year that just ended.
        $year = (int) ($this->argument('year') ?? (date('Y') - 1));

        if ($this->option('dry-run')) {
            $this->info("[Dry run] Would forfeit non-cumulative balances for cycle year {$year}.");
            $this->info('Run without --dry-run to apply.');
            return self::SUCCESS;
        }

        $this->info("Forfeiting non-cumulative leave balances for cycle year {$year}...");

        $count = $this->service->forfeitNonCumulativeBalances($year);

        if ($count === 0) {
            $this->info("No non-cumulative balances to forfeit for {$year}.");
        } else {
            $this->info("Done. {$count} balance row(s) zeroed for cycle year {$year}.");
        }

        return self::SUCCESS;
    }
}   