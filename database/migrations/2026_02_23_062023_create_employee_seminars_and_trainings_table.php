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
        Schema::create('employee_seminars_and_trainings', function (Blueprint $table) {
            $table->id('employee_seminar_training_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->string('seminar_training_name');
            $table->string('provider');
            $table->date('date_attended');
            $table->string('venue')->nullable();
            $table->string('organizer')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_seminars_and_trainings');
    }
};
