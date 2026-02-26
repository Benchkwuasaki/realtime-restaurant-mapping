<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DocumentTrackingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\BenefitsController;
use App\Http\Controllers\ReportsAndAnalyticsController;
use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\PositionController;
use PhpParser\Node\Scalar\MagicConst\Dir;

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
        // Family
        Route::post('/{employee}/family', [EmployeeController::class, 'storeFamily'])->name('family.store');
        Route::put('/{employee}/family/{index}', [EmployeeController::class, 'updateFamily'])->name('family.update');
        Route::delete('/{employee}/family/{index}', [EmployeeController::class, 'destroyFamily'])->name('family.destroy');

        // Education
        Route::post('/{employee}/education', [EmployeeController::class, 'storeEducation'])->name('education.store');
        Route::put('/{employee}/education/{index}', [EmployeeController::class, 'updateEducation'])->name('education.update');
        Route::delete('/{employee}/education/{index}', [EmployeeController::class, 'destroyEducation'])->name('education.destroy');

        // Seminars & Trainings
        Route::post('/{employee}/seminar', [EmployeeController::class, 'storeSeminar'])->name('seminar.store');
        Route::put('/{employee}/seminar/{seminar}', [EmployeeController::class, 'updateSeminar'])->name('seminar.update');
        Route::delete('/{employee}/seminar/{seminar}', [EmployeeController::class, 'destroySeminar'])->name('seminar.destroy');

        // Service Records
        Route::post('/{employee}/service-record', [EmployeeController::class, 'storeServiceRecord'])->name('service-record.store');
        Route::put('/{employee}/service-record/{record}', [EmployeeController::class, 'updateServiceRecord'])->name('service-record.update');
        Route::delete('/{employee}/service-record/{record}', [EmployeeController::class, 'destroyServiceRecord'])->name('service-record.destroy');

    });

    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::get('/benefits', [BenefitsController::class, 'index'])->name('benefits.index');
    Route::get('/reports_and_analytics', [ReportsAndAnalyticsController::class, 'index'])->name('reports_and_analytics.index');
    Route::get('/activity_logs', [ActivityLogsController::class, 'index'])->name('activity_logs.index');
});

Route::prefix('organization/units')->name('unit.')->group(function () {
    Route::get('/', [UnitController::class, 'index'])->name('index');
    Route::get('/{unit}', [UnitController::class, 'show'])->name('show');
    Route::post('/', [UnitController::class, 'store'])->name('store');
    Route::put('/{unit}', [UnitController::class, 'update'])->name('update');
    Route::delete('/bulk-destroy', [UnitController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::delete('/{unit}', [UnitController::class, 'destroy'])->name('destroy');
});

Route::prefix('organization/divisions')->name('division.')->group(function () {
    Route::get('/', [DivisionController::class, 'index'])->name('index');
    Route::get('/{division}', [DivisionController::class, 'show'])->name('show');
    Route::post('/', [DivisionController::class, 'store'])->name('store');
    Route::put('/{division}', [DivisionController::class, 'update'])->name('update');
    Route::delete('/bulk-destroy', [DivisionController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::delete('/{division}', [DivisionController::class, 'destroy'])->name('destroy');
});

Route::prefix('organization/positions')->name('position.')->group(function () {
    Route::get('/', [PositionController::class, 'index'])->name('index');
    Route::get('/{position}', [PositionController::class, 'show'])->name('show');
    Route::post('/', [PositionController::class, 'store'])->name('store');
    Route::put('/{position}', [PositionController::class, 'update'])->name('update');
    Route::delete('/bulk-destroy', [PositionController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::delete('/{position}', [PositionController::class, 'destroy'])->name('destroy');
});

Route::resource('holiday', HolidayController::class)->parameters([
    'holiday' => 'holiday:holiday_id',
]);


require __DIR__ . '/settings.php';
