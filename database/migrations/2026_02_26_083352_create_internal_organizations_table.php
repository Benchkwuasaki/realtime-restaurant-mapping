<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_organizations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['Union', 'Cooperative', 'Association']);
            $table->string('head');
            $table->boolean('payroll_deduction_linked')->default(false);
            $table->boolean('status')->default(true); // true = Active
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_organizations');
    }
};