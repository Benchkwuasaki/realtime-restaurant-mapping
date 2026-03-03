<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $table = "leave_types";

    protected $primaryKey = "leave_type_id";

    protected $fillable = [
        "leave_type_id",
        "leave_type_name",
        "leave_type_description",
        "eligible_sex",
        "is_paid",
        "is_convertible",
        "status",
    ];

     public function requirements()
    {
        return $this->hasMany(LeaveTypeRequirement::class, 'leave_type_id');
    }

}
