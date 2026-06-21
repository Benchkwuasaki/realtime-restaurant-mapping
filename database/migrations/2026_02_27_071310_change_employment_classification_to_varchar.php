<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE employees MODIFY employment_classification VARCHAR(255) NOT NULL');
        } elseif (DB::getDriverName() === 'sqlite') {
            // SQLite doesn't support MODIFY, so we skip this for SQLite
            // The column is already created correctly in the initial migration
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE employees MODIFY employment_classification ENUM('Regular', 'Job Order', 'Casual') NOT NULL");
        }
    }
};
