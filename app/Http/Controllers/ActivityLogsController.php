<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogsController extends Controller
{
    public function index()
    {
        return Inertia::render('ActivityLogs/Index');
    }
}
