<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollReportController extends Controller

{
     public function index()
    {
        return Inertia::render('ReportsAndAnalytics/Payroll/Index');
    }
}

