<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhereaboutSlip extends Model
{
    protected $primaryKey = 'whereabout_slip_id';

    protected $fillable = [
        'employee_id',
        'reviewed_and_noted_by_id',
        'approved_by_id',
        'attested_by_id',
        'date_filed',
        'purpose_type',
        'purpose_description',
        'time_out',
        'time_returned',
        'time_noted',
        'minutes_gone',   // computed on logReturn — null until employee returns
        'status',
        'return_status',
    ];

    protected $casts = [
        'date_filed' => 'date',
        'minutes_gone' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function reviewedAndNotedBy()
    {
        return $this->belongsTo(Employee::class, 'reviewed_and_noted_by_id', 'employee_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(Employee::class, 'approved_by_id', 'employee_id');
    }

    public function attestedBy()
    {
        return $this->belongsTo(Employee::class, 'attested_by_id', 'employee_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Personal slips that have been returned — used by ProcessAttendanceLog
     * to deduct from work_minutes.
     */
    public function scopePersonalDeductions($query, int $employeeId, string $date)
    {
        return $query
            ->where('employee_id', $employeeId)
            ->where('date_filed', $date)
            ->where('purpose_type', 'personal')
            ->where('return_status', 'returned')
            ->whereNotNull('minutes_gone');
    }
}
