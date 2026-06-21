<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSeminarAndTraining extends Model
{
    protected $table = 'employee_seminars_and_trainings';
    protected $primaryKey = 'employee_seminar_training_id';

    protected $fillable = [
        'employee_id',
        'seminar_training_name',
        'date_attended',
        'venue',
        'organizer',
    ];

    protected $casts = ['date_attended' => 'date'];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}