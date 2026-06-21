<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_grade_steps', function (Blueprint $table) {
            $table->unsignedBigInteger('ssl_table_id')
                ->nullable()
                ->after('salary_grade_step_id');
            $table->foreign('ssl_table_id')
                ->references('ssl_table_id')
                ->on('payroll_ssl_tables')
                ->nullOnDelete();
            // $table->renameColumn('salary_amount', 'monthly_salary');
            $table->decimal('monthly_salary', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('salary_grade_steps', function (Blueprint $table) {
            $table->dropForeign(['ssl_table_id']);
            $table->dropUnique('uq_ssl_grade_step');
            $table->dropColumn('ssl_table_id');
            $table->renameColumn('monthly_salary', 'salary_amount');
        });
    }
};
