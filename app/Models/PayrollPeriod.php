<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollPeriod extends Model
{
    protected $primaryKey = 'payroll_period_id';

    protected $fillable = ['start_date', 'end_date', 'status', 'employee_type'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function getCutOffAttribute(): string
    {
        return $this->start_date->day >= 16 ? '2nd' : '1st';
    }

    public function getIsSecondCutOffAttribute(): bool
    {
        return $this->start_date->day >= 16;
    }
}
