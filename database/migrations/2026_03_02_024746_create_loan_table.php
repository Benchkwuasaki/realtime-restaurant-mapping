<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->cascadeOnDelete();

            $table->string('loan_type', 100);
            $table->string('source', 255);

            // Nullable FK — only set for internal org loans
            $table->unsignedBigInteger('internal_organization_id')->nullable();
            $table->foreign('internal_organization_id')
                ->references('internal_organization_id')
                ->on('internal_organizations')
                ->nullOnDelete();

            $table->decimal('total_amount', 12, 2);
            $table->decimal('monthly_amortization', 10, 2);
            $table->decimal('semi_monthly_deduction', 10, 2);
            $table->decimal('balance', 12, 2);
            $table->string('start_period', 7);
            $table->string('end_period', 7);
            $table->enum('status', ['Active', 'Completed', 'Suspended'])
                ->default('Active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};