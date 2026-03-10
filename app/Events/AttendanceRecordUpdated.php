<?php

namespace App\Events;

use App\Models\AttendanceRecord;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast whenever an AttendanceRecord is created or updated.
 *
 * Frontend (React + Echo) listens on the public "attendance-records" channel
 * and patches its local state without a full page reload.
 */
class AttendanceRecordUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly AttendanceRecord $record) {}

    /**
     * Broadcast on a public channel — no auth required for the dashboard.
     * Swap to a private/presence channel if you add per-user auth.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('attendance-records');
    }

    public function broadcastAs(): string
    {
        return 'record.updated';
    }

    /**
     * Shape of the broadcast payload — mirrors the shape the frontend already expects.
     */
    public function broadcastWith(): array
    {
        $r = $this->record;
        $e = $r->employee;
        $b = $e?->basicInfo;

        return [
            'id'                    => $r->id,
            'employee_id'           => $r->employee_id,
            'date'                  => $r->date?->toDateString(),
            'scheduled_time_in'     => $r->scheduled_time_in,
            'scheduled_break_out'   => $r->scheduled_break_out,
            'scheduled_break_in'    => $r->scheduled_break_in,
            'scheduled_time_out'    => $r->scheduled_time_out,
            'grace_minutes'         => $r->grace_minutes,
            'time_in'               => $r->time_in,
            'break_out'             => $r->break_out,
            'break_in'              => $r->break_in,
            'time_out'              => $r->time_out,
            'late_minutes'          => $r->late_minutes,
            'work_minutes'          => $r->work_minutes,
            'status'                => $r->status,
            'employee' => $e ? [
                'employee_id' => $e->employee_id,
                'work_id'     => $e->work_id,
                'avatar_url'  => $e->avatar_url,
                'basic_info'  => $b ? [
                    'first_name'  => $b->first_name,
                    'last_name'   => $b->last_name,
                    'middle_name' => $b->middle_name,
                ] : null,
            ] : null,
        ];
    }
}