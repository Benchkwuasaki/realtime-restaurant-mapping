<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->string('status', 20)
                ->default('draft')
                ->after('hr_officer_name')
                ->comment('draft | posted | locked');
        });

        DB::table('payroll_records')
            ->whereNull('status')
            ->orWhere('status', '')
            ->update(['status' => 'draft']);
    }

    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
