<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveEntitlement;

class LeaveEntitlementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
         // Validate the incoming request data
        $validated = $request->validate([
            'leave_type_id' => 'required|integer|exists:leave_types,leave_type_id',
            'leave_entitlement_description' => 'nullable|string',
            'years_of_service' => 'required|integer|min:0',
            'days_entitled' => 'required|numeric|min:0',
            'event_type' => 'nullable|string',
            ]);

        // Create a new leave entitlement record in the database
        LeaveEntitlement::create($validated);

        // Redirect back with a success message
        return back()->with('success', 'Leave entitlement created successfully.');
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
        // Find the leave entitlement by ID
        $entitlement = LeaveEntitlement::findOrFail($id);

        // Validate the incoming request data
        $validated = $request->validate([
            'leave_type_id' => 'required|integer|exists:leave_types,leave_type_id',
            'leave_entitlement_description' => 'nullable|string',
            'years_of_service' => 'required|integer|min:0',
            'days_entitled' => 'required|numeric|min:0',
            'event_type' => 'nullable|string',
        ]);

        // Update the leave entitlement record with validated data
        $entitlement->update($validated);

        // Redirect back with a success message
        return back()->with('success', 'Leave entitlement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
          // Find the leave entitlement by ID
        $entitlement = LeaveEntitlement::findOrFail($id);

        // Delete the leave entitlement from the database
        $entitlement->delete();

        // Redirect back with a success message
        return back()->with('success', 'Leave entitlement deleted successfully.');
    }


    /**
     * Delete multiple leave entitlements at once.
     */
    public function bulkDestroy(Request $request)
    {
        // Validate that IDs are provided and exist in the database
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:leave_entitlements,leave_entitlement_id'],
        ]);

        // Delete all targeted entitlements in one query instead of looping
        LeaveEntitlement::whereIn('leave_entitlement_id', $request->ids)->delete();

        // Redirect back with success message and number of records deleted
        return back()->with('success', count($request->ids) . ' leave entitlement(s) deleted.');

    }
}