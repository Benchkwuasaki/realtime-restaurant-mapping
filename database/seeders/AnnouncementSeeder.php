<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        // Find a user with the super_admin role (Spatie Permission)
        $admin = User::role('super_admin')->first();

        if (!$admin) {
            $this->command->error('No super_admin user found. Assign the super_admin role to a user first.');
            return;
        }

        $departments = Department::all();

        if ($departments->isEmpty()) {
            $this->command->warn('No departments found — all announcements will be global.');
        }

        $deptIds = $departments->pluck('department_id')->toArray();

        $announcements = [
            [
                'title'     => '📌 Office Closure — Holy Week',
                'body'      => '<p>Please be informed that the office will be <strong>closed from April 17 to 20</strong> in observance of Holy Week.</p><p>Operations will resume on <strong>April 21 (Monday)</strong>. Employees on skeletal duty have already been notified separately.</p>',
                'is_pinned' => true,
                'dept_ids'  => [], // global
            ],
            [
                'title'     => 'Reminder: Biometric Registration Deadline',
                'body'      => '<p>All employees who have not yet completed their <strong>biometric registration</strong> are reminded to do so on or before <strong>March 28</strong>.</p><ul><li>Proceed to the HR office between 8:00 AM – 5:00 PM</li><li>Bring your company ID</li></ul>',
                'is_pinned' => false,
                'dept_ids'  => array_slice($deptIds, 0, 2),
            ],
            [
                'title'     => 'New Attendance Policy Effective April 1',
                'body'      => '<p>HR announces updates to the attendance policy effective <strong>April 1</strong>:</p><ul><li>Grace period removed — tardiness recorded from scheduled time-in</li><li>Whereabout slips must be filed <strong>before</strong> leaving the premises</li><li>Personal slips exceeding 60 minutes require supervisor approval</li></ul>',
                'is_pinned' => false,
                'dept_ids'  => [], // global
            ],
            [
                'title'     => 'Q1 Performance Review Schedule',
                'body'      => '<p>Q1 performance reviews are scheduled for the <strong>last two weeks of March</strong>. Department heads will send individual schedules by end of this week.</p><p>Please prepare your self-evaluation forms ahead of the review date.</p>',
                'is_pinned' => false,
                'dept_ids'  => array_slice($deptIds, 0, 3),
            ],
            [
                'title'     => '🎉 Welcome to Our New HR Officer',
                'body'      => '<p>Please join us in welcoming <strong>Maria Santos</strong> as our new HR Officer, effective March 18.</p><p>Maria brings 7 years of experience in human resource management. Her office is located at Room 204, Admin Building.</p>',
                'is_pinned' => false,
                'dept_ids'  => [], // global
            ],
            [
                'title'     => 'Updated Leave Filing Guidelines',
                'body'      => '<p>Effective immediately, all leave applications must be filed <strong>at least 3 working days in advance</strong> via the HR portal.</p><blockquote><p>Emergency leaves are still accepted same-day but must be supported by appropriate documentation.</p></blockquote>',
                'is_pinned' => false,
                'dept_ids'  => array_slice($deptIds, 1, 3),
            ],
            [
                'title'     => 'Town Hall Meeting — March 25',
                'body'      => '<h2>All-Hands Town Hall</h2><p>We will be holding a company-wide town hall on <strong>March 25, 2:00 PM</strong> at the Main Conference Hall.</p><ul><li>Q1 performance update</li><li>Upcoming company milestones</li><li>Open Q&A with management</li></ul><p>Attendance is required for all regular employees.</p>',
                'is_pinned' => true,
                'dept_ids'  => [], // global
            ],
            [
                'title'     => 'IT System Maintenance — March 22 (10 PM–2 AM)',
                'body'      => '<p>The IT team will be conducting scheduled system maintenance on <strong>March 22, from 10:00 PM to 2:00 AM</strong>.</p><p>The following systems will be temporarily unavailable:</p><ul><li>HR Portal</li><li>Internal email</li><li>Time & Attendance system</li></ul><p>Please save all work before 10:00 PM.</p>',
                'is_pinned' => false,
                'dept_ids'  => array_slice($deptIds, 0, 4),
            ],
        ];

        foreach ($announcements as $data) {
            $announcement = Announcement::create([
                'title'     => $data['title'],
                'body'      => $data['body'],
                'is_pinned' => $data['is_pinned'],
                'posted_by' => $admin->id,
            ]);

            if (!empty($data['dept_ids'])) {
                $announcement->departments()->sync($data['dept_ids']);
            }
        }

        $this->command->info('Seeded ' . count($announcements) . ' announcements (posted by: ' . $admin->name . ').');
    }
}