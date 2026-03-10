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
        Schema::create('government_acc_types', function (Blueprint $table) {
            $table->id('government_acc_type_id');
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('has_employer_share')->default(true);
            $table->enum('computation_type', ['rate', 'fixed'])->default('rate');
            $table->decimal('employee_rate', 5, 2)->nullable();
            $table->decimal('employer_rate', 5, 2)->nullable();
            $table->decimal('fixed_amount', 8, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('government_accounts', function (Blueprint $table) {
            $table->id('government_account_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->foreignId('government_acc_type_id')->constrained('government_acc_types', 'government_acc_type_id');
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
    }
};
