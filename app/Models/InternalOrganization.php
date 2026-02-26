<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
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
}