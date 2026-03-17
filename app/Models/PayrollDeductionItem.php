<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Itemized deduction ledger — one row per deduction line per payroll record.
 *
 * Replaces the opaque other_deductions_total aggregate with a full, auditable
 * breakdown. Consumers (register view, payslip, dispute resolution) should
 * read from this table for per-item detail.
 */
class PayrollDeductionItem extends Model
{
    protected $fillable = [
        'payroll_record_id',
        'category',         // PayrollDeductionPriorityOrder::CATEGORY_* constant
        'source_type',      // 'government_loan' | 'internal_org_deduction' | etc.
        'source_id',        // FK to originating record (nullable for gov't loans)
        'label',            // Human-readable: "GSIS MPL", "AMA Savings"
        'org_name',         // Organisation name for org items
        'amount',           // Raw amount before floor rule / waiver
        'effective_amount', // Amount actually applied after floor rule
        'was_cut',          // True when floor rule zeroed / reduced this item
        'cut_amount',       // Difference: amount - effective_amount
        'waived',           // True when HR waived this item (carry-forward applied)
    ];

    protected $casts = [
        'amount' => 'float',
        'effective_amount' => 'float',
        'cut_amount' => 'float',
        'was_cut' => 'boolean',
        'waived' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function payrollRecord(): BelongsTo
    {
        return $this->belongsTo(PayrollRecord::class, 'payroll_record_id', 'payroll_record_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Build a ledger item array ready for ::create() from a government loan.
     */
    public static function fromGovernmentLoan(
        int $payrollRecordId,
        string $category,
        string $label,
        float $rawAmount,
        float $effectiveAmount,
        bool $waived,
    ): array {
        return [
            'payroll_record_id' => $payrollRecordId,
            'category' => $category,
            'source_type' => 'government_loan',
            'source_id' => null,
            'label' => $label,
            'org_name' => null,
            'amount' => $rawAmount,
            'effective_amount' => $effectiveAmount,
            'was_cut' => $effectiveAmount < $rawAmount,
            'cut_amount' => max(0.0, $rawAmount - $effectiveAmount),
            'waived' => $waived,
        ];
    }

    /**
     * Build a ledger item array from an InternalOrgDeduction or Loan item.
     */
    public static function fromOrgItem(
        int $payrollRecordId,
        string $category,
        string $sourceType,
        int $sourceId,
        string $label,
        string $orgName,
        float $amount,
        bool $waived,
    ): array {
        return [
            'payroll_record_id' => $payrollRecordId,
            'category' => $category,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'label' => $label,
            'org_name' => $orgName,
            'amount' => $amount,
            'effective_amount' => $waived ? 0.0 : $amount,
            'was_cut' => false,
            'cut_amount' => 0.0,
            'waived' => $waived,
        ];
    }

    /**
     * Build a ledger item from an OtherDeduction entry.
     */
    public static function fromOtherDeduction(
        int $payrollRecordId,
        string $category,
        string $sourceType,
        int $sourceId,
        string $label,
        float $amount,
        bool $waived,
    ): array {
        return [
            'payroll_record_id' => $payrollRecordId,
            'category' => $category,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'label' => $label,
            'org_name' => null,
            'amount' => $amount,
            'effective_amount' => $waived ? 0.0 : $amount,
            'was_cut' => false,
            'cut_amount' => 0.0,
            'waived' => $waived,
        ];
    }
}
