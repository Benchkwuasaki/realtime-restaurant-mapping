<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class GovernmentReportController extends Controller

{
     public function index()
    {
        return Inertia::render('ReportsAndAnalytics/Government/Index');
    }
}