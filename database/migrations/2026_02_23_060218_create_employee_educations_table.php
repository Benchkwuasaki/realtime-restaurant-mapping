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
        Schema::create('employee_educations', function (Blueprint $table) {
            $table->id('employee_education_id');
            $table->foreignId('employee_basic_info_id')->constrained('employee_basic_info', 'employee_basic_info_id')->onDelete('cascade');
            $table->string('level');
            $table->string('school_name');
            $table->string('school_address')->nullable();
            $table->date('graduation_date')->nullable();
            $table->string('degree')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_educations');
    }
};
