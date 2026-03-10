<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GovernmentAccType extends Model
{
    protected $primaryKey = 'government_acc_type_id';

    protected $fillable = [
        'code',
        'name',
        'has_employer_share',
        'computation_type',
        'employee_rate',
        'employer_rate',
        'fixed_amount',
    ];

    protected $casts = [
        'has_employer_share' => 'boolean',
        'employee_rate'      => 'float',
        'employer_rate'      => 'float',
        'fixed_amount'       => 'float',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function governmentAccounts(): HasMany
    {
        return $this->hasMany(
            GovernmentAccount::class,
            'government_acc_type_id',
            'government_acc_type_id'
        );
    }

    public function deductionPriorityEntries(): HasMany
    {
        return $this->hasMany(
            PayrollDeductionPriorityOrder::class,
            'government_acc_type_id',
            'government_acc_type_id'
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Returns the effective deduction value for payroll computation.
     * For rate types, returns the employee_rate percentage.
     * For fixed types, returns the fixed_amount.
     */
    public function employeeDeductionValue(): float
    {
        return $this->computation_type === 'rate'
            ? (float) $this->employee_rate
            : (float) $this->fixed_amount;
    }

    /**
     * Returns the employer share value, if applicable.
     */
    public function employerDeductionValue(): ?float
    {
        if (! $this->has_employer_share) {
            return null;
        }

        return $this->computation_type === 'rate'
            ? (float) $this->employer_rate
            : (float) $this->fixed_amount;
    }

    /**
     * Convenient lookup by code — used throughout the payroll engine.
     * e.g. GovernmentAccType::byCode('GSIS')
     */
    public static function byCode(string $code): self
    {
        return static::where('code', $code)->firstOrFail();
    }

    public function getRouteKeyName(): string
    {
        return 'government_acc_type_id';
    }
}