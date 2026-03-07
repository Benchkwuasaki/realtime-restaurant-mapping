<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRecord extends Model
{
    protected $primaryKey = 'payroll_record_id';

    protected $fillable = [
        'employee_id',
        'payroll_period_id',
        'basic_pay',
        'pera',
        'rice_allowance',
        'uniform_allowance',
        'gsis_premium',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'absent_days',
        'absent_deduction',
        'late_minutes',
        'late_deduction',
        'gsis_mpl',
        'gsis_emergency',
        'pag_ibig_mpl',
        'ama_y2k_union',
        'water_bill',
        'net_pay',
        'floor_check_passed',
        'posted_at',
        'hr_officer_name',
    ];

    protected $casts = [
        'basic_pay' => 'float',
        'pera' => 'float',
        'rice_allowance' => 'float',
        'uniform_allowance' => 'float',
        'gsis_premium' => 'float',
        'philhealth' => 'float',
        'pag_ibig' => 'float',
        'withholding_tax' => 'float',
        'absent_deduction' => 'float',
        'late_deduction' => 'float',
        'gsis_mpl' => 'float',
        'gsis_emergency' => 'float',
        'pag_ibig_mpl' => 'float',
        'ama_y2k_union' => 'float',
        'water_bill' => 'float',
        'net_pay' => 'float',
        'floor_check_passed' => 'boolean',
        'posted_at' => 'datetime',
    ];

    public function getGrossPayAttribute(): float
    {
        return (float) $this->basic_pay
            + (float) $this->pera
            + (float) $this->rice_allowance
            + (float) $this->uniform_allowance;
    }

    public function getTotalDeductionsAttribute(): float
    {
        return (float) $this->gsis_premium
            + (float) $this->philhealth
            + (float) $this->pag_ibig
            + (float) $this->withholding_tax
            + (float) $this->absent_deduction
            + (float) $this->late_deduction
            + (float) $this->gsis_mpl
            + (float) $this->gsis_emergency
            + (float) $this->pag_ibig_mpl
            + (float) $this->ama_y2k_union
            + (float) $this->water_bill;
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }
}
