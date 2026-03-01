<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationalChartController extends Controller
{
    /**
     * Display the organizational chart with departments, divisions, and employees.
     */
    public function index(): Response
    {
        // Fetch all departments with their divisions, units, positions, and employees
        $departments = Department::with([
            'divisions' => function ($query) {
                $query->with([
                    'units',
                    'positions' => function ($q) {
                        $q->with([
                            'items' => function ($i) {
                                $i->with(['employee' => function ($e) {
                                    $e->with('basicInfo');
                                }]);
                            }
                        ]);
                    }
                ]);
            },
            'positions' => function ($query) {
                $query->with([
                    'items' => function ($i) {
                        $i->with(['employee' => function ($e) {
                            $e->with('basicInfo');
                        }]);
                    }
                ]);
            }
        ])->get();

        // Transform the data into a hierarchical structure
        $organizationalChart = $departments->map(function ($department) {
            return [
                'id' => $department->department_id,
                'name' => $department->department_name,
                'acronym' => $department->department_acronym,
                'description' => $department->department_description,
                'divisions' => $department->divisions->map(function ($division) {
                    return [
                        'id' => $division->division_id,
                        'name' => $division->division_name,
                        'acronym' => $division->division_acronym,
                        'description' => $division->division_description,
                        'units' => $division->units->map(function ($unit) {
                            return [
                                'id' => $unit->unit_id ?? null,
                                'name' => $unit->unit_name ?? null,
                            ];
                        })->values(),
                        'positions' => $division->positions->map(function ($position) {
                            return [
                                'id' => $position->position_id,
                                'name' => $position->position_name,
                                'employees' => $position->items->map(function ($item) {
                                    $employee = $item->employee;
                                    $basicInfo = $employee->basicInfo;
                                    return [
                                        'id' => $employee->employee_id,
                                        'firstName' => $basicInfo->first_name ?? null,
                                        'lastName' => $basicInfo->last_name ?? null,
                                        'middleName' => $basicInfo->middle_name ?? null,
                                        'email' => $employee->work_email,
                                        'dateHired' => $employee->date_hired,
                                        'profilePicture' => $employee->profile_picture,
                                    ];
                                })->values(),
                            ];
                        })->values(),
                    ];
                })->values(),
                'topPositions' => $department->positions->map(function ($position) {
                    return [
                        'id' => $position->position_id,
                        'name' => $position->position_name,
                        'employees' => $position->items->map(function ($item) {
                            $employee = $item->employee;
                            $basicInfo = $employee->basicInfo;
                            return [
                                'id' => $employee->employee_id,
                                'firstName' => $basicInfo->first_name ?? null,
                                'lastName' => $basicInfo->last_name ?? null,
                                'middleName' => $basicInfo->middle_name ?? null,
                                'email' => $employee->work_email,
                                'dateHired' => $employee->date_hired,
                                'profilePicture' => $employee->profile_picture,
                            ];
                        })->values(),
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Organization/OrganizationalChart', [
            'organizationalChart' => $organizationalChart,
        ]);
    }
}
