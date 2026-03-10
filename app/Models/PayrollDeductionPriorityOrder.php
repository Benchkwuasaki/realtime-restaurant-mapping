<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\GovernmentAccType;
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

    public function governmentAccType(): BelongsTo
    {
        return $this->belongsTo(
            GovernmentAccType::class,
            'government_acc_type_id',
            'government_acc_type_id'
        );
    }

    // Always fetch in order
    public static function ordered(): Collection
    {
        return static::with('governmentAccType')
            ->orderBy('priority')
            ->get();
    }

    // Reorder from drag-and-drop — receives array of IDs in new order
    public static function reorder(array $orderedIds, array $cuttabilityMap): void
    {
        // Step 1 — shift all priorities to a safe range to avoid unique constraint
        // collisions during sequential updates (e.g. two rows can't both be priority 3)
        foreach ($orderedIds as $index => $id) {
            static::where('id', $id)->update([
                'priority' => $index + 1000,
            ]);
        }

        // Step 2 — set the real priority and cuttability values
        foreach ($orderedIds as $index => $id) {
            static::where('id', $id)->update([
                'priority' => $index + 1,
                'cuttability' => $cuttabilityMap[$id] ?? 'yes',
            ]);
        }
    }
}
