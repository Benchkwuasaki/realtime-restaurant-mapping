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
        Schema::create('whereabout_slips', function (Blueprint $table) {
            $table->id('whereabout_slip_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('reviewed_and_noted_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('approved_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('attested_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->date('date_filed');
            $table->boolean('purpose_type');
            $table->string('purpose_description');
            $table->time('time_out');
            $table->time('time_noted');
            $table->time('time_returned');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('return_status', ['still_here', 'not_returned', 'returned'])->default('still_here');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whereabout_slips');
    }
};
