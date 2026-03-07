<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Allowance extends Model
{
    protected $fillable = [
        'name',
        'description',
        'monthly_salary',
        'taxable',
        'applicable_to',
        'mandatory',
        'basis',
    ];

    protected $casts = [
        'taxable' => 'boolean',
        'mandatory' => 'boolean',
        'monthly_salary' => 'float',
    ];

    public function employeeAllowances(): HasMany
    {
        return $this->hasMany(EmployeeAllowance::class, 'allowance_id');
    }

    public function isApplicableTo(?string $classification): bool
    {
        if (empty($this->applicable_to) || empty($classification)) {
            return true;
        }

        $applicable = array_map('trim', explode(',', $this->applicable_to));

        return in_array($classification, $applicable, true);
    }

    public function getNameKeyAttribute(): string
    {
        return strtolower($this->name);
    }
}
