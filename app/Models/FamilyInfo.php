<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyInfo extends Model
{
    protected $primaryKey = 'family_info_id';

    protected $fillable = [
        'employee_basic_info_id',
        'full_name',
        'contact_number',
        'relationship',
    ];

    public function basicInfo(): BelongsTo
    {
        return $this->belongsTo(EmployeeBasicInfo::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }
}