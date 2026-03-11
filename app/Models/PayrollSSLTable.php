<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollSslTable extends Model
{
    protected $table = 'payroll_ssl_tables';

    protected $primaryKey = 'ssl_table_id';

    protected $fillable = [
        'ssl_version',
        'legal_basis',
        'tranche',
        'effectivity_date',
        'status',
        'activated_at',
        'activated_by',
    ];

    protected $casts = [
        'effectivity_date' => 'date',
        'activated_at' => 'datetime',
        'tranche' => 'integer',
    ];

    public function salaryGradeSteps(): HasMany
    {
        return $this->hasMany(SalaryGradeStep::class, 'ssl_table_id', 'ssl_table_id');
    }

    public function activationLogs(): HasMany
    {
        return $this->hasMany(SslActivationLog::class, 'ssl_table_id', 'ssl_table_id');
    }

    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Returns the 33 × 8 grid as a nested array keyed by [salary_grade][step].
     */
    public function getGridAttribute(): array
    {
        $grid = [];
        foreach ($this->salaryGradeSteps as $step) {
            $grid[$step->salary_grade][$step->step] = $step->monthly_salary;
        }

        return $grid;
    }

    /**
     * How many of the 264 cells have a non-null salary amount.
     */
    public function getFilledCellsCountAttribute(): int
    {
        return $this->salaryGradeSteps->whereNotNull('monthly_salary')->count();
    }

    public function getTrancheOrdinalAttribute(): string
    {
        return match ($this->tranche) {
            1 => '1st',
            2 => '2nd',
            3 => '3rd',
            4 => '4th',
            default => (string) $this->tranche,
        };
    }
}
