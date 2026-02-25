<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $primaryKey = 'department_id';

    protected $fillable = [
        'department_name',
        'department_acronym',
        'department_description',
    ];

    public function divisions(): HasMany
    {
        return $this->hasMany(Division::class, 'department_id', 'department_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'department_id', 'department_id');
    }
}