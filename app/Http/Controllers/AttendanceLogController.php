<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceLogController extends Controller
{
    public function index(Request $request): Response
    {
        $date  = $request->get('date', Carbon::today('Asia/Manila')->toDateString());
        $start = Carbon::parse($date, 'Asia/Manila')->startOfDay()->utc();
        $end   = Carbon::parse($date, 'Asia/Manila')->endOfDay()->utc();

        $attendances = Attendance::with(['employee.basicInfo'])
            ->whereNotNull('employee_id')
            ->whereBetween('captured_at', [$start, $end])
            ->orderByDesc('captured_at')
            ->get();

        return Inertia::render('Attendance/RecognitionLog/Index', [
            'attendances' => $attendances,
            'filters'     => ['date' => $date],
            'settings'    => AttendanceSetting::orderByDesc('is_default')->orderBy('name')->get(),
        ]);
    }
}