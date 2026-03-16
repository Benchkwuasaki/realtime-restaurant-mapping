<?php

namespace App\Http\Controllers;

use App\Models\Allowance;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmploymentClassification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AllowanceManagementController extends Controller
{
    public function index()
    {
        $allowances = Allowance::orderBy('name')->get();

        $classifications = EmploymentClassification::orderBy('name')->get(['id', 'name']);

        $employees = Employee::with(['basicInfo', 'allowances'])
            ->where('status', true)
            ->get()
            ->map(fn($e) => [
                'employee_id'               => $e->employee_id,
                // Adjust the name field below to match your EmployeeBasicInfo model
                'name'                      => $e->basicInfo
                    ? trim(($e->basicInfo->first_name ?? '') . ' ' . ($e->basicInfo->last_name ?? ''))
                    : 'Unknown',
                'employment_classification' => $e->employment_classification,
                'assigned_allowances'       => $e->allowances->pluck('allowance_name')->values(),
            ]);

        return Inertia::render('Payroll/Earnings&Deductions/AllowancesManagement/Index', [
            'allowances'      => $allowances,
            'classifications' => $classifications,
            'employees'       => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string|max:255',
            'monthly_salary' => 'required|numeric|min:0',
            'taxable'        => 'required|boolean',
            'applicable_to'  => 'nullable|string|max:255',
            'mandatory'      => 'required|boolean',
            'basis'          => 'nullable|string|max:255',
        ]);

        Allowance::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Allowance $allowance)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string|max:255',
            'monthly_salary' => 'required|numeric|min:0',
            'taxable'        => 'required|boolean',
            'applicable_to'  => 'nullable|string|max:255',
            'mandatory'      => 'required|boolean',
            'basis'          => 'nullable|string|max:255',
        ]);

        $allowance->update($validated);

        return redirect()->back();
    }

    public function assign(Request $request, Allowance $allowance)
    {
        $request->validate([
            'employee_ids'   => 'required|array|min:1',
            'employee_ids.*' => 'integer|exists:employees,employee_id',
        ]);

        foreach ($request->employee_ids as $employeeId) {
            EmployeeAllowance::firstOrCreate(
                [
                    'employee_id'    => $employeeId,
                    'allowance_name' => $allowance->name,
                ],
                [
                    'allowance_amount' => $allowance->monthly_salary,
                    'taxable'          => $allowance->taxable,
                ]
            );
        }

        return redirect()->back();
    }

    public function unassign(Request $request, Allowance $allowance)
    {
        $request->validate([
            'employee_ids'   => 'required|array|min:1',
            'employee_ids.*' => 'integer|exists:employees,employee_id',
        ]);

        EmployeeAllowance::whereIn('employee_id', $request->employee_ids)
            ->where('allowance_name', $allowance->name)
            ->delete();

        return redirect()->back();
    }
}