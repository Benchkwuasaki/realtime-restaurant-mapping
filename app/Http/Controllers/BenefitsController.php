<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BenefitsController extends Controller
{
    public function index()
    {
        return Inertia::render('Benefits/Index');
    }
}
