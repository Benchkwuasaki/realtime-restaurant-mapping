<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveApplication extends Model
{
    use SoftDeletes;

    protected $table = 'leave_applications';

    protected $primaryKey = 'leave_application_id';

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'days_requested',
        'reason',
        'status',
        'approved_by_supervisor',
        'approved_by_manager',
        'supervisor_approved_at',
        'manager_approved_at',
        'rejection_reason',
        'rejected_by',
        'rejected_at',
    ];

    protected $casts = [
        'start_date'            => 'date:Y-m-d',
        'end_date'              => 'date:Y-m-d',
        'days_requested'        => 'decimal:1',
        'supervisor_approved_at'=> 'datetime',
        'manager_approved_at'   => 'datetime',
        'rejected_at'           => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * The employee who filed this leave application.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * The type of leave being applied for.
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }

    /**
     * Supervisor who approved the application (nullable).
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by_supervisor', 'employee_id');
    }

    /**
     * Manager who approved the application (nullable).
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by_manager', 'employee_id');
    }

    /**
     * Employee who rejected the application (nullable).
     */
    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'rejected_by', 'employee_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope: only approved leaves.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: only pending leaves.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: leaves active on a given date.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string|\DateTimeInterface              $date  YYYY-MM-DD
     */
    public function scopeActiveOn($query, $date)
    {
        return $query->where('start_date', '<=', $date)
                     ->where('end_date', '>=', $date);
    }
}