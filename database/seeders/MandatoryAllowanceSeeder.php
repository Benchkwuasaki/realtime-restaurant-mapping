<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the `allowances` table with mandatory Philippine government allowances.
 *
 * Basis:
 *  - PERA:    EO 611 / DBM-CSC Joint Circular — ₱2,000/month (Regular), ₱1,500/month (Casual/Part-time)
 *  - Rice:    RA 7305 / DBM Circular — ₱1,500/month, non-taxable, all employees
 *  - Uniform: RA 10149 / DBM Circular — ₱6,000/year → ₱500/month amortized, non-taxable
 *
 * Safe to re-run: uses upsert on name.
 */
class MandatoryAllowanceSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $allowances = [
            [
                'name' => 'PERA',
                'description' => 'Personnel Economic Relief Allowance – EO 611 / DBM-CSC Joint Circular',
                'monthly_salary' => 2000.00,
                'taxable' => false,
                'applicable_to' => 'Regular',   // Regular employees only
                'mandatory' => true,
                'basis' => 'EO 611',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'PERA',       // Casual / Part-time rate — distinct row not needed
                // We handle this via applicable_to; one row covers Regular.
                // If your system needs a separate row for Casual, duplicate here.
                'name' => 'PERA - Casual',
                'description' => 'Personnel Economic Relief Allowance (Casual/Part-time) – EO 611',
                'monthly_salary' => 1500.00,
                'taxable' => false,
                'applicable_to' => 'Casual',
                'mandatory' => true,
                'basis' => 'EO 611',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Rice Subsidy',
                'description' => 'Rice Subsidy – RA 7305 / DBM Circular, non-taxable',
                'monthly_salary' => 1500.00,
                'taxable' => false,
                'applicable_to' => null,         // All employees
                'mandatory' => true,
                'basis' => 'RA 7305',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Uniform/Clothing Allowance',
                'description' => 'Uniform & Clothing Allowance – RA 10149 / DBM Circular, ₱6,000/year amortized monthly',
                'monthly_salary' => 500.00,       // ₱6,000 ÷ 12
                'taxable' => false,
                'applicable_to' => null,         // All employees
                'mandatory' => true,
                'basis' => 'RA 10149',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($allowances as $allowance) {
            $updated = DB::table('allowances')
                ->where('name', $allowance['name'])
                ->update(array_merge($allowance, ['updated_at' => $now]));

            if ($updated === 0) {
                DB::table('allowances')->insert($allowance);
            }
        }

        $this->command->info('Mandatory allowances seeded: PERA (Regular), PERA (Casual), Rice Subsidy, Uniform/Clothing.');
    }
}
