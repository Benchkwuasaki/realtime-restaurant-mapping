<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceLogs extends Controller
{
    public function index()
    {
        return Inertia::render('Attendance/AttendanceLogs/Index');
    }
}
