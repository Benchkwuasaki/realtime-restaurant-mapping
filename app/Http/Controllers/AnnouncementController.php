<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\Request;
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
            'module' => 'announcement',
            'description' => 'Visited Announcement Page',
        ]);

        return inertia(component: 'Announcement/Index');
    }
}
