<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BenefitsController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}


    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'benefits',
            'description' => 'Viewed Benefits Page',
        ]);

        return Inertia::render('Benefits/Index');
    }
}
