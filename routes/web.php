<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DocumentTrackingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\BenefitsController;
use App\Http\Controllers\ReportsAndAnalyticsController;
use App\Http\Controllers\ActivityLogsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('/document_tracking', [DocumentTrackingController::class, 'index'])->name('document_tracking.index');
    Route::get('/employee', [EmployeeController::class, 'index'])->name('employee.index');
    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::get('/benefits', [BenefitsController::class, 'index'])->name('benefits.index');
    Route::get('/reports_and_analytics', [ReportsAndAnalyticsController::class, 'index'])->name('reports_and_analytics.index');
    Route::get('/activity_logs', [ActivityLogsController::class, 'index'])->name('activity_logs.index');
});


require __DIR__ . '/settings.php';
