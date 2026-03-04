<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Status flow:
     *   draft → pending → approved
     *                  ↘ rejected
     *   (any)          → cancelled
     *
     * Approval columns are scaffolded but nullable — logic not yet implemented.
     */
    public function up(): void
    {
        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id('leave_application_id');
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->onDelete('cascade');
            $table->foreignId('leave_type_id')
                ->constrained('leave_types', 'leave_type_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('days_requested', 5, 1);
            $table->text('reason')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'cancelled'])
                ->default('draft');
            $table->foreignId('approved_by_supervisor')->nullable()
                ->constrained('employees', 'employee_id')
                ->nullOnDelete();
            $table->foreignId('approved_by_manager')->nullable()
                ->constrained('employees', 'employee_id')
                ->nullOnDelete();
            $table->timestamp('supervisor_approved_at')->nullable();
            $table->timestamp('manager_approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('rejected_by')->nullable()
                ->constrained('employees', 'employee_id')
                ->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_applications');
    }
};