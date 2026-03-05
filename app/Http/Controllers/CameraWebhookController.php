<?php

namespace App\Http\Controllers;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CameraWebhookController extends Controller
{
    public function verify(Request $request)
    {
        $data = $request->all();

        if ($data['operator'] !== 'VerifyPush') {
            return response()->json(['status' => 'ignored']);
        }

        $info = $data['info'];

        $workId = $info['IdCard'] ?? null;

        $employee = Employee::where('work_id', $workId)->first();

        $imagePath = null;

        if (!empty($data['SanpPic'])) {

            $base64 = str_replace('data:image/jpeg;base64,', '', $data['SanpPic']);

            $filename = 'attendance/' . time() . '.jpg';

            Storage::disk('public')->put(
                $filename,
                base64_decode($base64)
            );

            $imagePath = $filename;
        }

        Attendance::create([
            'employee_id' => $employee?->employee_id,
            'work_id' => $workId,
            'similarity' => $info['Similarity1'] ?? null,
            'device_id' => $info['DeviceID'] ?? null,
            'snapshot_path' => $imagePath,
            'captured_at' => $info['CreateTime']
        ]);

        return response()->json(['status' => 'success']);
    }
}
