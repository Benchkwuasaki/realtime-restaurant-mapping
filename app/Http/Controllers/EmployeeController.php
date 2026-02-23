<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $tasks = json_decode(file_get_contents(base_path('resources/js/components/Employeee/data/task.json')), true);

        return Inertia::render('Employee/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function create()
    {
        return Inertia::render('Employee/CreateEmployee');
    }
}
