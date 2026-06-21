<?php
// database/migrations/xxxx_create_employment_classifications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_classifications', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Seed with the existing hardcoded values
        DB::table('employment_classifications')->insert([
            ['name' => 'Regular',   'description' => 'Permanent employee with full benefits.', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Job Order', 'description' => 'Contract-based, project-specific engagement.', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Casual',    'description' => 'Temporary employee for short-term needs.', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('employment_classifications');
    }
};