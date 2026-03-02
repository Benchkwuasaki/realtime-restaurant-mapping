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
        Schema::create('positions', function (Blueprint $table) {
            $table->id('position_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id')->onDelete('cascade');
            $table->foreignId('division_id')->nullable()->constrained('divisions', 'division_id')->onDelete('cascade');
            $table->foreignId('unit_id')->nullable()->constrained('units', 'unit_id')->onDelete('cascade');
            $table->string('position_name');
            $table->enum('position_type', ['Regular', 'Casual', 'Job Order'])->default('Regular');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
