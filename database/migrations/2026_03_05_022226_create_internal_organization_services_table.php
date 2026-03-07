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
        Schema::create('internal_organization_services', function (Blueprint $table) {
            $table->id('internal_organization_service_id');
            $table->foreignId('internal_organization_id')->constrained('internal_organizations', 'internal_organization_id')->cascadeOnDelete();
            $table->string('internal_organization_service_name');
            $table->boolean('deductable_from_payroll')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_organization_services');
    }
};
