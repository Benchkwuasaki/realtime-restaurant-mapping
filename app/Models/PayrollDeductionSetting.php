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
        'working_days_divisor',
        'minimum_take_home_pay',
        'salary_threshold',
    ];

    protected $casts = [
        'working_days_divisor' => 'integer',
        'minimum_take_home_pay' => 'float',
        'salary_threshold' => 'float',
    ];

    public static function getSettings(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'working_days_divisor' => 22,
                'minimum_take_home_pay' => 3000.0,
                'salary_threshold' => 6000.0,
            ]
        );
    }
}
