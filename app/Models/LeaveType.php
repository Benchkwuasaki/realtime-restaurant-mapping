<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $table      = 'leave_types';
    protected $primaryKey = 'leave_type_id';

    protected $fillable = [
        'leave_type_name',
        'leave_type_description',
        'eligible_sex',
        'is_paid',
        'is_convertible',
        'is_accrual',
        'status',
    ];

    protected $casts = [
        'is_paid'        => 'boolean',
        'is_convertible' => 'boolean',
        'is_accrual'     => 'boolean',
        'status'         => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function requirements(): HasMany
    {
        return $this->hasMany(LeaveTypeRequirement::class, 'leave_type_id', 'leave_type_id');
    }

    public function entitlements(): HasMany
    {
        return $this->hasMany(LeaveEntitlement::class, 'leave_type_id', 'leave_type_id');
    }

    public function leaveApplications(): HasMany
    {
        return $this->hasMany(LeaveApplication::class, 'leave_type_id', 'leave_type_id');
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class, 'leave_type_id', 'leave_type_id');
    }
}
