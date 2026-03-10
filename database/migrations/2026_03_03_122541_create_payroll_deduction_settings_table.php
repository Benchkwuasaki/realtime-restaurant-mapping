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
            // Attendance divisor
            $table->unsignedSmallInteger('working_days_divisor')->default(22);

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
