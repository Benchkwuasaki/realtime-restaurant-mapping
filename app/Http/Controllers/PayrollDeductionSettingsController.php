<?php

namespace App\Http\Controllers;

use App\Models\PayrollDeductionSetting;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PayrollDeductionSettingsController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    /**
     * Show the Payroll Deduction Settings page.
     * Passes all three sections the frontend needs:
     *   - settings        (contribution rates + working days divisor)
     *   - floorRules      (minimum take-home, salary threshold)
     *   - priorityOrder   (draggable deduction priority list)
     */
    public function index(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Payroll Deduction Settings Page',
        ]);

        $s = PayrollDeductionSetting::getSettings();

        return Inertia::render('Payroll/Configuration/PayrollDeductionSettings/Index', [
            'settings' => [
                'gsis_employee_rate' => $s->gsis_employee_rate,
                'gsis_employer_rate' => $s->gsis_employer_rate,
                'philhealth_rate' => $s->philhealth_rate,
                'pagibig_monthly' => $s->pagibig_monthly,
                'working_days_divisor' => $s->working_days_divisor,
            ],
            'floorRules' => [
                'minimum_take_home_pay' => $s->minimum_take_home_pay,
                'salary_threshold' => $s->salary_threshold,
            ],
            'priorityOrder' => $s->priority_order ?? [],
        ]);
    }

    /**
     * Update contribution rates and working days divisor.
     * PUT /payroll/deduction-settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'gsis_employee_rate' => 'required|numeric|min:0|max:100',
            'gsis_employer_rate' => 'required|numeric|min:0|max:100',
            'philhealth_rate' => 'required|numeric|min:0|max:100',
            'pagibig_monthly' => 'required|numeric|min:0',
            'working_days_divisor' => 'required|integer|min:1|max:31',
        ]);

        PayrollDeductionSetting::getSettings()->update($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Payroll Deduction Settings (Contribution Rates)',
        ]);

        return back()->with('success', 'Contribution rates updated.');
    }

    /**
     * Update the deduction priority order.
     * PUT /payroll/deduction-settings/priority-order
     */
    public function updatePriorityOrder(Request $request)
    {
        $validated = $request->validate([
            'priority_order' => 'required|array|min:1',
            'priority_order.*.id' => 'required|string',
            'priority_order.*.priority' => 'required|integer|min:1',
            'priority_order.*.deduction_type' => 'required|string|max:100',
            'priority_order.*.examples' => 'nullable|string|max:255',
            'priority_order.*.can_be_cut' => 'nullable|string|max:50',
        ]);

        PayrollDeductionSetting::getSettings()->update([
            'priority_order' => $validated['priority_order'],
        ]);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Payroll Deduction Priority Order',
        ]);

        return back()->with('success', 'Priority order updated.');
    }

    /**
     * Update floor rules.
     * PUT /payroll/deduction-settings/floor-rules
     */
    public function updateFloorRules(Request $request)
    {
        $validated = $request->validate([
            'minimum_take_home_pay' => 'required|numeric|min:0',
            'salary_threshold' => 'required|numeric|min:0',
        ]);

        PayrollDeductionSetting::getSettings()->update($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Payroll Floor Rules',
        ]);

        return back()->with('success', 'Floor rules updated.');
    }
}
