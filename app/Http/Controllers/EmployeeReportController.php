<?php

namespace App\Http\Controllers;

// EmployeeReportController.php

use App\Models\Employee;
use Carbon\Carbon;
use Inertia\Inertia;

class EmployeeReportController extends Controller
{
    public function index()
    {
        $employees = Employee::with([
            'basicInfo.addresses',
            'basicInfo.educations',
            'item.position.department',
            'item.position.division',
            'salaryGradeStep',
        ])->get();

        $formatted = $employees->map(fn(Employee $e) => $this->formatForReport($e));

        $departments = $formatted
            ->pluck('department')
            ->filter(fn($d) => $d !== '—')
            ->unique()
            ->sort()
            ->values();

            $department_acronyms = $employees->map(fn(Employee $e) => $e->item?->position?->department)->filter()->unique('department_id')->mapWithKeys(fn($dept) => [
                $dept->department_name => $dept->department_acronym ?? $dept->department_name,
            ]);

        return Inertia::render('ReportsAndAnalytics/Employees/Index', [
            'employees'         => $formatted,
            'totalEmployees'    => $employees->count(),
            'activeEmployees'   => $employees->where('status', true)->count(),
            'inactiveEmployees' => $employees->where('status', false)->count(),
            'departments'       => $departments,
            'departmentAcronyms'=> $department_acronyms,
        ]);
    }

    private function formatForReport(Employee $employee): array
    {
        $position  = $employee->item?->position;
        $basicInfo = $employee->basicInfo;
        $sgs       = $employee->salaryGradeStep;

        $age = $basicInfo?->birth_date
            ? Carbon::parse($basicInfo->birth_date)->age
            : 0;

        $sex = match ($basicInfo?->sex) {
            true  => 'Male',
            false => 'Female',
            default => '—',
        };

        $educOrder = ['Elementary', 'High School', 'Vocational', 'College', 'Post-Graduate'];
        $education = $basicInfo?->educations
            ->sortByDesc(fn($edu) => array_search($edu->level, $educOrder))
            ->first()
                ?->level ?? '—';

        $address = $basicInfo?->addresses->first();

        // Daily rate: monthly salary ÷ 22 working days (CSC/DBM standard)
        $dailyRate = $sgs ? number_format($sgs->monthly_salary / 22, 2) : '—';

        return [
            'id'                  => (string) $employee->employee_id,
            'workId'              => $employee->work_id,
            'name'                => $basicInfo?->full_name ?? '—',
            'avatarUrl'           => $employee?->avatar_url ?? null,
            'department'          => $position?->department?->department_name ?? '—',
            'division'            => $position?->division?->division_name ?? '—',
            'position'            => $position?->position_name ?? '—',
            'type'                => $employee->employment_classification ?? '—',
            'status'              => $employee->status ? 'Active' : 'Inactive',
            'dateHired'           => $employee->date_hired?->toDateString() ?? '—',
            'appointmentEnd'      => $employee->appointment_end_date?->toDateString() ?? null,
            'salaryGrade'         => $sgs ? "SG-{$sgs->salary_grade} Step {$sgs->step}" : '—',
            'salaryGradeNum'      => $sgs?->salary_grade ?? null,   // raw int for plantilla
            'stepNum'             => $sgs?->step ?? null,           // raw int for plantilla
            'monthlySalary'       => $sgs ? number_format($sgs->monthly_salary, 2) : '—',
            'dailyRate'           => $dailyRate,
            'age'                 => $age,
            'sex'                 => $sex,
            'education'           => $education,
            'city'                => $address?->city ?? '—',
            'state'               => $address?->state ?? '—',
            'email'               => $employee->work_email,
        ];
    }
}