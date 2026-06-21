<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveBalance extends Model
{
    protected $table      = 'employee_leave_balances';
    protected $primaryKey = 'employee_leave_balance_id';

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'cycle_year',
        'total_days',
        'used_days',
        'balance',
    ];

    protected $casts = [
        // DB column is decimal(8,4) — cast must match to preserve accrual precision.
        // decimal:1 would silently truncate e.g. 1.2500 → 1.3, corrupting balances.
        'total_days' => 'decimal:4',
        'used_days'  => 'decimal:4',
        'balance'    => 'decimal:4',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }
}