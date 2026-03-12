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
            $table->string('office_department')->nullable();
            $table->string('position')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->string('leave_type_availed')->nullable();
            $table->timestamp('date_of_filing');

            // 6.C Number of working days applied for (inclusive dates)
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Commutation
            $table->boolean('is_requested')->default(false);


            $table->boolean('is_with_pay')->default(false);

            // 7.C Approved For:
            $table->decimal('approved_with_pay', 8, 2)->nullable();
            $table->decimal('approved_without_pay', 8, 2)->nullable();
            $table->string('approved_others')->nullable();


            $table->enum('status', ['Pending', 'For Approval', 'For Disapproval', 'Approved', 'Disapproved']);
            $table->text('for_disapproval_reason')->nullable();
            $table->text('disapproved_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('leave_application_details', function (Blueprint $table) {
            $table->id('leave_application_detail_id');
            $table->foreignId('leave_application_id')->constrained('leave_applications', 'leave_application_id')->cascadeOnDelete();
            // 6.B Vacation / Special Privilege Leave
            $table->enum('leave_location_type', ['ph', 'abroad'])->nullable();
            $table->string('leave_location')->nullable();

            // 6.B Sick Leave / Rehabilitation Leave
            $table->enum('sick_type', ['hospital', 'outpatient'])->nullable();
            $table->string('sick_details')->nullable();

            // 6.B Special Leave Benefits for Women
            $table->string('women_illness')->nullable();

            // 6.B Study Leave
            $table->string('study_purpose')->nullable();
            // other purpose
            $table->string('other_purpose')->nullable();

            $table->decimal('monetization_vl_days', 8, 2)->nullable();
            $table->decimal('monetization_sl_days', 8, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_applications');
    }
};