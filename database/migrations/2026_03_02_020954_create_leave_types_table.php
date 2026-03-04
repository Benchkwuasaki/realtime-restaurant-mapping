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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id('leave_type_id');
            $table->string('leave_type_name')->unique();
            $table->text('leave_type_description')->nullable();
            $table->enum('eligible_sex', ['All', 'Male', 'Female'])->default('All');
            $table->boolean('is_paid')->default(false);
            $table->boolean('is_convertible')->default(false);
            $table->boolean('is_accrual')->default(false);
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};