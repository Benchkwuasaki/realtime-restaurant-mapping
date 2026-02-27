<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InternalOrganization extends Model
{

    protected $table = 'internal_organizations';
    protected $primaryKey = 'internal_organization_id';
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
        'status' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            Employee::class,
            'employee_internal_organization',
            'internal_organization_id',
            'employee_id',
            'internal_organization_id',
            'employee_id'
        )->withTimestamps();
    }

    public function getRouteKeyName(): string
    {
        return 'internal_organization_id';
    }
}