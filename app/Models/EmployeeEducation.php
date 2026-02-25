<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeEducation extends Model
{
    protected $table = 'employee_educations';
    protected $primaryKey = 'employee_education_id';

    protected $fillable = [
        'employee_basic_info_id',
        'level',
        'school_name',
        'school_address',
        'graduation_date',
        'degree',
    ];

    protected $casts = ['graduation_date' => 'date'];

    public function basicInfo(): BelongsTo
    {
        return $this->belongsTo(EmployeeBasicInfo::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }
}