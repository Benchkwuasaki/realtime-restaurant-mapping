<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'general',
            'activity' => 'Visited Announcement Page',
        ]);

        return inertia(component: 'Announcement/Index');
    }
}
