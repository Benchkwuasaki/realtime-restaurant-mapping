<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtherDeduction extends Model
{
    const CATEGORY_WATER_BILL = 'Water Bill';

    const CATEGORY_NS_ND = 'NS & ND (COA)';

    const CATEGORY_MISCELLANEOUS = 'Miscellaneous';

    const SPECIAL_CATEGORIES = [
        self::CATEGORY_WATER_BILL,
        self::CATEGORY_NS_ND,
        self::CATEGORY_MISCELLANEOUS,
    ];

    protected $fillable = [
        'employee_id',
        'category',
        'description',
        'amount',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'amount' => 'float',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Tab key used in the UI to group by category.
     */
    public function tabKey(): string
    {
        return $this->category ?? '';
    }

    public function isWaterBill(): bool
    {
        return $this->category === self::CATEGORY_WATER_BILL;
    }

    public function isNsNd(): bool
    {
        return $this->category === self::CATEGORY_NS_ND;
    }

    public function isMiscellaneous(): bool
    {
        return $this->category === self::CATEGORY_MISCELLANEOUS;
    }
}
