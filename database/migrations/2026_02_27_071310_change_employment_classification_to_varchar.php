<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement('ALTER TABLE employees MODIFY employment_classification VARCHAR(255) NOT NULL');
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE employees MODIFY employment_classification ENUM('Regular', 'Job Order', 'Casual') NOT NULL");
    }
};
