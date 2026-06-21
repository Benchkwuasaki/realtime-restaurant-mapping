<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GovernmentAccount extends Model
{
    protected $primaryKey = 'government_account_id';

    protected $fillable = [
        'employee_id',
        'account_type',
        'account_number',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}