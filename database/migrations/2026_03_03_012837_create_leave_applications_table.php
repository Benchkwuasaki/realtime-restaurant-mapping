<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use function Laravel\Prompts\table;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id('leave_application_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->nullable()->constrained('leave_types', 'leave_type_id')->cascadeOnDelete();
            $table->foreignId('recommendation_officer')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->foreignId('approval_officer')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->string('leave_type_availed');
            $table->timestamp('date_of_filing');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_requested');
            $table->boolean('is_with_pay');
            $table->string('approved_for_specifics')->nullable();
            $table->enum('status', ['Pending', 'For Approval', 'For Disapproval', 'Approval', 'Disapproved']);
            $table->text('for_disapproval_reason')->nullable();
            $table->text('disapproved_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('leave_application_details', function (Blueprint $table) {
            $table->id('leave_application_detail_id');
            $table->foreignId('leave_application_id')->constrained('leave_applications', 'leave_application_id')->cascadeOnDelete();
            $table->string('leave_location')->nullable();
            $table->string('illness_details')->nullable();
            $table->string('study_leave_purpose')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_applications');
    }
};