<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DocumentTrackingController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'document_tracking',
            'activity' => 'Viewed Document Tracking Page',
        ]);

        return Inertia::render('DocumentTracking/Index', []);
    }
}
