<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class GovernmentRemittanceReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Payroll/Outputs/GovernmentRemittanceReport/Index');
    }
}