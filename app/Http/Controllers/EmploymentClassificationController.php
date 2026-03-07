<?php

namespace App\Http\Controllers;

use App\Models\EmploymentClassification;
use Illuminate\Http\Request;

class EmploymentClassificationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:employment_classifications,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        EmploymentClassification::create($request->only('name', 'description'));

        return back()->with('success', 'Classification created.');
    }

    public function update(Request $request, EmploymentClassification $employmentClassification)
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:employment_classifications,name,' . $employmentClassification->id],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $employmentClassification->update($request->only('name', 'description'));

        return back()->with('success', 'Classification updated.');
    }

    public function destroy(EmploymentClassification $employmentClassification)
    {
        $employmentClassification->delete();

        return back()->with('success', 'Classification deleted.');
    }
}