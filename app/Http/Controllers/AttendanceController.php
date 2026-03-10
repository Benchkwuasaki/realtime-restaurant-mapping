<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $date   = $request->get('date', Carbon::today()->toDateString());

        $start = Carbon::parse($date, 'Asia/Manila')->startOfDay()->utc();
        $end   = Carbon::parse($date, 'Asia/Manila')->endOfDay()->utc();

        $query = Attendance::with(['employee.basicInfo'])
            ->whereNotNull('employee_id')
            ->whereBetween('captured_at', [$start, $end])
            ->orderByDesc('captured_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('work_id', 'like', "%{$search}%")
                    ->orWhereHas('employee.basicInfo', function ($q2) use ($search) {
                        $q2->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $attendances = $query->paginate(20)->withQueryString();

        return Inertia::render('Attendance/RecognitionLog/Index', [
            'attendances' => $attendances,
            'filters'     => ['search' => $search, 'date' => $date],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if (($data['operator'] ?? '') !== 'VerifyPush') {
            return response()->json(['error' => 'invalid'], 400);
        }

        $info     = $data['info'];
        $employee = Employee::where('work_id', $info['IdCard'])->first();

        // ── Reject unmatched scans — no employee, no record ───────────────────
        // If the face/card doesn't match any active employee in the system,
        // we discard the scan entirely. Nothing is saved, nothing is broadcast.
        if (!$employee) {
            return response()->json(['status' => 'unmatched']);
        }

        // ── Duplicate prevention (5-minute window) ────────────────────────────
        $exists = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('captured_at', [now()->subMinutes(5), now()])
            ->exists();

        if ($exists) {
            return response()->json(['status' => 'duplicate']);
        }

        Attendance::create([
            'employee_id'         => $employee->employee_id,
            'work_id'             => $info['IdCard'],
            'verification_status' => ($info['VerifyStatus'] ?? 0) == 1 ? 'verified' : 'unknown',
            'similarity'          => $info['Similarity1'] ?? null,
            'device_id'           => $info['DeviceID'] ?? null,
            'captured_at'         => $info['CreateTime'],
        ]);

        return response()->json(['status' => 'ok']);
    }
}