<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Posting header ─────────────────────────────────────────────────────
        Schema::create('leave_accrual_postings', function (Blueprint $table) {
            $table->id('leave_accrual_posting_id');

            $table->unsignedTinyInteger('posting_month');            // 1–12
            $table->unsignedSmallInteger('posting_year');

            $table->unsignedTinyInteger('total_days_in_month');
            $table->unsignedTinyInteger('total_sundays');
            $table->unsignedTinyInteger('total_holidays');
            $table->unsignedTinyInteger('work_days');                // stored for audit trail

            $table->unsignedBigInteger('posted_by_user_id')->nullable();
            $table->string('reference_no')->unique();                // e.g. LP-03-2026

            $table->string('status')->default('draft');              // draft | posted

            $table->timestamps();

            $table->unique(['posting_month', 'posting_year']);       // prevent double-posting
        });

        // ── Per-employee accrual lines ─────────────────────────────────────────
        Schema::create('leave_accrual_records', function (Blueprint $table) {
            $table->id('leave_accrual_record_id');
            $table->foreignId('leave_accrual_posting_id')
                ->constrained('leave_accrual_postings', 'leave_accrual_posting_id')
                ->cascadeOnDelete();
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->cascadeOnDelete();
            $table->foreignId('leave_type_id')
                ->constrained('leave_types', 'leave_type_id');
            // Total Minutes Worked (TMW) by the employee in the posting period.
            // Used in the CSC formula: accrual = 1.25 / (TWD×8×60) × TMW
            $table->unsignedInteger('minutes_worked')->default(0);
            $table->decimal('accrual_earned', 8, 4);

            $table->decimal('balance_before', 8, 4)->default(0);
            $table->decimal('balance_after', 8, 4)->default(0);
            $table->string('credit_status')->default('full_credit');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_accrual_records');
        Schema::dropIfExists('leave_accrual_postings');
    }
};
