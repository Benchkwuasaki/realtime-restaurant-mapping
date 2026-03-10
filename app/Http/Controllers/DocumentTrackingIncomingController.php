<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DocumentTracking;
use App\Services\DocumentTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentTrackingIncomingController extends Controller
{
    public function __construct(
        private readonly DocumentTrackingService $service
    ) {}

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user         = $request->user();
        $departmentId = $this->resolveDepartmentId($user);

        $documents = DocumentTracking::query()
            ->with(['latestForwardAction.fromOffice'])
            ->where('current_office_id', $departmentId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->latest()
            ->get()
            ->map(fn(DocumentTracking $doc) => [
                'id'               => $doc->document_tracking_id,
                'title'            => $doc->title,
                'from_office'      => $doc->latestForwardAction?->fromOffice
                    ? [
                        'id'      => $doc->latestForwardAction->fromOffice->department_id,
                        'name'    => $doc->latestForwardAction->fromOffice->department_name,
                        'acronym' => $doc->latestForwardAction->fromOffice->department_acronym,
                    ]
                    : null,
                'office_status'    => $doc->office_status,
                'status'           => $doc->status,
                'days_stayed'      => $doc->getDaysStayed(),
                'origin_office_id' => $doc->origin_office_id,
                'current_office_id' => $doc->current_office_id,
            ]);

        return Inertia::render('DocumentTracking/Incoming/Index', [
            'documents'    => $documents,
            'departmentId' => $departmentId,
            'departments'  => Department::orderBy('department_name')
                ->get(['department_id', 'department_name', 'department_acronym']),
        ]);
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    public function receive(Request $request, DocumentTracking $documentTracking): RedirectResponse
    {
        $request->validate(['remarks' => ['nullable', 'string', 'max:1000']]);

        $this->service->receive($request->user(), $documentTracking);

        return back()->with('success', 'Document received.');
    }

    public function forward(Request $request, DocumentTracking $documentTracking): RedirectResponse
    {
        $request->validate([
            'to_office_id' => ['required', 'integer', 'exists:departments,department_id'],
            'remarks'      => ['nullable', 'string', 'max:1000'],
        ]);

        $this->service->forward($request->user(), $documentTracking, $request->only('to_office_id', 'remarks'));

        return back()->with('success', 'Document forwarded.');
    }

    public function return(Request $request, DocumentTracking $documentTracking): RedirectResponse
    {
        $request->validate(['remarks' => ['nullable', 'string', 'max:1000']]);

        $this->service->return($request->user(), $documentTracking, $request->only('remarks'));

        return back()->with('success', 'Document returned.');
    }

    public function complete(Request $request, DocumentTracking $documentTracking): RedirectResponse
    {
        $request->validate(['remarks' => ['nullable', 'string', 'max:1000']]);

        $this->service->complete($request->user(), $documentTracking, $request->only('remarks'));

        return back()->with('success', 'Request completed.');
    }

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
