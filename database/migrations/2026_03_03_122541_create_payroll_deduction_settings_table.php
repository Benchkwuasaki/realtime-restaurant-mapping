<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_deduction_settings', function (Blueprint $table) {
            $table->id();

            // Government contribution rates (stored as percentages, e.g. 9.0 = 9%)
            $table->decimal('gsis_employee_rate', 5, 2)->default(9.00);
            $table->decimal('gsis_employer_rate', 5, 2)->default(12.00);
            $table->decimal('philhealth_rate', 5, 2)->default(2.50);   // Employee share only
            $table->decimal('pagibig_monthly', 8, 2)->default(100.00); // Fixed monthly cap

            // Attendance divisor
            $table->unsignedTinyInteger('working_days_divisor')->default(22);

            // Floor rules
            $table->decimal('minimum_take_home_pay', 10, 2)->default(3000.00);
            $table->decimal('salary_threshold', 10, 2)->default(6000.00);

            // Deduction priority order (JSON array)
            $table->json('priority_order')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_deduction_settings');
    }
};
