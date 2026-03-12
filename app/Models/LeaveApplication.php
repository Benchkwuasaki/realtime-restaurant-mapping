<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveApplication extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'leave_application_id';

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'recommendation_officer',
        'approval_officer',
        'office_department',
        'position',
        'salary',
        'leave_type_availed',
        'date_of_filing',
        'start_date',
        'end_date',
        'is_requested',
        'is_with_pay',
        'approved_with_pay',
        'approved_without_pay',
        'approved_others',
        'status',
        'for_disapproval_reason',
        'disapproved_reason',
        
    ];

    protected $casts = [
        'date_of_filing' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_requested' => 'boolean',
        'is_with_pay' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }

    public function recommendationOfficer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'recommendation_officer', 'employee_id');
    }

    public function approvalOfficer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approval_officer', 'employee_id');
    }

    public function detail(): HasOne
    {
        return $this->hasOne(LeaveApplicationDetail::class, 'leave_application_id', 'leave_application_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }

    public function scopeForApproval($query)
    {
        return $query->where('status', 'For Approval');
    }

    public function scopeForDisapproval($query)
    {
        return $query->where('status', 'For Disapproval');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }

    public function scopeDisapproved($query)
    {
        return $query->where('status', 'Disapproved');
    }
}