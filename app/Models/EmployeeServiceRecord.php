<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeServiceRecord extends Model
{
    protected $primaryKey = 'employee_service_record_id';

    protected $fillable = [
        'employee_id',
        'department',
        'service_title',
        'durationStart',
        'durationEnd',
    ];

    protected $casts = [
        'durationStart' => 'date',
        'durationEnd'   => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}