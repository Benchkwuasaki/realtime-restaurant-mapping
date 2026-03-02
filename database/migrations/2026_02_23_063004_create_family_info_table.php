<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('family_info', function (Blueprint $table) {
            $table->id('family_info_id');
            $table->foreignId('employee_basic_info_id')->constrained('employee_basic_info', 'employee_basic_info_id')->onDelete('cascade');
            $table->string('full_name');
            $table->string('contact_number')->nullable();
            $table->string('relationship')->nullable();
            $table->boolean('sex')->default(true);
            $table->date('date_of_birth')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('family_info');
    }
};
