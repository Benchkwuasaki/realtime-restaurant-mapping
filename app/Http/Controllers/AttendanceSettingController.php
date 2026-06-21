<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceSettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Attendance/AttendanceSetting/Index', [
            'settings' => AttendanceSetting::orderByDesc('is_default')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:attendance_settings,name',
            'early_time_in_minutes' => 'required|integer|min:0|max:480',
            'late_time_out_minutes' => 'required|integer|min:0|max:480',
            'is_default' => 'boolean',
        ]);

        DB::transaction(function () use ($data) {
            $setting = AttendanceSetting::create([
                'name' => $data['name'],
                'early_time_in_minutes' => $data['early_time_in_minutes'],
                'late_time_out_minutes' => $data['late_time_out_minutes'],
                'is_default' => false,
            ]);

            if (!empty($data['is_default'])) {
                $setting->markAsDefault();
            }
        });

        return back()->with('success', "Attendance setting \"{$data['name']}\" created.");
    }

    public function update(Request $request, AttendanceSetting $attendanceSetting): RedirectResponse
    {

        $data = $request->validate([
            'name' => "required|string|max:100|unique:attendance_settings,name,{$attendanceSetting->id}",
            'early_time_in_minutes' => 'required|integer|min:0|max:480',
            'late_time_out_minutes' => 'required|integer|min:0|max:480',
            'is_default' => 'boolean',
        ]);

        DB::transaction(function () use ($data, $attendanceSetting) {
            // Separate is_default from the main update to avoid Eloquent
            // dirty-tracking skipping markAsDefault() when the value hasn't changed.
            $attendanceSetting->update([
                'name' => $data['name'],
                'early_time_in_minutes' => $data['early_time_in_minutes'],
                'late_time_out_minutes' => $data['late_time_out_minutes'],
            ]);

            if (!empty($data['is_default'])) {
                $attendanceSetting->markAsDefault();
            } elseif ($attendanceSetting->is_default) {
                // Already default — do nothing, preserve it
            } else {
                // Explicitly ensure it stays false for non-defaults
                $attendanceSetting->update(['is_default' => false]);
            }
        });

        return back()->with('success', "Attendance setting \"{$attendanceSetting->name}\" updated.");
    }

    /**
     * Promote a setting to default without editing other fields.
     * Useful for a one-click "Make Default" button in the UI.
     */
    public function setDefault(AttendanceSetting $attendanceSetting): RedirectResponse
    {
        $attendanceSetting->markAsDefault();

        return back()->with('success', "\"{$attendanceSetting->name}\" is now the default setting.");
    }

    public function destroy(AttendanceSetting $attendanceSetting): RedirectResponse
    {
        if ($attendanceSetting->is_default) {
            return back()->with('error', 'Cannot delete the default setting. Assign another setting as default first.');
        }

        if (AttendanceSetting::count() === 1) {
            return back()->with('error', 'Cannot delete the only remaining attendance setting.');
        }

        $name = $attendanceSetting->name;
        $attendanceSetting->delete();

        return back()->with('success', "Attendance setting \"{$name}\" deleted.");
    }
}