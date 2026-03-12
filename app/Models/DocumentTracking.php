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

    // ── Relationships ─────────────────────────────────────────────────────────

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

    /**
     * The most recent forward/return action — used to derive the "from office"
     * column on the Incoming table (who sent it to us).
     */
    public function latestForwardAction(): HasOne
    {
        return $this->hasOne(DocumentTrackingAction::class, 'document_tracking_id', 'document_tracking_id')
            ->whereIn('action', ['forwarded', 'returned'])
            ->orderByDesc('acted_at');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return in_array($this->status, ['filed', 'in_progress']);
    }

    public function isArchived(): bool
    {
        return in_array($this->status, ['completed', 'cancelled']);
    }

    /**
     * Human-readable days stayed string for the current holder.
     *
     * Rules:
     *   pending_receipt              → "Awaiting receipt"
     *   completed or cancelled       → "—"
     *   received, has timestamp      → "X days" / "Today"
     */
    public function getDaysStayed(): string
    {
        if ($this->office_status === 'pending_receipt') {
            return 'Awaiting receipt';
        }

        if ($this->isArchived()) {
            return '—';
        }

        if (! $this->current_holder_received_at) {
            return '—';
        }

        $days = (int) now()->diffInDays($this->current_holder_received_at);

        if ($days === 0) return 'Today';
        if ($days === 1) return '1 day';

        return "{$days} days";
    }
}
