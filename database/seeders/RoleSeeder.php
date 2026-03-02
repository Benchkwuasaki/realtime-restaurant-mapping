<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRole = Role::create(['name' => 'super_admin']);
        $adminRole = Role::create(['name' => 'hr_admin']);
        $adminRole = Role::create(['name' => 'ogm']);
        $org = Role::create(['name' => 'org']);
        $inventoryRole = Role::create(['name' => 'inventory']);
        $employee = Role::create(['name' => 'employee']);
    }
}
