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
        Schema::create('municipalities', function (Blueprint $table) {
            $table->id();
            $table->string('city_code')->unique();
            $table->string('city_name');
            $table->string('prov_code');
            $table->string('reg_code');
            $table->timestamps();

            $table->foreign('prov_code')->references('prov_code')->on('provinces')->onDelete('cascade');
            $table->foreign('reg_code')->references('reg_code')->on('regions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('municipalities');
    }
};
