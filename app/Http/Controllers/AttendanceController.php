<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Services\FaceRecognitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private FaceRecognitionService $faceService) {}

    private function isInertia(Request $request): bool
    {
        return (bool) $request->header('X-Inertia');
    }

    private function inertiaBack(string $flashKey, array $payload)
    {
        return back()->with($flashKey, $payload);
    }

    /** POST /attendance/detect */
    public function detect(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        try {
            $result = $this->faceService->detect($request->file('image'), returnLandmarks: false);

            $payload = [
                'success' => true,
                'data' => $result,
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_detect', $payload)
                : response()->json($payload);
        } catch (\RuntimeException $e) {
            $payload = [
                'success' => false,
                'message' => 'Detection failed: ' . $e->getMessage(),
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_detect', $payload)
                : response()->json($payload, 422);
        }
    }

    /** POST /attendance/clock-in (multipart: image) */
    public function clockIn(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        // Save captured image
        $path = $request->file('image')->store('attendance_captures', 'local');

        try {
            $result = $this->faceService->identify(
                image: $request->file('image'),
                topN: (int) config('services.face_api.top_n', 5),
            );
        } catch (\RuntimeException $e) {
            $payload = [
                'success' => false,
                'message' => 'Face recognition failed: ' . $e->getMessage(),
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_identify', $payload)
                : response()->json($payload, 422);
        }

        if (!($result['matched'] ?? false)) {
            $payload = [
                'success'    => false,
                'message'    => 'Face not recognized. Please try again.',
                'candidates' => $result['candidates'] ?? [],
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_identify', $payload)
                : response()->json($payload, 404);
        }

        $best = $result['best_match'] ?? null;
        if (!$best) {
            $payload = [
                'success' => false,
                'message' => 'Recognition response missing best_match.',
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_identify', $payload)
                : response()->json($payload, 422);
        }

        $employeeId   = (string) ($best['employee_id'] ?? '');
        $embeddingsId = (string) ($best['embeddings_id'] ?? '');
        $similarity   = (float)  ($best['similarity'] ?? 0);

        $min = (float) config('services.face_api.min_similarity', 0.45);
        if ($employeeId === '' || $similarity < $min) {
            $payload = [
                'success'    => false,
                'message'    => 'Low confidence match. Please try again.',
                'similarity' => $similarity,
                'threshold'  => $min,
            ];

            return $this->isInertia($request)
                ? $this->inertiaBack('kiosk_identify', $payload)
                : response()->json($payload, 422);
        }

        // Optional: prevent duplicate spam within 2 minutes
        $already = AttendanceRecord::where('employee_id', $employeeId)
            ->whereDate('date', now()->toDateString())
            ->where('created_at', '>=', now()->subMinutes(2))
            ->exists();

        $recordId = null;
        if (!$already) {
            $record = AttendanceRecord::create([
                'employee_id'   => $employeeId,
                'embeddings_id' => $embeddingsId,
                'status'        => 'present',
                'img_path'      => $path,
                'date'          => now()->toDateString(),
            ]);
            $recordId = $record->id;
        }

        $payload = [
            'success'            => true,
            'employee_id'        => $employeeId,
            'confidence'         => $similarity,
            'attendance_id'      => $recordId,
            'recognition_log_id' => $result['recognition_log_id'] ?? null,
            'message'            => $already ? 'Already recorded recently.' : 'Clock-in recorded successfully.',
        ];

        return $this->isInertia($request)
            ? $this->inertiaBack('kiosk_identify', $payload)
            : response()->json($payload);
    }

    /** POST /attendance/enroll (multipart: image + employee_id) */
    public function enroll(Request $request): JsonResponse
    {
        // enroll can stay JSON if you want, or make it hybrid too.
        $request->validate([
            'image'       => ['required', 'image', 'max:10240'],
            'employee_id' => ['required', 'string'],
        ]);

        $path = $request->file('image')->store('enrollment_captures', 'local');

        try {
            $result = $this->faceService->enroll(
                employeeId: (string) $request->employee_id,
                image: $request->file('image'),
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Enrollment failed: ' . $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success'               => true,
            'employee_id'           => $result['employee_id'] ?? $request->employee_id,
            'embeddings_id'         => $result['embeddings_id'] ?? null,
            'enrollment_session_id' => $result['enrollment_session_id'] ?? null,
            'message'               => 'Employee enrolled successfully.',
            'saved_image_path'      => $path,
        ], 201);
    }
}
