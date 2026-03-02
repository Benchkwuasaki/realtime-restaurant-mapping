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
        try {
            // Fetch departments with eager loading
            $departments = Department::with([
                'divisions.positions.items.employee.basicInfo',
                'divisions.units',
                'positions.items.employee.basicInfo',
            ])->get();

            // Transform the data
            $organizationalChart = $departments->map(function ($department) {
                return $this->transformDepartment($department);
            })->values();

            return Inertia::render('Organization/OrganizationalChart/Index', [
                'organizationalChart' => $organizationalChart->all(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Organizational Chart Error: ' . $e->getMessage());
            
            return Inertia::render('Organization/OrganizationalChart/Index', [
                'organizationalChart' => [],
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
