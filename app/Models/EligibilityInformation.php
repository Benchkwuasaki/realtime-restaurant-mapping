<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EligibilityInformation extends Model
{
    protected $table = 'eligibility_information';
    protected $primaryKey = 'eligibility_information_id';

    protected $fillable = [
        'employee_id',
        'eligibility_name',
        'year_passed',
    ];

    protected $casts = [
        'year_passed' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}