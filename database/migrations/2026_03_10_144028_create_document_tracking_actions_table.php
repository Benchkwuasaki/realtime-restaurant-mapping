<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_tracking_actions', function (Blueprint $table) {
            $table->id('document_tracking_action_id');

            $table->foreignId('document_tracking_id')
                ->constrained('document_trackings', 'document_tracking_id')
                ->cascadeOnDelete();

            // The office that performed the action
            $table->unsignedBigInteger('office_id')->nullable();

            // Only set for forwarded / returned actions
            $table->unsignedBigInteger('from_office_id')->nullable();
            $table->unsignedBigInteger('to_office_id')->nullable();

            $table->enum('action', [
                'created',
                'forwarded',
                'received',
                'returned',
                'completed',
                'cancelled',
            ]);

            $table->text('remarks')->nullable();

            $table->foreignId('acted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('acted_at')->nullable();

            $table->timestamps();

            $table->foreign('office_id')
                ->references('department_id')
                ->on('departments')
                ->nullOnDelete();

            $table->foreign('from_office_id')
                ->references('department_id')
                ->on('departments')
                ->nullOnDelete();

            $table->foreign('to_office_id')
                ->references('department_id')
                ->on('departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_tracking_actions');
    }
};
