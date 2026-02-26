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
        // admin
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]);
        User::create([
            'name' => 'Klein Allen',
            'email' => 'allenklein04@gmail.com',
            'email_verified_at' => now(),
            'password' => bcrypt('shira081419'),
        ]);
    }
}
