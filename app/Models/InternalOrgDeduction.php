<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalOrgDeduction extends Model
{
    protected $table = 'internal_org_deductions';

    protected $fillable = [
        'employee_id',
        'internal_organization_id',
        'internal_organization_service_id', // ← new
        'description',
        'amount',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'amount'      => 'float',
        'period_start' => 'date',
        'period_end'   => 'date',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function internalOrganization(): BelongsTo
    {
        return $this->belongsTo(
            InternalOrganization::class,
            'internal_organization_id',
            'internal_organization_id'
        );
    }

    public function service(): BelongsTo // ← new
    {
        return $this->belongsTo(
            InternalOrganizationService::class,
            'internal_organization_service_id',
            'internal_organization_service_id'
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function tabKey(): string
    {
        return $this->internal_organization_id;
    }
}