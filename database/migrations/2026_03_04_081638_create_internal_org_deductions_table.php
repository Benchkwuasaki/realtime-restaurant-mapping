<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_org_deductions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('internal_organization_id');
            $table->string('description', 255);
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('period_start');
            $table->date('period_end');
            $table->timestamps();

            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->cascadeOnDelete();

            $table->foreign('internal_organization_id')
                ->references('internal_organization_id')
                ->on('internal_organizations')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_org_deductions');
    }
};
