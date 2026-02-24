<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Salary Grade Steps ──────────────────────────────────
        $salaryGradeSteps = [
            ['salary_grade' => 10, 'step' => 1, 'salary_amount' => 22316.00],
            ['salary_grade' => 12, 'step' => 1, 'salary_amount' => 27608.00],
            ['salary_grade' => 15, 'step' => 1, 'salary_amount' => 36619.00],
            ['salary_grade' => 18, 'step' => 1, 'salary_amount' => 48597.00],
            ['salary_grade' => 24, 'step' => 1, 'salary_amount' => 97744.00],
        ];

        $sgStepIds = [];
        foreach ($salaryGradeSteps as $sg) {
            $sgStepIds[] = DB::table('salary_grade_steps')->insertGetId(
                array_merge($sg, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // ── 2. Department ──────────────────────────────────────────
        $deptId = DB::table('departments')->insertGetId([
            'department_name'        => 'Office of Business Excellence',
            'department_acronym'     => 'OBE',
            'department_description' => 'Handles overall business operations and excellence.',
            'created_at'             => now(),
            'updated_at'             => now(),
        ]);

        // ── 3. Divisions ───────────────────────────────────────────
        $divHrId = DB::table('divisions')->insertGetId([
            'department_id'       => $deptId,
            'division_name'       => 'Human Resources Division',
            'division_acronym'    => 'HRD',
            'division_description'=> 'Manages recruitment, payroll, and employee relations.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $divItId = DB::table('divisions')->insertGetId([
            'department_id'       => $deptId,
            'division_name'       => 'Information Technology Division',
            'division_acronym'    => 'ITD',
            'division_description'=> 'Manages all IT infrastructure and software systems.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        // ── 4. Units ───────────────────────────────────────────────
        $unitRecruitId = DB::table('units')->insertGetId([
            'division_id'      => $divHrId,
            'unit_name'        => 'Recruitment Unit',
            'unit_acronym'     => 'RU',
            'unit_description' => 'Handles hiring and onboarding of new employees.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $unitDevId = DB::table('units')->insertGetId([
            'division_id'      => $divItId,
            'unit_name'        => 'Software Development Unit',
            'unit_acronym'     => 'SDU',
            'unit_description' => 'Develops and maintains internal software systems.',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ── 5. Positions ───────────────────────────────────────────
        $posHrOfficerId = DB::table('positions')->insertGetId([
            'department_id' => $deptId,
            'division_id'   => $divHrId,
            'unit_id'       => $unitRecruitId,
            'position_name' => 'HR Officer',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $posHrManagerId = DB::table('positions')->insertGetId([
            'department_id' => $deptId,
            'division_id'   => $divHrId,
            'unit_id'       => null,
            'position_name' => 'HR Manager',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $posDevId = DB::table('positions')->insertGetId([
            'department_id' => $deptId,
            'division_id'   => $divItId,
            'unit_id'       => $unitDevId,
            'position_name' => 'Software Developer',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $posSysAdminId = DB::table('positions')->insertGetId([
            'department_id' => $deptId,
            'division_id'   => $divItId,
            'unit_id'       => $unitDevId,
            'position_name' => 'Systems Administrator',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $posItManagerId = DB::table('positions')->insertGetId([
            'department_id' => $deptId,
            'division_id'   => $divItId,
            'unit_id'       => null,
            'position_name' => 'IT Manager',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // ── 6. Items (one item per position slot) ─────────────────
        $itemIds = [
            DB::table('items')->insertGetId(['position_id' => $posHrOfficerId,  'item_name' => 'HR Officer Item 1',          'created_at' => now(), 'updated_at' => now()]),
            DB::table('items')->insertGetId(['position_id' => $posHrManagerId,  'item_name' => 'HR Manager Item 1',          'created_at' => now(), 'updated_at' => now()]),
            DB::table('items')->insertGetId(['position_id' => $posDevId,         'item_name' => 'Software Developer Item 1',  'created_at' => now(), 'updated_at' => now()]),
            DB::table('items')->insertGetId(['position_id' => $posSysAdminId,    'item_name' => 'Systems Administrator Item 1','created_at' => now(), 'updated_at' => now()]),
            DB::table('items')->insertGetId(['position_id' => $posItManagerId,   'item_name' => 'IT Manager Item 1',          'created_at' => now(), 'updated_at' => now()]),
        ];

        // ── 7. Employee Definitions ────────────────────────────────
        $employees = [
            [
                'basic' => [
                    'first_name'     => 'Maria',
                    'last_name'      => 'Santos',
                    'middle_name'    => 'Cruz',
                    'name_extension' => null,
                    'birth_date'     => '1990-03-15',
                    'sex'            => 1,
                    'personal_email' => 'maria.santos.personal@gmail.com',
                    'phone_number'   => '09171234567',
                    'civil_status'   => 'married',
                    'place_of_birth' => 'Manila, Philippines',
                ],
                'employee' => [
                    'item_id'                   => $itemIds[0],
                    'salary_grade_step_id'       => $sgStepIds[0],
                    'employment_classification'  => 'Regular',
                    'work_email'                 => 'maria.santos@obx.gov.ph',
                    'date_applied'               => '2018-01-10',
                    'date_hired'                 => '2018-02-01',
                    'work_schedule_start'        => '08:00:00',
                    'work_schedule_end'          => '17:00:00',
                    'status'                     => true,
                ],
                'address' => [
                    'street_address' => '123 Rizal Street',
                    'city'           => 'Quezon City',
                    'state'          => 'Metro Manila',
                    'zip_code'       => '1100',
                ],
                'education' => [
                    'level'           => 'College',
                    'school_name'     => 'University of the Philippines Diliman',
                    'school_address'  => 'Diliman, Quezon City',
                    'graduation_date' => '2012-04-15',
                    'degree'          => 'Bachelor of Science in Psychology',
                ],
                'family' => [
                    'full_name'      => 'Jose Santos',
                    'contact_number' => '09179876543',
                    'relationship'   => '2000-01-01', // date field in schema
                ],
                'gov_accounts' => [
                    ['account_type' => 'SSS',     'account_number' => '03-1234567-8'],
                    ['account_type' => 'PhilHealth','account_number' => '12-345678901-2'],
                    ['account_type' => 'Pag-IBIG', 'account_number' => '1234-5678-9012'],
                ],
                'allowances' => [
                    ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
                    ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
                ],
                'service_records' => [
                    ['department' => 'Human Resources Division', 'service_title' => 'HR Assistant', 'durationStart' => '2018-02-01', 'durationEnd' => '2020-12-31'],
                    ['department' => 'Human Resources Division', 'service_title' => 'HR Officer',   'durationStart' => '2021-01-01', 'durationEnd' => null],
                ],
                'seminars' => [
                    ['seminar_training_name' => 'Labor Law and Employee Relations Seminar', 'date_attended' => '2022-06-10', 'venue' => 'Makati City Hall'],
                ],
                'eligibility' => [
                    ['eligibility_name' => 'Career Service Professional', 'year_passed' => '2013-08-01'],
                ],
                'leave_info' => [
                    ['leave_type' => 'Vacation Leave', 'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                    ['leave_type' => 'Sick Leave',     'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                ],
                'leave_availments' => [
                    ['leave_type' => 'Vacation Leave', 'leave_start_date' => '2024-04-08', 'leave_end_date' => '2024-04-10', 'status' => 'approved'],
                ],
                'payroll' => [
                    ['initial_amount' => 22316.00, 'deduction_amount' => 2800.00, 'final_amount' => 19516.00, 'date_processed' => '2025-01-31', 'payroll_status' => 'Released'],
                ],
                'water_bill' => ['water_bill_number' => 'WB-001-2024', 'account_name' => 'Maria C. Santos', 'address' => '123 Rizal Street, Quezon City'],
                'uploaded_files' => [
                    ['file_name' => 'birth_certificate.pdf', 'file_size' => '512KB', 'file_database_location' => 'employees/1/birth_certificate.pdf'],
                ],
            ],
            [
                'basic' => [
                    'first_name'     => 'Ramon',
                    'last_name'      => 'Dela Cruz',
                    'middle_name'    => 'Bautista',
                    'name_extension' => 'Jr.',
                    'birth_date'     => '1985-07-22',
                    'sex'            => 0,
                    'personal_email' => 'ramon.delacruz@gmail.com',
                    'phone_number'   => '09281234567',
                    'civil_status'   => 'married',
                    'place_of_birth' => 'Cebu City, Philippines',
                ],
                'employee' => [
                    'item_id'                   => $itemIds[1],
                    'salary_grade_step_id'       => $sgStepIds[3],
                    'employment_classification'  => 'Regular',
                    'work_email'                 => 'ramon.delacruz@obx.gov.ph',
                    'date_applied'               => '2012-05-01',
                    'date_hired'                 => '2012-06-01',
                    'work_schedule_start'        => '08:00:00',
                    'work_schedule_end'          => '17:00:00',
                    'status'                     => true,
                ],
                'address' => [
                    'street_address' => '45 Mabini Avenue',
                    'city'           => 'Pasig City',
                    'state'          => 'Metro Manila',
                    'zip_code'       => '1600',
                ],
                'education' => [
                    'level'           => 'College',
                    'school_name'     => 'De La Salle University',
                    'school_address'  => 'Taft Avenue, Manila',
                    'graduation_date' => '2007-03-20',
                    'degree'          => 'Bachelor of Science in Business Administration',
                ],
                'family' => [
                    'full_name'      => 'Luisa Dela Cruz',
                    'contact_number' => '09289876543',
                    'relationship'   => '2000-01-01',
                ],
                'gov_accounts' => [
                    ['account_type' => 'SSS',     'account_number' => '04-9876543-2'],
                    ['account_type' => 'PhilHealth','account_number' => '13-987654321-0'],
                    ['account_type' => 'Pag-IBIG', 'account_number' => '9876-5432-1098'],
                    ['account_type' => 'GSIS',     'account_number' => 'GSIS-0001-2012'],
                ],
                'allowances' => [
                    ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
                    ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
                    ['allowance_name' => 'Clothing Allowance',       'allowance_amount' => 6000.00],
                ],
                'service_records' => [
                    ['department' => 'Human Resources Division', 'service_title' => 'HR Officer',  'durationStart' => '2012-06-01', 'durationEnd' => '2018-12-31'],
                    ['department' => 'Human Resources Division', 'service_title' => 'HR Manager',  'durationStart' => '2019-01-01', 'durationEnd' => null],
                ],
                'seminars' => [
                    ['seminar_training_name' => 'Strategic HR Management', 'date_attended' => '2020-09-15', 'venue' => 'PICC, Pasay City'],
                    ['seminar_training_name' => 'Leadership and Management', 'date_attended' => '2023-03-22', 'venue' => 'Manila Hotel'],
                ],
                'eligibility' => [
                    ['eligibility_name' => 'Career Service Professional', 'year_passed' => '2008-08-01'],
                    ['eligibility_name' => 'Career Service Executive',    'year_passed' => '2018-11-01'],
                ],
                'leave_info' => [
                    ['leave_type' => 'Vacation Leave', 'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                    ['leave_type' => 'Sick Leave',     'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                ],
                'leave_availments' => [
                    ['leave_type' => 'Sick Leave', 'leave_start_date' => '2024-02-20', 'leave_end_date' => '2024-02-21', 'status' => 'approved'],
                ],
                'payroll' => [
                    ['initial_amount' => 48597.00, 'deduction_amount' => 6200.00, 'final_amount' => 42397.00, 'date_processed' => '2025-01-31', 'payroll_status' => 'Released'],
                ],
                'water_bill' => ['water_bill_number' => 'WB-002-2024', 'account_name' => 'Ramon B. Dela Cruz Jr.', 'address' => '45 Mabini Avenue, Pasig City'],
                'uploaded_files' => [
                    ['file_name' => 'diploma.pdf',            'file_size' => '1.2MB', 'file_database_location' => 'employees/2/diploma.pdf'],
                    ['file_name' => 'service_record.pdf',     'file_size' => '800KB', 'file_database_location' => 'employees/2/service_record.pdf'],
                ],
            ],
            [
                'basic' => [
                    'first_name'     => 'Ana',
                    'last_name'      => 'Reyes',
                    'middle_name'    => 'Gomez',
                    'name_extension' => null,
                    'birth_date'     => '1995-11-08',
                    'sex'            => 1,
                    'personal_email' => 'ana.reyes@gmail.com',
                    'phone_number'   => '09351234567',
                    'civil_status'   => 'single',
                    'place_of_birth' => 'Davao City, Philippines',
                ],
                'employee' => [
                    'item_id'                   => $itemIds[2],
                    'salary_grade_step_id'       => $sgStepIds[1],
                    'employment_classification'  => 'Regular',
                    'work_email'                 => 'ana.reyes@obx.gov.ph',
                    'date_applied'               => '2020-08-15',
                    'date_hired'                 => '2020-09-01',
                    'work_schedule_start'        => '08:00:00',
                    'work_schedule_end'          => '17:00:00',
                    'status'                     => true,
                ],
                'address' => [
                    'street_address' => '78 Bonifacio Street',
                    'city'           => 'Taguig City',
                    'state'          => 'Metro Manila',
                    'zip_code'       => '1634',
                ],
                'education' => [
                    'level'           => 'College',
                    'school_name'     => 'Ateneo de Manila University',
                    'school_address'  => 'Loyola Heights, Quezon City',
                    'graduation_date' => '2017-03-25',
                    'degree'          => 'Bachelor of Science in Computer Science',
                ],
                'family' => [
                    'full_name'      => 'Pedro Reyes',
                    'contact_number' => '09359876543',
                    'relationship'   => '2000-01-01',
                ],
                'gov_accounts' => [
                    ['account_type' => 'SSS',     'account_number' => '05-5551234-9'],
                    ['account_type' => 'PhilHealth','account_number' => '14-555123456-7'],
                    ['account_type' => 'Pag-IBIG', 'account_number' => '5551-2345-6789'],
                ],
                'allowances' => [
                    ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
                    ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
                ],
                'service_records' => [
                    ['department' => 'Information Technology Division', 'service_title' => 'Junior Developer',   'durationStart' => '2020-09-01', 'durationEnd' => '2022-08-31'],
                    ['department' => 'Information Technology Division', 'service_title' => 'Software Developer', 'durationStart' => '2022-09-01', 'durationEnd' => null],
                ],
                'seminars' => [
                    ['seminar_training_name' => 'Laravel Advanced Workshop', 'date_attended' => '2023-07-14', 'venue' => 'BGC Tech Hub, Taguig'],
                    ['seminar_training_name' => 'Cybersecurity Awareness Training', 'date_attended' => '2024-01-20', 'venue' => 'Online (Zoom)'],
                ],
                'eligibility' => [
                    ['eligibility_name' => 'Career Service Sub-professional', 'year_passed' => '2018-04-01'],
                ],
                'leave_info' => [
                    ['leave_type' => 'Vacation Leave', 'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                    ['leave_type' => 'Sick Leave',     'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                ],
                'leave_availments' => [
                    ['leave_type' => 'Vacation Leave', 'leave_start_date' => '2024-12-23', 'leave_end_date' => '2024-12-27', 'status' => 'approved'],
                ],
                'payroll' => [
                    ['initial_amount' => 27608.00, 'deduction_amount' => 3500.00, 'final_amount' => 24108.00, 'date_processed' => '2025-01-31', 'payroll_status' => 'Released'],
                ],
                'water_bill' => ['water_bill_number' => 'WB-003-2024', 'account_name' => 'Ana G. Reyes', 'address' => '78 Bonifacio Street, Taguig City'],
                'uploaded_files' => [
                    ['file_name' => 'tor.pdf', 'file_size' => '950KB', 'file_database_location' => 'employees/3/tor.pdf'],
                ],
            ],
            [
                'basic' => [
                    'first_name'     => 'Carlo',
                    'last_name'      => 'Mendoza',
                    'middle_name'    => 'Aquino',
                    'name_extension' => null,
                    'birth_date'     => '1988-05-30',
                    'sex'            => 0,
                    'personal_email' => 'carlo.mendoza@gmail.com',
                    'phone_number'   => '09461234567',
                    'civil_status'   => 'single',
                    'place_of_birth' => 'Iloilo City, Philippines',
                ],
                'employee' => [
                    'item_id'                   => $itemIds[3],
                    'salary_grade_step_id'       => $sgStepIds[2],
                    'employment_classification'  => 'Regular',
                    'work_email'                 => 'carlo.mendoza@obx.gov.ph',
                    'date_applied'               => '2015-03-01',
                    'date_hired'                 => '2015-04-01',
                    'work_schedule_start'        => '08:00:00',
                    'work_schedule_end'          => '17:00:00',
                    'status'                     => true,
                ],
                'address' => [
                    'street_address' => '22 Luna Street',
                    'city'           => 'Mandaluyong City',
                    'state'          => 'Metro Manila',
                    'zip_code'       => '1550',
                ],
                'education' => [
                    'level'           => 'College',
                    'school_name'     => 'Mapúa University',
                    'school_address'  => 'Muralla Street, Intramuros, Manila',
                    'graduation_date' => '2010-03-18',
                    'degree'          => 'Bachelor of Science in Information Technology',
                ],
                'family' => [
                    'full_name'      => 'Gloria Mendoza',
                    'contact_number' => '09469876543',
                    'relationship'   => '2000-01-01',
                ],
                'gov_accounts' => [
                    ['account_type' => 'SSS',     'account_number' => '06-4441234-0'],
                    ['account_type' => 'PhilHealth','account_number' => '15-444123456-3'],
                    ['account_type' => 'Pag-IBIG', 'account_number' => '4441-2345-6780'],
                ],
                'allowances' => [
                    ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
                    ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
                    ['allowance_name' => 'Hazard Pay',               'allowance_amount' => 3000.00],
                ],
                'service_records' => [
                    ['department' => 'Information Technology Division', 'service_title' => 'IT Support Specialist', 'durationStart' => '2015-04-01', 'durationEnd' => '2019-12-31'],
                    ['department' => 'Information Technology Division', 'service_title' => 'Systems Administrator', 'durationStart' => '2020-01-01', 'durationEnd' => null],
                ],
                'seminars' => [
                    ['seminar_training_name' => 'Linux System Administration', 'date_attended' => '2021-11-05', 'venue' => 'Manila'],
                    ['seminar_training_name' => 'Network Security Fundamentals', 'date_attended' => '2023-09-18', 'venue' => 'Online (MS Teams)'],
                ],
                'eligibility' => [
                    ['eligibility_name' => 'Career Service Professional', 'year_passed' => '2011-08-01'],
                ],
                'leave_info' => [
                    ['leave_type' => 'Vacation Leave', 'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                    ['leave_type' => 'Sick Leave',     'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                ],
                'leave_availments' => [
                    ['leave_type' => 'Sick Leave', 'leave_start_date' => '2024-07-15', 'leave_end_date' => '2024-07-16', 'status' => 'approved'],
                ],
                'payroll' => [
                    ['initial_amount' => 36619.00, 'deduction_amount' => 4800.00, 'final_amount' => 31819.00, 'date_processed' => '2025-01-31', 'payroll_status' => 'Released'],
                ],
                'water_bill' => ['water_bill_number' => 'WB-004-2024', 'account_name' => 'Carlo A. Mendoza', 'address' => '22 Luna Street, Mandaluyong City'],
                'uploaded_files' => [
                    ['file_name' => 'nbi_clearance.pdf', 'file_size' => '300KB', 'file_database_location' => 'employees/4/nbi_clearance.pdf'],
                    ['file_name' => 'certifications.pdf','file_size' => '1.5MB', 'file_database_location' => 'employees/4/certifications.pdf'],
                ],
            ],
            [
                'basic' => [
                    'first_name'     => 'Joanna',
                    'last_name'      => 'Villanueva',
                    'middle_name'    => 'Lim',
                    'name_extension' => null,
                    'birth_date'     => '1982-09-14',
                    'sex'            => 1,
                    'personal_email' => 'joanna.villanueva@gmail.com',
                    'phone_number'   => '09171112222',
                    'civil_status'   => 'married',
                    'place_of_birth' => 'Cagayan de Oro, Philippines',
                ],
                'employee' => [
                    'item_id'                   => $itemIds[4],
                    'salary_grade_step_id'       => $sgStepIds[4],
                    'employment_classification'  => 'Regular',
                    'work_email'                 => 'joanna.villanueva@obx.gov.ph',
                    'date_applied'               => '2008-10-01',
                    'date_hired'                 => '2008-11-01',
                    'work_schedule_start'        => '08:00:00',
                    'work_schedule_end'          => '17:00:00',
                    'status'                     => false,
                ],
                'address' => [
                    'street_address' => '9 Aguinaldo Street',
                    'city'           => 'Marikina City',
                    'state'          => 'Metro Manila',
                    'zip_code'       => '1800',
                ],
                'education' => [
                    'level'           => 'Post-Graduate',
                    'school_name'     => 'University of Santo Tomas',
                    'school_address'  => 'España Blvd., Sampaloc, Manila',
                    'graduation_date' => '2006-04-10',
                    'degree'          => 'Master of Science in Information Systems',
                ],
                'family' => [
                    'full_name'      => 'Eduardo Villanueva',
                    'contact_number' => '09179998888',
                    'relationship'   => '2000-01-01',
                ],
                'gov_accounts' => [
                    ['account_type' => 'SSS',     'account_number' => '07-3331234-5'],
                    ['account_type' => 'PhilHealth','account_number' => '16-333123456-8'],
                    ['account_type' => 'Pag-IBIG', 'account_number' => '3331-2345-6785'],
                    ['account_type' => 'GSIS',     'account_number' => 'GSIS-0005-2008'],
                ],
                'allowances' => [
                    ['allowance_name' => 'Transportation Allowance', 'allowance_amount' => 2000.00],
                    ['allowance_name' => 'Rice Subsidy',             'allowance_amount' => 1500.00],
                    ['allowance_name' => 'Representation Allowance', 'allowance_amount' => 5000.00],
                    ['allowance_name' => 'Clothing Allowance',       'allowance_amount' => 6000.00],
                ],
                'service_records' => [
                    ['department' => 'Information Technology Division', 'service_title' => 'Senior Developer',  'durationStart' => '2008-11-01', 'durationEnd' => '2015-12-31'],
                    ['department' => 'Information Technology Division', 'service_title' => 'IT Division Chief', 'durationStart' => '2016-01-01', 'durationEnd' => '2020-06-30'],
                    ['department' => 'Information Technology Division', 'service_title' => 'IT Manager',        'durationStart' => '2020-07-01', 'durationEnd' => null],
                ],
                'seminars' => [
                    ['seminar_training_name' => 'Digital Transformation for Government', 'date_attended' => '2022-10-05', 'venue' => 'Sofitel Philippine Plaza, Pasay'],
                    ['seminar_training_name' => 'Executive Leadership Program',          'date_attended' => '2023-05-17', 'venue' => 'Asian Institute of Management, Makati'],
                ],
                'eligibility' => [
                    ['eligibility_name' => 'Career Service Professional', 'year_passed' => '2005-08-01'],
                    ['eligibility_name' => 'Information Technology Officer Exam', 'year_passed' => '2010-05-01'],
                ],
                'leave_info' => [
                    ['leave_type' => 'Vacation Leave', 'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                    ['leave_type' => 'Sick Leave',     'leave_days' => '2024-01-01', 'leave_balance' => '2024-12-31'],
                ],
                'leave_availments' => [
                    ['leave_type' => 'Vacation Leave', 'leave_start_date' => '2024-08-12', 'leave_end_date' => '2024-08-16', 'status' => 'approved'],
                    ['leave_type' => 'Sick Leave',     'leave_start_date' => '2024-11-04', 'leave_end_date' => '2024-11-05', 'status' => 'approved'],
                ],
                'payroll' => [
                    ['initial_amount' => 97744.00, 'deduction_amount' => 13500.00, 'final_amount' => 84244.00, 'date_processed' => '2025-01-31', 'payroll_status' => 'Released'],
                ],
                'water_bill' => ['water_bill_number' => 'WB-005-2024', 'account_name' => 'Joanna L. Villanueva', 'address' => '9 Aguinaldo Street, Marikina City'],
                'uploaded_files' => [
                    ['file_name' => 'diploma.pdf',        'file_size' => '1.1MB', 'file_database_location' => 'employees/5/diploma.pdf'],
                    ['file_name' => 'masteral_tor.pdf',   'file_size' => '1.4MB', 'file_database_location' => 'employees/5/masteral_tor.pdf'],
                    ['file_name' => 'pds_form.pdf',       'file_size' => '600KB', 'file_database_location' => 'employees/5/pds_form.pdf'],
                ],
            ],
        ];

        // ── 8. Insert each employee and all related records ────────
        $createdEmployeeIds = [];

        foreach ($employees as $data) {
            // employee_basic_info
            $basicInfoId = DB::table('employee_basic_info')->insertGetId(
                array_merge($data['basic'], ['created_at' => now(), 'updated_at' => now()])
            );

            // employees
            $employeeId = DB::table('employees')->insertGetId(array_merge(
                $data['employee'],
                [
                    'employee_basic_info_id' => $basicInfoId,
                    'password'               => Hash::make('password'),
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]
            ));

            $createdEmployeeIds[] = $employeeId;

            // employee_adresses
            DB::table('employee_adresses')->insert(
                array_merge($data['address'], [
                    'employee_basic_info_id' => $basicInfoId,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ])
            );

            // employee_educations
            DB::table('employee_educations')->insert(
                array_merge($data['education'], [
                    'employee_basic_info_id' => $basicInfoId,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ])
            );

            // family_info
            DB::table('family_info')->insert(
                array_merge($data['family'], [
                    'employee_basic_info_id' => $basicInfoId,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ])
            );

            // government_accounts
            foreach ($data['gov_accounts'] as $govAccount) {
                DB::table('government_accounts')->insert(
                    array_merge($govAccount, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // employee_allowances
            foreach ($data['allowances'] as $allowance) {
                DB::table('employee_allowances')->insert(
                    array_merge($allowance, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // employee_service_records
            foreach ($data['service_records'] as $record) {
                DB::table('employee_service_records')->insert(
                    array_merge($record, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // employee_seminars_and_trainings
            foreach ($data['seminars'] as $seminar) {
                DB::table('employee_seminars_and_trainings')->insert(
                    array_merge($seminar, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // eligibility_information
            foreach ($data['eligibility'] as $eligibility) {
                DB::table('eligibility_information')->insert(
                    array_merge($eligibility, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // leave_information
            foreach ($data['leave_info'] as $leave) {
                DB::table('leave_information')->insert(
                    array_merge($leave, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // leave_availments
            foreach ($data['leave_availments'] as $availment) {
                DB::table('leave_availments')->insert(
                    array_merge($availment, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // employee_payroll_data
            foreach ($data['payroll'] as $payroll) {
                DB::table('employee_payroll_data')->insert(
                    array_merge($payroll, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }

            // employee_water_bill
            DB::table('employee_water_bill')->insert(
                array_merge($data['water_bill'], [
                    'employee_id' => $employeeId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ])
            );

            // employee_uploaded_files
            foreach ($data['uploaded_files'] as $file) {
                DB::table('employee_uploaded_files')->insert(
                    array_merge($file, [
                        'employee_id' => $employeeId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ])
                );
            }
        }

        // ── 9. Whereabout slips (requires employees to exist first) ──
        // Assign reviewer = employee 2 (HR Manager), approver = employee 5 (IT Manager), attester = employee 2
        [$emp1, $emp2, $emp3, $emp4, $emp5] = $createdEmployeeIds;

        $whereabouts = [
            [
                'employee_id'               => $emp1,
                'reviewed_and_noted_by_id'  => $emp2,
                'approved_by_id'            => $emp5,
                'attested_by_id'            => $emp2,
                'date_filed'                => '2024-05-10',
                'purpose_type'              => 1,
                'purpose_description'       => 'Attend external HR seminar at Makati.',
                'time_out'                  => '09:00:00',
                'time_noted'                => '09:05:00',
                'time_returned'             => '17:30:00',
                'status'                    => 'approved',
                'return_status'             => 'returned',
            ],
            [
                'employee_id'               => $emp3,
                'reviewed_and_noted_by_id'  => $emp5,
                'approved_by_id'            => $emp5,
                'attested_by_id'            => $emp2,
                'date_filed'                => '2024-06-20',
                'purpose_type'              => 0,
                'purpose_description'       => 'Client site visit for system deployment in BGC.',
                'time_out'                  => '10:00:00',
                'time_noted'                => '10:02:00',
                'time_returned'             => '16:00:00',
                'status'                    => 'approved',
                'return_status'             => 'returned',
            ],
            [
                'employee_id'               => $emp4,
                'reviewed_and_noted_by_id'  => $emp5,
                'approved_by_id'            => $emp5,
                'attested_by_id'            => $emp2,
                'date_filed'                => '2024-09-03',
                'purpose_type'              => 1,
                'purpose_description'       => 'Attend network infrastructure planning meeting.',
                'time_out'                  => '13:00:00',
                'time_noted'                => '13:03:00',
                'time_returned'             => '18:00:00',
                'status'                    => 'pending',
                'return_status'             => 'still_here',
            ],
        ];

        foreach ($whereabouts as $slip) {
            DB::table('whereabout_slips')->insert(
                array_merge($slip, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}