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

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/attendance', [AttendanceController::class, 'index'])->middleware(['auth', 'verified'])->name('attendance.index');
Route::get('/document_tracking', [DocumentTrackingController::class, 'index'])->middleware(['auth', 'verified'])->name('document_tracking.index');

// Employee Routes
Route::prefix('employee')->name('employee.')->group(function () {
    Route::get('/',          [EmployeeController::class, 'index'])->name('index');
    Route::get('/create',    [EmployeeController::class, 'create'])->name('create');
    Route::post('/',         [EmployeeController::class, 'store'])->name('store');
    Route::get('/{employee}',         [EmployeeController::class, 'show'])->name('show');
    Route::get('/{employee}/edit',    [EmployeeController::class, 'edit'])->name('edit');
    Route::put('/{employee}',         [EmployeeController::class, 'update'])->name('update');
    Route::patch('/{employee}/toggle',[EmployeeController::class, 'toggleStatus'])->name('toggleStatus');
    Route::delete('/{employee}',      [EmployeeController::class, 'destroy'])->name('destroy');
});

Route::get('/payroll',[PayrollController::class,'index'])->middleware(['auth', 'verified'])->name('payroll.index');
Route::get('/benefits',[BenefitsController::class,'index'])->middleware(['auth', 'verified'])->name('benefits.index');
Route::get('/reports_and_analytics',[ReportsAndAnalyticsController::class,'index'])->middleware(['auth', 'verified'])->name('reports_and_analytics.index');
Route::get('/activity_logs',[ActivityLogsController::class,'index'])->middleware(['auth', 'verified'])->name('activity_logs.index');   

require __DIR__ . '/settings.php';
