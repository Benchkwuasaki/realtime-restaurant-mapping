<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollSslTable;
use App\Models\SalaryGradeStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalaryGradeTableController extends Controller
{
    public function index()
    {
        $tables = PayrollSslTable::withCount([
            'salaryGradeSteps',
            'salaryGradeSteps as filled_steps_count' => fn ($q) => $q->whereNotNull('monthly_salary'),
        ])
            ->with('activatedBy:id,name')
            ->orderByRaw("FIELD(status, 'active', 'draft', 'superseded')")
            ->orderByDesc('effectivity_date')
            ->get()
            ->map(fn (PayrollSslTable $t) => [
                'ssl_table_id' => $t->ssl_table_id,
                'ssl_version' => $t->ssl_version,
                'legal_basis' => $t->legal_basis,
                'tranche' => $t->tranche,
                'tranche_ordinal' => $t->tranche_ordinal,
                'effectivity_date' => $t->effectivity_date->toDateString(),
                'status' => $t->status,
                'activated_at' => $t->activated_at?->toDateTimeString(),
                'activated_by_name' => $t->activatedBy?->name,
                'filled_cells' => (int) $t->filled_steps_count,
                'total_cells' => 264, // 33 × 8
            ]);

        $activeTable = $tables->firstWhere('status', 'active');

        return Inertia::render('Payroll/Configuration/SalaryGradeTable/Index', [
            'tables' => $tables,
            'activeTable' => $activeTable,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ssl_version' => 'required|string|max:20',
            'legal_basis' => 'required|string|max:100',
            'tranche' => 'required|integer|min:1|max:4',
            'effectivity_date' => 'required|date',
        ]);

        $exists = PayrollSslTable::where('ssl_version', $validated['ssl_version'])
            ->where('tranche', $validated['tranche'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'tranche' => "{$validated['ssl_version']} Tranche {$validated['tranche']} already exists.",
            ]);
        }

        $table = PayrollSslTable::create(array_merge($validated, ['status' => 'draft']));

        $rows = [];
        for ($sg = 1; $sg <= 33; $sg++) {
            for ($step = 1; $step <= 8; $step++) {
                $rows[] = [
                    'ssl_table_id' => $table->ssl_table_id,
                    'salary_grade' => $sg,
                    'step' => $step,
                    'monthly_salary' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        SalaryGradeStep::insert($rows);

        return redirect()
            ->route('payroll.salary-grade.show', $table->ssl_table_id)
            ->with('success', 'Draft SSL table created. Fill in the salary amounts below.');
    }

    public function show(PayrollSslTable $salaryGrade)
    {
        $steps = $salaryGrade->salaryGradeSteps()
            ->orderBy('salary_grade')
            ->orderBy('step')
            ->get(['salary_grade_step_id', 'salary_grade', 'step', 'monthly_salary']);

        $grid = [];
        foreach ($steps as $s) {
            $grid[$s->salary_grade][$s->step] = [
                'salary_grade_step_id' => $s->salary_grade_step_id,
                'monthly_salary' => $s->monthly_salary ? (float) $s->monthly_salary : null,
            ];
        }

        $salaryTable = [];
        for ($sg = 1; $sg <= 33; $sg++) {
            $row = ['salary_grade' => $sg, 'steps' => []];
            for ($step = 1; $step <= 8; $step++) {
                $row['steps'][] = [
                    'step' => $step,
                    'monthly_salary' => $grid[$sg][$step]['monthly_salary'] ?? null,
                ];
            }
            $salaryTable[] = $row;
        }

        $affectedEmployeeCount = 0;
        if ($salaryGrade->status === 'draft') {
            $affectedEmployeeCount = Employee::whereNotNull('salary_grade_step_id')->count();
        }

        return Inertia::render('Payroll/Configuration/SalaryGradeTable/Show', [
            'sslTable' => [
                'ssl_table_id' => $salaryGrade->ssl_table_id,
                'ssl_version' => $salaryGrade->ssl_version,
                'legal_basis' => $salaryGrade->legal_basis,
                'tranche' => $salaryGrade->tranche,
                'tranche_ordinal' => $salaryGrade->tranche_ordinal,
                'effectivity_date' => $salaryGrade->effectivity_date->toDateString(),
                'status' => $salaryGrade->status,
                'activated_at' => $salaryGrade->activated_at?->toDateTimeString(),
            ],
            'salaryTable' => $salaryTable,
            'affectedEmployeeCount' => $affectedEmployeeCount,
        ]);
    }

    public function update(Request $request, PayrollSslTable $salaryGrade)
    {
        if ($salaryGrade->status !== 'draft') {
            return back()->with('error', 'Only draft tables can be edited.');
        }

        $validated = $request->validate([
            'salary_table' => 'required|array|size:33',
            'salary_table.*.salary_grade' => 'required|integer|min:1|max:33',
            'salary_table.*.steps' => 'required|array|size:8',
            'salary_table.*.steps.*.step' => 'required|integer|min:1|max:8',
            'salary_table.*.steps.*.monthly_salary' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $salaryGrade) {
            foreach ($validated['salary_table'] as $row) {
                foreach ($row['steps'] as $step) {
                    SalaryGradeStep::where('ssl_table_id', $salaryGrade->ssl_table_id)
                        ->where('salary_grade', $row['salary_grade'])
                        ->where('step', $step['step'])
                        ->update(['monthly_salary' => $step['monthly_salary']]);
                }
            }
        });

        return back()->with('success', 'Salary grade table saved.');
    }

    public function activate(Request $request, PayrollSslTable $salaryGrade)
    {
        if ($salaryGrade->status !== 'draft') {
            return back()->with('error', 'Only draft tables can be activated.');
        }

        $missingCount = $salaryGrade->salaryGradeSteps()
            ->where(fn ($q) => $q->where('salary_grade', '<', 33)
                ->orWhere('step', '<=', 2))
            ->whereNull('monthly_salary')
            ->count();

        if ($missingCount > 0) {
            return back()->with(
                'error',
                "Cannot activate: {$missingCount} required salary cells are still empty."
            );
        }

        DB::transaction(function () use ($salaryGrade) {
            $newSteps = $salaryGrade->salaryGradeSteps
                ->keyBy(fn ($s) => "{$s->salary_grade}-{$s->step}");

            $employees = Employee::with('salaryGradeStep')
                ->whereNotNull('salary_grade_step_id')
                ->get();

            $logs = [];
            foreach ($employees as $employee) {
                $current = $employee->salaryGradeStep;
                if (! $current) {
                    continue;
                }

                $key = "{$current->salary_grade}-{$current->step}";
                $newStep = $newSteps->get($key);

                if (! $newStep) {
                    continue;
                }

                $employee->update([
                    'salary_grade_step_id' => $newStep->salary_grade_step_id,
                ]);

                $logs[] = [
                    'ssl_table_id' => $salaryGrade->ssl_table_id,
                    'employee_id' => $employee->employee_id,
                    'old_monthly_salary' => $current->monthly_salary,
                    'new_monthly_salary' => $newStep->monthly_salary,
                    'effective_date' => $salaryGrade->effectivity_date,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            PayrollSslTable::where('status', 'active')
                ->update(['status' => 'superseded']);

            $salaryGrade->update([
                'status' => 'active',
                'activated_at' => now(),
                'activated_by' => Auth::id(),
            ]);

            if (! empty($logs)) {
                DB::table('payroll_ssl_activation_logs')->insert($logs);
            }
        });

        return redirect()
            ->route('payroll.salary-grade.index')
            ->with('success', "SSL table activated. Employee salaries updated as of {$salaryGrade->effectivity_date->format('F j, Y')}.");
    }

    public function destroy(PayrollSslTable $salaryGrade)
    {
        if ($salaryGrade->status !== 'draft') {
            return back()->with('error', 'Only draft tables can be deleted. Active and superseded tables are kept for audit purposes.');
        }

        $salaryGrade->salaryGradeSteps()->delete();
        $salaryGrade->delete();

        return redirect()
            ->route('payroll.salary-grade.index')
            ->with('success', 'Draft table deleted.');
    }
}
