<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTrackingAction extends Model
{
    protected $primaryKey = 'document_tracking_action_id';

    protected $fillable = [
        'document_tracking_id',
        'office_id',
        'from_office_id',
        'to_office_id',
        'action',
        'remarks',
        'acted_by',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function document(): BelongsTo
    {
        return $this->belongsTo(DocumentTracking::class, 'document_tracking_id', 'document_tracking_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'office_id', 'department_id');
    }

    public function fromOffice(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_office_id', 'department_id');
    }

    public function toOffice(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_office_id', 'department_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Human-readable label for the timeline.
     * e.g. "Forwarded from HR to Budget", "Received by Legal"
     */
    public function getTimelineLabel(): string
    {
        $office     = $this->office?->department_acronym     ?? 'Unknown';
        $fromOffice = $this->fromOffice?->department_acronym ?? 'Unknown';
        $toOffice   = $this->toOffice?->department_acronym   ?? 'Unknown';

        return match ($this->action) {
            'created'   => "Created by {$office}",
            'forwarded' => "Forwarded from {$fromOffice} to {$toOffice}",
            'received'  => "Received by {$office}",
            'returned'  => "Returned from {$fromOffice} to {$toOffice}",
            'completed' => "Completed by {$office}",
            'cancelled' => "Cancelled by {$office}",
            default     => ucfirst($this->action),
        };
    }
}
