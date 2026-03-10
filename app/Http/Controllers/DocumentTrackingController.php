<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
