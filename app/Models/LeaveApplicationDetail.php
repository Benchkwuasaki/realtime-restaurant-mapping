<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApplicationDetail extends Model
{
    protected $primaryKey = 'leave_application_detail_id';

    protected $fillable = [
        'leave_application_id',
        'leave_location',
        'illness_details',
        'study_leave_purpose',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function leaveApplication(): BelongsTo
    {
        return $this->belongsTo(LeaveApplication::class, 'leave_application_id', 'leave_application_id');
    }
}