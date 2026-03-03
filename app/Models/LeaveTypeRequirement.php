<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveTypeRequirement extends Model
{
    protected $primaryKey = 'leave_type_requirement_id';

    protected $fillable = [
        'leave_type_id',
        'requirement_name',
        'requirement_description',
    ];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'leave_type_id');
    }
}