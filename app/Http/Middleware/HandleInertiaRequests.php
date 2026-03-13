<?php

namespace App\Http\Middleware;

use App\Models\DocumentTracking;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing(
            'employee.basicInfo',
            'employee.item.position.department',
            'employee.item.position.division',
            'employee.item.position.unit'
        );

        // dd($user);

        $position = $user?->employee?->item?->position;
        $department = $position?->department;
        $division = $position?->division;
        $unit = $position?->unit;
        $departmentId = $department?->department_id;
        $incomingDocumentsCount = $departmentId
            ? DocumentTracking::query()
                ->where('current_office_id', $departmentId)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count()
            : 0;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'employee_id' => $user->employee_id,
                    'name' => $user->getFullName(),
                    'email' => $user->email,
                    'avatar_url' => $user->employee?->avatar_url,
                    'position' => $position?->position_name,
                    'roles' => $user->getRoleNames()->values()->all(),
                    'offices' => [
                        'department' => [
                            'name' => $department?->department_name,
                            'acronym' => $department?->department_acronym,
                        ],
                        'division' => [
                            'name' => $division?->division_name,
                            'acronym' => $division?->division_acronym,
                        ],
                        'unit' => [
                            'name' => $unit?->unit_name,
                            'acronym' => $unit?->unit_acronym,
                        ],
                    ],
                    'notifications' => [
                        'incoming_documents_count' => $incomingDocumentsCount,
                    ],
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
