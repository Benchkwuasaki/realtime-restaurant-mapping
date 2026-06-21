<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'scheduled_time_in',
        'scheduled_break_out',
        'scheduled_break_in',
        'scheduled_time_out',
        'grace_minutes',
        'time_in',
        'break_out',
        'break_in',
        'time_out',
        'late_minutes',
        'work_minutes',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'grace_minutes' => 'integer',
        'late_minutes' => 'integer',
        'work_minutes' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
