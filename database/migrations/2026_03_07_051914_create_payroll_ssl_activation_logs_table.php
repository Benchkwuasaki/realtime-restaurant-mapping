<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_ssl_activation_logs', function (Blueprint $table) {
            $table->id('activation_log_id');

            $table->foreignId('ssl_table_id')
                ->constrained('payroll_ssl_tables', 'ssl_table_id')
                ->cascadeOnDelete();
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnDelete();
            $table->decimal('old_monthly_salary', 12, 2)->nullable();
            $table->decimal('new_monthly_salary', 12, 2)->nullable();
            $table->date('effective_date');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_ssl_activation_logs');
    }
};
