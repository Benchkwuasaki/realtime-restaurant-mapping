<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'name'                  => 'required|string|max:100|unique:attendance_settings,name',
            'early_time_in_minutes' => 'required|integer|min:0|max:480',
            'late_time_out_minutes' => 'required|integer|min:0|max:480',
            'is_default'            => 'boolean',
        ]);

        $setting = AttendanceSetting::create([
            'name'                  => $data['name'],
            'early_time_in_minutes' => $data['early_time_in_minutes'],
            'late_time_out_minutes' => $data['late_time_out_minutes'],
            'is_default'            => false,
        ]);

        if (!empty($data['is_default'])) {
            $setting->markAsDefault();
        }

        return back()->with('success', "Attendance setting \"{$setting->name}\" created.");
    }

    public function update(Request $request, AttendanceSetting $attendanceSetting): RedirectResponse
    {
        $data = $request->validate([
            'name'                  => "required|string|max:100|unique:attendance_settings,name,{$attendanceSetting->id}",
            'early_time_in_minutes' => 'required|integer|min:0|max:480',
            'late_time_out_minutes' => 'required|integer|min:0|max:480',
            'is_default'            => 'boolean',
        ]);

        // Update non-default fields only — avoids Eloquent dirty-tracking bug
        // where is_default stays cached as true and the markAsDefault SQL is skipped
        $attendanceSetting->update([
            'name'                  => $data['name'],
            'early_time_in_minutes' => $data['early_time_in_minutes'],
            'late_time_out_minutes' => $data['late_time_out_minutes'],
        ]);

        if (!empty($data['is_default'])) {
            $attendanceSetting->markAsDefault();
        }

        return back()->with('success', "Attendance setting \"{$attendanceSetting->name}\" updated.");
    }

    public function destroy(AttendanceSetting $attendanceSetting): RedirectResponse
    {
        if ($attendanceSetting->is_default) {
            return back()->with('error', 'Cannot delete the default setting. Assign another as default first.');
        }

        $name = $attendanceSetting->name;
        $attendanceSetting->delete();

        return back()->with('success', "Attendance setting \"{$name}\" deleted.");
    }
}