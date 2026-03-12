<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentClassification;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'general',
            'activity' => 'Viewed dashboard',
        ]);

        // Get all classification names from the reference table
        $classifications = EmploymentClassification::orderBy('name')->pluck('name');

        // Count active employees grouped by employment_classification
        $countsByClassification = Employee::query()
            ->whereNull('deleted_at')
            ->where('status', true)
            ->selectRaw('employment_classification, COUNT(*) as total')
            ->groupBy('employment_classification')
            ->pluck('total', 'employment_classification');

        // Build a complete list — classifications with 0 employees still appear
        $employeeClassificationCounts = $classifications->map(fn (string $name) => [
            'classification' => $name,
            'total'          => $countsByClassification->get($name, 0),
        ])->values();

        return Inertia::render('dashboard', [
            'employeeClassificationCounts' => $employeeClassificationCounts,
        ]);
    }
}