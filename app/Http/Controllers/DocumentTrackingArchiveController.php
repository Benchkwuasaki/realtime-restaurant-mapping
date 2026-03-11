<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DocumentTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DocumentTrackingArchiveController extends Controller
{
    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user         = $request->user();
        $departmentId = $this->resolveDepartmentId($user);

        // Find all document IDs this department has ever been involved with
        $involvedIds = DB::table('document_tracking_actions')
            ->where('office_id', $departmentId)
            ->pluck('document_tracking_id');

        $documents = DocumentTracking::query()
            ->with(['originOffice', 'currentOffice'])
            ->whereIn('status', ['completed', 'cancelled'])
            ->where(function ($q) use ($departmentId, $involvedIds) {
                // Either this dept originated it, or was involved via an action
                $q->where('origin_office_id', $departmentId)
                    ->orWhereIn('document_tracking_id', $involvedIds);
            })
            ->latest()
            ->get()
            ->map(fn(DocumentTracking $doc) => [
                'id'             => $doc->document_tracking_id,
                'title'          => $doc->title,
                'origin_office'  => $doc->originOffice
                    ? [
                        'id'      => $doc->originOffice->department_id,
                        'name'    => $doc->originOffice->department_name,
                        'acronym' => $doc->originOffice->department_acronym,
                    ]
                    : null,
                'current_office' => $doc->currentOffice
                    ? [
                        'id'      => $doc->currentOffice->department_id,
                        'name'    => $doc->currentOffice->department_name,
                        'acronym' => $doc->currentOffice->department_acronym,
                    ]
                    : null,
                'status'         => $doc->status,
            ]);

        return Inertia::render('DocumentTracking/Archive/Index', [
            'documents'    => $documents,
            'departmentId' => $departmentId,
        ]);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private function resolveDepartmentId($user): int
    {
        $id = $user->employee?->item?->position?->department_id;
        abort_if(! $id, 403, 'Your account is not linked to any department.');
        return (int) $id;
    }
}
