<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollSslTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StepIncrementController extends Controller
{
    public function index()
    {
        $activeTable = PayrollSslTable::where('status', 'active')
            ->with('salaryGradeSteps')
            ->first();

        $stepMap = $activeTable
            ? $activeTable->salaryGradeSteps->keyBy(fn ($s) => "{$s->salary_grade}-{$s->step}")
            : collect();

        $employees = Employee::with(['basicInfo', 'salaryGradeStep'])
            ->where('status', true)
            ->whereNotNull('salary_grade_step_id')
            ->get()
            ->map(function (Employee $e) {
                $current = $e->salaryGradeStep;

                return [
                    'employee_id' => $e->employee_id,
                    'name' => trim(
                        ($e->basicInfo->first_name ?? '').' '.
                        ($e->basicInfo->last_name ?? '')
                    ),
                    'employment_classification' => $e->employment_classification,
                    'salary_grade' => $current?->salary_grade,
                    'step' => $current?->step,
                    'monthly_salary' => $current ? (float) $current->monthly_salary : null,
                    'salary_grade_step_id' => $e->salary_grade_step_id,
                ];
            });

        return Inertia::render('Payroll/Configuration/StepIncrement/Index', [
            'employees' => $employees,
            'activeTable' => $activeTable ? [
                'ssl_table_id' => $activeTable->ssl_table_id,
                'ssl_version' => $activeTable->ssl_version,
                'legal_basis' => $activeTable->legal_basis,
                'tranche_ordinal' => $activeTable->tranche_ordinal,
                'effectivity_date' => $activeTable->effectivity_date->toDateString(),
            ] : null,
            'stepSalaryMap' => $stepMap->mapWithKeys(fn ($s, $key) => [
                $key => (float) $s->monthly_salary,
            ])->toArray(),
        ]);
    }

    public function apply(Request $request)
    {
        $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'integer|exists:employees,employee_id',
            'increment' => 'required|integer|min:1|max:7',
        ]);

        $activeTable = PayrollSslTable::where('status', 'active')
            ->with('salaryGradeSteps')
            ->firstOrFail();

        $stepMap = $activeTable->salaryGradeSteps
            ->keyBy(fn ($s) => "{$s->salary_grade}-{$s->step}");

        $employees = Employee::with('salaryGradeStep')
            ->whereIn('employee_id', $request->employee_ids)
            ->get();

        $updated = 0;

        DB::transaction(function () use ($employees, $stepMap, $request, &$updated) {
            foreach ($employees as $employee) {
                $current = $employee->salaryGradeStep;
                if (! $current) {
                    continue;
                }

                $newStep = min($current->step + $request->increment, 8);

                if ($newStep === $current->step) {
                    continue;
                }

                $key = "{$current->salary_grade}-{$newStep}";
                $newRecord = $stepMap->get($key);

                if (! $newRecord) {
                    continue;
                }

                $employee->update([
                    'salary_grade_step_id' => $newRecord->salary_grade_step_id,
                ]);

                $updated++;
            }
        });

        return redirect()->back()->with(
            'success',
            "{$updated} employee(s) step incremented successfully."
        );
    }
}
