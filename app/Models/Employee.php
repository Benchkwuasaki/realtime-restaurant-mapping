<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'employee_basic_info_id',
        'item_id',
        'salary_grade_step_id',
        'profile_picture',
        'employment_classification',
        'work_email',
        'password',
        'date_applied',
        'date_hired',
        'work_schedule_start',
        'work_schedule_end',
        'status',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'date_applied'  => 'date',
        'date_hired'    => 'date',
        'status'        => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────

    public function basicInfo(): BelongsTo
    {
        return $this->belongsTo(EmployeeBasicInfo::class, 'employee_basic_info_id', 'employee_basic_info_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'item_id');
    }

    public function salaryGradeStep(): BelongsTo
    {
        return $this->belongsTo(SalaryGradeStep::class, 'salary_grade_step_id', 'salary_grade_step_id');
    }

    public function allowances(): HasMany
    {
        return $this->hasMany(EmployeeAllowance::class, 'employee_id', 'employee_id');
    }

    public function payrollData(): HasMany
    {
        return $this->hasMany(EmployeePayrollData::class, 'employee_id', 'employee_id');
    }

    public function serviceRecords(): HasMany
    {
        return $this->hasMany(EmployeeServiceRecord::class, 'employee_id', 'employee_id');
    }

    public function seminarsAndTrainings(): HasMany
    {
        return $this->hasMany(EmployeeSeminarAndTraining::class, 'employee_id', 'employee_id');
    }

    public function uploadedFiles(): HasMany
    {
        return $this->hasMany(EmployeeUploadedFile::class, 'employee_id', 'employee_id');
    }

    public function waterBill(): HasOne
    {
        return $this->hasOne(EmployeeWaterBill::class, 'employee_id', 'employee_id');
    }

    public function eligibilityInformation(): HasMany
    {
        return $this->hasMany(EligibilityInformation::class, 'employee_id', 'employee_id');
    }
}