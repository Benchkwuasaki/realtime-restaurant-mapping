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
        Schema::table('family_info', function (Blueprint $table) {
            $table->string('full_name', 255)->change();
            $table->string('contact_number', 20)->nullable()->change();
            $table->string('relationship', 100)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('family_info', function (Blueprint $table) {
            $table->string('full_name', 100)->change();
            $table->string('contact_number', 15)->nullable()->change();
            $table->string('relationship', 50)->nullable()->change();
        });
    }
};
