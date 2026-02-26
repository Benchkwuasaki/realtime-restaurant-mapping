<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryGradeStep extends Model
{
    protected $primaryKey = 'salary_grade_step_id';

    protected $fillable = [
        'salary_grade',
        'step',
        'monthly_salary',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'salary_grade_step_id', 'salary_grade_step_id');
    }
}