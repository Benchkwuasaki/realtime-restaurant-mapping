<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * BackfillTypedColumnsSeeder
 *
 * Populates the two new typed classification columns from existing free-text data.
 * Run ONCE after deploying the migration that adds loan_classification and allowance_type.
 *
 * Safe to re-run — uses WHERE ... IS NULL so already-classified rows are never touched.
 *
 * Usage:
 *   php artisan db:seed --class=BackfillTypedColumnsSeeder
 */
class BackfillTypedColumnsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Backfilling loan_classification...');
        $this->backfillLoans();

        $this->command->info('Backfilling allowance_type on master allowances table...');
        $this->backfillAllowances();

        $this->command->info('Backfilling allowance_type on employee_allowances snapshot table...');
        $this->backfillEmployeeAllowances();

        $this->command->info('Done. Review any NULLs left using the queries in the output above.');
        $this->reportUnclassified();
    }

    // ── Loans ─────────────────────────────────────────────────────────────────

    private function backfillLoans(): void
    {
        // Guard: column might not exist if the migration hasn't run yet
        if (! $this->columnExists('loans', 'loan_classification')) {
            $this->command->warn('  loans.loan_classification column not found — skipping. Run php artisan migrate first.');
            return;
        }

        // GSIS regular (non-emergency)
        $count = DB::table('loans')
            ->whereNull('loan_classification')
            ->whereRaw("LOWER(source) = 'gsis'")
            ->whereRaw("LOWER(loan_type) NOT LIKE '%emergency%'")
            ->update(['loan_classification' => 'gsis_regular']);
        $this->command->line("  gsis_regular:   {$count} rows");

        // GSIS emergency
        $count = DB::table('loans')
            ->whereNull('loan_classification')
            ->whereRaw("LOWER(source) = 'gsis'")
            ->whereRaw("LOWER(loan_type) LIKE '%emergency%'")
            ->update(['loan_classification' => 'gsis_emergency']);
        $this->command->line("  gsis_emergency: {$count} rows");

        // Pag-IBIG (handles pag-ibig, pagibig, hdmf variants)
        $count = DB::table('loans')
            ->whereNull('loan_classification')
            ->whereRaw("LOWER(source) IN ('pag-ibig', 'pagibig', 'hdmf')")
            ->update(['loan_classification' => 'pagibig']);
        $this->command->line("  pagibig:        {$count} rows");

        // Internal org loans — identified by FK, not by source text
        if ($this->columnExists('loans', 'internal_organization_id')) {
            $count = DB::table('loans')
                ->whereNull('loan_classification')
                ->whereNotNull('internal_organization_id')
                ->update(['loan_classification' => 'internal_org']);
            $this->command->line("  internal_org:   {$count} rows");
        } else {
            $this->command->warn('  loans.internal_organization_id not found — internal_org skipped.');
        }

        // Report anything still unclassified so it can be handled manually
        $remaining = DB::table('loans')
            ->whereNull('loan_classification')
            ->where('status', 'Active')
            ->select('id', 'employee_id', 'source', 'loan_type')
            ->get();

        if ($remaining->isNotEmpty()) {
            $this->command->warn("  {$remaining->count()} active loan(s) could not be auto-classified:");
            foreach ($remaining as $loan) {
                $this->command->warn("    id={$loan->id} employee_id={$loan->employee_id} source=\"{$loan->source}\" type=\"{$loan->loan_type}\"");
            }
        }
    }

    // ── Master allowances ─────────────────────────────────────────────────────

    private function backfillAllowances(): void
    {
        if (! $this->columnExists('allowances', 'allowance_type')) {
            $this->command->warn('  allowances.allowance_type column not found — skipping. Run php artisan migrate first.');
            return;
        }

        $count = DB::table('allowances')
            ->whereNull('allowance_type')
            ->whereRaw("LOWER(name) LIKE '%pera%'")
            ->update(['allowance_type' => 'pera']);
        $this->command->line("  pera:             {$count} rows");

        $count = DB::table('allowances')
            ->whereNull('allowance_type')
            ->whereRaw("LOWER(name) LIKE '%rice%'")
            ->update(['allowance_type' => 'rice_subsidy']);
        $this->command->line("  rice_subsidy:     {$count} rows");

        $count = DB::table('allowances')
            ->whereNull('allowance_type')
            ->where(function ($q) {
                $q->whereRaw("LOWER(name) LIKE '%uniform%'")
                  ->orWhereRaw("LOWER(name) LIKE '%clothing%'");
            })
            ->update(['allowance_type' => 'uniform_clothing']);
        $this->command->line("  uniform_clothing: {$count} rows");

        $count = DB::table('allowances')
            ->whereNull('allowance_type')
            ->where('taxable', true)
            ->update(['allowance_type' => 'taxable_other']);
        $this->command->line("  taxable_other:    {$count} rows");

        $count = DB::table('allowances')
            ->whereNull('allowance_type')
            ->where('taxable', false)
            ->update(['allowance_type' => 'non_taxable_other']);
        $this->command->line("  non_taxable_other:{$count} rows");
    }

    // ── Employee allowances snapshot ──────────────────────────────────────────
    // The employee_allowances table is a pure snapshot — it stores allowance_name
    // and allowance_amount directly with no FK back to the master allowances table.
    // Classification is therefore done by name matching only.

    private function backfillEmployeeAllowances(): void
    {
        if (! $this->columnExists('employee_allowances', 'allowance_type')) {
            $this->command->warn('  employee_allowances.allowance_type column not found — skipping. Run php artisan migrate first.');
            return;
        }

        // Detect which column holds the allowance name on the snapshot table
        $nameCol = $this->columnExists('employee_allowances', 'allowance_name')
            ? 'allowance_name'
            : ($this->columnExists('employee_allowances', 'name') ? 'name' : null);

        if (is_null($nameCol)) {
            $this->command->warn('  Could not detect name column on employee_allowances — skipping snapshot backfill.');
            $this->command->warn('  Columns found: '.implode(', ', $this->getColumns('employee_allowances')));
            return;
        }

        $this->command->line("  Using name column: {$nameCol}");

        $patterns = [
            'pera'             => "%pera%",
            'rice_subsidy'     => "%rice%",
            'uniform_clothing' => "%uniform%",
        ];

        foreach ($patterns as $type => $pattern) {
            $count = DB::table('employee_allowances')
                ->whereNull('allowance_type')
                ->whereRaw("LOWER({$nameCol}) LIKE ?", [$pattern])
                ->update(['allowance_type' => $type]);
            $this->command->line("  {$type}: {$count} rows");
        }

        // Clothing variant
        $count = DB::table('employee_allowances')
            ->whereNull('allowance_type')
            ->whereRaw("LOWER({$nameCol}) LIKE '%clothing%'")
            ->update(['allowance_type' => 'uniform_clothing']);
        $this->command->line("  uniform_clothing (clothing variant): {$count} rows");

        // Remaining — detect taxable column if it exists
        if ($this->columnExists('employee_allowances', 'taxable')) {
            $count = DB::table('employee_allowances')
                ->whereNull('allowance_type')
                ->where('taxable', true)
                ->update(['allowance_type' => 'taxable_other']);
            $this->command->line("  taxable_other:    {$count} rows");

            $count = DB::table('employee_allowances')
                ->whereNull('allowance_type')
                ->where('taxable', false)
                ->update(['allowance_type' => 'non_taxable_other']);
            $this->command->line("  non_taxable_other:{$count} rows");
        } else {
            // No taxable column — mark all remaining as non_taxable_other
            $count = DB::table('employee_allowances')
                ->whereNull('allowance_type')
                ->update(['allowance_type' => 'non_taxable_other']);
            $this->command->line("  non_taxable_other (no taxable col): {$count} rows");
        }

        $remaining = DB::table('employee_allowances')->whereNull('allowance_type')->count();
        $this->command->line("  Unclassified after backfill: {$remaining}");
    }

    // ── Report unclassified rows ──────────────────────────────────────────────

    private function reportUnclassified(): void
    {
        if ($this->columnExists('loans', 'loan_classification')) {
            $unclassifiedLoans = DB::table('loans')
                ->whereNull('loan_classification')
                ->where('status', 'Active')
                ->count();

            if ($unclassifiedLoans > 0) {
                $this->command->warn(
                    "  {$unclassifiedLoans} active loan(s) still have NULL loan_classification — ".
                    'falling back to legacy str_contains logic for these rows.'
                );
            }
        }

        if ($this->columnExists('allowances', 'allowance_type')) {
            $unclassifiedAllowances = DB::table('allowances')
                ->whereNull('allowance_type')
                ->count();

            if ($unclassifiedAllowances > 0) {
                $this->command->warn(
                    "  {$unclassifiedAllowances} master allowance(s) still have NULL allowance_type."
                );
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function columnExists(string $table, string $column): bool
    {
        return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
    }

    private function getColumns(string $table): array
    {
        return \Illuminate\Support\Facades\Schema::getColumnListing($table);
    }