<?php

namespace App\Events;

use App\Models\Attendance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceLogCreated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Attendance $log) {}

    /**
     * Only broadcast if the log is linked to a real employee.
     * Returning false suppresses the broadcast entirely.
     */
    public function broadcastWhen(): bool
    {
        return $this->log->employee_id !== null;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('attendance-logs');
    }

    public function broadcastAs(): string
    {
        return 'log.created';
    }

    public function broadcastWith(): array
    {
        $e = $this->log->employee;
        $b = $e?->basicInfo;

        return [
            'id'                  => $this->log->id,
            'work_id'             => $this->log->work_id,
            'verification_status' => $this->log->verification_status,
            'time_type'           => $this->log->time_type,
            'similarity'          => $this->log->similarity,
            'device_id'           => $this->log->device_id,
            'snapshot_path'       => $this->log->snapshot_path,
            'captured_at'         => $this->log->captured_at,
            'employee'            => $e ? [
                'employee_id' => $e->employee_id,
                'work_id'     => $e->work_id,
                'avatar_url'  => $e->avatar_url,
                'basic_info'  => $b ? [
                    'first_name' => $b->first_name,
                    'last_name'  => $b->last_name,
                ] : null,
            ] : null,
        ];
    }
}