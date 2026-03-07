<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LeaveType;
use App\Models\LeaveEntitlement;
use Inertia\Inertia;

class LeaveSettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Load leave types with their requirements for the Leave Types tab
        $leave_types = LeaveType::with('requirements')->get();

        // Load entitlements with their parent leave type name for the Leave Entitlements tab
        $leave_entitlements = LeaveEntitlement::with('leaveType')->get();

        // Summary counts for the stat cards
        $total_leave_types = LeaveType::count();
        $total_paid = LeaveType::where('is_paid', true)->count();
        $total_convertible = LeaveType::where('is_convertible', true)->count();

        return Inertia::render('Leave/LeaveSettings/LeaveSettingsTabNav', compact(
            'leave_types',
            'leave_entitlements', 
            'total_leave_types',
            'total_paid',
            'total_convertible',
        ));
    }

}
