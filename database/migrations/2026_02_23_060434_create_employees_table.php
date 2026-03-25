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
            $table->foreignId('item_id')->constrained('items', 'item_id')->cascadeOnDelete();
            $table->foreignId('salary_grade_step_id')->constrained('salary_grade_steps', 'salary_grade_step_id')->onDelete('cascade');
            $table->enum('employment_classification', ['Regular', 'Job Order', 'Casual']);
            $table->string('work_email');
            $table->string('password');
            $table->string('solo_parent_id_number')->nullable();
            $table->date('solo_parent_id_expiry')->nullable();
            $table->string('work_id')->unique();
            $table->string('avatar_path')->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('status')->default(true);
            $table->date('date_applied');
            $table->date('date_hired');
            $table->date('appointment_end_date')->nullable();
            $table->time('work_schedule_start');
            $table->time('work_schedule_end');
            $table->time('break_start');
            $table->time('break_end');
            $table->softDeletes();
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
