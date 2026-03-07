<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\OtherDeduction;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OtherDeductionEntryController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Other Deductions Entry Page',
        ]);

        $deductions = OtherDeduction::with('employee.basicInfo')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (OtherDeduction $d) => [
                'id' => $d->id,
                'employee_id' => $d->employee_id,
                'employee_name' => $d->employee?->basicInfo
                    ? $d->employee->basicInfo->last_name.', '.$d->employee->basicInfo->first_name
                    : '—',
                'category' => $d->category,
                'tab_key' => $d->tabKey(),
                'description' => $d->description,
                'amount' => (float) $d->amount,
                'period_start' => $d->period_start?->toDateString(),
                'period_end' => $d->period_end?->toDateString(),
            ])
            ->values();

        $employees = Employee::with('basicInfo')
            ->where('status', true)
            ->get()
            ->sortBy(fn (Employee $e) => $e->basicInfo?->last_name)
            ->values()
            ->map(fn (Employee $e) => [
                'id' => $e->employee_id,
                'full_name' => $e->basicInfo
                    ? $e->basicInfo->last_name.', '.$e->basicInfo->first_name
                    : '—',
                'position' => $e->basicInfo?->position_title ?? null,
            ]);

        return Inertia::render('Payroll/Earnings&Deductions/OtherDeductionEntry/Index', [
            'deductions' => $deductions,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'category' => 'required|string|in:Water Bill,NS & ND (COA),Miscellaneous',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        OtherDeduction::create($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Created Other Deduction Entry',
        ]);

        return back()->with('success', 'Deduction entry created successfully.');
    }

    public function updateAmount(Request $request, OtherDeduction $otherDeduction)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $otherDeduction->update($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Amount for Other Deduction Entry #'.$otherDeduction->id,
        ]);

        return back()->with('success', 'Amount updated.');
    }

    public function destroy(OtherDeduction $otherDeduction)
    {
        $otherDeduction->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Deleted Other Deduction Entry #'.$otherDeduction->id,
        ]);

        return back()->with('success', 'Deduction entry deleted.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:other_deductions,id',
        ]);

        $count = OtherDeduction::whereIn('id', $validated['ids'])->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Bulk deleted {$count} Other Deduction Entries",
        ]);

        return back()->with('success', "{$count} deduction entries deleted successfully.");
    }
}
