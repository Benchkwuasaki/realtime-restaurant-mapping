<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Allowance extends Model
{
    // ── Allowance type constants ───────────────────────────────────────────────
    const TYPE_PERA = 'pera';

    const TYPE_RICE_SUBSIDY = 'rice_subsidy';

    const TYPE_UNIFORM_CLOTHING = 'uniform_clothing';

    const TYPE_TAXABLE_OTHER = 'taxable_other';

    const TYPE_NON_TAXABLE_OTHER = 'non_taxable_other';

    protected $fillable = [
        'name',
        'allowance_type',   // ← new typed classification column
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
