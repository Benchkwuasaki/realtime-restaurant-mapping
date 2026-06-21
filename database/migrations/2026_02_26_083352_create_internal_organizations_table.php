<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_org_types', function (Blueprint $table) {
            $table->id('internal_org_type_id'); // fixed typo: itnernal → internal
            $table->string('internal_org_type')->unique();
            $table->timestamps();
        });

        // Seed default types
        DB::table('internal_org_types')->insert([
            ['internal_org_type' => 'Union',       'created_at' => now(), 'updated_at' => now()],
            ['internal_org_type' => 'Cooperative', 'created_at' => now(), 'updated_at' => now()],
            ['internal_org_type' => 'Association', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('internal_organizations', function (Blueprint $table) {
            $table->id('internal_organization_id');
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('internal_org_type_id')
                  ->constrained('internal_org_types', 'internal_org_type_id')
                  ->restrictOnDelete();
            $table->foreignId('head_employee_id')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            $table->boolean('payroll_deduction_linked')->default(false);
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_organizations');
        Schema::dropIfExists('internal_org_types');
    }
};