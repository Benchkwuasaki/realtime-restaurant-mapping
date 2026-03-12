<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApplicationDetail extends Model
{
    protected $primaryKey = 'leave_application_detail_id';

    protected $fillable = [
        'leave_application_id',
        // 6.B Vacation / Special Privilege Leave
        'leave_location_type',
        'leave_location',

        // 6.B Sick Leave / Rehabilitation Leave
        'sick_type',
        'sick_details',

        // 6.B Special Leave Benefits for Women
        'women_illness',

        // 6.B Study Leave
        'study_purpose',

        // 6.B Other purpose
        'other_purpose',
        'monetization_vl_days',
        'monetization_sl_days',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function leaveApplication(): BelongsTo
    {
        return $this->belongsTo(LeaveApplication::class, 'leave_application_id', 'leave_application_id');
    }
}