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
        'status',
        'return_status'
    ];

    protected $casts = [
        'date_filed'   => 'date',
    ];


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
}
