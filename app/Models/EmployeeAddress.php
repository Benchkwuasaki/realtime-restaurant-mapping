<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAddress extends Model
{
    protected $table = 'employee_adresses'; // note: typo preserved from migration
    protected $primaryKey = 'employee_address_id';

    protected $fillable = [
        'employee_basic_info_id',
        'street_address',
        'city',
        'state',
        'zip_code',
    ];

    public function basicInfo(): BelongsTo
    {
        return $this->belongsTo(EmployeeBasicInfo::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }
}