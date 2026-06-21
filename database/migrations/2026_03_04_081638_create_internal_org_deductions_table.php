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
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnDelete();
            $table->foreignId('internal_organization_id')
                ->constrained('internal_organizations', 'internal_organization_id')
                ->cascadeOnDelete();
            $table->foreignId('internal_organization_service_id')
                ->nullable()
                ->constrained('internal_organization_services', 'internal_organization_service_id')
                ->nullOnDelete();
            $table->string('description', 255);
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('period_start');
            $table->date('period_end');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_org_deductions');
    }
};