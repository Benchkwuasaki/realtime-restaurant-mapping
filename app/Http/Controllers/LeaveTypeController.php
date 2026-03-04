<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\LeaveType;
use App\Models\LeaveTypeRequirement;


class LeaveTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $leave_types = LeaveType::with('requirements')->get()->all();
        $total_leave_types = LeaveType::count();
        $total_paid = LeaveType::where('is_paid', true)->count();
        $total_convertible = LeaveType::where('is_convertible', true)->count();

        return Inertia::render('Leave/LeaveSettings/LeaveSettingsTabNav', compact(
            'leave_types',
            'total_leave_types',
            'total_paid',
            'total_convertible',
        ));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {


        $validated = $request->validate([
            'leave_type_name' => 'required|string|max:255|unique:leave_types,leave_type_name',
            'leave_type_description' => 'nullable|string',
            'eligible_sex' => 'required|in:All,Male,Female',
            'is_paid' => 'required|boolean',
            'is_convertible' => 'required|boolean',
            'status' => 'required|boolean',
            'requirements' => 'nullable|array',
            'requirements.*.requirement_name' => 'required|string|max:255',
        ]);

        $leaveType = LeaveType::create($validated);

        foreach ($validated['requirements'] ?? [] as $req) {
            $leaveType->requirements()->create([
                'requirement_name' => $req['requirement_name'],
            ]);
        }

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
        $leaveType = LeaveType::with('requirements')->findOrFail($id);

        $validated = $request->validate([
            'leave_type_name' => 'required|string|max:255|unique:leave_types,leave_type_name,' . $leaveType->leave_type_id . ',leave_type_id',
            'leave_type_description' => 'nullable|string',
            'eligible_sex' => 'required|in:All,Male,Female',
            'is_paid' => 'required|boolean',
            'is_convertible' => 'required|boolean',
            'status' => 'required|boolean',
            'requirements' => 'nullable|array',
            'requirements.*.leave_type_requirement_id' => 'nullable|integer|exists:leave_type_requirements,leave_type_requirement_id',
            'requirements.*.requirement_name' => 'required|string|max:255',
        ]);

        $leaveType->update($validated);

        $incomingIds = collect($validated['requirements'] ?? [])
            ->pluck('leave_type_requirement_id')
            ->filter()
            ->values();

        $leaveType->requirements()
            ->whereNotIn('leave_type_requirement_id', $incomingIds)
            ->delete();

        foreach ($validated['requirements'] ?? [] as $req) {
            if (!empty($req['leave_type_requirement_id'])) {
                LeaveTypeRequirement::where('leave_type_requirement_id', $req['leave_type_requirement_id'])
                    ->update(['requirement_name' => $req['requirement_name']]);
            } else {
                $leaveType->requirements()->create([
                    'requirement_name' => $req['requirement_name'],
                ]);
            }
        }

        return back()->with('success', 'Leave type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $leave_type = LeaveType::findOrFail($id);
        $leave_type->requirements()->delete();
        $leave_type->delete();
        return back()->with('success', 'Leave type deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:leave_types,leave_type_id'],
        ]);

        $leaveTypes = LeaveType::whereIn('leave_type_id', $request->ids)->get();

        foreach ($leaveTypes as $leaveType) {
            $leaveType->requirements()->delete();
            $leaveType->delete();
        }

        return back()->with('success', count($request->ids) . ' leave type(s) deleted.');
    }
}
