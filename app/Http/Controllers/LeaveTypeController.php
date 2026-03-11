<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use App\Models\LeaveTypeRequirement;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {}

    /**
     * Show the form for creating a new resource.
     */
    public function create() {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'leave_type_name' => 'required|string|max:255|unique:leave_types,leave_type_name',
            'leave_type_description' => 'nullable|string',
            'eligible_sex' => 'required|in:All,Male,Female',
            'is_paid' => 'required|boolean',
            'is_convertible' => 'required|boolean',
            'is_accrual' => 'required|boolean',
            'status' => 'required|boolean',
            'requirements' => 'nullable|array',
            'requirements.*.requirement_name' => 'required|string|max:255',
        ]);

        // Create the leave type
        $leaveType = LeaveType::create($validated);

        // Save each requirement related to the leave type
        foreach ($validated['requirements'] ?? [] as $req) {
            $leaveType->requirements()->create([
                'requirement_name' => $req['requirement_name'],
            ]);
        }

        // Redirect back with success message
        return back()->with('success', 'Leave type created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Find the leave type with its requirements
        $leaveType = LeaveType::with('requirements')->findOrFail($id);

        // Validate request data
        $validated = $request->validate([
            'leave_type_name' => 'required|string|max:255|unique:leave_types,leave_type_name,'.$leaveType->leave_type_id.',leave_type_id',
            'leave_type_description' => 'nullable|string',
            'eligible_sex' => 'required|in:All,Male,Female',
            'is_paid' => 'required|boolean',
            'is_convertible' => 'required|boolean',
            'status' => 'required|boolean',
            'requirements' => 'nullable|array',
            'requirements.*.leave_type_requirement_id' => 'nullable|integer|exists:leave_type_requirements,leave_type_requirement_id',
            'requirements.*.requirement_name' => 'required|string|max:255',
        ]);

        // Update leave type details
        $leaveType->update($validated);

        // Collect incoming requirement IDs
        $incomingIds = collect($validated['requirements'] ?? [])
            ->pluck('leave_type_requirement_id')
            ->filter()
            ->values();

        // Delete requirements that were removed
        $leaveType->requirements()
            ->whereNotIn('leave_type_requirement_id', $incomingIds)
            ->delete();

        // Update existing requirements or create new ones
        foreach ($validated['requirements'] ?? [] as $req) {
            if (! empty($req['leave_type_requirement_id'])) {
                // Update existing requirement
                LeaveTypeRequirement::where('leave_type_requirement_id', $req['leave_type_requirement_id'])
                    ->update(['requirement_name' => $req['requirement_name']]);
            } else {
                // Create new requirement
                $leaveType->requirements()->create([
                    'requirement_name' => $req['requirement_name'],
                ]);
            }
        }

        // Redirect back with success message
        return back()->with('success', 'Leave type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Find the leave type
        $leave_type = LeaveType::findOrFail($id);

        // Delete related requirements first
        $leave_type->requirements()->delete();

        // Delete the leave type
        $leave_type->delete();

        // Redirect back with success message
        return back()->with('success', 'Leave type deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        // Validate IDs to delete
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:leave_types,leave_type_id'],
        ]);

        // Get all selected leave types
        $leaveTypes = LeaveType::whereIn('leave_type_id', $request->ids)->get();

        // Delete each leave type with its requirements
        foreach ($leaveTypes as $leaveType) {
            $leaveType->requirements()->delete();
            $leaveType->delete();
        }

        // Return success message with count
        return back()->with('success', count($request->ids).' leave type(s) deleted.');
    }
}
