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
        'total_days' => 'decimal:1',
        'used_days'  => 'decimal:1',
        'balance'    => 'decimal:1',
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