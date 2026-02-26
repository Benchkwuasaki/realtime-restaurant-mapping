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

            // ── Regular Holidays ─────────────────────────────────────────────

            [
                'name'         => "New Year's Day",
                'date'         => "$year-01-01",
                'type'         => 'Regular Holiday',
                'description'  => 'Celebration of the first day of the Gregorian calendar year.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Araw ng Kagitingan (Day of Valor)',
                'date'         => "$year-04-09",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the Fall of Bataan and the heroism of Filipino and American soldiers.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Labor Day',
                'date'         => "$year-05-01",
                'type'         => 'Regular Holiday',
                'description'  => 'International Workers\' Day celebrating the achievements of the labor movement.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Independence Day',
                'date'         => "$year-06-12",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the declaration of Philippine independence from Spain in 1898.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'National Heroes Day',
                'date'         => "$year-08-25",  // Last Monday of August — adjust yearly
                'type'         => 'Regular Holiday',
                'description'  => 'Honors all Filipino national heroes. Falls on the last Monday of August.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Bonifacio Day',
                'date'         => "$year-11-30",
                'type'         => 'Regular Holiday',
                'description'  => 'Birthday of Andres Bonifacio, founder of the Katipunan revolutionary movement.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Christmas Day',
                'date'         => "$year-12-25",
                'type'         => 'Regular Holiday',
                'description'  => 'Celebration of the birth of Jesus Christ.',
                'is_recurring' => true,
            ],
            [
                'name'         => "Rizal Day",
                'date'         => "$year-12-30",
                'type'         => 'Regular Holiday',
                'description'  => 'Commemorates the execution of Dr. José Rizal, the Philippine national hero, in 1896.',
                'is_recurring' => true,
            ],

            // ── Moveable Regular Holidays (approximate — update dates yearly) ─

            [
                'name'         => 'Maundy Thursday',
                'date'         => "$year-04-17",  // Update yearly
                'type'         => 'Regular Holiday',
                'description'  => 'Thursday before Easter Sunday, commemorating the Last Supper of Jesus Christ.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Good Friday',
                'date'         => "$year-04-18",  // Update yearly
                'type'         => 'Regular Holiday',
                'description'  => 'Friday before Easter Sunday, commemorating the crucifixion of Jesus Christ.',
                'is_recurring' => false,
            ],
            [
                'name'         => "Eid'l Fitr (Feast of Ramadan)",
                'date'         => "$year-03-31",  // Update yearly — based on Islamic lunar calendar
                'type'         => 'Regular Holiday',
                'description'  => 'Marks the end of Ramadan, the Islamic holy month of fasting.',
                'is_recurring' => false,
            ],
            [
                'name'         => "Eid'l Adha (Feast of Sacrifice)",
                'date'         => "$year-06-07",  // Update yearly — based on Islamic lunar calendar
                'type'         => 'Regular Holiday',
                'description'  => 'Islamic festival commemorating the willingness of Ibrahim to sacrifice his son.',
                'is_recurring' => false,
            ],

            // ── Special Non-Working Holidays ─────────────────────────────────

            [
                'name'         => 'Chinese New Year',
                'date'         => "$year-01-29",  // Update yearly — based on lunar calendar
                'type'         => 'Special Non-Working',
                'description'  => 'Celebration of the Lunar New Year, widely observed in the Philippines.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Black Saturday',
                'date'         => "$year-04-19",  // Update yearly
                'type'         => 'Special Non-Working',
                'description'  => 'The day between Good Friday and Easter Sunday in the Holy Week.',
                'is_recurring' => false,
            ],
            [
                'name'         => 'Ninoy Aquino Day',
                'date'         => "$year-08-21",
                'type'         => 'Special Non-Working',
                'description'  => 'Commemorates the assassination of Senator Benigno "Ninoy" Aquino Jr. in 1983.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'All Saints Day',
                'date'         => "$year-11-01",
                'type'         => 'Special Non-Working',
                'description'  => 'Day to honor all saints and deceased relatives, widely observed in the Philippines.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'All Souls Day',
                'date'         => "$year-11-02",
                'type'         => 'Special Non-Working',
                'description'  => 'Day of prayer and remembrance for the souls of the deceased.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Feast of the Immaculate Conception',
                'date'         => "$year-12-08",
                'type'         => 'Special Non-Working',
                'description'  => 'Catholic feast day honoring the Immaculate Conception of the Virgin Mary.',
                'is_recurring' => true,
            ],
            [
                'name'         => 'Christmas Eve',
                'date'         => "$year-12-24",
                'type'         => 'Special Non-Working',
                'description'  => 'The evening before Christmas Day.',
                'is_recurring' => true,
            ],
            [
                'name'         => "Last Day of the Year (New Year's Eve)",
                'date'         => "$year-12-31",
                'type'         => 'Special Non-Working',
                'description'  => 'The last day of the calendar year.',
                'is_recurring' => true,
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