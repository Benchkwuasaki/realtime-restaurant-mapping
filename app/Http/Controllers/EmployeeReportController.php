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

        return Inertia::render('ReportsAndAnalytics/Employees/Index', [
            'employees'         => $formatted,
            'totalEmployees'    => $employees->count(),
            'activeEmployees'   => $employees->where('status', true)->count(),
            'inactiveEmployees' => $employees->where('status', false)->count(),
            'departments'       => $departments,
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

        $gender = match ($basicInfo?->sex) {
            true  => 'Male',
            false => 'Female',
            null  => '—',
        };

        $educOrder = ['Elementary', 'High School', 'Vocational', "Bachelor's", "Master's", 'Doctorate'];
        $education = $basicInfo?->educations
            ->sortByDesc(fn($edu) => array_search($edu->level, $educOrder))
            ->first()
                ?->level ?? '—';

        $address = $basicInfo?->addresses->first();

        return [
            'id'          => (string) $employee->employee_id,
            'workId'      => $employee->work_id,
            'name'        => $basicInfo?->full_name ?? '—',
            'department'  => $position?->department?->department_name ?? '—',
            'division'    => $position?->division?->division_name ?? '—',
            'position'    => $position?->position_name ?? '—',
            'type'        => $employee->employment_classification ?? '—',
            'status'      => $employee->status ? 'Active' : 'Inactive',
            'dateHired'   => $employee->date_hired?->toDateString() ?? '—',
            'salaryGrade' => $sgs ? "SG-{$sgs->salary_grade} Step {$sgs->step}" : '—',
            'age'         => $age,
            'gender'      => $gender,
            'education'   => $education,
            'city'        => $address?->city ?? '—',
            'state'       => $address?->state ?? '—',
            'email'       => $employee->work_email,
        ];
    }
}
