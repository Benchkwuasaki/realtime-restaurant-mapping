<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    protected $primaryKey = 'position_id';

    protected $fillable = [
        'department_id',
        'division_id',
        'unit_id',
        'position_name',
        'position_type',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id', 'division_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id', 'unit_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'position_id', 'position_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeRegular(Builder $query): Builder
    {
        return $query->where('position_type', 'Regular');
    }

    public function scopeJobOrder(Builder $query): Builder
    {
        return $query->where('position_type', 'Job Order');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isJobOrder(): bool
    {
        return $this->position_type === 'Job Order';
    }

    public function isRegular(): bool
    {
        return $this->position_type === 'Regular';
    }
}