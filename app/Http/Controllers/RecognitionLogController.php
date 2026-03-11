<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RecognitionLogController extends Controller
{
    public function index()
    {
        return Inertia::render('Attendance/RecognitionLog/Index');
    }
}
