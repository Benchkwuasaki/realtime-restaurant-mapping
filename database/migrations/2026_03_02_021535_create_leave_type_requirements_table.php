<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_type_requirements', function (Blueprint $table) {
            $table->id('leave_type_requirement_id');
            $table->foreignId('leave_type_id')->constrained('leave_types', 'leave_type_id');
            $table->string('requirement_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_type_requirements');
    }
};