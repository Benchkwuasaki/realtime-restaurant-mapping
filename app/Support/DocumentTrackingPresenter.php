<?php

namespace App\Support;

use App\Models\Department;
use App\Models\DocumentTracking;
use App\Models\DocumentTrackingAction;
use Illuminate\Support\Collection;

class DocumentTrackingPresenter
{
    public static function details(DocumentTracking $document): array
    {
        $actions = $document->actions
            ->sortBy('acted_at')
            ->values();

        return [
            'title' => $document->title,
            'notes' => $document->notes,
            'status' => $document->status,
            'office_status' => $document->office_status,
            'elapsed_time' => $document->getElapsedTime(),
            'origin_office' => self::office($document->originOffice),
            'current_office' => self::office($document->currentOffice),
            'final_office' => self::resolveFinalOffice($document, $actions),
            'flow' => self::buildFlow($document, $actions)->values()->all(),
            'actions' => $actions
                ->map(fn (DocumentTrackingAction $action) => self::action($action))
                ->values()
                ->all(),
        ];
    }

    private static function action(DocumentTrackingAction $action): array
    {
        return [
            'id' => $action->document_tracking_action_id,
            'action' => $action->action,
            'label' => $action->getTimelineLabel(),
            'remarks' => $action->remarks,
            'acted_at' => $action->acted_at?->toIso8601String(),
            'actor_name' => $action->actor?->getFullName(),
            'office' => self::office($action->office),
            'from_office' => self::office($action->fromOffice),
            'to_office' => self::office($action->toOffice),
        ];
    }

    private static function resolveFinalOffice(DocumentTracking $document, Collection $actions): ?array
    {
        $closingAction = $actions
            ->filter(fn (DocumentTrackingAction $action) => in_array($action->action, ['completed', 'cancelled'], true))
            ->last();

        return self::office($closingAction?->office ?? $document->currentOffice);
    }

    private static function buildFlow(DocumentTracking $document, Collection $actions): Collection
    {
        $flow = collect();

        self::pushOffice($flow, $document->originOffice);

        foreach ($actions as $action) {
            if ($action->toOffice) {
                self::pushOffice($flow, $action->toOffice, $action->action);
                continue;
            }

            if (in_array($action->action, ['completed', 'cancelled'], true)) {
                self::pushOffice($flow, $action->office, $action->action, true);
                continue;
            }

            if ($flow->isEmpty()) {
                self::pushOffice($flow, $action->office);
            }
        }

        self::pushOffice($flow, $document->currentOffice);

        return $flow;
    }

    private static function pushOffice(
        Collection $flow,
        ?Department $office,
        ?string $action = null,
        bool $allowDuplicate = false,
    ): void
    {
        if (! $office) {
            return;
        }

        $payload = [
            'office' => self::office($office),
            'action' => $action,
        ];
        $last = $flow->last();

        if (! $allowDuplicate && ($last['office']['id'] ?? null) === $payload['office']['id']) {
            return;
        }

        $flow->push($payload);
    }

    private static function office(?Department $office): ?array
    {
        if (! $office) {
            return null;
        }

        return [
            'id' => $office->department_id,
            'name' => $office->department_name,
            'acronym' => $office->department_acronym,
        ];
    }
}
