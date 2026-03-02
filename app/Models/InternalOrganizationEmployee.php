<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EmployeeInternalOrganization extends Pivot
{
    protected $table = 'employee_internal_organization';

    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'internal_organization_id',
    ];
}