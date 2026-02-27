<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_internal_organization', function (Blueprint $table) {
            // ── Foreign key → employees (unsignedBigInteger to match employee_id PK) ──
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                  ->references('employee_id')
                  ->on('employees')
                  ->cascadeOnDelete();

            // ── Foreign key → internal_organizations (UUID) ────────────────────────
            $table->uuid('internal_organization_id');
            $table->foreign('internal_organization_id')
                  ->references('id')
                  ->on('internal_organizations')
                  ->cascadeOnDelete();

            // ── Composite primary key (prevents duplicate memberships) ─────────────
            $table->primary(['employee_id', 'internal_organization_id']);

            // ── Optional: track when/who added the member ─────────────────────────
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_internal_organization');
    }
};