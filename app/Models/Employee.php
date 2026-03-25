<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'solo_parent_id_number',        // RA 8972 — Solo Parent Leave eligibility
        'solo_parent_id_expiry',        // Must be valid (not expired) at time of filing
        'date_applied',
        'date_hired',
        'appointment_end_date',         // For Casual & Job Order CSC plantilla period
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
        'appointment_end_date' => 'date',
        'solo_parent_id_expiry' => 'date',
        'status' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

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

    // ── NEW: links to actual processed payroll records (payslip history) ───────
    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class, 'employee_id', 'employee_id');
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

    public function leaveApplications(): HasMany
    {
        return $this->hasMany(LeaveApplication::class, 'employee_id', 'employee_id');
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class, 'employee_id', 'employee_id');
    }

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

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'employee_id', 'employee_id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'employee_id', 'employee_id');
    }

    // ─── Leave helpers ────────────────────────────────────────────────────────

    /**
     * Returns the number of complete years of service from date_hired
     * to a given reference date (defaults to today).
     *
     * Used for:
     *   - Solo Parent Leave eligibility gate (≥ 1 year)
     *   - Study Leave eligibility gate (≥ 6 years)
     *   - Maternity Leave proportional pay computation (< 2 years)
     */
    public function yearsOfService(?Carbon $asOf = null): int
    {
        if (! $this->date_hired) {
            return 0;
        }

        return (int) $this->date_hired->diffInYears($asOf ?? Carbon::today());
    }

    /**
     * Whether the employee currently holds a valid Solo Parent ID.
     *
     * CSC / RA 8972 requires a valid, unexpired ID from the DSWD
     * at the time of leave filing. An ID with no expiry date set
     * is treated as not yet recorded — returns false.
     */
    public function hasValidSoloParentId(?Carbon $asOf = null): bool
    {
        if (! $this->solo_parent_id_number || ! $this->solo_parent_id_expiry) {
            return false;
        }

        return ($asOf ?? Carbon::today())->lessThanOrEqualTo($this->solo_parent_id_expiry);
    }

    /**
     * Whether the employee is female.
     * Sourced from basicInfo.sex (1 = Female, 0 = Male).
     * Used for SLB for Women, VAWC Leave, and Maternity Leave eligibility.
     */
    public function isFemale(): bool
    {
        return (bool) ($this->basicInfo?->sex ?? false);
    }

    /**
     * Whether the employee is married.
     * Sourced from basicInfo.civil_status.
     * Used for Paternity Leave (married male) and Maternity Leave gating.
     */
    public function isMarried(): bool
    {
        return ($this->basicInfo?->civil_status ?? '') === 'married';
    }
}
