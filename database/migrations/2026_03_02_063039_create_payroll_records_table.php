<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add allowance_type to master allowances table ──────────────────
        // Replaces str_contains keyword matching in resolveAllowances().
        Schema::table('allowances', function (Blueprint $table) {
            $table->enum('allowance_type', [
                'pera',
                'rice_subsidy',
                'uniform_clothing',
                'taxable_other',
                'non_taxable_other',
            ])->nullable()->after('name');
        });

        // ── 2. Add allowance_type snapshot to employee_allowances ─────────────
        // Written when HR assigns an allowance so payroll always reads the typed
        // value from the snapshot, not the master.
        Schema::table('employee_allowances', function (Blueprint $table) {
            $table->enum('allowance_type', [
                'pera',
                'rice_subsidy',
                'uniform_clothing',
                'taxable_other',
                'non_taxable_other',
            ])->nullable()->after('allowance_name');
        });

        // ── 3. Add loan_classification to loans table ─────────────────────────
        // Replaces str_contains / in_array source matching in computeForEmployee().
        Schema::table('loans', function (Blueprint $table) {
            $table->enum('loan_classification', [
                'gsis_regular',
                'gsis_emergency',
                'pagibig',
                'internal_org',
            ])->nullable()->after('source');
        });

        // ── 4. Create payroll_records ─────────────────────────────────────────
        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id('payroll_record_id');

            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('payroll_period_id');
            $table->foreign('payroll_period_id')
                ->references('payroll_period_id')
                ->on('payroll_periods')
                ->cascadeOnDelete();

            // ── Earnings ──────────────────────────────────────────────────────
            $table->decimal('basic_pay', 12, 2)->default(0);
            $table->decimal('pera', 10, 2)->default(0);
            $table->decimal('rice_allowance', 10, 2)->default(0);
            $table->decimal('uniform_allowance', 10, 2)->default(0);
            $table->decimal('overtime_pay', 10, 2)->default(0);

            // ── Statutory Deductions ──────────────────────────────────────────
            $table->decimal('gsis_premium', 10, 2)->default(0);
            $table->decimal('philhealth', 10, 2)->default(0);
            $table->decimal('pag_ibig', 10, 2)->default(0);
            $table->decimal('withholding_tax', 10, 2)->default(0);

            // ── Attendance Deductions ─────────────────────────────────────────
            // absent_days stored as DECIMAL to support 0.5 (HALF_DAY)
            $table->decimal('absent_days', 5, 2)->default(0);
            $table->decimal('absent_deduction', 10, 2)->default(0);
            $table->integer('half_days')->default(0);
            $table->decimal('half_day_deduction', 10, 2)->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);
            $table->integer('undertime_minutes')->default(0);
            $table->decimal('undertime_deduction', 10, 2)->default(0);

            // ── Whereabout Slip Deductions ────────────────────────────────────
            // personal_slip → chargeable; deducted from pay
            // official_slip → authorised; stored for audit only, never deducted
            $table->integer('personal_slip_minutes')->default(0);
            $table->decimal('personal_slip_deduction', 10, 2)->default(0);
            $table->integer('official_slip_minutes')->default(0);

            // ── Work Metrics (for payslip & audit) ───────────────────────────
            $table->decimal('total_work_days', 5, 2)->default(0);
            $table->decimal('total_hours_worked', 8, 2)->default(0);
            $table->decimal('total_overtime_hours', 8, 4)->default(0);

            // ── Gov't Loan Deductions ─────────────────────────────────────────
            $table->decimal('gsis_mpl', 10, 2)->default(0);
            $table->decimal('gsis_emergency', 10, 2)->default(0);
            $table->decimal('pag_ibig_mpl', 10, 2)->default(0);

            // ── Internal Org Deductions ───────────────────────────────────────
            // Savings + Share_Capital → deducted on BOTH cut-offs
            $table->decimal('internal_org_savings', 10, 2)->default(0);
            // Dues → deducted on 2nd cut-off only (stored for drill-down display)
            $table->decimal('internal_org_second', 10, 2)->default(0);

            // ── Other / Miscellaneous Deductions ─────────────────────────────
            // Renamed from ama_y2k_union. Accumulates: internal org loans,
            // internal org dues, NS&ND, and miscellaneous OtherDeduction entries.
            // Itemized breakdown lives in payroll_deduction_items.
            $table->decimal('other_deductions_total', 10, 2)->default(0);
            $table->decimal('water_bill', 10, 2)->default(0);

            // ── Net Pay ───────────────────────────────────────────────────────
            $table->decimal('net_pay', 12, 2)->default(0);

            // ── Floor Rule ────────────────────────────────────────────────────
            $table->boolean('floor_check_passed')->default(false);
            $table->decimal('floor_cut_amount', 10, 2)->default(0);

            // ── Meta ──────────────────────────────────────────────────────────
            $table->timestamp('posted_at')->nullable();
            $table->string('hr_officer_name')->nullable();
            $table->enum('status', ['draft', 'posted', 'locked'])->default('draft');

            $table->timestamps();

            $table->unique(['employee_id', 'payroll_period_id']);
        });

        // ── 5. Create payroll_deduction_items (itemized ledger) ───────────────
        // One row per deduction line per payroll record.
        // Replaces the opaque other_deductions_total aggregate with a full audit trail.
        Schema::create('payroll_deduction_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('payroll_record_id');
            $table->foreign('payroll_record_id')
                ->references('payroll_record_id')
                ->on('payroll_records')
                ->cascadeOnDelete();

            // Matches PayrollDeductionPriorityOrder::CATEGORY_* constants
            $table->string('category', 60);

            // Which table generated this item
            $table->enum('source_type', [
                'government_loan',
                'internal_org_deduction',
                'internal_org_loan',
                'other_deduction',
                'water_bill',
                'miscellaneous',
            ]);

            // FK to the originating record (nullable for gov't loans which have no row)
            $table->unsignedBigInteger('source_id')->nullable();

            // Human-readable label e.g. "GSIS MPL", "AMA Savings"
            $table->string('label', 255);

            // Organisation name for org deductions (null for statutory/misc)
            $table->string('org_name', 255)->nullable();

            // Amount before floor rule / waiver
            $table->decimal('amount', 12, 2);

            // Amount actually applied after floor rule
            $table->decimal('effective_amount', 12, 2);

            $table->boolean('was_cut')->default(false);
            $table->decimal('cut_amount', 12, 2)->default(0);

            // HR waived this item for this period (carry-forward applied)
            $table->boolean('waived')->default(false);

            $table->timestamps();

            $table->index(['payroll_record_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_deduction_items');
        Schema::dropIfExists('payroll_records');

        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('loan_classification');
        });

        Schema::table('employee_allowances', function (Blueprint $table) {
            $table->dropColumn('allowance_type');
        });

        Schema::table('allowances', function (Blueprint $table) {
            $table->dropColumn('allowance_type');
        });
    }
};
