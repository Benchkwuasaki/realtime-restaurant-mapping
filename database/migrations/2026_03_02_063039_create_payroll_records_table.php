<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

            // ── Statutory Deductions ──────────────────────────────────────────
            $table->decimal('gsis_premium', 10, 2)->default(0);
            $table->decimal('philhealth', 10, 2)->default(0);
            $table->decimal('pag_ibig', 10, 2)->default(0);
            $table->decimal('withholding_tax', 10, 2)->default(0);

            // ── Attendance Deductions ─────────────────────────────────────────
            $table->integer('absent_days')->default(0);
            $table->decimal('absent_deduction', 10, 2)->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);

            // ── Gov't Loan Deductions (2nd cut-off only) ──────────────────────
            $table->decimal('gsis_mpl', 10, 2)->default(0);
            $table->decimal('gsis_emergency', 10, 2)->default(0);
            $table->decimal('pag_ibig_mpl', 10, 2)->default(0);

            // ── Other Deductions (2nd cut-off only) ───────────────────────────
            // Includes: internal org loans (from loans table), internal org dues,
            // AMA, Y2K, Union, NS&ND, Miscellaneous
            $table->decimal('ama_y2k_union', 10, 2)->default(0);
            $table->decimal('water_bill', 10, 2)->default(0);

            // ── Internal Org Deductions ───────────────────────────────────────
            // Savings + Share_Capital → deducted on BOTH cut-offs
            $table->decimal('internal_org_savings', 10, 2)->default(0);
            // Dues → deducted on 2nd cut-off only
            // (loans are in ama_y2k_union via the loans table)
            $table->decimal('internal_org_second', 10, 2)->default(0);

            // ── Net Pay ───────────────────────────────────────────────────────
            $table->decimal('net_pay', 12, 2)->default(0);

            // ── Meta ──────────────────────────────────────────────────────────
            $table->boolean('floor_check_passed')->default(false);
            $table->timestamp('posted_at')->nullable();
            $table->string('hr_officer_name')->nullable();
            $table->enum('status', ['draft', 'posted', 'locked'])->default('draft');

            $table->timestamps();

            $table->unique(['employee_id', 'payroll_period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
    }
};