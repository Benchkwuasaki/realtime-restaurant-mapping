<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EmployeeInternalOrganization extends Pivot
{
    protected $table = 'internal_organization_employees';

    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'internal_organization_id',
    ];
}