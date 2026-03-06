<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveAccrualPosting extends Model
{
    protected $primaryKey = 'leave_accrual_posting_id';

    protected $fillable = [
        'posting_month',
        'posting_year',
        'total_days_in_month',
        'total_sundays',
        'total_holidays',
        'work_days',
        'posted_by_user_id',
        'reference_no',
        'status',
    ];

    protected $casts = [
        'posting_month'      => 'integer',
        'posting_year'       => 'integer',
        'total_days_in_month'=> 'integer',
        'total_sundays'      => 'integer',
        'total_holidays'     => 'integer',
        'work_days'          => 'integer',
    ];

    public function records(): HasMany
    {
        return $this->hasMany(LeaveAccrualRecord::class, 'leave_accrual_posting_id', 'leave_accrual_posting_id');
    }
}