<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $fillable = ['prov_code', 'prov_name', 'reg_code'];

    public function region()
    {
        return $this->belongsTo(Region::class, 'reg_code', 'reg_code');
    }

    public function municipalities()
    {
        return $this->hasMany(Municipality::class, 'prov_code', 'prov_code');
    }

    public function barangays()
    {
        return $this->hasMany(Barangay::class, 'prov_code', 'prov_code');
    }
}
