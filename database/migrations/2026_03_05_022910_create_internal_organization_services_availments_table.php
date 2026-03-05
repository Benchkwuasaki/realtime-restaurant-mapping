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
        Schema::create('internal_organization_services_availments', function (Blueprint $table) {
            $table->id('internal_organization_services_availment_id');

            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('internal_organization_id');
            $table->foreignId('internal_organization_employee_id')->constrained('internal_organization_employees', 'internal_organization_employee_id');
            $table->enum('service_type', ['Loan', 'Savings']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_organization_services_availments');
    }
};
