<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeBasicInfo extends Model
{
    protected $primaryKey = 'employee_basic_info_id';

    protected $table = 'employee_basic_info';

    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'name_extension',
        'birth_date',
        'sex',
        'personal_email',
        'phone_number',
        'civil_status',
        'place_of_birth',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'sex'        => 'boolean',
    ];

    protected $appends = ['full_name'];

    // ── Computed ───────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        $name = "{$this->first_name}";
        if ($this->middle_name) {
            $name .= " {$this->middle_name}";
        }
        $name .= " {$this->last_name}";
        if ($this->name_extension) {
            $name .= " {$this->name_extension}";
        }
        return $name;
    }

    // ── Relationships ──────────────────────────────────────────────

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(EmployeeAddress::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }

    public function educations(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }

    public function familyInfo(): HasMany
    {
        return $this->hasMany(FamilyInfo::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }
}