<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\WhereaboutSlip;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class WhereaboutSlipController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService,
    ) {}

    public function index(): Response
    {
        $slips = WhereaboutSlip::with([
            'employee.basicInfo',
            'reviewedAndNotedBy.basicInfo',
            'approvedBy.basicInfo',
            'attestedBy.basicInfo',
        ])
            ->latest()
            ->get()
            ->map(fn($slip) => [
                'whereabout_slip_id'       => $slip->whereabout_slip_id,
                'employee_id'              => $slip->employee_id,
                'reviewed_and_noted_by_id' => $slip->reviewed_and_noted_by_id,
                'approved_by_id'           => $slip->approved_by_id,
                'attested_by_id'           => $slip->attested_by_id,
                'date_filed'               => $slip->date_filed->format('Y-m-d'),
                'purpose_type'             => $slip->purpose_type,
                'purpose_description'      => $slip->purpose_description,
                'time_out'                 => $slip->time_out,
                'time_returned'            => $slip->time_returned,
                'time_noted'               => $slip->time_noted,
                'status'                   => $slip->status,
                'return_status'            => $slip->return_status,
                'employee'              => self::mapEmployee($slip->employee),
                'reviewed_and_noted_by' => self::mapEmployee($slip->reviewedAndNotedBy),
                'approved_by'           => self::mapEmployee($slip->approvedBy),
                'attested_by'           => self::mapEmployee($slip->attestedBy),
            ]);

        $employees = Employee::with('basicInfo')
            ->get()
            ->sortBy(fn($e) => $e->basicInfo?->last_name)
            ->map(fn($e) => self::mapEmployee($e))
            ->values();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'attendance',
            'activity' => "Viewed whereabout slip management",
        ]);

        return Inertia::render('Attendance/WhereaboutSlip/Index', [
            'slips'     => $slips,
            'employees' => $employees,
        ]);
    }


    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id'              => ['required', 'integer', 'exists:employees,employee_id'],
            'reviewed_and_noted_by_id' => ['required', 'integer', 'exists:employees,employee_id'],
            'approved_by_id'           => ['required', 'integer', 'exists:employees,employee_id'],
            'attested_by_id'           => ['required', 'integer', 'exists:employees,employee_id'],
            'date_filed'               => ['required', 'date'],
            'purpose_type'             => ['required', 'string', 'in:official,personal'],
            'purpose_description'      => ['required', 'string', 'max:1000'],
            'time_out'                 => ['required', 'date_format:H:i:s'],
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        WhereaboutSlip::create($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'attendance',
            'activity' => "Created whereabout slip for {$employee->basicInfo->full_name}",
        ]);

        return back()->with('success', 'Whereabout slip created successfully.');
    }


    public function update(Request $request, WhereaboutSlip $whereaboutSlip): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id'              => ['required', 'integer', 'exists:employees,employee_id'],
            'reviewed_and_noted_by_id' => ['required', 'integer', 'exists:employees,employee_id'],
            'approved_by_id'           => ['required', 'integer', 'exists:employees,employee_id'],
            'attested_by_id'           => ['required', 'integer', 'exists:employees,employee_id'],
            'date_filed'               => ['required', 'date'],
            'purpose_type'             => ['required', 'boolean'],
            'purpose_description'      => ['required', 'string', 'max:1000'],
            'time_out'                 => ['required', 'date_format:H:i:s'],
        ]);

        $whereaboutSlip->update($validated);

        return back()->with('success', 'Whereabout slip updated successfully.');
    }

    public function logReturn(Request $request, WhereaboutSlip $whereaboutSlip): RedirectResponse
    {
        $timeOut = $whereaboutSlip->time_out;

        $validated = $request->validate([
            'time_returned' => [
                'required',
                'date_format:H:i:s',
                "after:{$timeOut}",
            ],
            'time_noted' => [
                'required',
                'date_format:H:i:s',
                "after:{$timeOut}",
                'after:time_returned',  // ← must be after the submitted time_returned field
            ],
        ], [
            'time_returned.after' => "Time returned must be after the time out ({$timeOut}).",
            'time_noted.after'    => "Time noted must be after time returned.",
        ]);

        $whereaboutSlip->update([
            'time_returned' => $validated['time_returned'],
            'time_noted'    => $validated['time_noted'],
            'return_status' => 'returned',
            'status'        => 'done',
        ]);

        return back()->with('success', 'Return time logged successfully.');
    }

    public function destroy(WhereaboutSlip $whereaboutSlip): RedirectResponse
    {
        $whereaboutSlip->delete();

        return back()->with('success', 'Whereabout slip deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:whereabout_slips,whereabout_slip_id'],
        ]);

        WhereaboutSlip::whereIn('whereabout_slip_id', $validated['ids'])->delete();

        $count = count($validated['ids']);

        return back()->with(
            'success',
            "Successfully deleted {$count} whereabout slip" . ($count !== 1 ? 's' : '') . '.'
        );
    }


    private static function mapEmployee(?Employee $employee): ?array
    {
        if (! $employee) return null;

        return [
            'employee_id'            => $employee->employee_id,
            'employee_basic_info_id' => $employee->employee_basic_info_id,
            'basic_info'             => $employee->basicInfo ? [
                'employee_basic_info_id' => $employee->basicInfo->employee_basic_info_id,
                'first_name'             => $employee->basicInfo->first_name,
                'last_name'              => $employee->basicInfo->last_name,
                'middle_name'            => $employee->basicInfo->middle_name,
                'name_extension'         => $employee->basicInfo->name_extension,
            ] : null,
        ];
    }
}
