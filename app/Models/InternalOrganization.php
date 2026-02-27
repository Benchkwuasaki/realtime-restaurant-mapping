<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InternalOrganization extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'type',
        'head',
        'payroll_deduction_linked',
        'status',
    ];

    protected $casts = [
        'payroll_deduction_linked' => 'boolean',
        'status'                   => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            Employee::class,
            'employee_internal_organization', // pivot table
            'internal_organization_id',       // FK for this model on pivot
            'employee_id',                    // FK for Employee on pivot
            'id',                             // local key on this model (UUID)
            'employee_id'                     // local key on Employee model
        )->withTimestamps();
    }
}