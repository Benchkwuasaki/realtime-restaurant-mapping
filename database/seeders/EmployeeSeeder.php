<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeeBasicInfo;
use App\Models\EmployeeAddress;
use App\Models\EmployeeEducation;
use App\Models\EligibilityInformation;
use App\Models\FamilyInfo;
use App\Models\GovernmentAccount;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    // ─────────────────────────────────────────────────────────────────────────
    // Reference Data Pools
    // ─────────────────────────────────────────────────────────────────────────

    private array $firstNamesMale = [
        'Ramon', 'Carlo', 'Jose', 'Miguel', 'Eduardo',
        'Roberto', 'Fernando', 'Antonio', 'Ricardo', 'Emmanuel',
        'Rodrigo', 'Alfredo', 'Bernard', 'Leonardo', 'Danilo',
        'Renato', 'Armando', 'Cesar', 'Victor', 'Nelson',
        'Bryan', 'Kevin', 'Mark', 'Christian', 'Ronald',
        'Joel', 'Jerome', 'Patrick', 'Dennis', 'Alvin',
    ];

    private array $firstNamesFemale = [
        'Maria', 'Ana', 'Joanna', 'Rosa', 'Maricel',
        'Lourdes', 'Teresita', 'Corazon', 'Josephine', 'Erlinda',
        'Gina', 'Rowena', 'Charissa', 'Kristine', 'Patricia',
        'Melissa', 'Diana', 'Catherine', 'Angela', 'Sheila',
        'Vanessa', 'Aileen', 'Mylene', 'Cheryl', 'Fe',
        'Elvira', 'Nora', 'Cynthia', 'Susan', 'Marites',
    ];

    private array $lastNames = [
        'Santos', 'Dela Cruz', 'Reyes', 'Mendoza', 'Garcia',
        'Torres', 'Villanueva', 'Bautista', 'Ramos', 'Aquino',
        'Fernandez', 'Flores', 'Lopez', 'Diaz', 'Castro',
        'Aguilar', 'Tolentino', 'Espinosa', 'Navarro', 'Palma',
        'Morales', 'Velasco', 'Ibanez', 'Ocampo', 'Macapagal',
        'Pangilinan', 'Mercado', 'Bonifacio', 'Luna', 'Mabini',
        'Rizal', 'Pascual', 'Lucero', 'Salazar', 'Macaraeg',
    ];

    private array $middleNames = [
        'Cruz', 'Gomez', 'Lim', 'Tan', 'Ong',
        'Aquino', 'Rivera', 'Pascual', 'Jimenez', 'Reyes',
        'Santos', 'Bautista', 'Garcia', 'Torres', 'Ramos',
        'Fernandez', 'Flores', 'Soriano', 'Valdez', 'Manalo',
        'Bartolome', 'Castillo', 'Guevara', 'Zabala',
    ];

    private array $cities = [
        'Quezon City', 'Manila', 'Pasig City', 'Taguig City',
        'Mandaluyong City', 'Marikina City', 'Pasay City', 'Makati City',
        'Paranaque City', 'Caloocan City', 'Valenzuela City', 'Malabon City',
        'Las Pinas City', 'Muntinlupa City', 'Pateros',
    ];

    private array $streets = [
        'Rizal Street', 'Mabini Avenue', 'Luna Street', 'Bonifacio Boulevard',
        'Aguinaldo Street', 'Quezon Avenue', 'Commonwealth Avenue', 'España Boulevard',
        'Taft Avenue', 'EDSA', 'Ortigas Avenue', 'Shaw Boulevard',
        'Aurora Boulevard', 'C-5 Road', 'Marcos Highway',
    ];

    private array $zipCodes = [
        '1100', '1200', '1300', '1400', '1500',
        '1550', '1600', '1634', '1700', '1800',
        '1100', '1200', '1300', '1400', '1500',
        '1550', '1600', '1634', '1700', '1800',
    ];

    private array $schools = [
        ['school' => 'University of the Philippines Diliman',    'address' => 'Diliman, Quezon City'],
        ['school' => 'De La Salle University',                   'address' => 'Taft Avenue, Manila'],
        ['school' => 'Ateneo de Manila University',              'address' => 'Loyola Heights, Quezon City'],
        ['school' => 'University of Santo Tomas',                'address' => 'España Blvd., Sampaloc, Manila'],
        ['school' => 'Mapúa University',                         'address' => 'Muralla Street, Intramuros, Manila'],
        ['school' => 'Far Eastern University',                   'address' => 'Nicanor Reyes Street, Manila'],
        ['school' => 'San Beda University',                      'address' => 'Mendiola Street, Manila'],
        ['school' => 'Polytechnic University of the Philippines','address' => 'Anonas Street, Santa Mesa, Manila'],
        ['school' => 'Pamantasan ng Lungsod ng Maynila',         'address' => 'Intramuros, Manila'],
        ['school' => 'Philippine Normal University',             'address' => 'Taft Avenue, Manila'],
        ['school' => 'Technological Institute of the Philippines','address' => 'Cubao, Quezon City'],
        ['school' => 'National University Philippines',          'address' => 'M.V. Delos Santos Street, Manila'],
    ];

    private array $degrees = [
        'Bachelor of Science in Computer Science',
        'Bachelor of Science in Information Technology',
        'Bachelor of Science in Business Administration',
        'Bachelor of Science in Accountancy',
        'Bachelor of Science in Psychology',
        'Bachelor of Science in Public Administration',
        'Bachelor of Laws',
        'Bachelor of Science in Office Administration',
        'Bachelor of Science in Electronics Engineering',
        'Bachelor of Science in Civil Engineering',
        'Master of Business Administration',
        'Master of Public Administration',
        'Master of Science in Information Systems',
    ];

    private array $eduLevels = [
        'College', 'Post-Graduate', 'College', 'College', 'College', 'Post-Graduate',
    ];

    private array $eligibilities = [
        'Career Service Sub-professional',
        'Career Service Professional',
        'Career Service Executive',
        'Bar Examinations',
        'Certified Public Accountant',
        'Information Technology Officer Exam',
        'Civil Service Eligibility for Teachers',
    ];

    private array $govtSeminars = [
        ['name' => 'Strategic Planning Workshop',              'venue' => 'PICC, Pasay City',                           'organizer' => 'National Economic and Development Authority'],
        ['name' => 'Labor Law and Employee Relations Seminar', 'venue' => 'Makati City Hall',                           'organizer' => 'Department of Labor and Employment'],
        ['name' => 'Cybersecurity Awareness Training',         'venue' => 'Online (Zoom)',                              'organizer' => 'Department of Information and Communications Technology'],
        ['name' => 'Laravel Advanced Workshop',                'venue' => 'BGC Tech Hub, Taguig',                       'organizer' => 'Philippine Software Industry Association'],
        ['name' => 'Leadership and Management',                'venue' => 'Manila Hotel',                               'organizer' => 'Civil Service Commission'],
        ['name' => 'Digital Transformation for Government',    'venue' => 'Sofitel Philippine Plaza, Pasay',            'organizer' => 'Department of Information and Communications Technology'],
        ['name' => 'Public Financial Management Seminar',      'venue' => 'COA Headquarters, Quezon City',              'organizer' => 'Commission on Audit'],
        ['name' => 'Records and Documents Management',         'venue' => 'NEDA Pasig',                                 'organizer' => 'National Archives of the Philippines'],
        ['name' => 'Project Management Essentials',            'venue' => 'Online (MS Teams)',                          'organizer' => 'Project Management Institute Philippines'],
        ['name' => 'Anti-Corruption and Ethics in Public Service', 'venue' => 'CSC Regional Office, Manila',           'organizer' => 'Office of the Ombudsman'],
        ['name' => 'Gender and Development Awareness Program', 'venue' => 'DSWD Office, Diliman',                       'organizer' => 'Philippine Commission on Women'],
        ['name' => 'Procurement Law and GPPB Guidelines',      'venue' => 'GPPB-TSO, Pasig City',                      'organizer' => 'Government Procurement Policy Board'],
        ['name' => 'Network Security Fundamentals',            'venue' => 'Online (MS Teams)',                          'organizer' => 'Department of Information and Communications Technology'],
        ['name' => 'Executive Leadership Program',             'venue' => 'Asian Institute of Management, Makati',      'organizer' => 'Asian Institute of Management'],
        ['name' => 'Budget and Financial Reporting',           'venue' => 'DBM Conference Hall, Manila',                'organizer' => 'Department of Budget and Management'],
    ];

    private array $allowanceTypes = [
        ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
        ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
        ['allowance_name' => 'Clothing Allowance',       'allowance_amount' => 6000.00],
        ['allowance_name' => 'Hazard Pay',               'allowance_amount' => 3000.00],
        ['allowance_name' => 'Representation Allowance', 'allowance_amount' => 5000.00],
        ['allowance_name' => 'Subsistence Allowance',    'allowance_amount' => 1800.00],
        ['allowance_name' => 'Laundry Allowance',        'allowance_amount' => 600.00],
    ];

    private array $employmentClassifications = [
        'Regular', 'Regular', 'Regular', 'Job Order', 'Casual',
    ];

    private array $civStatuses = [
        'single', 'married', 'married', 'married', 'single', 'widowed',
    ];

    private array $placesBirth = [
        'Manila, Philippines',           'Cebu City, Philippines',
        'Davao City, Philippines',       'Quezon City, Philippines',
        'Iloilo City, Philippines',      'Cagayan de Oro, Philippines',
        'Zamboanga City, Philippines',   'Bacolod City, Philippines',
        'General Santos City, Philippines', 'Baguio City, Philippines',
        'Tacloban City, Philippines',    'Butuan City, Philippines',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Run
    // ─────────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        $sgStepIds     = DB::table('salary_grade_steps')->orderBy('salary_grade_step_id')->pluck('salary_grade_step_id')->toArray();
        $positions     = $this->resolvePositions();
        $fillableItems = $this->resolveFillableItems($positions);

        // ── Resolve JO items pool (one item per division, seeded by DatabaseSeeder) ──
        $joItemIds = DB::table('items')
            ->join('positions', 'items.position_id', '=', 'positions.position_id')
            ->where('positions.position_type', 'Job Order')
            ->pluck('items.item_id')
            ->toArray();

        $docTrackMap = $this->buildDocTrackMap($positions);
        $roleMap     = ['hr_admin' => 5, 'ogm' => 7];

        $positionSeenCount = [];
        $fillableIndex     = 0; // advances only for Regular / Casual (plantilla)
        $joIndex           = 0; // advances only for Job Order
        srand(42);

        for ($i = 0; $i < 100; $i++) {
            $isFemale = ($i % 3 !== 0);
            $classif  = $this->employmentClassifications[$i % count($this->employmentClassifications)];
            $isJO     = $classif === 'Job Order';

            if ($isJO) {
                // Cycle through available JO items across all divisions
                $itemId  = $joItemIds[$joIndex % count($joItemIds)];
                $joIndex++;
                $posIdx  = $i % count($positions); // used only for service records context
                $sgIdx   = 1;                       // default SG for JO
            } else {
                $itemEntry = $fillableItems[$fillableIndex++];
                $itemId    = $itemEntry['id'];
                $posIdx    = $itemEntry['pos_idx'];
                $sgIdx     = $positions[$posIdx]['sg_idx'];
            }

            $positionSeenCount[$posIdx] = ($positionSeenCount[$posIdx] ?? 0) + 1;
            $occurrence = $positionSeenCount[$posIdx];

            $names      = $this->generateNames($i, $isFemale);
            $dates      = $this->generateDates($i);
            $location   = $this->generateLocation($i);
            $schoolData = $this->schools[$i % count($this->schools)];
            $civStat    = $this->civStatuses[$i % count($this->civStatuses)];
            $status     = ($i % 10 !== 0);

            $workEmail = strtolower(
                preg_replace('/[^a-z0-9]/', '', $names['first']) . '.' .
                preg_replace('/[^a-z0-9]/', '', $names['last']) .
                ($i > 0 ? $i : '') . '@obx.gov.ph'
            );

            DB::transaction(function () use (
                $i, $isFemale, $names, $dates, $location, $schoolData,
                $classif, $civStat, $status, $sgIdx, $sgStepIds,
                $itemId, $posIdx, $positions, $occurrence,
                $workEmail, $docTrackMap, $roleMap, $isJO
            ) {
                // ── Basic Info ────────────────────────────────────────────
                $basicInfo = EmployeeBasicInfo::create([
                    'first_name'     => $names['first'],
                    'last_name'      => $names['last'],
                    'middle_name'    => $names['middle'],
                    'name_extension' => ($i % 15 === 0 && !$isFemale) ? 'Jr.' : null,
                    'birth_date'     => $dates['birth'],
                    'sex'            => $isFemale ? 1 : 0,
                    'personal_email' => strtolower("{$names['first']}.{$names['last']}{$i}@gmail.com"),
                    'phone_number'   => '09' . str_pad((171000000 + $i * 1234567) % 900000000 + 100000000, 9, '0'),
                    'civil_status'   => $civStat,
                    'place_of_birth' => $this->placesBirth[$i % count($this->placesBirth)],
                ]);

                // ── Employee ──────────────────────────────────────────────
                // item_id is always set:
                //   - Regular/Casual → plantilla item from resolveFillableItems()
                //   - Job Order      → JO item seeded per division in DatabaseSeeder
                $employee = Employee::create([
                    'employee_basic_info_id'    => $basicInfo->employee_basic_info_id,
                    'item_id'                   => $itemId,
                    'salary_grade_step_id'      => $sgStepIds[$sgIdx],
                    'employment_classification' => $classif,
                    'work_id'                   => sprintf('EMP-%04d', $i + 1),
                    'work_email'                => $workEmail,
                    'password'                  => Hash::make('password'),
                    'date_applied'              => $dates['applied'],
                    'date_hired'                => $dates['hired'],
                    'work_schedule_start'       => '08:00:00',
                    'work_schedule_end'         => '17:00:00',
                    'break_start'               => '12:00:00',
                    'break_end'                 => '13:00:00',
                    'status'                    => $status,
                ]);

                // ── User & Roles ──────────────────────────────────────────
                $user = User::create([
                    'employee_id'       => $employee->employee_id,
                    'email'             => $employee->work_email,
                    'email_verified_at' => now(),
                    'password'          => $employee->password,
                ]);

                $user->assignRole('employee');

                // Special roles only for plantilla (non-JO) employees
                if (!$isJO) {
                    if (isset($docTrackMap[$posIdx]) && $occurrence === 1) {
                        $user->assignRole('document_tracking_operator');
                    }
                    if ($posIdx === $roleMap['hr_admin'] && $occurrence === 1) {
                        $user->assignRole('hr_admin');
                    }
                    if ($posIdx === $roleMap['ogm'] && $occurrence === 1) {
                        $user->assignRole('ogm');
                    }
                }

                if ($i === 32) { $user->assignRole('hr_admin'); }
                if ($i === 33) { $user->assignRole('ogm'); }

                // ── Address ───────────────────────────────────────────────
                $this->seedAddress($basicInfo->employee_basic_info_id, $i, $location);

                // ── Education ─────────────────────────────────────────────
                $this->seedEducation($basicInfo->employee_basic_info_id, $i, $schoolData, $dates);

                // ── Family Info ───────────────────────────────────────────
                $this->seedFamilyInfo($basicInfo->employee_basic_info_id, $i, $isFemale, $names['last']);

                // ── Government Accounts ───────────────────────────────────
                $this->seedGovernmentAccounts($employee->employee_id, $i, $classif, $dates['hire_year']);

                // ── Allowances ────────────────────────────────────────────
                $this->seedAllowances($employee->employee_id, $i, $sgIdx);

                // ── Service Records ───────────────────────────────────────
                $this->seedServiceRecords($employee->employee_id, $i, $positions[$posIdx], $dates['hire_year']);

                // ── Seminars & Trainings ──────────────────────────────────
                $this->seedSeminars($employee->employee_id, $i, $dates['hire_year']);

                // ── Eligibility ───────────────────────────────────────────
                $this->seedEligibility($employee->employee_id, $i, $dates['birth_year'], $dates['hire_year']);

                // ── Leave Information & Availments ────────────────────────
                $this->seedLeave($employee->employee_id, $i);

                // ── Payroll ───────────────────────────────────────────────
                $this->seedPayroll($employee->employee_id, $sgIdx);

                // ── Water Bill ────────────────────────────────────────────
                $this->seedWaterBill($employee->employee_id, $i, $names, $location);
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seed Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function seedAddress(int $basicInfoId, int $i, array $location): void
    {
        EmployeeAddress::create([
            'employee_basic_info_id' => $basicInfoId,
            'street_address'         => "{$location['street_num']} {$location['street']}",
            'city'                   => $location['city'],
            'state'                  => 'Metro Manila',
            'zip_code'               => $location['zip'],
        ]);
    }

    private function seedEducation(int $basicInfoId, int $i, array $schoolData, array $dates): void
    {
        $gradYear = min($dates['hire_year'] - 1, $dates['birth_year'] + 20);

        EmployeeEducation::create([
            'employee_basic_info_id' => $basicInfoId,
            'level'                  => $this->eduLevels[$i % count($this->eduLevels)],
            'school_name'            => $schoolData['school'],
            'school_address'         => $schoolData['address'],
            'graduation_date'        => "{$gradYear}-03-25",
            'degree'                 => $this->degrees[$i % count($this->degrees)],
        ]);
    }

    private function seedFamilyInfo(int $basicInfoId, int $i, bool $isFemale, string $lastName): void
    {
        $spouseFirst = $isFemale
            ? $this->firstNamesMale[$i % count($this->firstNamesMale)]
            : $this->firstNamesFemale[$i % count($this->firstNamesFemale)];

        $spouseBirthYear  = 1975 + (($i + 3) % 25);
        $spouseBirthMonth = str_pad((($i + 3) % 12) + 1, 2, '0', STR_PAD_LEFT);
        $spouseBirthDay   = str_pad((($i + 3) % 28) + 1, 2, '0', STR_PAD_LEFT);

        FamilyInfo::create([
            'employee_basic_info_id' => $basicInfoId,
            'full_name'              => "{$spouseFirst} {$lastName}",
            'contact_number'         => '09' . str_pad((281000000 + $i * 7654321) % 900000000 + 100000000, 9, '0'),
            'relationship'           => 'Spouse',
            'sex'                    => !$isFemale ? 1 : 0,
            'date_of_birth'          => "{$spouseBirthYear}-{$spouseBirthMonth}-{$spouseBirthDay}",
            'place_of_birth'         => $this->placesBirth[($i + 2) % count($this->placesBirth)],
        ]);
    }

    private function seedGovernmentAccounts(int $employeeId, int $i, string $classif, int $hireYear): void
    {
        $accounts = [
            ['account_type' => 'PhilHealth', 'account_number' => sprintf('%02d-%09d-%d', ($i % 9) + 11, $i * 9876543 % 999999999, $i % 9)],
            ['account_type' => 'Pag-IBIG',   'account_number' => sprintf('%04d-%04d-%04d', ($i * 7) % 9999, ($i * 3) % 9999, ($i * 11) % 9999)],
        ];

        if ($classif === 'Regular' && $hireYear < 2015) {
            $accounts[] = [
                'account_type'   => 'GSIS',
                'account_number' => sprintf('%010d', ($i + 1) * 97 + $hireYear),
            ];
        }

        foreach ($accounts as $account) {
            GovernmentAccount::create(array_merge($account, ['employee_id' => $employeeId]));
        }
    }

    private function seedAllowances(int $employeeId, int $i, int $sgIdx): void
    {
        $allowances = [$this->allowanceTypes[0], $this->allowanceTypes[1]]; // Transportation + Rice always

        if ($i % 4 === 0) $allowances[] = $this->allowanceTypes[2]; // Clothing
        if ($i % 7 === 0) $allowances[] = $this->allowanceTypes[3]; // Hazard Pay
        if ($sgIdx >= 9)  $allowances[] = $this->allowanceTypes[4]; // Representation (senior)
        if ($i % 5 === 0) $allowances[] = $this->allowanceTypes[5]; // Subsistence

        foreach ($allowances as $allowance) {
            DB::table('employee_allowances')->insert(array_merge($allowance, [
                'employee_id' => $employeeId,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]));
        }
    }

    private function seedServiceRecords(int $employeeId, int $i, array $position, int $hireYear): void
    {
        $hiredDate = "{$hireYear}-" . str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT) . '-01';

        DB::table('employee_service_records')->insert([
            'employee_id'   => $employeeId,
            'department'    => $this->resolveDivisionName($position['div']),
            'service_title' => $position['name'],
            'durationStart' => $hiredDate,
            'durationEnd'   => null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        if ($hireYear <= 2015) {
            DB::table('employee_service_records')->insert([
                'employee_id'   => $employeeId,
                'department'    => $this->resolveDivisionName($position['div']),
                'service_title' => 'Administrative Aide',
                'durationStart' => "{$hireYear}-01-01",
                'durationEnd'   => ($hireYear + 4) . '-12-31',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
    }

    private function seedSeminars(int $employeeId, int $i, int $hireYear): void
    {
        $semYear   = min(2024, $hireYear + 2);
        $seminar1  = $this->govtSeminars[$i % count($this->govtSeminars)];

        DB::table('employee_seminars_and_trainings')->insert([
            'employee_id'          => $employeeId,
            'seminar_training_name'=> $seminar1['name'],
            'date_attended'        => "{$semYear}-06-15",
            'venue'                => $seminar1['venue'],
            'organizer'            => $seminar1['organizer'],
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        if ($i % 3 === 0) {
            $seminar2 = $this->govtSeminars[($i + 5) % count($this->govtSeminars)];
            DB::table('employee_seminars_and_trainings')->insert([
                'employee_id'          => $employeeId,
                'seminar_training_name'=> $seminar2['name'],
                'date_attended'        => min(2024, $semYear + 1) . '-11-20',
                'venue'                => $seminar2['venue'],
                'organizer'            => $seminar2['organizer'],
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);
        }
    }

    private function seedEligibility(int $employeeId, int $i, int $birthYear, int $hireYear): void
    {
        $eligYear = min($hireYear - 1, $birthYear + 22);

        EligibilityInformation::create([
            'employee_id'      => $employeeId,
            'eligibility_name' => $this->eligibilities[$i % count($this->eligibilities)],
            'year_passed'      => "{$eligYear}-08-01",
        ]);
    }

    private function seedLeave(int $employeeId, int $i): void
    {
        foreach (['Vacation Leave', 'Sick Leave'] as $leaveType) {
            DB::table('leave_information')->insert([
                'employee_id'  => $employeeId,
                'leave_type'   => $leaveType,
                'leave_days'   => '2024-01-01',
                'leave_balance'=> '2024-12-31',
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        if ($i % 5 !== 0) {
            $leaveTypes = ['Vacation Leave', 'Sick Leave'];
            $lvType     = $leaveTypes[$i % 2];
            $lvMonth    = str_pad(($i % 11) + 1, 2, '0', STR_PAD_LEFT);
            $lvDay      = str_pad(($i % 20) + 1, 2, '0', STR_PAD_LEFT);
            $lvEnd      = str_pad(((int) $lvDay + 1) % 28 + 1, 2, '0', STR_PAD_LEFT);

            DB::table('leave_availments')->insert([
                'employee_id'      => $employeeId,
                'leave_type'       => $lvType,
                'leave_start_date' => "2024-{$lvMonth}-{$lvDay}",
                'leave_end_date'   => "2024-{$lvMonth}-{$lvEnd}",
                'status'           => 'approved',
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }
    }

    private function seedPayroll(int $employeeId, int $sgIdx): void
    {
        $baseSalary = DB::table('salary_grade_steps')
            ->orderBy('salary_grade_step_id')
            ->skip($sgIdx)
            ->value('monthly_salary');

        $deduction   = round($baseSalary * 0.12, 2);
        $finalAmount = round($baseSalary - $deduction, 2);

        DB::table('employee_payroll_data')->insert([
            'employee_id'    => $employeeId,
            'initial_amount' => $baseSalary,
            'deduction_amount'=> $deduction,
            'final_amount'   => $finalAmount,
            'date_processed' => '2025-01-31',
            'payroll_status' => 'Released',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }

    private function seedWaterBill(int $employeeId, int $i, array $names, array $location): void
    {
        DB::table('employee_water_bill')->insert([
            'employee_id'      => $employeeId,
            'water_bill_number'=> sprintf('WB-%03d-2024', $i + 1),
            'account_name'     => "{$names['first']} {$names['middle'][0]}. {$names['last']}",
            'address'          => "{$location['street_num']} {$location['street']}, {$location['city']}",
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Generator Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function generateNames(int $i, bool $isFemale): array
    {
        return [
            'first'  => $isFemale
                ? $this->firstNamesFemale[$i % count($this->firstNamesFemale)]
                : $this->firstNamesMale[$i % count($this->firstNamesMale)],
            'last'   => $this->lastNames[$i % count($this->lastNames)],
            'middle' => $this->middleNames[$i % count($this->middleNames)],
        ];
    }

    private function generateDates(int $i): array
    {
        $birthYear  = 1975 + ($i % 25);
        $hireYear   = min(2023, 2000 + ($i % 24));
        $hireMonth  = str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT);
        $hiredDate  = "{$hireYear}-{$hireMonth}-01";
        $appliedDate= date('Y-m-d', strtotime($hiredDate . ' -1 month'));

        return [
            'birth'      => sprintf('%d-%s-%s', $birthYear, str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT), str_pad(($i % 28) + 1, 2, '0', STR_PAD_LEFT)),
            'birth_year' => $birthYear,
            'hired'      => $hiredDate,
            'hire_year'  => $hireYear,
            'applied'    => $appliedDate,
        ];
    }

    private function generateLocation(int $i): array
    {
        return [
            'city'       => $this->cities[$i % count($this->cities)],
            'street'     => $this->streets[$i % count($this->streets)],
            'street_num' => (($i + 1) * 7) % 200 + 1,
            'zip'        => $this->zipCodes[$i % count($this->zipCodes)],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Organisation Resolution
    // ─────────────────────────────────────────────────────────────────────────

    private function resolvePositions(): array
    {
        $dept = fn(string $acronym) => DB::table('departments')->where('department_acronym', $acronym)->value('department_id');
        $div  = fn(string $acronym) => DB::table('divisions')->where('division_acronym', $acronym)->value('division_id');
        $unit = fn(string $acronym) => DB::table('units')->where('unit_acronym', $acronym)->value('unit_id');

        $deptId    = $dept('OBE');
        $deptOpsId = $dept('OSD');
        $deptGovId = $dept('GPAD');

        $divHrId        = $div('HRD');
        $divItId        = $div('ITD');
        $divFinId       = $div('FBD');
        $divAdminId     = $div('ASD');
        $divLegalId     = $div('LCD');
        $divOpsFieldId  = $div('FOD');
        $divPublicAffId = $div('PAD');

        $unitRecruitId     = $unit('RU');
        $unitPayrollId     = $unit('PBU');
        $unitDevId         = $unit('SDU');
        $unitInfraId       = $unit('INU');
        $unitAccountingId  = $unit('AU');
        $unitBudgetId      = $unit('BU');
        $unitRecordsId     = $unit('RMU');
        $unitProcurementId = $unit('PU');
        $unitLegalId       = $unit('LAU');
        $unitDispatchId    = $unit('DCU');
        $unitCommsId       = $unit('CU');

        return [
            // HR
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitRecruitId,     'name' => 'HR Officer',             'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitRecruitId,     'name' => 'Recruitment Specialist', 'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitPayrollId,     'name' => 'Payroll Officer',        'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => $unitPayrollId,     'name' => 'Benefits Administrator', 'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => null,               'name' => 'HR Division Chief',      'sg_idx' => 9],
            ['dept' => $deptId,    'div' => $divHrId,        'unit' => null,               'name' => 'HR Manager',             'sg_idx' => 9],
            // Operations
            ['dept' => $deptOpsId, 'div' => $divOpsFieldId,  'unit' => $unitDispatchId,    'name' => 'Operations Coordinator', 'sg_idx' => 5],
            // Governance
            ['dept' => $deptGovId, 'div' => $divPublicAffId, 'unit' => $unitCommsId,       'name' => 'Public Affairs Officer', 'sg_idx' => 5],
            // IT
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitDevId,         'name' => 'Software Developer',     'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitDevId,         'name' => 'Senior Developer',       'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitDevId,         'name' => 'Systems Analyst',        'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitInfraId,       'name' => 'Systems Administrator',  'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => $unitInfraId,       'name' => 'Network Engineer',       'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divItId,        'unit' => null,               'name' => 'IT Manager',             'sg_idx' => 12],
            // Finance
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitAccountingId,  'name' => 'Accountant',             'sg_idx' => 4],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitAccountingId,  'name' => 'Senior Accountant',      'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitBudgetId,      'name' => 'Budget Officer',         'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => $unitBudgetId,      'name' => 'Budget Analyst',         'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divFinId,       'unit' => null,               'name' => 'Finance Manager',        'sg_idx' => 11],
            // Admin
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitRecordsId,     'name' => 'Records Officer',        'sg_idx' => 2],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitRecordsId,     'name' => 'Administrative Aide',    'sg_idx' => 0],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitProcurementId, 'name' => 'Procurement Officer',    'sg_idx' => 5],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => $unitProcurementId, 'name' => 'Procurement Specialist', 'sg_idx' => 3],
            ['dept' => $deptId,    'div' => $divAdminId,     'unit' => null,               'name' => 'Admin Division Chief',   'sg_idx' => 9],
            // Legal
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => $unitLegalId,       'name' => 'Legal Officer',          'sg_idx' => 7],
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => $unitLegalId,       'name' => 'Compliance Officer',     'sg_idx' => 6],
            ['dept' => $deptId,    'div' => $divLegalId,     'unit' => null,               'name' => 'Legal Division Chief',   'sg_idx' => 10],
        ];
    }

    /**
     * Returns only the non-vacant plantilla item entries (Regular/Casual slots).
     * JO items are resolved separately via the position_type = 'Job Order' query.
     */
    private function resolveFillableItems(array $positions): array
    {
        $positionsWithVacantSlot = [1, 4, 7, 10, 13, 16, 19, 21, 23, 24];

        $positionIds = DB::table('positions')
            ->where('position_type', 'Regular')
            ->orderBy('position_id')
            ->pluck('position_id')
            ->toArray();

        $allItems = [];

        foreach ($positionIds as $idx => $posId) {
            if (!isset($positions[$idx])) {
                continue;
            }

            $posName       = $positions[$idx]['name'];
            $hasVacantSlot = in_array($idx, $positionsWithVacantSlot, true);
            $slotLimit     = $hasVacantSlot ? 5 : 4;

            for ($slot = 1; $slot <= $slotLimit; $slot++) {
                $isVacant = $hasVacantSlot && $slot === 5;

                $itemId = DB::table('items')
                    ->where('position_id', $posId)
                    ->where('item_name', "{$posName} Item {$slot}")
                    ->value('item_id');

                if ($itemId) {
                    $allItems[] = [
                        'id'              => $itemId,
                        'pos_idx'         => $idx,
                        'is_vacant_slot'  => $isVacant,
                    ];
                }
            }
        }

        return array_values(array_filter($allItems, fn($item) => !$item['is_vacant_slot']));
    }

    private function buildDocTrackMap(array $positions): array
    {
        $dept = fn(string $acronym) => DB::table('departments')->where('department_acronym', $acronym)->value('department_id');

        $docTrackTargets = [
            $dept('OBE')  => 5,
            $dept('OSD')  => 6,
            $dept('GPAD') => 7,
        ];

        $map = [];
        foreach ($positions as $idx => $pos) {
            $deptId = $pos['dept'] ?? null;
            if ($deptId && isset($docTrackTargets[$deptId]) && $docTrackTargets[$deptId] === $idx) {
                $map[$idx] = $deptId;
            }
        }

        return $map;
    }

    private function resolveDivisionName(?int $divisionId): string
    {
        if (!$divisionId) {
            return 'Office of Business Excellence';
        }

        return DB::table('divisions')
            ->where('division_id', $divisionId)
            ->value('division_name') ?? 'Office of Business Excellence';
    }
}