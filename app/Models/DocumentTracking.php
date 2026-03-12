<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DocumentTracking extends Model
{
    protected $primaryKey = 'document_tracking_id';

    protected $fillable = [
        'title',
        'notes',
        'origin_office_id',
        'current_office_id',
        'status',
        'office_status',
        'current_holder_received_at',
        'created_by',
    ];

    protected $casts = [
        'current_holder_received_at' => 'datetime',
    ];

    public function originOffice(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'origin_office_id', 'department_id');
    }

    public function currentOffice(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'current_office_id', 'department_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(DocumentTrackingAction::class, 'document_tracking_id', 'document_tracking_id')
            ->orderBy('acted_at');
    }

    public function latestForwardAction(): HasOne
    {
        return $this->hasOne(DocumentTrackingAction::class, 'document_tracking_id', 'document_tracking_id')
            ->whereIn('action', ['forwarded', 'returned'])
            ->orderByDesc('acted_at');
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['filed', 'in_progress']);
    }

    public function isArchived(): bool
    {
        return in_array($this->status, ['completed', 'cancelled']);
    }

    public function getElapsedTime(): string
    {
        if ($this->office_status === 'pending_receipt') {
            return 'Awaiting receipt';
        }

        if ($this->isArchived()) {
            return '-';
        }

        if (! $this->current_holder_received_at) {
            return '-';
        }

        $totalMinutes = max(0, (int) $this->current_holder_received_at->diffInMinutes(now()));
        $days = intdiv($totalMinutes, 1440);
        $hours = intdiv($totalMinutes % 1440, 60);
        $minutes = $totalMinutes % 60;

        if ($totalMinutes < 1) {
            return 'Just now';
        }

        if ($days > 0) {
            $label = $days === 1 ? '1 day' : "{$days} days";

            if ($hours > 0) {
                $label .= $hours === 1 ? ', 1 hour' : ", {$hours} hours";
            }

            return $label;
        }

        if ($hours > 0) {
            $label = $hours === 1 ? '1 hour' : "{$hours} hours";

            if ($minutes > 0) {
                $label .= $minutes === 1 ? ', 1 min' : ", {$minutes} mins";
            }

            return $label;
        }

        return $minutes === 1 ? '1 min' : "{$minutes} mins";
    }
}
