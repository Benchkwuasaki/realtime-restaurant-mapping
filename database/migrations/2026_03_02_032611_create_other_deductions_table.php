<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('other_deductions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->cascadeOnDelete();
            $table->string('category', 100);
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->date('period_start');
            $table->date('period_end');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('other_deductions');
    }
};
