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
        // Shared
        'employee_rate',
        'employer_rate',
        'fixed_amount',
        // PhilHealth bracket
        'min_contribution',
        'max_contribution',
        // Pag-IBIG tier
        'lower_salary_threshold',
        'lower_rate',
        'upper_rate',
    ];

    protected $casts = [
        'has_employer_share' => 'boolean',
        'employee_rate' => 'float',
        'employer_rate' => 'float',
        'fixed_amount' => 'float',
        'min_contribution' => 'float',
        'max_contribution' => 'float',
        'lower_salary_threshold' => 'float',
        'lower_rate' => 'float',
        'upper_rate' => 'float',
    ];

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

    /**
     * Returns the effective employee deduction value.
     *
     * For rate-type agencies (GSIS, PhilHealth) → returns employee_rate percentage.
     * For fixed-type agencies (Pag-IBIG)        → returns fixed_amount (the cap).
     *
     * NOTE: For PhilHealth and Pag-IBIG, use the dedicated compute methods below
     * instead of this one — they apply the full bracket/tier logic.
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
     * Compute the monthly PhilHealth employee contribution for a given salary.
     *
     * Formula: clamp(monthlyBasic × rate%, min_contribution, max_contribution)
     *
     * All three values — rate, floor, ceiling — come from the DB row,
     * replacing the previously hardcoded max(250.0, min(2500.0, ...)).
     *
     * @param  float  $monthlyBasic  The employee's full monthly basic salary.
     * @return float Monthly PhilHealth employee share (not yet halved).
     */
    public function computePhilHealth(float $monthlyBasic): float
    {
        $rate = (float) ($this->employee_rate ?? 2.5);
        $floor = (float) ($this->min_contribution ?? 250.0);
        $ceiling = (float) ($this->max_contribution ?? 2500.0);

        $computed = round($monthlyBasic * ($rate / 100), 2);

        return max($floor, min($ceiling, $computed));
    }

    /**
     * Compute the monthly Pag-IBIG employee contribution for a given salary.
     *
     * Formula:
     *   if monthlyBasic <= lower_salary_threshold → basic × lower_rate%
     *   else                                      → min(fixed_amount, basic × upper_rate%)
     *
     * All four values — threshold, lower rate, upper rate, cap — come from the DB row,
     * replacing the previously hardcoded <= 1500, 0.01, 0.02, 100.0.
     *
     * @param  float  $monthlyBasic  The employee's full monthly basic salary.
     * @return float Monthly Pag-IBIG contribution (not yet halved).
     */
    public function computePagIbig(float $monthlyBasic): float
    {
        $cap = (float) ($this->fixed_amount ?? 100.0);
        $threshold = (float) ($this->lower_salary_threshold ?? 1500.0);
        $lowerRate = (float) ($this->lower_rate ?? 1.0);
        $upperRate = (float) ($this->upper_rate ?? 2.0);

        if ($monthlyBasic <= $threshold) {
            return round($monthlyBasic * ($lowerRate / 100), 2);
        }

        return min($cap, round($monthlyBasic * ($upperRate / 100), 2));
    }

    /**
     * Convenient lookup by code.
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
