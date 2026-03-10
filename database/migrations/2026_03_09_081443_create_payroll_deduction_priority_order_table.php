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
        Schema::create('payroll_deduction_priority_order', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('priority')->unique();

            $table->enum('deduction_category', [
                'government_contribution',
                'government_loan',
                'internal_org_loan',
                'internal_org_dues',
                'miscellaneous',
            ]);

            // nullable FK — only populated for government_contribution category
            $table->foreignId('government_acc_type_id')
                ->nullable()
                ->constrained('government_acc_types', 'government_acc_type_id')
                ->nullOnDelete();

            $table->string('label');
            $table->string('examples')->nullable();
            $table->enum('cuttability', [
                'Never',
                'Rarely',
                'Yes',
                'First_to_Cut',
            ]);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_deduction_priority_order');
    }
};
