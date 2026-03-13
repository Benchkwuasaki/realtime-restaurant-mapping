<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = ['reg_code', 'reg_name'];

    public function provinces()
    {
        return $this->hasMany(Province::class, 'reg_code', 'reg_code');
    }

    public function municipalities()
    {
        return $this->hasMany(Municipality::class, 'reg_code', 'reg_code');
    }

    public function barangays()
    {
        return $this->hasMany(Barangay::class, 'reg_code', 'reg_code');
    }
}
