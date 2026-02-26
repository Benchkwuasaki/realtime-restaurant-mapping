<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeWaterBill extends Model
{
    protected $primaryKey = 'employee_water_bill_id';

    protected $fillable = [
        'employee_id',
        'water_bill_number',
        'account_name',
        'address',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}