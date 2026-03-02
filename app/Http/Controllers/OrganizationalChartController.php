<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationalChartController extends Controller
{
    /**
     * Display the organizational chart with departments, divisions, and employees.
     */
    public function index(): Response
    {
        try {
            // Fetch departments with eager loading - optimized for the new hierarchical view
            $departments = Department::with([
                'divisions' => function ($query) {
                    $query->orderBy('division_name');
                },
                'divisions.positions.items.employee.basicInfo',
                'divisions.units',
                'positions.items.employee.basicInfo',
            ])->orderBy('department_name')->get();

            // Transform the data
            $organizationalChart = $departments->map(function ($department) {
                return $this->transformDepartment($department);
            })->values();

            return Inertia::render('Organization/OrganizationalChart/Index', [
                'organizationalChart' => $organizationalChart->all(),
                'departmentCount' => $departments->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Organizational Chart Error: ' . $e->getMessage());
            
            return Inertia::render('Organization/OrganizationalChart/Index', [
                'organizationalChart' => [],
                'departmentCount' => 0,
            ]);
        }
    }

    /**
     * Display a specific department with divisions and units.
     */
    public function show(Department $department): Response
    {
        try {
            // Fetch department with eager loading for divisions, units, and positions
            $department->load([
                'divisions' => function ($query) {
                    $query->orderBy('division_name');
                },
                'divisions.units' => function ($query) {
                    $query->orderBy('unit_name');
                },
                'divisions.units.positions.items.employee.basicInfo',
                'divisions.positions.items.employee.basicInfo',
                'positions.items.employee.basicInfo',
            ]);

            $transformedDepartment = $this->transformDepartment($department);

            return Inertia::render('Organization/OrganizationalChart/Show', [
                'department' => $transformedDepartment,
            ]);
        } catch (\Exception $e) {
            Log::error('Department Detail Error: ' . $e->getMessage());
            
            return Inertia::render('Organization/OrganizationalChart/Show', [
                'department' => null,
            ]);
        }
    }

    private function transformDepartment($department)
    {
        return [
            'id' => $department->department_id,
            'name' => $department->department_name ?? 'Unknown',
            'acronym' => $department->department_acronym ?? '',
            'description' => $department->department_description ?? '',
            'divisions' => $this->transformDivisions($department->divisions ?? []),
            'topPositions' => $this->transformPositions($department->positions ?? []),
        ];
    }

    private function transformDivisions($divisions)
    {
        return $divisions->map(function ($division) {
            return [
                'id' => $division->division_id,
                'name' => $division->division_name ?? 'Unknown',
                'acronym' => $division->division_acronym ?? '',
                'description' => $division->division_description ?? '',
                'units' => $this->transformUnits($division->units ?? []),
                'positions' => $this->transformPositions($division->positions ?? []),
            ];
        })->values()->all();
    }

    private function transformUnits($units)
    {
        return $units->map(function ($unit) {
            return [
                'id' => $unit->unit_id ?? null,
                'name' => $unit->unit_name ?? 'Unknown',
                'acronym' => $unit->unit_acronym ?? '',
                'description' => $unit->unit_description ?? '',
                'positions' => $this->transformPositions($unit->positions ?? []),
            ];
        })->values()->all();
    }

    private function transformPositions($positions)
    {
        return $positions->map(function ($position) {
            return [
                'id' => $position->position_id,
                'name' => $position->position_name ?? 'Unknown',
                'employees' => $this->transformEmployees($position->items ?? []),
            ];
        })->values()->all();
    }

    private function transformEmployees($items)
    {
        return $items->filter(function ($item) {
            return $item->employee && $item->employee->basicInfo;
        })->map(function ($item) {
            $employee = $item->employee;
            $basicInfo = $employee->basicInfo;

            return [
                'id' => $employee->employee_id,
                'firstName' => $basicInfo->first_name ?? 'Unknown',
                'lastName' => $basicInfo->last_name ?? '',
                'middleName' => $basicInfo->middle_name ?? '',
                'email' => $employee->work_email ?? 'N/A',
                'dateHired' => $employee->date_hired ?? null,
                'profilePicture' => $employee->profile_picture ?? null,
            ];
        })->values()->all();
    }
}
