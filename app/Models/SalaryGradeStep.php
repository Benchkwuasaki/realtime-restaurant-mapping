<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryGradeStep extends Model
{
    protected $primaryKey = 'salary_grade_step_id';

    protected $fillable = [
        'ssl_table_id',
        'salary_grade',
        'step',
        'monthly_salary',
    ];

    protected $casts = [
        'monthly_salary' => 'decimal:2',
    ];

    public function sslTable(): BelongsTo
    {
        return $this->belongsTo(PayrollSslTable::class, 'ssl_table_id', 'ssl_table_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'salary_grade_step_id', 'salary_grade_step_id');
    }
}
