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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id('attendance_record_id');
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnDelete();
            $table->foreignId('recognition_morning_in_id')
                ->nullable()
                ->constrained('recognition_logs', 'recognition_log_id')
                ->nullOnDelete();
            $table->foreignId('recognition_morning_out_id')
                ->nullable()
                ->constrained('recognition_logs', 'recognition_log_id')
                ->nullOnDelete();
            $table->foreignId('recognition_afternoon_in_id')
                ->nullable()
                ->constrained('recognition_logs', 'recognition_log_id')
                ->nullOnDelete();
            $table->foreignId('recognition_afternoon_out_id')
                ->nullable()
                ->constrained('recognition_logs', 'recognition_log_id')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['employee_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
