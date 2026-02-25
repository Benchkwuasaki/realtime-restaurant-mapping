<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DocumentTrackingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\BenefitsController;
use App\Http\Controllers\ReportsAndAnalyticsController;
use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\HolidayController;


Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::group(['middleware' => ['auth', 'verified']], function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/attendance', [AttendanceController::class, 'index'])->middleware(['auth', 'verified'])->name('attendance.index');
    Route::get('/document_tracking', [DocumentTrackingController::class, 'index'])->middleware(['auth', 'verified'])->name('document_tracking.index');

    // Employee Routes
    Route::prefix('employee')->name('employee.')->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('index');
        Route::get('/create', [EmployeeController::class, 'create'])->name('create');
        Route::post('/', [EmployeeController::class, 'store'])->name('store');
                Route::delete('/bulk-destroy', [EmployeeController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{employee}', [EmployeeController::class, 'show'])->name('show');
        Route::get('/{employee}/edit', [EmployeeController::class, 'edit'])->name('edit');
        Route::put('/{employee}', [EmployeeController::class, 'update'])->name('update');
        Route::patch('/{employee}/toggle', [EmployeeController::class, 'toggleStatus'])->name('toggleStatus');
        Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('destroy');

        // Government Accounts
        Route::post('/{employee}/government-account', [EmployeeController::class, 'storeGovernmentAccount'])->name('government-account.store');
        Route::put('/{employee}/government-account/{account}', [EmployeeController::class, 'updateGovernmentAccount'])->name('government-account.update');
        Route::delete('/{employee}/government-account/{account}', [EmployeeController::class, 'destroyGovernmentAccount'])->name('government-account.destroy');

        // Eligibility
        Route::post('/{employee}/eligibility', [EmployeeController::class, 'storeEligibility'])->name('eligibility.store');
        Route::put('/{employee}/eligibility/{eligibility}', [EmployeeController::class, 'updateEligibility'])->name('eligibility.update');
        Route::delete('/{employee}/eligibility/{eligibility}', [EmployeeController::class, 'destroyEligibility'])->name('eligibility.destroy');
    });



    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::get('/benefits', [BenefitsController::class, 'index'])->name('benefits.index');
    Route::get('/reports_and_analytics', [ReportsAndAnalyticsController::class, 'index'])->name('reports_and_analytics.index');
    Route::get('/activity_logs', [ActivityLogsController::class, 'index'])->name('activity_logs.index');
});

Route::resource('holiday', HolidayController::class)->parameters([
    'holiday' => 'holiday:holiday_id',
]);


require __DIR__ . '/settings.php';
