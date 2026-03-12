<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;


class EmployeeReportController extends Controller
{
     public function index()
    {
        return Inertia::render('ReportsAndAnalytics/Employees/Index');
    }
}
