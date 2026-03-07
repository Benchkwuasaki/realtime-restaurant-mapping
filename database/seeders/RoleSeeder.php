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
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);
        $adminRole = Role::firstOrCreate(['name' => 'hr_admin']);
        $adminRole = Role::firstOrCreate(['name' => 'ogm']);
        $org = Role::firstOrCreate(['name' => 'org']);
        $inventoryRole = Role::firstOrCreate(['name' => 'inventory']);
        $employee = Role::firstOrCreate(['name' => 'employee']);
    }
}
