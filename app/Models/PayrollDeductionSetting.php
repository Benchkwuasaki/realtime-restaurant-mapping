<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Single-row configuration table.
 * Always access via PayrollDeductionSetting::getSettings().
 */
class PayrollDeductionSetting extends Model
{
    protected $table = 'payroll_deduction_settings';

    protected $fillable = [
        'gsis_employee_rate',
        'gsis_employer_rate',
        'philhealth_rate',
        'pagibig_monthly',
        'working_days_divisor',
        'minimum_take_home_pay',
        'salary_threshold',
        'priority_order',
    ];

    protected $casts = [
        'gsis_employee_rate' => 'float',
        'gsis_employer_rate' => 'float',
        'philhealth_rate' => 'float',
        'pagibig_monthly' => 'float',
        'working_days_divisor' => 'integer',
        'minimum_take_home_pay' => 'float',
        'salary_threshold' => 'float',
        'priority_order' => 'array',
    ];

    /** Always retrieve (or seed) the single settings row. */
    public static function getSettings(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'gsis_employee_rate' => 9.0,
                'gsis_employer_rate' => 12.0,
                'philhealth_rate' => 2.5,
                'pagibig_monthly' => 100.0,
                'working_days_divisor' => 22,
                'minimum_take_home_pay' => 3000.0,
                'salary_threshold' => 6000.0,
                'priority_order' => [
                    ['id' => '1', 'priority' => 1, 'deduction_type' => "Gov't Contributions",  'examples' => 'GSIS, PhilHealth, Pag-IBIG, Tax',           'can_be_cut' => 'Never'],
                    ['id' => '2', 'priority' => 2, 'deduction_type' => "Gov't Loans",          'examples' => 'All GSIS Loans, Pag-IBIG Loans',            'can_be_cut' => 'Rarely'],
                    ['id' => '3', 'priority' => 3, 'deduction_type' => 'Internal Org Loans',   'examples' => 'AMA Loan, Y2K Loans, MKWD Loans',           'can_be_cut' => 'Yes'],
                    ['id' => '4', 'priority' => 4, 'deduction_type' => 'Org Dues & Premiums',  'examples' => 'AMA Premium, Y2K Premium, Union Dues...',   'can_be_cut' => 'First to Cut'],
                    ['id' => '5', 'priority' => 5, 'deduction_type' => 'Miscellaneous',        'examples' => 'Water Bill, NSGND, One-time Items',         'can_be_cut' => 'First to Cut'],
                ],
            ]
        );
    }
}
