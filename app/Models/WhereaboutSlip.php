<?php

namespace App\Models;

use Carbon\Carbon;
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
        'date_returned',
        'time_noted',
        'date_noted',
        'minutes_gone',
        'status',
        'prov_code',
        'city_code',
        'brgy_code',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'date_filed' => 'date',
        'date_returned' => 'date',
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
            ->where('status', 'returned')
            ->whereNotNull('minutes_gone');
    }

    /**
     * Slips that are still outstanding (employee has not returned).
     * Useful for the scheduled job that flips still_out → not_returned.
     */
    public function scopeOutstanding($query)
    {
        return $query->whereIn('status', ['still_out', 'not_returned']);
    }

    // ─── Business logic ───────────────────────────────────────────────────────

    /**
     * Call from a scheduled job (e.g. every minute, or end-of-day):
     * if the employee's work_schedule_end has passed and the slip is still
     * still_out, escalate to not_returned.
     *
     * Example usage in a command / observer:
     *   WhereaboutSlip::outstanding()
     *       ->whereHas('employee', fn($q) => $q->whereRaw('work_schedule_end <= ?', [now()->format('H:i:s')]))
     *       ->where('status', 'still_out')
     *       ->update(['status' => 'not_returned']);
     */
    public function escalateIfOverdue(string $workScheduleEnd): void
    {
        if ($this->status !== 'still_out') {
            return;
        }

        $now = Carbon::now('Asia/Manila');
        $end = Carbon::parse($now->toDateString().' '.$workScheduleEnd, 'Asia/Manila');

        if ($now->greaterThanOrEqualTo($end)) {
            $this->update(['status' => 'not_returned']);
        }
    }

    /**
     * Log a return. Computes minutes_gone as the span between time_out on
     * date_filed and time_returned on date_returned (handles overnight gaps).
     */
    public function logReturn(string $dateReturned, string $timeReturned, string $timeNoted): void
    {
        $out = Carbon::parse($this->date_filed->toDateString().' '.$this->time_out, 'Asia/Manila');
        $ret = Carbon::parse($dateReturned.' '.$timeReturned, 'Asia/Manila');

        $this->update([
            'date_returned' => $dateReturned,
            'time_returned' => $timeReturned,
            'time_noted' => $timeNoted,
            'minutes_gone' => (int) $out->diffInMinutes($ret),
            'status' => 'returned',
        ]);
    }
}
