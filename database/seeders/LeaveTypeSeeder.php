<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;
use App\Models\LeaveTypeRequirement;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        /* Maternity Leave */
        $maternity = LeaveType::create([
            'leave_type_name' => 'Maternity Leave',
            'leave_type_description' => 'Leave granted for childbirth and recovery.',
            'eligible_sex' => 'Female',
            'is_paid' => true,
            'is_convertible' => false,
            'status' => true,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $maternity->leave_type_id,
            'requirement_name' => 'Medical Certificate',
        ]);

        /* Sick Leave */
        $sick = LeaveType::create([
            'leave_type_name' => 'Sick Leave',
            'leave_type_description' => 'Leave for medical reasons.',
            'eligible_sex' => 'All',
            'is_paid' => true,
            'is_convertible' => true,
            'status' => true,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $sick->leave_type_id,
            'requirement_name' => 'Doctor Certificate',
        ]);

        /* Paternity Leave */
        $paternity = LeaveType::create([
            'leave_type_name' => 'Paternity Leave',
            'leave_type_description' => 'Leave granted to married male employees for the first four deliveries of their legitimate spouse.',
            'eligible_sex' => 'Male',
            'is_paid' => true,
            'is_convertible' => false,
            'status' => true,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $paternity->leave_type_id,
            'requirement_name' => 'Marriage Certificate & Proof of Delivery',
        ]);

        /* Solo Parent Leave */
        $soloParent = LeaveType::create([
            'leave_type_name' => 'Solo Parent Leave',
            'leave_type_description' => 'Leave granted to solo parents to perform parental duties.',
            'eligible_sex' => 'All',
            'is_paid' => true,
            'is_convertible' => false,
            'status' => false,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $soloParent->leave_type_id,
            'requirement_name' => 'Solo Parent ID',
        ]);

        /* Special Emergency Leave */
        $calamity = LeaveType::create([
            'leave_type_name' => 'Special Emergency Leave',
            'leave_type_description' => 'Leave granted during calamities or disasters affecting the employee.',
            'eligible_sex' => 'All',
            'is_paid' => false,
            'is_convertible' => false,
            'status' => true,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $calamity->leave_type_id,
            'requirement_name' => 'Barangay Certification',
        ]);

        /* Vacation Leave */
        $vacation = LeaveType::create([
            'leave_type_name' => 'Vacation Leave',
            'leave_type_description' => 'Leave for personal reasons, travel, or rest and recreation.',
            'eligible_sex' => 'All',
            'is_paid' => false,
            'is_convertible' => true,
            'status' => false,
        ]);

        /* Terminal Leave */
        $terminal = LeaveType::create([
            'leave_type_name' => 'Terminal Leave',
            'leave_type_description' => 'Leave applied upon separation from service to monetize accumulated leave credits.',
            'eligible_sex' => 'All',
            'is_paid' => true,
            'is_convertible' => false,
            'status' => false,
        ]);

        LeaveTypeRequirement::create([
            'leave_type_id' => $terminal->leave_type_id,
            'requirement_name' => 'Separation/Retirement Approval',
        ]);
    }
}