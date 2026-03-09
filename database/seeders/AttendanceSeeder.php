<?php

namespace Database\Seeders;

use App\Models\AttendanceSetting;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $setting = AttendanceSetting::firstOrCreate(
            ['name' => 'Standard Policy'],
            [
                'time_in_grace_minutes'  => 15,
                'break_in_grace_minutes' => 15,
                'early_time_in_minutes'  => 60,
                'late_time_out_minutes'  => 60,
                'is_default'             => false, // markAsDefault() handles clearing others
            ]
        );

        // Only promote to default if nothing else is already default.
        // This prevents overriding a default the team intentionally set later.
        $hasDefault = AttendanceSetting::where('is_default', true)
            ->where('id', '!=', $setting->id)
            ->exists();

        if (!$hasDefault) {
            $setting->markAsDefault();
        }

        $this->command->info("AttendanceSetting [{$setting->name}] seeded" . ($setting->is_default ? ' (default).' : ' (default already set elsewhere).'));
    }
}