<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogsController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $now = now();
        $since24h = $now->copy()->subDay();

        $totalLogs = ActivityLog::query()->count();

        $logs24h = ActivityLog::query()
            ->where('created_at', '>=', $since24h)
            ->count();

        $activeUsers24h = ActivityLog::query()
            ->where('created_at', '>=', $since24h)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $activityLogs = ActivityLog::query()
            ->with(['user:id,name'])
            ->latest('created_at')
            ->get()
            ->map(function (ActivityLog $log) {
                return [
                    'user' => $this->activityLogService->formatUserName(optional($log->user)->name ?? 'System'),
                    'module' => $this->activityLogService->formatModuleName($log->module),
                    'description' => $log->description,
                    'device' => $log->device,
                    'platform' => $log->platform,

                    'timestamp' => $log->created_at->format('j F, Y • g:i a'),

                    'created_at' => $log->created_at->toISOString(),
                ];
            });

        return Inertia::render('ActivityLogs/Index', [
            'activity_logs' => $activityLogs,
            'stat' => [
                'total_logs' => $totalLogs,
                'logs_24h' => $logs24h,
                'active_users_24h' => $activeUsers24h,
            ],
        ]);
    }
}
