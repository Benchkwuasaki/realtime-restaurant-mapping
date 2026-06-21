<?php

namespace App\Models;

use App\Observers\AttendanceObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Attendance extends Model
{

    protected static function booted(): void
    {
        static::observe(AttendanceObserver::class);
    }
    protected $fillable = [
        'employee_id',
        'work_id',
        'verification_status',
        'similarity',
        'device_id',
        'snapshot_path',
        'captured_at',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}