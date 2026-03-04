<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

// ─── Item ─────────────────────────────────────────────────────────────────────

class Item extends Model
{
    protected $table = 'items';
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'position_id',
        'item_name',
    ];

    /**
     * Position this plantilla item belongs to.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    /**
     * Employees currently holding this item.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'item_id', 'item_id');
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class, 'item_id', 'item_id');
    }
}