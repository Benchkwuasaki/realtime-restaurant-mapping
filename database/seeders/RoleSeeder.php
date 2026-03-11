<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'super_admin']);
        Role::firstOrCreate(['name' => 'hr_admin']);
        Role::firstOrCreate(['name' => 'ogm']);
        Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'document_tracking_operator']);
    }
}
