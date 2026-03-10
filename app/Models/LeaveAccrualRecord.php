<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveAccrualRecord extends Model
{
    protected $primaryKey = 'leave_accrual_record_id';

    protected $fillable = [
        'leave_accrual_posting_id',
        'employee_id',
        'leave_type_id',
        'attendance_days',
        'accrual_earned',
        'balance_before',
        'balance_after',
        'credit_status',
    ];

    protected $casts = [
        'accrual_earned' => 'decimal:4',
        'balance_before' => 'decimal:4',
        'balance_after'  => 'decimal:4',
        'attendance_days'=> 'integer',
    ];

    public function posting(): BelongsTo
    {
        return $this->belongsTo(LeaveAccrualPosting::class, 'leave_accrual_posting_id', 'leave_accrual_posting_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }
}