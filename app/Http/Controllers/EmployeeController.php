<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\ActivityLogService;

class EmployeeController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $tasks = json_decode(file_get_contents(base_path('resources/js/components/Employeee/data/task.json')), true);
        
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'attendance',
            'description' => 'Viewed Employee Page',
        ]);

        return Inertia::render('Employee/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function create()
    {
        return Inertia::render('Employee/CreateEmployee');
    }
}
