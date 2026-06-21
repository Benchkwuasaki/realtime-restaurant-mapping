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
        Schema::create('government_acc_types', function (Blueprint $table) {
            $table->id('government_acc_type_id');
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('has_employer_share')->default(true);
            $table->enum('computation_type', ['rate', 'fixed'])->default('rate');

            // ── Shared rate columns (GSIS, PhilHealth) ────────────────────────
            $table->decimal('employee_rate', 5, 2)->nullable();
            $table->decimal('employer_rate', 5, 2)->nullable();

            // ── Fixed amount / cap (Pag-IBIG) ─────────────────────────────────
            $table->decimal('fixed_amount', 8, 2)->nullable();

            // ── PhilHealth bracket ────────────────────────────────────────────
            // Replaces the hardcoded max(250.0, min(2500.0, ...)) in the controller.
            $table->decimal('min_contribution', 10, 2)->nullable()
                ->comment('PhilHealth: monthly floor e.g. 250.00');
            $table->decimal('max_contribution', 10, 2)->nullable()
                ->comment('PhilHealth: monthly ceiling e.g. 2500.00');

            // ── Pag-IBIG tier ─────────────────────────────────────────────────
            // Replaces the hardcoded <= 1500, 0.01, 0.02 in the controller.
            $table->decimal('lower_salary_threshold', 10, 2)->nullable()
                ->comment('Pag-IBIG: salary cutoff between lower/upper rate e.g. 1500.00');
            $table->decimal('lower_rate', 8, 4)->nullable()
                ->comment('Pag-IBIG: rate when basic <= threshold e.g. 1.0 for 1%');
            $table->decimal('upper_rate', 8, 4)->nullable()
                ->comment('Pag-IBIG: rate when basic > threshold e.g. 2.0 for 2%');

            $table->timestamps();
        });

        Schema::create('government_accounts', function (Blueprint $table) {
            $table->id('government_account_id');
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->onDelete('cascade');
            $table->foreignId('government_acc_type_id')
                ->constrained('government_acc_types', 'government_acc_type_id');
            $table->string('account_type');
            $table->string('account_number');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('government_accounts');
        Schema::dropIfExists('government_acc_types');
    }
};
