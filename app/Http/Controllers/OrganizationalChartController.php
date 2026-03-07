<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Position;
use Inertia\Inertia;

class OrganizationalChartController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────
    public function index()
    {
        $departments = Department::with($this->eagerLoads())->get();

        return Inertia::render('Organization/OrganizationalChart/Index', [
            'organizationalChart' => $departments
                ->map(fn ($d) => $this->formatDepartment($d))
                ->values(),
        ]);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────
    public function show(Department $department)
    {
        $department->load($this->eagerLoads());

        return Inertia::render('Organization/OrganizationalChart/Show', [
            'department' => $this->formatDepartment($department),
        ]);
    }

    // ─── Eager loads ─────────────────────────────────────────────────────────
    private function eagerLoads(): array
    {
        return [
            // Department-direct positions (division_id = null, unit_id = null)
            'positions.items.employee.basicInfo',
            // Divisions → their direct positions (unit_id = null)
            'divisions.positions.items.employee.basicInfo',
            // Divisions → Units → their positions → items → employee
            'divisions.units.positions.items.employee.basicInfo',
        ];
    }

    // ─── Formatters ──────────────────────────────────────────────────────────

    private function formatDepartment(Department $dept): array
    {
        return [
            'id'          => $dept->department_id,
            'name'        => $dept->department_name,
            'acronym'     => $dept->department_acronym     ?? '',
            'description' => $dept->department_description ?? null,

            // Positions with NO division and NO unit (pure dept-level)
            'topPositions' => $dept->positions
                ->filter(fn ($p) => is_null($p->division_id) && is_null($p->unit_id))
                ->map(fn ($p) => $this->formatPosition($p))
                ->values(),

            'divisions' => $dept->divisions
                ->map(fn ($d) => $this->formatDivision($d))
                ->values(),
        ];
    }

    private function formatDivision($div): array
    {
        return [
            'id'          => $div->division_id,
            'name'        => $div->division_name,
            'acronym'     => $div->division_acronym     ?? '',
            'description' => $div->division_description ?? null,

            // Positions directly on the division (no unit) — e.g. Division Chief
            // If the Division model has no positions() relationship, fall back to
            // querying Position directly scoped to this division with unit_id null.
            'positions' => $this->getDivisionDirectPositions($div),

            'units' => $div->units
                ->map(fn ($u) => $this->formatUnit($u))
                ->values(),
        ];
    }

    /**
     * Get positions that belong directly to a division (unit_id IS NULL).
     * Tries the eager-loaded relationship first; falls back to a direct query
     * if the Division model has no positions() relationship or it's empty
     * due to missing eager load.
     */
    private function getDivisionDirectPositions($div): array
    {
        // If the division has a loaded positions relation, use it
        if ($div->relationLoaded('positions')) {
            $positions = $div->positions
                ->filter(fn ($p) => is_null($p->unit_id));

            // If items are NOT loaded on these positions, load them now
            if ($positions->isNotEmpty() && ! $positions->first()->relationLoaded('items')) {
                $positions->load('items.employee.basicInfo');
            }

            return $positions
                ->map(fn ($p) => $this->formatPosition($p))
                ->values()
                ->toArray();
        }

        // Fallback: query directly
        $positions = Position::with('items.employee.basicInfo')
            ->where('division_id', $div->division_id)
            ->whereNull('unit_id')
            ->get();

        return $positions
            ->map(fn ($p) => $this->formatPosition($p))
            ->values()
            ->toArray();
    }

    private function formatUnit($unit): array
    {
        return [
            'id'        => $unit->unit_id,
            'name'      => $unit->unit_name,
            'acronym'   => $unit->unit_acronym ?? null,
            'positions' => $unit->positions
                ->map(fn ($p) => $this->formatPosition($p))
                ->values(),
        ];
    }

    /**
     * Position → items() → item.employee
     * Skips vacant slots (no employee assigned).
     * Includes both active and inactive employees.
     */
    private function formatPosition($pos): array
    {
        $employees = $pos->items
            ->filter(fn ($item) => $item->employee !== null)
            ->map(fn ($item) => $this->formatEmployee($item->employee))
            ->values();

        return [
            'id'        => $pos->position_id,
            'name'      => $pos->position_name,
            'employees' => $employees,
        ];
    }

    /**
     * avatar_url / avatar_path live on the employees table.
     * Name fields are on employee_basic_info via basicInfo relationship.
     */
    private function formatEmployee($emp): array
    {
        $info = $emp->basicInfo;

        return [
            'id'         => $emp->employee_id,
            'firstName'  => $info?->first_name  ?? '',
            'lastName'   => $info?->last_name   ?? '',
            'middleName' => $info?->middle_name ?? null,
            'email'      => $emp->work_email,
            'dateHired'  => $emp->date_hired,
            'avatarUrl'  => $emp->avatar_url,
            'avatarPath' => $emp->avatar_path,
        ];
    }
}