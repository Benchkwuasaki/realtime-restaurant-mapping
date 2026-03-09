<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `employee_type` to payroll_periods so that the same date range can be
 * processed independently for each employment classification (Regular, Casual,
 * Job Order, etc.).
 *
 * The unique constraint on (start_date, end_date, employee_type) enforces that
 * each combination is only ever finalized once — making the duplicate-prevention
 * check in PayrollProcessingController::checkDuplicate() reliable.
 *
 * `employee_type` is nullable so that existing rows (created before this
 * migration) are not broken.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_periods', function (Blueprint $table) {
            $table->string('employee_type', 100)->nullable()->after('status');
            $table->unique(['start_date', 'end_date', 'employee_type'], 'payroll_periods_period_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_periods', function (Blueprint $table) {
            $table->dropUnique('payroll_periods_period_type_unique');
            $table->dropColumn('employee_type');
        });
    }
};
