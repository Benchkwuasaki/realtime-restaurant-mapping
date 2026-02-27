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
            'name' => 'Super Admin',
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

        $addmin2 = User::create([
            'name' => 'Klein Allen',
            'email' => 'allenklein04@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('shira081419'),
        ]);

        $superAdmin->assignRole('super_admin');
        $admin1->assignRole('admin');
        $addmin2->assignRole('admin');
    }
}
