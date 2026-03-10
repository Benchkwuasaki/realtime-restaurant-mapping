<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $fillable = [
        'name',
        'early_time_in_minutes',
        'late_time_out_minutes',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Returns the active default setting, or a hardcoded fallback if none exists.
     */
    public static function getDefault(): self
    {
        return static::where('is_default', true)->first() ?? new self([
            'name'                  => 'Default',
            'early_time_in_minutes' => 60,
            'late_time_out_minutes' => 60,
            'is_default'            => true,
        ]);
    }

    /**
     * Promotes this setting to default, clearing any previous default first.
     */
    public function markAsDefault(): void
    {
        static::where('is_default', true)->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }
}