<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whereabout_slips', function (Blueprint $table) {
            $table->id('whereabout_slip_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('reviewed_and_noted_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('approved_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('attested_by_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->date('date_filed');
            $table->enum('purpose_type', ['official', 'personal']);
            $table->string('purpose_description');
            $table->time('time_out');
            $table->time('time_returned')->nullable();
            $table->date('date_returned')->nullable();
            $table->time('time_noted')->nullable();
            $table->date('date_noted')->nullable();
            $table->unsignedSmallInteger('minutes_gone')->nullable();
            $table->enum('status', ['still_out', 'not_returned', 'returned'])->default('still_out');
            $table->string('prov_code')->nullable();
            $table->string('city_code')->nullable();
            $table->string('brgy_code')->nullable();
            $table->decimal('latitude', 11, 7)->nullable();
            $table->decimal('longitude', 11, 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whereabout_slips');
    }
};
