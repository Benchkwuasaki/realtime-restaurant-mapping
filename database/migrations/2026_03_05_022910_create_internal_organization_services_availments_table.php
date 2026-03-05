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

            $table->foreign(['employee_id', 'internal_organization_id'])
                ->references(['employee_id', 'internal_organization_id'])
                ->on('employee_internal_organization')
                ->cascadeOnDelete();

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
