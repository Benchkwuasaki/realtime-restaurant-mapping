<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_leave_balances', function (Blueprint $table) {
            $table->id('employee_leave_balance_id');
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->onDelete('cascade');
            $table->foreignId('leave_type_id')
                ->constrained('leave_types', 'leave_type_id')
                ->onDelete('cascade');
            $table->smallInteger('cycle_year');
            $table->decimal('total_days', 8, 4)->default(0);
            $table->decimal('used_days', 8, 4)->default(0);
            $table->decimal('balance', 8, 4)->default(0);
            $table->unique(['employee_id', 'leave_type_id', 'cycle_year'], 'unique_employee_leave_year');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_leave_balances');
    }
};
