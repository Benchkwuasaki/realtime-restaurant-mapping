<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAttendanceLog;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Single entry-point for all camera / face-recognition webhook events.
 *
 * Flow:
 *   Camera POST /webhook/camera
 *     → store raw Attendance log
 *     → dispatch ProcessAttendanceLog job (queued, non-blocking)
 *     → return 200 immediately
 *
 * The job handles: record computation, upsert, real-time broadcast.
 */
class CameraWebhookController extends Controller
{
    public function verify(Request $request): JsonResponse
    {
        $data = $request->all();

        // Only handle VerifyPush events
        if (($data['operator'] ?? '') !== 'VerifyPush') {
            return response()->json(['status' => 'ignored']);
        }

        $info = $data['info'];
        $workId = $info['IdCard'] ?? null;

        if (!$workId) {
            return response()->json(['status' => 'missing_work_id'], 422);
        }

        // ── Resolve employee (nullable – unknown badge) ───────────────────────
        $employee = Employee::where('work_id', $workId)->first();

        // ── Persist snapshot image (optional) ─────────────────────────────────
        $imagePath = null;
        if (!empty($data['SanpPic'])) {
            $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $data['SanpPic']);
            $filename = 'attendance/' . now()->format('Ymd_His') . '_' . ($workId ?? 'unknown') . '.jpg';
            Storage::disk('public')->put($filename, base64_decode($base64));
            $imagePath = $filename;
        }

        // ── Store raw attendance log ───────────────────────────────────────────
        $log = Attendance::create([
            'employee_id' => $employee?->employee_id,
            'work_id' => $workId,
            'verification_status' => ($info['VerifyStatus'] ?? 0) == 1 ? 'verified' : 'unknown',
            'similarity' => $info['Similarity1'] ?? null,
            'device_id' => $info['DeviceID'] ?? null,
            'snapshot_path' => $imagePath,
            'captured_at' => $info['CreateTime'],
        ]);

        // ── Dispatch async job to compute / update AttendanceRecord ───────────
        // Only for matched employees — unmatched logs are stored for audit only.
        if ($employee) {
            ProcessAttendanceLog::dispatch($log->id)->onQueue('attendance');
        }

        $log->load('employee.basicInfo');
        broadcast(new \App\Events\AttendanceLogCreated($log));

        return response()->json(['status' => 'ok']);
    }
}