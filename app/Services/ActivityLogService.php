<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Jenssegers\Agent\Agent;

class ActivityLogService
{
    public function __construct(protected Agent $agent) {}

    public function createLog(array $data)
    {

        $log = ActivityLog::create([
            'user_id' => $data['user_id'] ?? null,
            'module' => $data['module'] ?? 'general',
            'description' => $data['description'],
            'device' => $this->detectDevice(),
            'platform' => $this->detectPlatform(),
        ]);

        return $log;
    }

    private function detectDevice()
    {
        if ($this->agent->isDesktop()) {
            return 'Desktop';
        } elseif ($this->agent->isTablet()) {
            return 'Tablet';
        } elseif ($this->agent->isPhone()) {
            return 'Phone';
        }
    }

    private function detectPlatform()
    {
        return $this->agent->platform() ?: 'Unknown';
    }

    public function userFullName(string $firstName, string $lastName)
    {
        $first = ucfirst($firstName);
        $last = ucfirst($lastName);
        return "$first $last";
    }
}
