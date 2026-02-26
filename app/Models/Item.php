<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Item extends Model
{
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'position_id',
        'item_name',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class, 'item_id', 'item_id');
    }
}