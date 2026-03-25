<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveEntitlement extends Model
{
    protected $table = 'leave_entitlements';

    protected $primaryKey = 'leave_entitlement_id';

    protected $fillable = [
        'leave_type_id',
        'leave_entitlement_description',
        'years_of_service',
        'event_type',
        'days_entitled',
    ];

    protected $casts = [
        'years_of_service' => 'integer',
        'days_entitled' => 'decimal:4',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Filter entitlements to a specific event type.
     *
     * Use this when a leave type has multiple scenario-dependent entitlement
     * rows (e.g. Maternity Leave). Pass the slug that matches what the employee
     * declared on their leave application form.
     *
     * Examples:
     *   LeaveEntitlement::forEvent('live_birth')->...
     *   LeaveEntitlement::forEvent('miscarriage')->...
     *   LeaveEntitlement::forEvent('live_birth_solo_parent')->...
     *
     * For leave types with a single unconditional entitlement (event_type = null),
     * omit this scope entirely — the NULL rows are not matched by this filter.
     */
    public function scopeForEvent($query, string $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Whether an employee with the given years of service meets
     * the minimum service threshold for this entitlement row.
     *
     * For most leave types there is only one entitlement row and
     * years_of_service = 0, meaning no minimum is required.
     *
     * For leaves with a service prerequisite (e.g. Study Leave
     * requires 6 years, Solo Parent Leave requires 1 year), seed
     * years_of_service to that minimum. This method lets callers
     * do the gate check without knowing the raw value.
     */
    public function isEligible(int $employeeYearsOfService): bool
    {
        return $employeeYearsOfService >= $this->years_of_service;
    }
}
