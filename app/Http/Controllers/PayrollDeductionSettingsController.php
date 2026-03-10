<?php

namespace App\Http\Controllers;

use App\Models\PayrollDeductionSetting;
use App\Models\PayrollDeductionPriorityOrder;
use App\Models\GovernmentAccType;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PayrollDeductionSettingsController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService)
    {
    }

    /**
     * Show the Payroll Deduction Settings page.
     * Passes all three sections the frontend needs:
     *   - settings        (contribution rates + working days divisor)
     *   - floorRules      (minimum take-home, salary threshold)
     *   - priorityOrder   (draggable deduction priority list)
     */
    public function index(): Response
    {
        $s = PayrollDeductionSetting::getSettings();

        // Rates now come from government_acc_types
        $accTypes = GovernmentAccType::all()->keyBy('code');

        return Inertia::render('Payroll/Configuration/PayrollDeductionSettings/Index', [
            'settings' => [
                'gsis_employee_rate' => $accTypes['GSIS']->employee_rate,
                'gsis_employer_rate' => $accTypes['GSIS']->employer_rate,
                'philhealth_rate' => $accTypes['PHILHEALTH']->employee_rate,
                'pagibig_monthly' => $accTypes['PAGIBIG']->fixed_amount,
                'working_days_divisor' => $s->working_days_divisor,
            ],
            'floorRules' => [
                'minimum_take_home_pay' => $s->minimum_take_home_pay,
                'salary_threshold' => $s->salary_threshold,
            ],
            'priorityOrder' => PayrollDeductionPriorityOrder::ordered()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'priority' => $p->priority,
                    'deduction_category' => $p->deduction_category,
                    'label' => $p->label, 
                    'examples' => $p->examples,
                    'cuttability' => $p->cuttability,
                ]),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'gsis_employee_rate' => 'required|numeric|min:0|max:100',
            'gsis_employer_rate' => 'required|numeric|min:0|max:100',
            'philhealth_rate' => 'required|numeric|min:0|max:100',
            'pagibig_monthly' => 'required|numeric|min:0',
            'working_days_divisor' => 'required|integer|min:1|max:31',
        ]);

        // Update each acc type row by code
        GovernmentAccType::where('code', 'GSIS')->update([
            'employee_rate' => $validated['gsis_employee_rate'],
            'employer_rate' => $validated['gsis_employer_rate'],
        ]);
        GovernmentAccType::where('code', 'PHILHEALTH')->update([
            'employee_rate' => $validated['philhealth_rate'],
        ]);
        GovernmentAccType::where('code', 'PAGIBIG')->update([
            'fixed_amount' => $validated['pagibig_monthly'],
        ]);

        PayrollDeductionSetting::getSettings()->update([
            'working_days_divisor' => $validated['working_days_divisor'],
        ]);

        return back()->with('success', 'Contribution rates updated.');
    }

    public function updatePriorityOrder(Request $request)
    {
        $validated = $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'exists:payroll_deduction_priority_order,id',
            'cuttability' => 'required|array',
            'cuttability.*' => 'in:Never,Rarely,Yes,First_to_Cut',
        ]);

        PayrollDeductionPriorityOrder::reorder(
            $validated['ordered_ids'],
            $validated['cuttability'],
        );

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
