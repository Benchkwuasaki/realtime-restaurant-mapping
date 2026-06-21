<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['unit_name' => 'Application Development',         'unit_acronym' => 'APPDEV'],
            ['unit_name' => 'Network Infrastructure',          'unit_acronym' => 'NETINFRA'],
            ['unit_name' => 'Systems Administration',          'unit_acronym' => 'SYSAD'],
            ['unit_name' => 'Database Management',             'unit_acronym' => 'DBM'],
            ['unit_name' => 'Information Security',            'unit_acronym' => 'INFOSEC'],
            ['unit_name' => 'Technical Support',               'unit_acronym' => 'TECHSUPP'],
            ['unit_name' => 'IT Operations',                   'unit_acronym' => 'ITOPS'],
            ['unit_name' => 'Software Quality Assurance',      'unit_acronym' => 'SQA'],
            ['unit_name' => 'Data Analytics',                  'unit_acronym' => 'DATANAL'],
            ['unit_name' => 'Enterprise Architecture',         'unit_acronym' => 'ENTARCH'],
            ['unit_name' => 'Cloud Services',                  'unit_acronym' => 'CLOUD'],
            ['unit_name' => 'IT Procurement',                  'unit_acronym' => 'ITPRO'],
            ['unit_name' => 'Digital Transformation',          'unit_acronym' => 'DIGTRANS'],
            ['unit_name' => 'IT Audit and Compliance',         'unit_acronym' => 'ITAUDIT'],
            ['unit_name' => 'Business Intelligence',           'unit_acronym' => 'BI'],
            ['unit_name' => 'End User Computing',              'unit_acronym' => 'EUC'],
            ['unit_name' => 'IT Project Management',           'unit_acronym' => 'ITPM'],
            ['unit_name' => 'Service Desk',                    'unit_acronym' => 'SVCDESK'],
            ['unit_name' => 'IT Training and Development',     'unit_acronym' => 'ITTD'],
            ['unit_name' => 'Cybersecurity Operations',        'unit_acronym' => 'CYBOPS'],
            ['unit_name' => 'Web Development',                 'unit_acronym' => 'WEBDEV'],
            ['unit_name' => 'Mobile Development',              'unit_acronym' => 'MOBDEV'],
            ['unit_name' => 'DevOps',                          'unit_acronym' => 'DEVOPS'],
            ['unit_name' => 'IT Asset Management',             'unit_acronym' => 'ITAM'],
            ['unit_name' => 'Telecommunications',              'unit_acronym' => 'TELECOM'],
            ['unit_name' => 'Geographic Information Systems',  'unit_acronym' => 'GIS'],
            ['unit_name' => 'Document Management',             'unit_acronym' => 'DOCMGMT'],
            ['unit_name' => 'ERP Systems',                     'unit_acronym' => 'ERP'],
            ['unit_name' => 'IT Research and Innovation',      'unit_acronym' => 'ITRI'],
            ['unit_name' => 'Disaster Recovery',               'unit_acronym' => 'DR'],
            ['unit_name' => 'IT Vendor Management',            'unit_acronym' => 'ITVM'],
            ['unit_name' => 'Data Governance',                 'unit_acronym' => 'DATAGOV'],
            ['unit_name' => 'IT Communications',               'unit_acronym' => 'ITCOMM'],
            ['unit_name' => 'Systems Integration',             'unit_acronym' => 'SYSINT'],
            ['unit_name' => 'Artificial Intelligence',         'unit_acronym' => 'AI'],
            ['unit_name' => 'Robotic Process Automation',      'unit_acronym' => 'RPA'],
            ['unit_name' => 'IT Finance and Budgeting',        'unit_acronym' => 'ITFIN'],
            ['unit_name' => 'Platform Engineering',            'unit_acronym' => 'PLATENG'],
            ['unit_name' => 'Identity and Access Management',  'unit_acronym' => 'IAM'],
            ['unit_name' => 'IT Policy and Standards',         'unit_acronym' => 'ITPOL'],
            ['unit_name' => 'Software Licensing',              'unit_acronym' => 'SWLIC'],
            ['unit_name' => 'IT Risk Management',              'unit_acronym' => 'ITRISK'],
            ['unit_name' => 'Monitoring and Observability',    'unit_acronym' => 'MONOBS'],
            ['unit_name' => 'Content Management',              'unit_acronym' => 'CONTMGMT'],
            ['unit_name' => 'IT Legal and Contracts',          'unit_acronym' => 'ITLEGAL'],
            ['unit_name' => 'Backup and Recovery',             'unit_acronym' => 'BUPREC'],
            ['unit_name' => 'IT Facilities',                   'unit_acronym' => 'ITFAC'],
            ['unit_name' => 'Emerging Technologies',           'unit_acronym' => 'EMTECH'],
            ['unit_name' => 'IT Customer Relations',           'unit_acronym' => 'ITCR'],
            ['unit_name' => 'Accessibility and UX',            'unit_acronym' => 'ACCUX'],
        ];

        foreach ($units as $unit) {
            Unit::create([
                'division_id'      => 1,
                'unit_name'        => $unit['unit_name'],
                'unit_acronym'     => $unit['unit_acronym'],
                'unit_description' => null,
            ]);
        }
    }
}