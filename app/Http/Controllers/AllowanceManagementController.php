<?php

namespace App\Http\Controllers;

use App\Models\Allowance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AllowanceManagementController extends Controller
{
    public function index()
    {
        $allowances = Allowance::orderBy('name')->get();

        return Inertia::render('Payroll/Earnings&Deductions/AllowancesManagement/Index', [
            'allowances' => $allowances,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'monthly_salary' => 'required|numeric|min:0',
            'taxable' => 'required|boolean',
            'applicable_to' => 'nullable|string|max:255',
            'mandatory' => 'required|boolean',
            'basis' => 'nullable|string|max:255',
        ]);

        Allowance::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Allowance $allowance)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'monthly_salary' => 'required|numeric|min:0',
            'taxable' => 'required|boolean',
            'applicable_to' => 'nullable|string|max:255',
            'mandatory' => 'required|boolean',
            'basis' => 'nullable|string|max:255',
        ]);

        $allowance->update($validated);

        return redirect()->back();
    }
}
