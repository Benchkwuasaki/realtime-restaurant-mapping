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

        $activityLogs = ActivityLog::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [

                    'user' => $this->activityLogService->formatUserName($log->user->name),
                    'module' => $this->activityLogService->formatModuleName($log->module),
                    'description' => $log->description,
                    'device' => $log->device,
                    'platform' => $log->platform,
                    'timestamp' => $log->created_at->format('j F, Y • g:i a'),
                ];
            });


        return Inertia::render('ActivityLogs/Index', [
            'activity_logs' => $activityLogs,
        ]);
    }
}
