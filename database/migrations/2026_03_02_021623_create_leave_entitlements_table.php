<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_entitlements', function (Blueprint $table) {
            $table->id('leave_entitlement_id');
            $table->foreignId('leave_type_id')->constrained('leave_types', 'leave_type_id');
            $table->text('leave_entitlement_description')->nullable();
            $table->integer('years_of_service')->default(0);
            $table->decimal('days_entitled', 8, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_entitlements');
    }
};
