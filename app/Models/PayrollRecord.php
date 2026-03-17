<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRecord extends Model
{
    protected $primaryKey = 'payroll_record_id';

    protected $fillable = [
        'employee_id',
        'payroll_period_id',

        // ── Earnings ──────────────────────────────────────────────────────────
        'basic_pay',
        'pera',
        'rice_allowance',
        'uniform_allowance',
        'overtime_pay',

        // ── Statutory Deductions ──────────────────────────────────────────────
        'gsis_premium',
        'philhealth',
        'pag_ibig',
        'withholding_tax',

        // ── Attendance Deductions ─────────────────────────────────────────────
        'absent_days',
        'absent_deduction',
        'half_days',
        'half_day_deduction',
        'late_minutes',
        'late_deduction',
        'undertime_minutes',
        'undertime_deduction',

        // ── Slip Deductions ───────────────────────────────────────────────────
        'personal_slip_minutes',
        'personal_slip_deduction',
        'official_slip_minutes',   // stored for audit, never deducted

        // ── Work Metrics ──────────────────────────────────────────────────────
        'total_work_days',
        'total_hours_worked',
        'total_overtime_hours',

        // ── Gov't Loan Deductions ─────────────────────────────────────────────
        'gsis_mpl',
        'gsis_emergency',
        'pag_ibig_mpl',

        // ── Internal Org Deductions ───────────────────────────────────────────
        'internal_org_savings',    // Savings + Share_Capital (both cut-offs)
        'internal_org_second',     // Dues only (2nd cut-off; stored for display)

        // ── Other / Misc Deductions ───────────────────────────────────────────
        // Renamed from ama_y2k_union.
        // Contains: internal org loans + dues + NS&ND + miscellaneous.
        'other_deductions_total',
        'water_bill',

        // ── Totals & Meta ─────────────────────────────────────────────────────
        'net_pay',
        'floor_check_passed',
        'floor_cut_amount',
        'posted_at',
        'hr_officer_name',
        'status',
    ];

    protected $casts = [
        'basic_pay' => 'float',
        'pera' => 'float',
        'rice_allowance' => 'float',
        'uniform_allowance' => 'float',
        'overtime_pay' => 'float',
        'gsis_premium' => 'float',
        'philhealth' => 'float',
        'pag_ibig' => 'float',
        'withholding_tax' => 'float',
        'absent_days' => 'float',
        'absent_deduction' => 'float',
        'half_days' => 'integer',
        'half_day_deduction' => 'float',
        'late_minutes' => 'integer',
        'late_deduction' => 'float',
        'undertime_minutes' => 'integer',
        'undertime_deduction' => 'float',
        'personal_slip_minutes' => 'integer',
        'personal_slip_deduction' => 'float',
        'official_slip_minutes' => 'integer',
        'total_work_days' => 'float',
        'total_hours_worked' => 'float',
        'total_overtime_hours' => 'float',
        'gsis_mpl' => 'float',
        'gsis_emergency' => 'float',
        'pag_ibig_mpl' => 'float',
        'internal_org_savings' => 'float',
        'internal_org_second' => 'float',
        'other_deductions_total' => 'float',
        'water_bill' => 'float',
        'net_pay' => 'float',
        'floor_check_passed' => 'boolean',
        'floor_cut_amount' => 'float',
        'posted_at' => 'datetime',
    ];

    // ── Computed Attributes ───────────────────────────────────────────────────

    public function getGrossPayAttribute(): float
    {
        return (float) $this->basic_pay
            + (float) $this->pera
            + (float) $this->rice_allowance
            + (float) $this->uniform_allowance
            + (float) ($this->overtime_pay ?? 0);
    }

    public function getTotalDeductionsAttribute(): float
    {
        return (float) $this->gsis_premium
            + (float) $this->philhealth
            + (float) $this->pag_ibig
            + (float) $this->withholding_tax
            + (float) $this->absent_deduction
            + (float) ($this->half_day_deduction ?? 0)
            + (float) $this->late_deduction
            + (float) ($this->undertime_deduction ?? 0)
            + (float) ($this->personal_slip_deduction ?? 0)
            + (float) $this->internal_org_savings   // both cut-offs
            + (float) $this->gsis_mpl
            + (float) $this->gsis_emergency
            + (float) $this->pag_ibig_mpl
            + (float) $this->other_deductions_total // org loans + dues + misc
            + (float) $this->water_bill;
    }

    /**
     * Backward-compatibility accessor.
     * Any code still reading ->ama_y2k_union will get other_deductions_total.
     * Remove after all callsites are updated.
     */
    public function getAmaY2kUnionAttribute(): float
    {
        return (float) $this->other_deductions_total;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function deductionItems(): HasMany
    {
        return $this->hasMany(PayrollDeductionItem::class, 'payroll_record_id', 'payroll_record_id');
    }
}
