<?php

namespace App\Http\Controllers;

use App\Models\GovernmentAccType;
use App\Models\PayrollDeductionPriorityOrder;
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
     *
     * Passes all three sections the frontend needs:
     *   - settings       (contribution rates + bracket values + working days divisor)
     *   - floorRules     (minimum take-home, salary threshold)
     *   - priorityOrder  (draggable deduction priority list)
     */
    public function index(): Response
    {
        $s = PayrollDeductionSetting::getSettings();
        $accTypes = GovernmentAccType::all()->keyBy('code');

        $gsis = $accTypes->get('GSIS');
        $philhealth = $accTypes->get('PHILHEALTH');
        $pagibig = $accTypes->get('PAGIBIG');

        return Inertia::render('Payroll/Configuration/PayrollDeductionSettings/Index', [
            'settings' => [
                // ── GSIS ───────────────────────────────────────────────────────
                'gsis_employee_rate' => $gsis?->employee_rate ?? 9.0,
                'gsis_employer_rate' => $gsis?->employer_rate ?? 12.0,

                // ── PhilHealth ─────────────────────────────────────────────────
                'philhealth_rate' => $philhealth?->employee_rate ?? 2.5,
                'philhealth_min' => $philhealth?->min_contribution ?? 250.0,
                'philhealth_max' => $philhealth?->max_contribution ?? 2500.0,

                // ── Pag-IBIG ───────────────────────────────────────────────────
                'pagibig_cap' => $pagibig?->fixed_amount ?? 100.0,
                'pagibig_lower_threshold' => $pagibig?->lower_salary_threshold ?? 1500.0,
                'pagibig_lower_rate' => $pagibig?->lower_rate ?? 1.0,
                'pagibig_upper_rate' => $pagibig?->upper_rate ?? 2.0,

                // ── General ────────────────────────────────────────────────────
                'working_days_divisor' => $s->working_days_divisor,
            ],
            'floorRules' => [
                'minimum_take_home_pay' => $s->minimum_take_home_pay,
                'salary_threshold' => $s->salary_threshold,
            ],
            'priorityOrder' => PayrollDeductionPriorityOrder::ordered()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'priority' => $p->priority,
                    'deduction_category' => $p->deduction_category,
                    'label' => $p->label,
                    'examples' => $p->examples,
                    'cuttability' => $p->cuttability,
                ]),
        ]);
    }

    /**
     * Update all government contribution rates and bracket values.
     * PUT /payroll/configuration/deduction-settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // GSIS
            'gsis_employee_rate' => 'required|numeric|min:0|max:100',
            'gsis_employer_rate' => 'required|numeric|min:0|max:100',

            // PhilHealth
            'philhealth_rate' => 'required|numeric|min:0|max:100',
            'philhealth_min' => 'required|numeric|min:0',
            'philhealth_max' => 'required|numeric|min:0|gte:philhealth_min',

            // Pag-IBIG
            'pagibig_cap' => 'required|numeric|min:0',
            'pagibig_lower_threshold' => 'required|numeric|min:0',
            'pagibig_lower_rate' => 'required|numeric|min:0|max:100',
            'pagibig_upper_rate' => 'required|numeric|min:0|max:100|gte:pagibig_lower_rate',

            // General
            'working_days_divisor' => 'required|integer|min:1|max:31',
        ]);

        // ── GSIS ──────────────────────────────────────────────────────────────
        GovernmentAccType::where('code', 'GSIS')->update([
            'employee_rate' => $validated['gsis_employee_rate'],
            'employer_rate' => $validated['gsis_employer_rate'],
        ]);

        // ── PhilHealth ────────────────────────────────────────────────────────
        GovernmentAccType::where('code', 'PHILHEALTH')->update([
            'employee_rate' => $validated['philhealth_rate'],
            'min_contribution' => $validated['philhealth_min'],
            'max_contribution' => $validated['philhealth_max'],
        ]);

        // ── Pag-IBIG ──────────────────────────────────────────────────────────
        GovernmentAccType::where('code', 'PAGIBIG')->update([
            'fixed_amount' => $validated['pagibig_cap'],
            'lower_salary_threshold' => $validated['pagibig_lower_threshold'],
            'lower_rate' => $validated['pagibig_lower_rate'],
            'upper_rate' => $validated['pagibig_upper_rate'],
        ]);

        // ── General ───────────────────────────────────────────────────────────
        PayrollDeductionSetting::getSettings()->update([
            'working_days_divisor' => $validated['working_days_divisor'],
        ]);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Government Contribution Rates',
        ]);

        return back()->with('success', 'Contribution rates updated.');
    }

    /**
     * Update deduction priority order.
     * PUT /payroll/configuration/deduction-settings/priority-order
     */
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
     * PUT /payroll/configuration/deduction-settings/floor-rules
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
