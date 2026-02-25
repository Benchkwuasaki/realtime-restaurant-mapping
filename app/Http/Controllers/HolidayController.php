<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        $year = request('year', now()->year);

        $holidays = Holiday::query()
            ->whereYear('date', $year)
            ->orWhere('is_recurring', true)
            ->orderBy('date')
            ->get()
            ->map(fn(Holiday $h) => [
                'holiday_id'   => $h->holiday_id,
                'name'         => $h->name,
                'date'         => $h->date->format('Y-m-d'),
                'display_date' => $h->date->format('F j'),
                'type'         => $h->type,
                'description'  => $h->description,
                'is_recurring' => $h->is_recurring,
            ]);

        return Inertia::render('Holiday/Index', [
            'holidays'     => $holidays,
            'currentYear'  => (int) $year,
            'holidayTypes' => Holiday::distinct()->pluck('type'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Holiday/CreateEdit', [
            'holiday'      => null,
            'holidayTypes' => [
                'Regular Holiday',
                'Special Non-Working',
                'Special Working',
                'Local Holiday',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'date'         => ['required', 'date'],
            'type'         => ['required', 'in:Regular Holiday,Special Non-Working,Special Working,Local Holiday'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'is_recurring' => ['boolean'],
        ]);

        Holiday::create($request->only('name', 'date', 'type', 'description', 'is_recurring'));

        return redirect()->route('holiday.index')->with('success', 'Holiday created successfully.');
    }

    public function edit(Holiday $holiday): Response
    {
        return Inertia::render('Holiday/CreateEdit', [
            'holiday' => [
                'holiday_id'   => $holiday->holiday_id,
                'name'         => $holiday->name,
                'date'         => $holiday->date->format('Y-m-d'),
                'type'         => $holiday->type,
                'description'  => $holiday->description,
                'is_recurring' => $holiday->is_recurring,
            ],
            'holidayTypes' => [
                'Regular Holiday',
                'Special Non-Working',
                'Special Working',
                'Local Holiday',
            ],
        ]);
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'date'         => ['required', 'date'],
            'type'         => ['required', 'in:Regular Holiday,Special Non-Working,Special Working,Local Holiday'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'is_recurring' => ['boolean'],
        ]);

        $holiday->update($request->only('name', 'date', 'type', 'description', 'is_recurring'));

        return redirect()->route('holiday.index')->with('success', 'Holiday updated successfully.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();

        return redirect()->route('holiday.index')->with('success', 'Holiday deleted successfully.');
    }
}