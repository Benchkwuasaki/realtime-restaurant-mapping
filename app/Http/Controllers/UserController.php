<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'user',
            'description' => 'Viewed User Management Page',
        ]);

        return Inertia::render("User/Index");
    }
}
