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

        // All departments except self — used for the Forward dialog
        $allDepartments = Department::where('department_id', '!=', $departmentId)
            ->orderBy('department_name')
            ->get(['department_id', 'department_name', 'department_acronym']);

        $documents = DocumentTracking::query()
            ->with([
                'latestForwardAction.fromOffice',
                // Load all actions with their office relationships so we can
                // derive which offices have touched each document
                'actions.office',
                'actions.fromOffice',
                'actions.toOffice',
            ])
            ->where('current_office_id', $departmentId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->latest()
            ->get()
            ->map(function (DocumentTracking $doc) use ($departmentId, $allDepartments) {

                // Offices that have previously touched this document (excluding current dept)
                // Collected from office_id, from_office_id, to_office_id across all actions
                $touchedIds = $doc->actions
                    ->flatMap(fn($a) => array_filter([
                        $a->office_id,
                        $a->from_office_id,
                        $a->to_office_id,
                    ]))
                    ->unique()
                    ->filter(fn($id) => (int) $id !== $departmentId)
                    ->values();

                $returnOffices = Department::whereIn('department_id', $touchedIds)
                    ->orderBy('department_name')
                    ->get(['department_id', 'department_name', 'department_acronym'])
                    ->map(fn($d) => [
                        'department_id'      => $d->department_id,
                        'department_name'    => $d->department_name,
                        'department_acronym' => $d->department_acronym,
                    ]);

                return [
                    'id'               => $doc->document_tracking_id,
                    'title'            => $doc->title,
                    'from_office'      => $doc->latestForwardAction?->fromOffice
                        ? [
                            'id'      => $doc->latestForwardAction->fromOffice->department_id,
                            'name'    => $doc->latestForwardAction->fromOffice->department_name,
                            'acronym' => $doc->latestForwardAction->fromOffice->department_acronym,
                        ]
                        : null,
                    'office_status'     => $doc->office_status,
                    'status'            => $doc->status,
                    'days_stayed'       => $doc->getDaysStayed(),
                    'origin_office_id'  => $doc->origin_office_id,
                    'current_office_id' => $doc->current_office_id,
                    // Per-document office lists for the dialogs
                    'forward_offices'   => $allDepartments->map(fn($d) => [
                        'department_id'      => $d->department_id,
                        'department_name'    => $d->department_name,
                        'department_acronym' => $d->department_acronym,
                    ])->values(),
                    'return_offices'    => $returnOffices->values(),
                ];
            });

        return Inertia::render('DocumentTracking/Incoming/Index', [
            'documents'    => $documents,
            'departmentId' => $departmentId,
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
        $request->validate([
            'to_office_id' => ['required', 'integer', 'exists:departments,department_id'],
            'remarks'      => ['nullable', 'string', 'max:1000'],
        ]);

        $this->service->return($request->user(), $documentTracking, $request->only('to_office_id', 'remarks'));

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
