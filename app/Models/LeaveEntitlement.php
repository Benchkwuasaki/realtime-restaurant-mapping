<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveEntitlement extends Model
{
    protected $table      = 'leave_entitlements';
    protected $primaryKey = 'leave_entitlement_id';

    protected $fillable = [
        'leave_type_id',
        'leave_entitlement_description',
        'years_of_service',
        'days_entitled',
    ];

    protected $casts = [
        'days_entitled' => 'decimal:3',
    ];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }
}