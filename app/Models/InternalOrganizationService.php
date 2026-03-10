<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalOrganizationService extends Model
{
    protected $primaryKey = 'internal_organization_service_id';

    protected $fillable = [
        'internal_organization_id',
        'internal_organization_service_name',
        'service_category',
        'deductable_from_payroll',
    ];

    protected $casts = [
        'deductable_from_payroll' => 'boolean',
    ];

    // ── Constants ──────────────────────────────────────────────────────────────

    const CATEGORY_LOAN          = 'Loan';
    const CATEGORY_SAVINGS       = 'Savings';
    const CATEGORY_DUES          = 'Dues';
    const CATEGORY_SHARE_CAPITAL = 'Share_Capital';

    /** Deducted on BOTH 1st and 2nd cut-off */
    const BOTH_CUTOFF_CATEGORIES = [
        self::CATEGORY_SAVINGS,
        self::CATEGORY_SHARE_CAPITAL,
    ];

    /** Deducted on 2nd cut-off ONLY */
    const SECOND_CUTOFF_ONLY_CATEGORIES = [
        self::CATEGORY_LOAN,
        self::CATEGORY_DUES,
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function internalOrganization(): BelongsTo
    {
        return $this->belongsTo(
            InternalOrganization::class,
            'internal_organization_id',
            'internal_organization_id'
        );
    }

    public function deductionEntries(): HasMany
    {
        return $this->hasMany(
            InternalOrgDeduction::class,
            'internal_organization_service_id',
            'internal_organization_service_id'
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isBothCutOff(): bool
    {
        return in_array($this->service_category, self::BOTH_CUTOFF_CATEGORIES);
    }

    public function isSecondCutOffOnly(): bool
    {
        return in_array($this->service_category, self::SECOND_CUTOFF_ONLY_CATEGORIES);
    }
}