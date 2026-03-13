<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Municipality extends Model
{
    protected $fillable = ['city_code', 'city_name', 'prov_code', 'reg_code'];

    public function region()
    {
        return $this->belongsTo(Region::class, 'reg_code', 'reg_code');
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'prov_code', 'prov_code');
    }

    public function barangays()
    {
        return $this->hasMany(Barangay::class, 'city_code', 'city_code');
    }
}
