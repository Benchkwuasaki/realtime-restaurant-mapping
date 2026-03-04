<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // super admin
        $superAdmin = User::create([
            'name' => 'SuperAdmin User',
            'email' => 'superadmin@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);

        // admin
        $admin1 = User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);

        // ogm
        $ogm = User::create([
            'name' => 'Ogm User',
            'email' => 'ogm@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);

        // org
        $org = User::create([
            'name' => 'Org User',
            'email' => 'org@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);

        // inventory
        $inventory = User::create([
            'name' => 'Inventory User',
            'email' => 'inventory@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);

        // employee
        $employee = User::create([
            'name' => 'Employee User',
            'email' => 'employee@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);


        $superAdmin->assignRole('super_admin');
        $admin1->assignRole('hr_admin');
        $ogm->assignRole('ogm');
        $org->assignRole('org');
        $inventory->assignRole('inventory');
        $employee->assignRole('employee');
    }
}
