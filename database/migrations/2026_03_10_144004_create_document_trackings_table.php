<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_trackings', function (Blueprint $table) {
            $table->id('document_tracking_id');

            $table->string('title');
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('origin_office_id')->nullable();
            $table->unsignedBigInteger('current_office_id')->nullable();

            $table->enum('status', [
                'filed',
                'in_progress',
                'completed',
                'cancelled',
            ])->default('filed');

            $table->enum('office_status', [
                'pending_receipt',
                'received',
                'done',
                'cancelled',
            ])->default('pending_receipt');

            $table->timestamp('current_holder_received_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('origin_office_id')
                ->references('department_id')
                ->on('departments')
                ->nullOnDelete();

            $table->foreign('current_office_id')
                ->references('department_id')
                ->on('departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_trackings');
    }
};
