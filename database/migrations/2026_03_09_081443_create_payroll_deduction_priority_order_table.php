<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_deduction_priority_order', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('priority')->unique();

            $table->enum('deduction_category', [
                'government_contribution',   // GSIS premium, PhilHealth, Pag-IBIG, W/Tax  — Never cuttable
                'government_loan',           // GSIS MPL/Emergency, Pag-IBIG MPL           — Rarely cuttable
                'internal_org_savings',      // Savings + Share Capital (both cut-offs)     — Rarely cuttable
                'internal_org_loan',         // Internal org loans (via loans table)        — Yes cuttable
                'internal_org_dues',         // Org dues / premiums                         — First_to_Cut
                'water_bill',               // Water bill deductions                        — First_to_Cut
                'other_miscellaneous',       // NS&ND, one-time misc items                  — First_to_Cut
            ]);

            // Nullable FK — only populated for government_contribution rows
            $table->foreignId('government_acc_type_id')
                ->nullable()
                ->constrained('government_acc_types', 'government_acc_type_id')
                ->nullOnDelete();

            $table->string('label');
            $table->string('examples')->nullable();

            $table->enum('cuttability', [
                'Never',        // Statutory — always deducted regardless of floor
                'Rarely',       // Only cut when absolutely no other option remains
                'Yes',          // Cut when needed to meet floor threshold
                'First_to_Cut', // Cut first before touching higher-priority deductions
            ]);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_deduction_priority_order');
    }
};