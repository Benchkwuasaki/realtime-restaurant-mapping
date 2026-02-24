<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employee_payroll_data', function (Blueprint $table) {
            $table->id('employee_payroll_data_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->decimal('initial_amount', 10, 2);
            $table->decimal('deduction_amount', 10, 2);
            $table->decimal('final_amount', 10, 2);
            $table->date('date_processed');
            $table->string('payroll_status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_payroll_data');
    }
};
