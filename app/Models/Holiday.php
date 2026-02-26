<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $primaryKey = 'holiday_id';

    protected $fillable = [
        'name',
        'date',
        'type',
        'description',
        'is_recurring',
    ];

    protected $casts = [
        'date'         => 'date',
        'is_recurring' => 'boolean',
    ];
}   