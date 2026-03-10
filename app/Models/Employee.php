<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\EmployeeAllowance;
use App\Models\EmployeePayrollData;
use App\Models\EmployeeServiceRecord;
use App\Models\EmployeeSeminarAndTraining;
use App\Models\EmployeeUploadedFile;
use App\Models\EmployeeWaterBill;
use App\Models\EligibilityInformation;
use App\Models\GovernmentAccount;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'employee_basic_info_id',
        'item_id',
        'salary_grade_step_id',
        'employment_classification',
        'work_email',
        'work_id',
        'password',
        'date_applied',
        'date_hired',
        'work_schedule_start',
        'work_schedule_end',
        'break_start',
        'break_end',
        'avatar_path',
        'avatar_url',
        'status',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'date_applied' => 'date',
        'date_hired' => 'date',
        'status' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

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

    public function governmentAccounts(): HasMany
    {
        return $this->hasMany(GovernmentAccount::class, 'employee_id', 'employee_id');
    }

    /**
     * Leave applications filed by this employee.
     */
    public function leaveApplications(): HasMany
    {
        return $this->hasMany(LeaveApplication::class, 'employee_id', 'employee_id');
    }

    /**
     * Leave balances per leave type per cycle year.
     */
    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class, 'employee_id', 'employee_id');
    }

    // ── Internal Organizations ─────────────────────────────────────────────────

    // In App\Models\Employee.php
    public function internalOrganizations(): BelongsToMany
    {
        return $this->belongsToMany(
            InternalOrganization::class,
            'internal_organization_employees',
            'employee_id',
            'internal_organization_id',
            'employee_id',
            'internal_organization_id'
        )->withTimestamps();
    }

    public function user()
    {
        return $this->hasOne(User::class, 'employee_id', 'employee_id');
    }
}
