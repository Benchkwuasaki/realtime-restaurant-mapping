<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $isAdmin = $user->hasAnyRole(['super_admin', 'hr_admin', 'ogm']);
        $userDepartmentId = $user->employee?->item->position->department->department_id ?? null;

        $announcements = Announcement::with(['author.employee', 'departments'])
            ->when(! $isAdmin, function ($query) use ($userDepartmentId) {
                $query->where(function ($q) use ($userDepartmentId) {
                    $q->doesntHave('departments');
                    if ($userDepartmentId) {
                        $q->orWhereHas('departments', function ($q2) use ($userDepartmentId) {
                            $q2->where('departments.department_id', $userDepartmentId);
                        });
                    }
                });
            })
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'is_pinned' => $a->is_pinned,
                'is_global' => $a->departments->isEmpty(),
                'created_at' => $a->created_at->toISOString(),
                'updated_at' => $a->updated_at->toISOString(),
                'author' => $a->author ? [
                    'id' => $a->author->id,
                    'name' => $a->author->getFullName(),
                    'first_name' => $a->author->employee?->basicInfo?->first_name ?? $a->author->first_name,
                    'last_name' => $a->author->employee?->basicInfo?->last_name ?? $a->author->last_name,
                    'avatar' => null,
                ] : null,
                'departments' => $a->departments->map(fn ($d) => [
                    'department_id' => $d->department_id,
                    'department_name' => $d->department_name,
                    'department_acronym' => $d->department_acronym ?? null,
                ])->values(),
            ]);

        $departments = Department::orderBy('department_name')
            ->get()
            ->map(fn ($d) => [
                'department_id' => $d->department_id,
                'department_name' => $d->department_name,
                'department_acronym' => $d->department_acronym,
            ]);

        return Inertia::render('Announcement/Index', [
            'announcements' => $announcements,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'is_pinned' => ['boolean'],
            'department_ids' => ['array'],
            'department_ids.*' => ['integer', 'exists:departments,department_id'],
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => $validated['is_pinned'] ?? false,
            'posted_by' => Auth::id(),
        ]);

        if (! empty($validated['department_ids'])) {
            $announcement->departments()->sync($validated['department_ids']);
        }

        return back()->with('success', 'Announcement posted successfully.');
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'is_pinned' => ['boolean'],
            'department_ids' => ['array'],
            'department_ids.*' => ['integer', 'exists:departments,department_id'],
        ]);

        $announcement->update([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        $announcement->departments()->sync($validated['department_ids'] ?? []);

        return back()->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->delete();

        return back()->with('success', 'Announcement deleted successfully.');
    }
}
