<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InternalOrganization extends Model
{
    use SoftDeletes;

    protected $table = 'internal_organizations';

    protected $primaryKey = 'internal_organization_id';

    protected $fillable = [
        'code',
        'name',
        'internal_org_type_id',
        'head_employee_id',
        'payroll_deduction_linked',
        'status',
    ];

    protected $casts = [
        'payroll_deduction_linked' => 'boolean',
        'status' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function orgType(): BelongsTo
    {
        return $this->belongsTo(InternalOrgType::class, 'internal_org_type_id', 'internal_org_type_id');
    }

    public function headEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'head_employee_id', 'employee_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            Employee::class,
            'internal_organization_employees',
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

    public function services(): HasMany
    {
        return $this->hasMany(
            InternalOrganizationService::class,
            'internal_organization_id',
            'internal_organization_id'
        );
    }
}
