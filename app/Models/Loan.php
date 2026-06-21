<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Loan extends Model
{
    // ── Loan classification constants ─────────────────────────────────────────
    const CLASS_GSIS_REGULAR = 'gsis_regular';

    const CLASS_GSIS_EMERGENCY = 'gsis_emergency';

    const CLASS_PAGIBIG = 'pagibig';

    const CLASS_INTERNAL_ORG = 'internal_org';

    protected $fillable = [
        'employee_id',
        'loan_type',
        'source',
        'loan_classification',
        'internal_organization_id',
        'total_amount',
        'monthly_amortization',
        'semi_monthly_deduction',
        'balance',
        'start_period',
        'end_period',
        'status',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'monthly_amortization' => 'float',
        'semi_monthly_deduction' => 'float',
        'balance' => 'float',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

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

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** True when this loan originated from an internal organization. */
    public function isInternalOrg(): bool
    {
        // Prefer the typed column; fall back to FK check for legacy rows not yet
        // migrated.
        if (! is_null($this->loan_classification)) {
            return $this->loan_classification === self::CLASS_INTERNAL_ORG;
        }

        return ! is_null($this->internal_organization_id);
    }

    public function isGsisRegular(): bool
    {
        return $this->loan_classification === self::CLASS_GSIS_REGULAR;
    }

    public function isGsisEmergency(): bool
    {
        return $this->loan_classification === self::CLASS_GSIS_EMERGENCY;
    }

    public function isPagIbig(): bool
    {
        return $this->loan_classification === self::CLASS_PAGIBIG;
    }

    public function isActiveForPeriod(string $yearMonth): bool
    {
        return $this->status === 'Active'
            && $this->start_period <= $yearMonth
            && $this->end_period >= $yearMonth;
    }

    public function applyDeduction(): void
    {
        $this->balance = max(0, $this->balance - $this->semi_monthly_deduction);

        if ($this->balance <= 0) {
            $this->status = 'Completed';
            $this->balance = 0;
        }

        $this->save();
    }
}
