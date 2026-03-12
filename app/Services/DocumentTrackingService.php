<?php

namespace App\Services;

use App\Models\DocumentTracking;
use App\Models\DocumentTrackingAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DocumentTrackingService
{
    // ── Transitions ───────────────────────────────────────────────────────────

    /**
     * Create a new request and immediately forward it to the target department.
     * Writes two action rows: created + forwarded.
     *
     * @param array{title: string, notes: ?string, to_office_id: int, remarks: ?string} $data
     */
    public function createRequest(User $user, array $data): DocumentTracking
    {
        $originOfficeId = $this->resolveUserDepartmentId($user);

        return DB::transaction(function () use ($user, $data, $originOfficeId) {
            $document = DocumentTracking::create([
                'title'             => $data['title'],
                'notes'             => $data['notes'] ?? null,
                'origin_office_id'  => $originOfficeId,
                'current_office_id' => $data['to_office_id'],
                'status'            => 'in_progress',
                'office_status'     => 'pending_receipt',
                'created_by'        => $user->id,
            ]);

            $this->log($document, [
                'office_id' => $originOfficeId,
                'action'    => 'created',
                'acted_by'  => $user->id,
            ]);

            $this->log($document, [
                'office_id'      => $originOfficeId,
                'from_office_id' => $originOfficeId,
                'to_office_id'   => $data['to_office_id'],
                'action'         => 'forwarded',
                'remarks'        => $data['remarks'] ?? null,
                'acted_by'       => $user->id,
            ]);

            return $document;
        });
    }

    /**
     * Current holder acknowledges receipt.
     * Sets office_status → received and stamps current_holder_received_at.
     */
    public function receive(User $user, DocumentTracking $document): void
    {
        $officeId = $this->resolveUserDepartmentId($user);
        $this->assertIsCurrentHolder($document, $officeId);

        DB::transaction(function () use ($user, $document, $officeId) {
            $document->update([
                'office_status'              => 'received',
                'current_holder_received_at' => now(),
            ]);

            $this->log($document, [
                'office_id' => $officeId,
                'action'    => 'received',
                'acted_by'  => $user->id,
            ]);
        });
    }

    /**
     * Forward the document to another department.
     * Resets office_status → pending_receipt on the new holder.
     *
     * @param array{to_office_id: int, remarks: ?string} $data
     */
    public function forward(User $user, DocumentTracking $document, array $data): void
    {
        $officeId = $this->resolveUserDepartmentId($user);
        $this->assertIsCurrentHolder($document, $officeId);

        DB::transaction(function () use ($user, $document, $officeId, $data) {
            $document->update([
                'current_office_id'          => $data['to_office_id'],
                'office_status'              => 'pending_receipt',
                'current_holder_received_at' => null,
            ]);

            $this->log($document, [
                'office_id'      => $officeId,
                'from_office_id' => $officeId,
                'to_office_id'   => $data['to_office_id'],
                'action'         => 'forwarded',
                'remarks'        => $data['remarks'] ?? null,
                'acted_by'       => $user->id,
            ]);
        });
    }

    /**
     * Return the document to a department that has previously touched it.
     * The frontend passes an explicit to_office_id chosen by the user.
     *
     * @param array{to_office_id: int, remarks: ?string} $data
     */
    public function return(User $user, DocumentTracking $document, array $data): void
    {
        $officeId = $this->resolveUserDepartmentId($user);
        $this->assertIsCurrentHolder($document, $officeId);

        $returnToId = (int) $data['to_office_id'];

        DB::transaction(function () use ($user, $document, $officeId, $returnToId, $data) {
            $document->update([
                'current_office_id'          => $returnToId,
                'office_status'              => 'pending_receipt',
                'current_holder_received_at' => null,
            ]);

            $this->log($document, [
                'office_id'      => $officeId,
                'from_office_id' => $officeId,
                'to_office_id'   => $returnToId,
                'action'         => 'returned',
                'remarks'        => $data['remarks'] ?? null,
                'acted_by'       => $user->id,
            ]);
        });
    }

    /**
     * Mark the request as completed. Closes the request.
     *
     * @param array{remarks: ?string} $data
     */
    public function complete(User $user, DocumentTracking $document, array $data): void
    {
        $officeId = $this->resolveUserDepartmentId($user);
        $this->assertIsCurrentHolder($document, $officeId);

        DB::transaction(function () use ($user, $document, $officeId, $data) {
            $document->update([
                'status'        => 'completed',
                'office_status' => 'done',
            ]);

            $this->log($document, [
                'office_id' => $officeId,
                'action'    => 'completed',
                'remarks'   => $data['remarks'] ?? null,
                'acted_by'  => $user->id,
            ]);
        });
    }

    /**
     * Cancel the request. Only the originating department may cancel.
     *
     * @param array{remarks: ?string} $data
     */
    public function cancel(User $user, DocumentTracking $document, array $data): void
    {
        $officeId = $this->resolveUserDepartmentId($user);

        abort_if(
            (int) $document->origin_office_id !== $officeId,
            403,
            'Only the originating department may cancel this request.'
        );

        abort_if($document->isArchived(), 422, 'This request is already closed.');

        DB::transaction(function () use ($user, $document, $officeId, $data) {
            $document->update([
                'status'        => 'cancelled',
                'office_status' => 'cancelled',
            ]);

            $this->log($document, [
                'office_id' => $officeId,
                'action'    => 'cancelled',
                'remarks'   => $data['remarks'] ?? null,
                'acted_by'  => $user->id,
            ]);
        });
    }

    // ── Timeline & Path ───────────────────────────────────────────────────────

    /**
     * Ordered list of human-readable timeline entries for the details page.
     *
     * @return array<int, array{label: string, acted_at: string|null, actor: string|null, remarks: string|null}>
     */
    public function buildTimeline(DocumentTracking $document): array
    {
        return $document->actions
            ->map(fn(DocumentTrackingAction $a) => [
                'label'    => $a->getTimelineLabel(),
                'acted_at' => $a->acted_at?->toDateTimeString(),
                'actor'    => $a->actor?->name,
                'remarks'  => $a->remarks,
            ])
            ->values()
            ->all();
    }

    /**
     * Movement path as an ordered array of department acronyms.
     * e.g. ["HR", "Budget", "Legal", "HR", "Manager"]
     *
     * @return string[]
     */
    public function buildMovementPath(DocumentTracking $document): array
    {
        $path = [];

        foreach ($document->actions as $action) {
            if ($action->action === 'created') {
                $acronym = $action->office?->department_acronym;
                if ($acronym && (empty($path) || end($path) !== $acronym)) {
                    $path[] = $acronym;
                }
                continue;
            }

            if (in_array($action->action, ['forwarded', 'returned'])) {
                $to = $action->toOffice?->department_acronym;
                if ($to) {
                    $path[] = $to;
                }
            }
        }

        return $path;
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private function log(DocumentTracking $document, array $attributes): DocumentTrackingAction
    {
        return DocumentTrackingAction::create(array_merge([
            'document_tracking_id' => $document->document_tracking_id,
            'acted_at'             => now(),
        ], $attributes));
    }

    private function resolveUserDepartmentId(User $user): int
    {
        $id = $user->employee?->item?->position?->department_id;
        abort_if(! $id, 403, 'Your account is not linked to any department.');
        return (int) $id;
    }

    private function assertIsCurrentHolder(DocumentTracking $document, int $officeId): void
    {
        abort_if(
            (int) $document->current_office_id !== $officeId,
            403,
            'Your department is not currently handling this request.'
        );

        abort_if($document->isArchived(), 422, 'This request is already closed.');
    }
}
