<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalOrgType extends Model
{
    protected $table = 'internal_org_types';
    protected $primaryKey = 'internal_org_type_id';

    protected $fillable = ['internal_org_type'];

    public function organizations(): HasMany
    {
        return $this->hasMany(InternalOrganization::class, 'internal_org_type_id', 'internal_org_type_id');
    }
}