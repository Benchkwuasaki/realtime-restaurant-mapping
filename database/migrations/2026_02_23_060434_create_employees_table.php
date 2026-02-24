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
        Schema::create('employees', function (Blueprint $table) {
            $table->id('employee_id');
            $table->foreignId('employee_basic_info_id')->constrained('employee_basic_info', 'employee_basic_info_id')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items', 'item_id')->onDelete('cascade');
            $table->foreignId('salary_grade_step_id')->constrained('salary_grade_steps', 'salary_grade_step_id')->onDelete('cascade');
            $table->string('profile_picture')->nullable();
            $table->enum('employment_classification', ['Regular', 'Job Order', 'Casual']);
            $table->string('work_email')->unique();
            $table->string('password');
            $table->date('date_applied');
            $table->date('date_hired');
            $table->time('work_schedule_start');
            $table->time('work_schedule_end');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
