<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                  ->constrained('employees', 'employee_id')
                  ->cascadeOnDelete();

            $table->date('date');

            // Scheduled times — snapshotted from employee at process time
            $table->time('scheduled_time_in')->nullable();
            $table->time('scheduled_break_out')->nullable();
            $table->time('scheduled_break_in')->nullable();
            $table->time('scheduled_time_out')->nullable();

            $table->unsignedSmallInteger('grace_minutes')->default(0);

            // Actual times derived from attendances table
            $table->time('time_in')->nullable();
            $table->time('break_out')->nullable();
            $table->time('break_in')->nullable();
            $table->time('time_out')->nullable();

            // Computed
            $table->unsignedSmallInteger('late_minutes')->nullable();
            $table->unsignedSmallInteger('work_minutes')->nullable();

            $table->enum('status', ['PRESENT', 'HALF_DAY', 'ABSENT'])->default('ABSENT');

            $table->timestamps();

            $table->unique(['employee_id', 'date'], 'attendance_records_employee_date_unique');
            $table->index('date');
            $table->index(['date', 'status']);
            $table->index(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};