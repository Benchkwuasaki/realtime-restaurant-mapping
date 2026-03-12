<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');                                               // e.g. "Standard Policy"

            // Scan acceptance windows (caps only — no grace period)
            $table->unsignedSmallInteger('early_time_in_minutes')->default(60);  // how early before time-in to accept scans
            $table->unsignedSmallInteger('late_time_out_minutes')->default(60);  // how late after time-out to accept scans

            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};