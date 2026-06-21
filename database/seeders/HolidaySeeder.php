<?php

namespace Database\Seeders;

use App\Models\Holiday;
use Illuminate\Database\Seeder;

class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        $year = now()->year;

        $holidays = [

            // ══════════════════════════════════════════════════════════════════
            // REGULAR HOLIDAYS
            // Pay rules:
            //   • Not worked → 100% of daily wage (paid day off)
            //   • Worked     → 200% of daily wage for the first 8 hours
            //   • Worked OT  → +30% of hourly rate on top of 200%
            //   • Worked on rest day → 260% of daily wage
            // ══════════════════════════════════════════════════════════════════

            [
                'name'         => "New Year's Day",
                'date'         => "$year-01-01",
                'type'         => 'Regular Holiday',
                'description'  => 'Celebration of the first day of the Gregorian calendar year. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Maundy Thursday',
                'date'         => "$year-04-02",  // 2026 date — update yearly
                'type'         => 'Regular Holiday',
                'description'  => 'Thursday before Easter Sunday, commemorating the Last Supper of Jesus Christ. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Good Friday',
                'date'         => "$year-04-03",  // 2026 date — update yearly
                'type'         => 'Regular Holiday',
                'description'  => 'Friday before Easter Sunday, commemorating the crucifixion of Jesus Christ. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Araw ng Kagitingan (Day of Valor)',
                'date'         => "$year-04-09",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the Fall of Bataan and the heroism of Filipino and American soldiers. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Labor Day',
                'date'         => "$year-05-01",
                'type'         => 'Regular Holiday',
                'description'  => 'International Workers\' Day celebrating the achievements of the labor movement. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Independence Day',
                'date'         => "$year-06-12",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the declaration of Philippine independence from Spain in 1898. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => "Eid'l Fitr (Feast of Ramadan)",
                'date'         => "$year-03-31",  // TBD — separate proclamation based on lunar calendar
                'type'         => 'Regular Holiday',
                'description'  => 'Marks the end of Ramadan. Date confirmed via separate proclamation based on the Islamic lunar calendar. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => "Eid'l Adha (Feast of Sacrifice)",
                'date'         => "$year-06-07",  // TBD — separate proclamation based on lunar calendar
                'type'         => 'Regular Holiday',
                'description'  => 'Islamic festival commemorating the willingness of Ibrahim to sacrifice his son. Date confirmed via separate proclamation. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'National Heroes Day',
                'date'         => "$year-08-31",  // Last Monday of August 2026
                'type'         => 'Regular Holiday',
                'description'  => 'Honors all Filipino national heroes. Falls on the last Monday of August each year. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Bonifacio Day',
                'date'         => "$year-11-30",
                'type'         => 'Regular Holiday',
                'description'  => 'Birthday of Andres Bonifacio, founder of the Katipunan revolutionary movement. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Christmas Day',
                'date'         => "$year-12-25",
                'type'         => 'Regular Holiday',
                'description'  => 'Celebration of the birth of Jesus Christ. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Rizal Day',
                'date'         => "$year-12-30",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the execution of Dr. José Rizal, the Philippine national hero, in 1896. Not worked: 100% pay. Worked: 200% pay.',
                'is_recurring' => true,
            ],

            // ══════════════════════════════════════════════════════════════════
            // SPECIAL NON-WORKING HOLIDAYS
            // Pay rules:
            //   • Not worked → No pay (no work, no pay principle)
            //   • Worked     → 130% of daily wage for the first 8 hours
            //   • Worked OT  → +30% of hourly rate on top of 130%
            //   • Worked on rest day → 150% of daily wage
            // ══════════════════════════════════════════════════════════════════

            [
                'name'         => 'Chinese New Year',
                'date'         => "$year-02-17",  // 2026 date — lunar calendar, update yearly
                'type'         => 'Special Non-Working',
                'description'  => 'Celebration of the Lunar New Year, widely observed in the Philippines. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Black Saturday',
                'date'         => "$year-04-04",  // 2026 date — update yearly
                'type'         => 'Special Non-Working',
                'description'  => 'The day between Good Friday and Easter Sunday, observed during Holy Week. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Ninoy Aquino Day',
                'date'         => "$year-08-21",
                'type'         => 'Special Non-Working',
                'description'  => 'Commemorates the assassination of Senator Benigno "Ninoy" Aquino Jr. in 1983. (R.A. 9256) Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'All Saints Day',
                'date'         => "$year-11-01",
                'type'         => 'Special Non-Working',
                'description'  => 'Day to honor all saints and deceased relatives. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => "All Souls' Day",
                'date'         => "$year-11-02",
                'type'         => 'Special Non-Working',
                'description'  => 'Day of prayer and remembrance for the souls of the deceased. Declared additional special non-working day to extend All Saints Day observance. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Feast of the Immaculate Conception',
                'date'         => "$year-12-08",
                'type'         => 'Special Non-Working',
                'description'  => 'Catholic feast day honoring the Immaculate Conception of the Virgin Mary. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Christmas Eve',
                'date'         => "$year-12-24",
                'type'         => 'Special Non-Working',
                'description'  => 'The evening before Christmas Day. Declared to promote family bonding and domestic tourism. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => false,
            ],
            [
                'name'         => "Last Day of the Year (New Year's Eve)",
                'date'         => "$year-12-31",
                'type'         => 'Special Non-Working',
                'description'  => 'The last day of the calendar year. Not worked: no pay. Worked: 130% pay.',
                'is_recurring' => true,
            ],

            // ══════════════════════════════════════════════════════════════════
            // SPECIAL WORKING HOLIDAYS
            // Pay rules:
            //   • Not worked → No pay (no work, no pay — treated as ordinary day)
            //   • Worked     → 100% of daily wage (no premium; treated as regular workday)
            //   • Worked OT  → +25% of hourly rate
            // Per DOLE Labor Advisory No. 01, Series of 2026.
            // ══════════════════════════════════════════════════════════════════

            [
                'name'         => 'EDSA People Power Revolution Anniversary',
                'date'         => "$year-02-25",
                'type'         => 'Special Working',
                'description'  => 'Commemorates the 40th anniversary of the 1986 EDSA People Power Revolution. Declared a special working day under Proclamation 1006 — work and classes continue as normal. No holiday premium. Worked OT: +25% of hourly rate.',
                'is_recurring' => false,
            ],
        ];

        foreach ($holidays as $holiday) {
            Holiday::updateOrCreate(
                [
                    'name' => $holiday['name'],
                    'date' => $holiday['date'],
                ],
                $holiday
            );
        }

        $this->command->info('Philippine national holidays seeded successfully for ' . $year . '.');
    }
}