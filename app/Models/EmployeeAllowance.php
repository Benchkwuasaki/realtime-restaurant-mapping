<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAllowance extends Model
{
    protected $primaryKey = 'employee_allowance_id';

    protected $fillable = [
        'employee_id',
        'allowance_name',
        'allowance_amount',
        'taxable',          // ← snapshot of taxable flag at time of assignment
    ];

    protected $casts = [
        'allowance_amount' => 'float',
        'taxable' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
