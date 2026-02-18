<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class DocumentTrackingController extends Controller
{
    public function index()
    {
        return Inertia::render('DocumentTracking/Index', []);
    }
}
