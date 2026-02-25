<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeePayrollData extends Model
{
    protected $primaryKey = 'employee_payroll_data_id';

    protected $fillable = [
        'employee_id',
        'initial_amount',
        'deduction_amount',
        'final_amount',
        'date_processed',
        'payroll_status',
    ];

    protected $casts = ['date_processed' => 'date'];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}