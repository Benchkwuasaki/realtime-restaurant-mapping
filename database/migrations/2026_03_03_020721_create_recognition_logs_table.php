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
        Schema::create('recognition_logs', function (Blueprint $table) {
            $table->id('recognition_log_id');
            $table->unsignedBigInteger('employee_id');
            $table->enum('action_type', [
                'identification',
                'verification',
            ]);
            $table->enum('recognition_status', [
                'matched',
                'not_matched',
            ])->default('not_matched');
            $table->decimal('confidence_score', 6, 5);
            $table->decimal('similarity_threshold', 6, 5);
            $table->unsignedInteger('processing_time_ms');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->onDelete('cascade');

            $table->index(['employee_id', 'created_at']);
            $table->index(['action_type', 'created_at']);
            $table->index(['recognition_status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recognition_logs');
    }
};
