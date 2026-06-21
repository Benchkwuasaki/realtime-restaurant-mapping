<?php

namespace Database\Seeders;

use App\Models\DocumentTracking;
use App\Models\DocumentTrackingAction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DocumentTrackingSeeder extends Seeder
{
    private const TITLE_PREFIX = '[Seeded DT]';

    public function run(): void
    {
        $actors = $this->resolveActorsByDepartment();

        if ($actors->count() < 3) {
            $this->command?->warn('Skipping DocumentTrackingSeeder: need at least 3 departments with linked users.');
            return;
        }

        $departmentIds = $actors->keys()->values();
        [$deptA, $deptB, $deptC] = $departmentIds->take(3)->all();

        DocumentTracking::where('title', 'like', self::TITLE_PREFIX . '%')->delete();

        $this->seedPendingReceipt($actors, $deptA, $deptB);
        $this->seedReceivedIncoming($actors, $deptB, $deptC);
        $this->seedForwardedPending($actors, $deptA, $deptB, $deptC);
        $this->seedReturnedPending($actors, $deptC, $deptA);
        $this->seedCompleted($actors, $deptB, $deptA);
        $this->seedCancelled($actors, $deptA, $deptC);
    }

    private function seedPendingReceipt(Collection $actors, int $originId, int $targetId): void
    {
        $createdAt = Carbon::now()->subDays(4)->setTime(9, 10);
        $originUser = $actors[$originId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Budget realignment request',
            'notes' => 'Request for budget realignment approval and supporting computation sheets.',
            'origin_office_id' => $originId,
            'current_office_id' => $targetId,
            'status' => 'in_progress',
            'office_status' => 'pending_receipt',
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $createdAt->copy()->addMinutes(12),
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Request encoded and prepared for routing.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $targetId,
            'action' => 'forwarded',
            'remarks' => 'Forwarded for review and acknowledgment.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(12),
        ]);
    }

    private function seedReceivedIncoming(Collection $actors, int $originId, int $targetId): void
    {
        $createdAt = Carbon::now()->subDays(3)->setTime(10, 0);
        $receivedAt = $createdAt->copy()->addHours(3);
        $originUser = $actors[$originId];
        $targetUser = $actors[$targetId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Office supply replenishment',
            'notes' => 'Consolidated office supply request with inventory attachments.',
            'origin_office_id' => $originId,
            'current_office_id' => $targetId,
            'status' => 'in_progress',
            'office_status' => 'received',
            'current_holder_received_at' => $receivedAt,
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $receivedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Request prepared for procurement processing.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $targetId,
            'action' => 'forwarded',
            'remarks' => 'Sent to receiving office.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(20),
        ]);

        $this->logAction($document, [
            'office_id' => $targetId,
            'action' => 'received',
            'remarks' => 'Received and logged by destination office.',
            'acted_by' => $targetUser->id,
            'acted_at' => $receivedAt,
        ]);
    }

    private function seedForwardedPending(Collection $actors, int $originId, int $middleId, int $targetId): void
    {
        $createdAt = Carbon::now()->subDays(2)->setTime(8, 30);
        $receivedAt = $createdAt->copy()->addHours(2);
        $forwardedAgainAt = $receivedAt->copy()->addHours(5);
        $originUser = $actors[$originId];
        $middleUser = $actors[$middleId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Inter-office legal review memo',
            'notes' => 'Memo endorsed for legal review after initial records check.',
            'origin_office_id' => $originId,
            'current_office_id' => $targetId,
            'status' => 'in_progress',
            'office_status' => 'pending_receipt',
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $forwardedAgainAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Initial request encoded.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $middleId,
            'action' => 'forwarded',
            'remarks' => 'Forwarded for preliminary review.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(15),
        ]);

        $this->logAction($document, [
            'office_id' => $middleId,
            'action' => 'received',
            'remarks' => 'Received and docketed.',
            'acted_by' => $middleUser->id,
            'acted_at' => $receivedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $middleId,
            'from_office_id' => $middleId,
            'to_office_id' => $targetId,
            'action' => 'forwarded',
            'remarks' => 'Endorsed to final reviewing office.',
            'acted_by' => $middleUser->id,
            'acted_at' => $forwardedAgainAt,
        ]);
    }

    private function seedReturnedPending(Collection $actors, int $originId, int $returnToId): void
    {
        $createdAt = Carbon::now()->subDays(5)->setTime(11, 0);
        $receivedAt = $createdAt->copy()->addHours(4);
        $returnedAt = $receivedAt->copy()->addDay()->setTime(9, 30);
        $originUser = $actors[$originId];
        $returnUser = $actors[$returnToId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Returned travel authority packet',
            'notes' => 'Travel authority packet returned for missing supporting signatures.',
            'origin_office_id' => $originId,
            'current_office_id' => $returnToId,
            'status' => 'in_progress',
            'office_status' => 'pending_receipt',
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $returnedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Travel packet created for approval chain.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $returnToId,
            'action' => 'forwarded',
            'remarks' => 'Forwarded for validation.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(10),
        ]);

        $this->logAction($document, [
            'office_id' => $returnToId,
            'action' => 'received',
            'remarks' => 'Received for review.',
            'acted_by' => $returnUser->id,
            'acted_at' => $receivedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $returnToId,
            'from_office_id' => $returnToId,
            'to_office_id' => $originId,
            'action' => 'returned',
            'remarks' => 'Returned to origin for missing attachments.',
            'acted_by' => $returnUser->id,
            'acted_at' => $returnedAt,
        ]);
    }

    private function seedCompleted(Collection $actors, int $originId, int $targetId): void
    {
        $createdAt = Carbon::now()->subDays(7)->setTime(8, 45);
        $receivedAt = $createdAt->copy()->addHours(5);
        $completedAt = $receivedAt->copy()->addDay()->setTime(14, 0);
        $originUser = $actors[$originId];
        $targetUser = $actors[$targetId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Completed payroll certification',
            'notes' => 'Payroll certification request fully processed and closed.',
            'origin_office_id' => $originId,
            'current_office_id' => $targetId,
            'status' => 'completed',
            'office_status' => 'done',
            'current_holder_received_at' => $receivedAt,
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $completedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Certification request logged.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $targetId,
            'action' => 'forwarded',
            'remarks' => 'Forwarded for payroll certification.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(25),
        ]);

        $this->logAction($document, [
            'office_id' => $targetId,
            'action' => 'received',
            'remarks' => 'Received and queued for processing.',
            'acted_by' => $targetUser->id,
            'acted_at' => $receivedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $targetId,
            'action' => 'completed',
            'remarks' => 'Certification released to requesting office.',
            'acted_by' => $targetUser->id,
            'acted_at' => $completedAt,
        ]);
    }

    private function seedCancelled(Collection $actors, int $originId, int $targetId): void
    {
        $createdAt = Carbon::now()->subDays(1)->setTime(13, 15);
        $receivedAt = $createdAt->copy()->addHours(2);
        $cancelledAt = $receivedAt->copy()->addHours(3);
        $originUser = $actors[$originId];
        $targetUser = $actors[$targetId];

        $document = $this->createDocument([
            'title' => self::TITLE_PREFIX . ' Cancelled procurement clarification',
            'notes' => 'Request cancelled after origin office withdrew the clarification memo.',
            'origin_office_id' => $originId,
            'current_office_id' => $targetId,
            'status' => 'cancelled',
            'office_status' => 'cancelled',
            'current_holder_received_at' => $receivedAt,
            'created_by' => $originUser->id,
            'created_at' => $createdAt,
            'updated_at' => $cancelledAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'created',
            'remarks' => 'Clarification memo drafted.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'from_office_id' => $originId,
            'to_office_id' => $targetId,
            'action' => 'forwarded',
            'remarks' => 'Sent for clarification.',
            'acted_by' => $originUser->id,
            'acted_at' => $createdAt->copy()->addMinutes(18),
        ]);

        $this->logAction($document, [
            'office_id' => $targetId,
            'action' => 'received',
            'remarks' => 'Receiving office acknowledged the request.',
            'acted_by' => $targetUser->id,
            'acted_at' => $receivedAt,
        ]);

        $this->logAction($document, [
            'office_id' => $originId,
            'action' => 'cancelled',
            'remarks' => 'Origin office withdrew the request.',
            'acted_by' => $originUser->id,
            'acted_at' => $cancelledAt,
        ]);
    }

    private function createDocument(array $attributes): DocumentTracking
    {
        $document = new DocumentTracking();
        $document->timestamps = false;
        $document->forceFill($attributes);
        $document->save();

        return $document;
    }

    private function logAction(DocumentTracking $document, array $attributes): void
    {
        $action = new DocumentTrackingAction();
        $action->timestamps = false;
        $action->forceFill(array_merge([
            'document_tracking_id' => $document->document_tracking_id,
            'created_at' => $attributes['acted_at'] ?? now(),
            'updated_at' => $attributes['acted_at'] ?? now(),
        ], $attributes));
        $action->save();
    }

    private function resolveActorsByDepartment(): Collection
    {
        return User::query()
            ->with('employee.item.position')
            ->get()
            ->filter(fn (User $user) => $user->employee?->item?->position?->department_id)
            ->groupBy(fn (User $user) => (int) $user->employee->item->position->department_id)
            ->map(fn (Collection $users) => $users->first())
            ->sortKeys()
            ->filter(fn (?User $user) => $user instanceof User);
    }
}
