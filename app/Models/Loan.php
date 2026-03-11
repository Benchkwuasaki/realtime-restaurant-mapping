<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Loan extends Model
{
    protected $fillable = [
        'employee_id',
        'loan_type',
        'source',
        'internal_organization_id',     // ← nullable FK for internal org loans
        'total_amount',
        'monthly_amortization',
        'semi_monthly_deduction',
        'balance',
        'start_period',                 // Format: Y-m (e.g. 2026-01)
        'end_period',                   // Format: Y-m (e.g. 2026-12)
        'status',                       // Active | Completed | Suspended
    ];

    protected $casts = [
        'total_amount'           => 'float',
        'monthly_amortization'   => 'float',
        'semi_monthly_deduction' => 'float',
        'balance'                => 'float',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function internalOrganization(): BelongsTo
    {
        return $this->belongsTo(
            InternalOrganization::class,
            'internal_organization_id',
            'internal_organization_id'
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** True when this loan originated from an internal organization. */
    public function isInternalOrg(): bool
    {
        return ! is_null($this->internal_organization_id);
    }

    public function isActiveForPeriod(string $yearMonth): bool
    {
        return $this->status === 'Active'
            && $this->start_period <= $yearMonth
            && $this->end_period   >= $yearMonth;
    }

    public function applyDeduction(): void
    {
        $this->balance = max(0, $this->balance - $this->semi_monthly_deduction);

        if ($this->balance <= 0) {
            $this->status  = 'Completed';
            $this->balance = 0;
        }

        $this->save();
    }
}