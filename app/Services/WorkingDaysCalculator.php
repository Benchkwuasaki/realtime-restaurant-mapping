<?php

namespace App\Services;

use App\Models\Holiday;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class WorkingDaysCalculator
{
    private Collection $holidays;

    public function __construct(int $year)
    {
        $this->holidays = Holiday::query()
            ->whereYear('date', $year)
            ->orWhere('is_recurring', true)
            ->get()
            ->map(fn(Holiday $h) => $h->date->format('m-d'))
            ->merge(
                Holiday::query()
                    ->whereYear('date', $year)
                    ->where('is_recurring', false)
                    ->get()
                    ->map(fn(Holiday $h) => $h->date->format('Y-m-d'))
            );
    }

    public function calculate(CarbonInterface $start, CarbonInterface $end): int
    {
        $days    = 0;
        $current = $start->toMutable(); // convert to mutable so addDay() works
        $end     = $end->toMutable();

        while ($current->lte($end)) {
            if ($this->isWorkingDay($current)) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }

    private function isWorkingDay(CarbonInterface $date): bool
    {
        if ($date->isWeekend()) return false;
        if ($this->holidays->contains($date->format('m-d'))) return false;
        if ($this->holidays->contains($date->format('Y-m-d'))) return false;

        return true;
    }
}