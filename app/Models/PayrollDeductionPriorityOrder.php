<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class PayrollDeductionPriorityOrder extends Model
{
    protected $table = 'payroll_deduction_priority_order';

    protected $fillable = [
        'priority',
        'deduction_category',
        'government_acc_type_id',
        'label',
        'examples',
        'cuttability',
    ];

    protected $casts = [
        'priority' => 'integer',
    ];

    // ── Category constants ────────────────────────────────────────────────────

    const CATEGORY_GOVERNMENT_CONTRIBUTION = 'government_contribution';
    const CATEGORY_GOVERNMENT_LOAN         = 'government_loan';
    const CATEGORY_INTERNAL_ORG_SAVINGS    = 'internal_org_savings';
    const CATEGORY_INTERNAL_ORG_LOAN       = 'internal_org_loan';
    const CATEGORY_INTERNAL_ORG_DUES       = 'internal_org_dues';
    const CATEGORY_WATER_BILL              = 'water_bill';
    const CATEGORY_OTHER_MISCELLANEOUS     = 'other_miscellaneous';

    // ── Cuttability constants ─────────────────────────────────────────────────

    const CUT_NEVER        = 'Never';
    const CUT_RARELY       = 'Rarely';
    const CUT_YES          = 'Yes';
    const CUT_FIRST_TO_CUT = 'First_to_Cut';

    // ── Relationships ─────────────────────────────────────────────────────────

    public function governmentAccType(): BelongsTo
    {
        return $this->belongsTo(
            GovernmentAccType::class,
            'government_acc_type_id',
            'government_acc_type_id'
        );
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /** Always fetch in ascending priority order. */
    public static function ordered(): Collection
    {
        return static::with('governmentAccType')
            ->orderBy('priority')
            ->get();
    }

    /**
     * Reorder from drag-and-drop.
     * Receives array of IDs in the new order + map of id → cuttability.
     */
    public static function reorder(array $orderedIds, array $cuttabilityMap): void
    {
        // Step 1 — shift all to a safe range to avoid unique constraint collisions
        foreach ($orderedIds as $index => $id) {
            static::where('id', $id)->update(['priority' => $index + 1000]);
        }

        // Step 2 — set real priority and cuttability
        foreach ($orderedIds as $index => $id) {
            static::where('id', $id)->update([
                'priority'     => $index + 1,
                'cuttability'  => $cuttabilityMap[$id] ?? self::CUT_YES,
            ]);
        }
    }
}