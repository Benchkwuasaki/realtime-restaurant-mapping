<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_ssl_tables', function (Blueprint $table) {
            $table->id('ssl_table_id');
            $table->string('ssl_version', 20);
            $table->string('legal_basis', 100);
            $table->unsignedTinyInteger('tranche');
            $table->date('effectivity_date');
            $table->enum('status', ['draft', 'active', 'superseded'])->default('draft');
            $table->timestamp('activated_at')->nullable();
            $table->foreignId('activated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();
            $table->unique(['ssl_version', 'tranche']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_ssl_tables');
    }
};
