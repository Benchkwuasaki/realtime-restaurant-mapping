<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $table = 'units';
    protected $primaryKey = 'unit_id';

    protected $fillable = [
        'division_id',
        'unit_name',
        'unit_acronym',
        'unit_description',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id', 'division_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'unit_id', 'unit_id');
    }
}