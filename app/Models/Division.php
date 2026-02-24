<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    protected $primaryKey = 'division_id';

    protected $fillable = [
        'department_id',
        'division_name',
        'division_acronym',
        'division_description',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'division_id', 'division_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'division_id', 'division_id');
    }
}