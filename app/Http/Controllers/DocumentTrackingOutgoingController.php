<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DocumentTracking;
use App\Services\DocumentTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DocumentTrackingOutgoingController extends Controller
{
    public function __construct(
        private readonly DocumentTrackingService $service
    ) {}

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user         = $request->user();
        $departmentId = $this->resolveDepartmentId($user);

        // Shape a document row for the frontend
        $shape = fn(DocumentTracking $doc) => [
            'id'               => $doc->document_tracking_id,
            'title'            => $doc->title,
            'origin_office'    => $doc->originOffice
                ? [
                    'id'      => $doc->originOffice->department_id,
                    'name'    => $doc->originOffice->department_name,
                    'acronym' => $doc->originOffice->department_acronym,
                ]
                : null,
            'current_office'   => $doc->currentOffice
                ? [
                    'id'      => $doc->currentOffice->department_id,
                    'name'    => $doc->currentOffice->department_name,
                    'acronym' => $doc->currentOffice->department_acronym,
                ]
                : null,
            'status'           => $doc->status,
            'office_status'    => $doc->office_status,
            'elapsed_time'     => $doc->getElapsedTime(),
            'origin_office_id' => $doc->origin_office_id,
        ];

        // "Our Office" tab — requests this department originally created
        $ourOffice = DocumentTracking::query()
            ->with(['originOffice', 'currentOffice'])
            ->where('origin_office_id', $departmentId)
            ->latest()
            ->get()
            ->map($shape);

        // "Other Offices" tab — requests this dept forwarded but did not originate
        $forwardedIds = DB::table('document_tracking_actions')
            ->where('office_id', $departmentId)
            ->whereIn('action', ['forwarded', 'returned'])
            ->pluck('document_tracking_id');

        $otherOffices = DocumentTracking::query()
            ->with(['originOffice', 'currentOffice'])
            ->whereIn('document_tracking_id', $forwardedIds)
            ->where('origin_office_id', '!=', $departmentId)
            ->latest()
            ->get()
            ->map($shape);

        return Inertia::render('DocumentTracking/Outgoing/Index', [
            'ourOffice'    => $ourOffice,
            'otherOffices' => $otherOffices,
            'departmentId' => $departmentId,
            // Exclude own department — cannot forward a new request to yourself
            'departments'  => Department::where('department_id', '!=', $departmentId)
                ->orderBy('department_name')
                ->get(['department_id', 'department_name', 'department_acronym']),
        ]);
    }

    // ── Create new request ────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'notes'        => ['nullable', 'string', 'max:5000'],
            'to_office_id' => ['required', 'integer', 'exists:departments,department_id'],
            'remarks'      => ['nullable', 'string', 'max:1000'],
        ]);

        $this->service->createRequest($request->user(), $validated);

        return back()->with('success', 'Request created and forwarded.');
    }

    // ── Cancel (origin office only) ───────────────────────────────────────────

    public function cancel(Request $request, DocumentTracking $documentTracking): RedirectResponse
    {
        $request->validate(['remarks' => ['nullable', 'string', 'max:1000']]);

        $this->service->cancel($request->user(), $documentTracking, $request->only('remarks'));

        return back()->with('success', 'Request cancelled.');
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private function resolveDepartmentId($user): int
    {
        $id = $user->employee?->item?->position?->department_id;
        abort_if(! $id, 403, 'Your account is not linked to any department.');
        return (int) $id;
    }
}
