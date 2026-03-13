<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    protected $fillable = ['brgy_code', 'brgy_name', 'city_code', 'prov_code', 'reg_code'];

    public function region()
    {
        return $this->belongsTo(Region::class, 'reg_code', 'reg_code');
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'prov_code', 'prov_code');
    }

    public function municipality()
    {
        return $this->belongsTo(Municipality::class, 'city_code', 'city_code');
    }
}
