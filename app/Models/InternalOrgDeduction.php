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
        'description',
        'amount',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'amount' => 'float',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

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

    /**
     * Tab key used in the UI to group by organization.
     */
    public function tabKey(): string
    {
        return $this->internal_organization_id;
    }
}
