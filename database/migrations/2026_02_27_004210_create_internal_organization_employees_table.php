<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_internal_organization', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                  ->references('employee_id')
                  ->on('employees')
                  ->cascadeOnDelete();
            $table->unsignedBigInteger('internal_organization_id');
            $table->foreign('internal_organization_id')
                  ->references('internal_organization_id')
                  ->on('internal_organizations')
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