<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('brgy_code')->unique();
            $table->string('brgy_name');
            $table->string('city_code');
            $table->string('prov_code');
            $table->string('reg_code');
            $table->timestamps();

            $table->foreign('city_code')->references('city_code')->on('municipalities')->onDelete('cascade');
            $table->foreign('prov_code')->references('prov_code')->on('provinces')->onDelete('cascade');
            $table->foreign('reg_code')->references('reg_code')->on('regions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
