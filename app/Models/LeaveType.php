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
        'is_cumulative',
        'is_per_event',
        'max_lifetime_grants',
        'is_convertible',
        'is_accrual',
        'availment_type',
        'availment_deadline_days',
        'status',
    ];

    protected $casts = [
        'is_paid'                 => 'boolean',
        'is_cumulative'           => 'boolean',
        'is_per_event'            => 'boolean',
        'max_lifetime_grants'     => 'integer',
        'is_convertible'          => 'boolean',
        'is_accrual'              => 'boolean',
        'availment_deadline_days' => 'integer',
        'status'                  => 'boolean',
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