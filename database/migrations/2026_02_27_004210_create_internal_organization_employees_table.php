<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_internal_organization', function (Blueprint $table) {
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnDelete();
            $table->foreignId('internal_organization_id')
                ->constrained('internal_organizations', 'internal_organization_id')
                ->cascadeOnDelete();
            $table->primary(['employee_id', 'internal_organization_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_internal_organization');
    }
};