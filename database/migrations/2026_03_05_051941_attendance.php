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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->nullable()
                ->constrained('employees', 'employee_id')
                ->nullOnDelete();

            $table->string('work_id')->nullable(); // ID sent by camera (IdCard)

            $table->enum('verification_status', ['verified', 'unknown', 'blacklisted']);

            $table->integer('similarity')->nullable(); // face match percentage

            $table->string('device_id')->nullable(); // camera device

            $table->string('snapshot_path')->nullable(); // saved image

            $table->timestamp('captured_at'); // camera time

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
